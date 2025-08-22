/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
importPackage(Packages.org.lwjgl.input);

if (typeof GuiScreen === "undefined") {
  var GuiScreen = Java.type("net.minecraft.client.gui.GuiScreen");
}
if (typeof Player === "undefined") {
  var Player = Java.type("com.chattriggers.ctjs.minecraft.wrappers.Player");
}
if (typeof GuiTextField === "undefined") {
  var GuiTextField = Java.type("net.minecraft.client.gui.GuiTextField");
}

// Input wrapper class using reflection
class Input {
  constructor(x, y, width, height) {
    const GuiTextField = Java.type("net.minecraft.client.gui.GuiTextField");
    this.mcObject = new GuiTextField(
      0,
      Client.getMinecraft().field_71466_p,
      x,
      y,
      width,
      height
    );

    this.getX = () => {
      return this.mcObject.field_146209_f;
    };
    this.getY = () => {
      return this.mcObject.field_146210_g;
    };
    this.getWidth = () => {
      return this.mcObject.field_146218_h;
    };
    this.getHeight = () => {
      return this.mcObject.field_146219_i;
    };
    this.setX = (x) => {
      this.mcObject.field_146209_f = x;
    };
    this.setY = (y) => {
      this.mcObject.field_146210_g = y;
    };
    this.setWidth = (width) => {
      this.mcObject.field_146218_h = width;
    };
    this.setHeight = (height) => {
      this.mcObject.field_146219_i = height;
    };

    this.setEnabled = (enabled) => {
      const isEnabledField =
        this.mcObject.class.getDeclaredField("field_146226_p");
      isEnabledField.setAccessible(true);
      isEnabledField.set(this.mcObject, enabled);
    };

    this.setText = (text) => {
      const textField = this.mcObject.class.getDeclaredField("field_146216_j");
      textField.setAccessible(true);
      textField.set(this.mcObject, text);
    };

    this.getText = () => {
      const textField = this.mcObject.class.getDeclaredField("field_146216_j");
      textField.setAccessible(true);
      return textField.get(this.mcObject);
    };

    this.setIsFocused = (isFocused) => {
      const isFocusedField =
        this.mcObject.class.getDeclaredField("field_146213_o");
      isFocusedField.setAccessible(true);
      isFocusedField.set(this.mcObject, isFocused);
    };

    this.isFocused = () => {
      const isFocusedField =
        this.mcObject.class.getDeclaredField("field_146213_o");
      isFocusedField.setAccessible(true);
      return isFocusedField.get(this.mcObject);
    };

    this.render = () => {
      this.mcObject.func_146194_f();
    };

    this.mouseClicked = (mouseX, mouseY, button) => {
      this.mcObject.func_146192_a(mouseX, mouseY, button);
    };

    this.keyTyped = (char, keyCode) => {
      this.mcObject.func_146201_a(char, keyCode);
    };
  }
}

class RegionsVisualCache {
  constructor() {
    this.cachedRegions = [];
    this.filteredRegions = [];
    this.isActive = false;
    this.isScanning = false;
    this.hoveredIndex = -1;
    this.selectedIndex = -1;
    this.scrollOffset = 0;
    this.currentWorld = null;
    this.filterText = "";
    this.showingFilter = false;
    this.scannedPages = new Set();
    this.totalPages = 0;
    this.currentPage = 1;
    this.scrollbarDragging = false;
    this.scrollbarDragStartY = 0;
    this.scrollbarDragStartOffset = 0;

    // Minecraft input field
    this.filterTextField = null;
    this.initializeTextField = true;

    // Simplified keybind handling
    this.keybindBlocker = null;

    this.colors = {
      panelBg: 0xe0000000,
      panelBorder: 0xff333333,
      itemBg: 0xff2a2a2a,
      itemHover: 0xff404040,
      itemSelected: 0xff4caf50,
      filterBg: 0xff1a1a1a,
      filterBorder: 0xff666666,
      scrollbar: 0xff444444,
      scrollbarThumb: 0xff777777,
      scrollbarThumbHover: 0xff999999,
    };

    this.registerEvents();
  }

  createTextField(x, y, width, height) {
    try {
      const textField = new Input(x, y, width, height);
      textField.setEnabled(true);
      textField.setIsFocused(false);
      textField.setText("");

      return textField;
    } catch (error) {
      ChatLib.chat(
        PREFIX + `§c[ERROR] Failed to create text field: ${error.message}`
      );
      return null;
    }
  }

  disableAllKeybinds() {
    if (this.keybindBlocker) return; // Already disabled

    this.keybindBlocker = register("guiKey", (char, keyCode, gui, event) => {
      // Only allow ESC key (keyCode 1), block everything else
      if (keyCode !== 1) {
        cancel(event);
      }
    });
  }

  restoreAllKeybinds() {
    if (this.keybindBlocker) {
      this.keybindBlocker.unregister();
      this.keybindBlocker = null;
    }
  }

  registerEvents() {
    // Clear cache when world changes
    register("worldLoad", () => {
      const newWorld = World.getWorld();
      if (this.currentWorld && newWorld !== this.currentWorld) {
        ChatLib.chat(PREFIX + "§eWorld changed - clearing regions cache");
        this.clearCache();
      }
      this.currentWorld = newWorld;
    });

    register("guiOpened", (guiEvent) => {
      const guiScreen = guiEvent.gui;
      if (!guiScreen) return;

      const className = guiScreen.getClass().getSimpleName();
      if (className !== "GuiChest") return;

      for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
          this.checkForRegionsGUI(i);
        }, 50 * i);
      }
    });

    // Monitor inventory changes to detect page changes
    register("itemTooltip", () => {
      if (this.isActive && !this.isScanning) {
        this.detectPageChange();
      }
    });

    register("guiClosed", () => {
      if (this.isActive) {
        this.hideOverlay();
      }
    });

    register("guiRender", (mouseX, mouseY) => {
      if (this.isActive && this.cachedRegions.length > 0) {
        this.renderOverlay();
      }
    });

    // Handle mouse clicks
    register("guiMouseClick", (mouseX, mouseY, button) => {
      if (this.isActive) {
        return this.handleMouseClick(mouseX, mouseY, button);
      }
    });

    // Handle mouse release
    register("guiMouseRelease", (mouseX, mouseY, button) => {
      if (this.isActive && this.scrollbarDragging && button === 0) {
        this.scrollbarDragging = false;
        return true;
      }
    });

    // Handle key presses
    register("guiKey", (char, keyCode) => {
      if (this.isActive) {
        return this.handleKeyPress(keyCode, char);
      }
    });

    // Custom scroll handling using step
    register("step", () => {
      if (!this.isActive) return;

      // Get mouse wheel input
      let scroll = Mouse.getDWheel();
      if (scroll !== 0) {
        this.handleMouseScroll(scroll > 0 ? -1 : 1);
      }
    }).setFps(60);
  }

  handleMouseScroll(direction) {
    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(
      0,
      this.filteredRegions.length - maxVisibleItems
    );

    // Scroll by 1 item at a time
    this.scrollOffset += direction * 1;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  getListAvailableHeight() {
    const screenHeight = Renderer.screen.getHeight();
    const panelHeight = this.calculatePanelDimensions().height;
    return panelHeight - 90; // Account for title, filter, and instructions
  }

  // Calculate panel dimensions to avoid GUI overlap
  calculatePanelDimensions() {
    const screenWidth = Renderer.screen.getWidth();
    const screenHeight = Renderer.screen.getHeight();

    // Standard chest GUI dimensions (approximately)
    const chestGuiWidth = 176;
    const chestGuiHeight = 166;
    const chestGuiX = (screenWidth - chestGuiWidth) / 2;
    const chestGuiY = (screenHeight - chestGuiHeight) / 2;

    // Calculate available space on the right side
    const rightEdgeOfChest = chestGuiX + chestGuiWidth;
    const availableWidthOnRight = screenWidth - rightEdgeOfChest - 20; // 20px margin

    // Panel dimensions
    const maxPanelWidth = 400;
    const minPanelWidth = 300;
    let panelWidth = Math.min(
      maxPanelWidth,
      Math.max(minPanelWidth, availableWidthOnRight)
    );

    // If there's not enough space on the right, position on the left
    let panelX;
    if (availableWidthOnRight < minPanelWidth) {
      panelWidth = Math.min(maxPanelWidth, chestGuiX - 20); // Use left side
      panelX = 10;
    } else {
      panelX = rightEdgeOfChest + 10;
    }

    // Height calculations
    const maxPanelHeight = Math.min(screenHeight - 40, 600);
    const panelHeight = maxPanelHeight;
    const panelY = Math.max(10, (screenHeight - panelHeight) / 2);

    return {
      width: panelWidth,
      height: panelHeight,
      x: panelX,
      y: panelY,
    };
  }

  clearCache() {
    this.cachedRegions = [];
    this.filteredRegions = [];
    this.isActive = false;
    this.hoveredIndex = -1;
    this.selectedIndex = -1;
    this.scrollOffset = 0;
    this.isScanning = false;
    this.filterText = "";
    this.showingFilter = false;
    this.scannedPages.clear();
    this.totalPages = 0;
    this.currentPage = 1;
    this.scrollbarDragging = false;
    this.filterTextField = null;
    this.initializeTextField = true;

    // Restore keybinds when clearing cache
    this.restoreAllKeybinds();
  }

  checkForRegionsGUI(attempt) {
    if (this.isActive || this.isScanning) return;

    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const regionsRegex = /^\(\d+\/\d+\) Regions$|^Regions$/;
    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

    if (regionsRegex.test(cleanTitle)) {
      ChatLib.chat(PREFIX + "§aRegions GUI detected! Starting scan...");

      // Parse page info from title
      const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Regions$/);
      if (pageMatch) {
        this.currentPage = parseInt(pageMatch[1]);
        this.totalPages = parseInt(pageMatch[2]);
      }

      this.isScanning = true;
      this.scanCurrentPage();
    }
  }

  detectPageChange() {
    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Regions$/);

    if (pageMatch) {
      const newPage = parseInt(pageMatch[1]);
      const newTotalPages = parseInt(pageMatch[2]);

      if (newPage !== this.currentPage || newTotalPages !== this.totalPages) {
        this.currentPage = newPage;
        this.totalPages = newTotalPages;

        // Only scan if we haven't scanned this page yet
        if (!this.scannedPages.has(newPage)) {
          ChatLib.chat(
            PREFIX +
              `§eNew page detected: ${newPage}/${newTotalPages}, scanning...`
          );
          this.scanCurrentPage();
        }
      }
    }
  }

  scanCurrentPage() {
    const inventory = Player.getOpenedInventory();
    if (!inventory) {
      this.isScanning = false;
      return;
    }

    // Mark this page as scanned
    this.scannedPages.add(this.currentPage);

    // The regions are in specific slots in the chest GUI
    // prettier-ignore
    const regionSlots = [
      10, 11, 12, 13, 14, 15, 16, // Row 1 
      19, 20, 21, 22, 23, 24, 25, // Row 2
      28, 29, 30, 31, 32, 33, 34, // Row 3
    ];

    let newRegionsFound = 0;

    // Scan the specific region slots
    regionSlots.forEach((slotIndex) => {
      const item = inventory.getStackInSlot(slotIndex);
      if (item && item.getName() !== "Air") {
        const regionData = this.parseRegionItem(item, slotIndex);
        if (regionData) {
          const existingRegion = this.cachedRegions.find(
            (r) => r.name === regionData.name
          );
          if (!existingRegion) {
            this.cachedRegions.push(regionData);
            newRegionsFound++;
          }
        }
      }
    });

    ChatLib.chat(
      PREFIX +
        `§aPage ${this.currentPage} scan complete. Found ${newRegionsFound} new regions. Total: ${this.cachedRegions.length}`
    );

    this.updateFilteredRegions();

    if (!this.isActive) {
      this.isActive = true;
      this.initializeTextField = true;

      // Disable all keybinds when showing overlay
      this.disableAllKeybinds();
    }

    this.isScanning = false;

    if (this.scannedPages.size < this.totalPages) {
      const unscannedPages = [];
      for (let i = 1; i <= this.totalPages; i++) {
        if (!this.scannedPages.has(i)) {
          unscannedPages.push(i);
        }
      }
    }
  }

  parseRegionItem(item, slotIndex) {
    const itemName = item.getName();
    const cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");
    const lore = item.getLore();

    let fromCoords = null;
    let toCoords = null;
    let hasRegionData = false;

    lore.forEach((line) => {
      const cleanLine = line.replace(/§[0-9a-fk-or]/g, "");

      if (cleanLine.startsWith("From:")) {
        fromCoords = cleanLine.substring(5).trim();
        hasRegionData = true;
      } else if (cleanLine.startsWith("To:")) {
        toCoords = cleanLine.substring(3).trim();
        hasRegionData = true;
      }
    });

    return {
      name: cleanName,
      displayName: itemName,
      from: fromCoords || "Unknown",
      to: toCoords || "Unknown",
      lore: lore,
      slotIndex: slotIndex,
      hasCoords: hasRegionData,
      page: this.currentPage,
    };
  }

  updateFilteredRegions() {
    const filterText = this.filterTextField
      ? this.filterTextField.getText()
      : "";

    if (!filterText) {
      this.filteredRegions = [...this.cachedRegions];
    } else {
      const filter = filterText.toLowerCase();
      this.filteredRegions = this.cachedRegions.filter(
        (region) =>
          region.name.toLowerCase().includes(filter) ||
          (region.from && region.from.toLowerCase().includes(filter)) ||
          (region.to && region.to.toLowerCase().includes(filter))
      );
    }

    if (this.selectedIndex >= this.filteredRegions.length) {
      this.selectedIndex = -1;
    }

    // Ensure scroll offset is still valid
    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(
      0,
      this.filteredRegions.length - maxVisibleItems
    );
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  renderOverlay() {
    try {
      const panelDims = this.calculatePanelDimensions();
      const {
        width: panelWidth,
        height: panelHeight,
        x: panelX,
        y: panelY,
      } = panelDims;

      // Initialize text field if needed
      if (this.initializeTextField || !this.filterTextField) {
        const filterY = panelY + 30;
        const filterHeight = 20;
        this.filterTextField = this.createTextField(
          panelX + 10,
          filterY,
          panelWidth - 20,
          filterHeight
        );
        this.initializeTextField = false;

        // Ensure it starts with empty text
        if (this.filterTextField) {
          this.filterTextField.setText(""); // Use wrapper method
          this.filterText = "";
          this.updateFilteredRegions();
        }
      }

      // Draw panel with border
      Renderer.drawRect(
        0xdd000000,
        panelX - 1,
        panelY - 1,
        panelWidth + 4,
        panelHeight + 4
      );
      Renderer.drawRect(
        0xff444444,
        panelX - 1,
        panelY - 1,
        panelWidth + 2,
        panelHeight + 2
      );
      Renderer.drawRect(0xcc222222, panelX, panelY, panelWidth, panelHeight);

      let currentY = panelY + 10;

      // Draw title with PREFIX
      const scannedInfo =
        this.totalPages > 0
          ? `(${this.scannedPages.size}/${this.totalPages} pages)`
          : "";
      const title = `${PREFIX}Regions (${this.cachedRegions.length}) ${scannedInfo}`;
      const titleWidth = Renderer.getStringWidth(title);
      Renderer.drawStringWithShadow(
        title,
        panelX + (panelWidth - titleWidth) / 2,
        currentY
      );
      currentY += 20;

      // Draw and update text field
      if (this.filterTextField) {
        this.filterTextField.render(); // Use wrapper method

        const currentText = this.filterTextField.getText();

        if (currentText !== this.filterText) {
          this.filterText = currentText;
          this.updateFilteredRegions();
        }
      }

      currentY += 30; // Account for text field height + spacing

      // Draw regions list with scrollbar
      this.drawRegionsList(
        panelX,
        currentY,
        panelWidth,
        panelHeight - (currentY - panelY) - 30
      );

      // Draw instructions at bottom
      const instructions = [
        "§eCAUTION: Regions with long names might not save to Last Region!",
        "§eCAUTION: The speed of the buttons is dependant on your ping!",
      ];
      instructions.forEach((instruction, index) => {
        const instrWidth = Renderer.getStringWidth(instruction);
        const instrX = panelX + (panelWidth - instrWidth) / 2;
        const instrY = panelY + panelHeight - 25 + index * 10;
        Renderer.drawStringWithShadow(instruction, instrX, instrY);
      });
    } catch (error) {
      ChatLib.chat(PREFIX + `§c[ERROR] Rendering failed: ${error.message}`);
    }
  }

  drawRegionsList(panelX, listStartY, panelWidth, availableHeight) {
    const itemHeight = 22;
    const itemSpacing = 1;
    const maxVisibleItems = Math.floor(
      availableHeight / (itemHeight + itemSpacing)
    );
    const scrollbarWidth = 3; // Smaller scrollbar
    const scrollbarMargin = 3; // Small margin from edge
    const listWidth = panelWidth - 20; // Align with filter box (10px margin on each side)

    let mouseX, mouseY;
    try {
      mouseX = Client.getMouseX();
      mouseY = Client.getMouseY();
    } catch (e) {
      mouseX = 0;
      mouseY = 0;
    }

    this.hoveredIndex = -1;

    // Calculate visible range
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(
      startIndex + maxVisibleItems,
      this.filteredRegions.length
    );

    // Calculate the actual height of the content being displayed
    const visibleItemCount = endIndex - startIndex;
    const actualContentHeight = visibleItemCount * (itemHeight + itemSpacing);

    // Draw scrollbar if needed (tucked on the right)
    if (this.filteredRegions.length > maxVisibleItems) {
      const scrollbarX = panelX + panelWidth - scrollbarWidth - scrollbarMargin;
      const maxScrollRange = this.filteredRegions.length - maxVisibleItems;

      // Use actual content height instead of full available height
      const scrollbarHeight = actualContentHeight;

      // Draw scrollbar track
      Renderer.drawRect(
        this.colors.scrollbar,
        scrollbarX,
        listStartY,
        scrollbarWidth,
        scrollbarHeight
      );

      // Calculate thumb properties
      const thumbHeight = Math.max(
        10,
        (maxVisibleItems / this.filteredRegions.length) * scrollbarHeight
      );

      // Fix thumb position calculation
      const thumbY =
        maxScrollRange > 0
          ? listStartY +
            (this.scrollOffset / maxScrollRange) *
              (scrollbarHeight - thumbHeight)
          : listStartY;

      // Draw scrollbar thumb
      Renderer.drawRect(
        this.colors.scrollbarThumb,
        scrollbarX,
        thumbY,
        scrollbarWidth,
        thumbHeight
      );
    }

    // Draw regions list (aligned with filter box)
    for (let i = startIndex; i < endIndex; i++) {
      const region = this.filteredRegions[i];
      if (!region) continue;

      const listIndex = i - startIndex;
      const itemX = panelX + 10; // Same margin as filter box
      const itemY = listStartY + listIndex * (itemHeight + itemSpacing);

      // Check if mouse is hovering over list item (not scrollbar area)
      const isHovered =
        mouseX >= itemX &&
        mouseX <= itemX + listWidth &&
        mouseY >= itemY &&
        mouseY <= itemY + itemHeight;

      if (isHovered) {
        this.hoveredIndex = i;
      }

      // Determine colors
      let bgColor = 0xff333333;
      if (i === this.selectedIndex) {
        bgColor = 0xff4caf50; // Green for selected
      } else if (isHovered) {
        bgColor = 0xff555555; // Lighter for hover
      }

      // Draw item background
      Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight);

      // Draw region name - adjust text length based on panel width
      const nameColor =
        i === this.selectedIndex ? "§a" : isHovered ? "§e" : "§f";
      const regionName = region.name || "Unknown Region";

      // Calculate max characters based on available width (account for scrollbar)
      const availableTextWidth = listWidth - 10; // 5px padding on each side
      const maxChars = Math.floor(availableTextWidth / 6) - 2; // Rough character width estimation
      const displayName =
        regionName.length > maxChars
          ? regionName.substring(0, maxChars - 3) + "..."
          : regionName;

      Renderer.drawStringWithShadow(
        nameColor + displayName,
        itemX + 5,
        itemY + 2
      );

      // Draw page info if panel is wide enough (positioned from right edge)
      if (this.totalPages > 1 && panelWidth > 250) {
        const pageText = `§8[P${region.page}]`;
        const pageWidth = Renderer.getStringWidth(pageText);
        Renderer.drawStringWithShadow(
          pageText,
          itemX + listWidth - pageWidth - 5,
          itemY + 2
        );
      }

      // Format coordinates - adjust based on available width
      if (region.hasCoords && region.from && region.to) {
        const formattedFrom = this.formatCoordinates(region.from);
        const formattedTo = this.formatCoordinates(region.to);
        const coordText = `§7${formattedFrom} → ${formattedTo}`;

        // Truncate coordinates if panel is too narrow
        const maxCoordLength = Math.floor(availableTextWidth / 6);
        const finalCoordText =
          coordText.length > maxCoordLength
            ? coordText.substring(0, maxCoordLength - 3) + "..."
            : coordText;

        Renderer.drawStringWithShadow(finalCoordText, itemX + 5, itemY + 12);
      } else {
        Renderer.drawStringWithShadow(
          "§8No coordinates",
          itemX + 5,
          itemY + 12
        );
      }
    }
  }

  formatCoordinates(coords) {
    if (!coords || coords === "Unknown") return coords;

    const clean = coords.replace(/\s/g, "").replace(/[()]/g, "");
    const parts = clean.split(",");
    if (parts.length === 3) {
      return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
    }

    return coords;
  }

  handleMouseClick(mouseX, mouseY, button) {
    if (!this.isActive || button !== 0) return false; // Only handle left clicks

    const panelDims = this.calculatePanelDimensions();
    const { width: panelWidth, x: panelX, y: panelY } = panelDims;

    // Let the text field handle its own clicks
    if (this.filterTextField) {
      this.filterTextField.mouseClicked(mouseX, mouseY, button); // Use wrapper method
    }

    // Check for region click
    if (
      this.hoveredIndex >= 0 &&
      this.hoveredIndex < this.filteredRegions.length
    ) {
      const region = this.filteredRegions[this.hoveredIndex];
      this.selectedIndex = this.hoveredIndex;
      this.editRegion(region);
      return true;
    }

    // If clicking anywhere on our panel, consume the click
    if (
      mouseX >= panelX &&
      mouseX <= panelX + panelWidth &&
      mouseY >= panelY &&
      mouseY <= panelY + panelDims.height
    ) {
      return true;
    }

    return false;
  }

  handleKeyPress(keyCode, char) {
    // When text field is focused, we want chat-like behavior
    if (this.filterTextField && this.filterTextField.isFocused()) {
      if (keyCode === 1) {
        // ESC
        this.filterTextField.setIsFocused(false);
        this.hideOverlay();
        return true;
      } else if (keyCode === 28) {
        // Enter
        this.filterTextField.setIsFocused(false);
        return true;
      } else if (keyCode === 15) {
        // Tab
        this.filterTextField.setIsFocused(false);
        return true;
      }

      // For all other keys, let the text field handle them
      this.filterTextField.keyTyped(char, keyCode);
      return true;
    }

    // Regular navigation when text field is not focused
    if (keyCode === 1) {
      // ESC
      this.hideOverlay();
      return true;
    } else if (keyCode === 200) {
      // Up arrow
      this.navigateUp();
      return true;
    } else if (keyCode === 208) {
      // Down arrow
      this.navigateDown();
      return true;
    } else if (keyCode === 28) {
      // Enter
      if (
        this.selectedIndex >= 0 &&
        this.selectedIndex < this.filteredRegions.length
      ) {
        this.editRegion(this.filteredRegions[this.selectedIndex]);
        return true;
      }
    }

    return true;
  }

  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.ensureVisible();
    } else if (this.selectedIndex === -1 && this.filteredRegions.length > 0) {
      this.selectedIndex = 0;
    }
  }

  navigateDown() {
    if (this.selectedIndex < this.filteredRegions.length - 1) {
      this.selectedIndex++;
      this.ensureVisible();
    } else if (this.selectedIndex === -1 && this.filteredRegions.length > 0) {
      this.selectedIndex = 0;
    }
  }

  ensureVisible() {
    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);

    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex;
    } else if (this.selectedIndex >= this.scrollOffset + maxVisibleItems) {
      this.scrollOffset = this.selectedIndex - maxVisibleItems + 1;
    }

    // Ensure scroll offset is within bounds
    const maxScroll = Math.max(
      0,
      this.filteredRegions.length - maxVisibleItems
    );
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  editRegion(region) {
    // Just run the region edit command instantly
    ChatLib.command(`region edit ${region.name}`);
  }

  hideOverlay() {
    this.isActive = false;
    this.hoveredIndex = -1;
    this.selectedIndex = -1;
    this.scrollOffset = 0;
    this.isScanning = false;
    this.scrollbarDragging = false;
    this.filterTextField = null;
    this.initializeTextField = true;

    // Restore keybinds when hiding overlay
    this.restoreAllKeybinds();
  }
}

const regionsVisualCache = new RegionsVisualCache();
export { regionsVisualCache };
