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

class FunctionsVisualCache {
  constructor() {
    this.cachedFunctions = [];
    this.filteredFunctions = [];
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

    this.filterTextField = null;
    this.initializeTextField = true;

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
    if (this.keybindBlocker) return;

    this.keybindBlocker = register("guiKey", (char, keyCode, gui, event) => {
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
    register("worldLoad", () => {
      const newWorld = World.getWorld();
      if (this.currentWorld && newWorld !== this.currentWorld) {
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
          this.checkForFunctionsGUI(i);
        }, 50 * i);
      }
    });

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
      if (this.isActive && this.cachedFunctions.length > 0) {
        this.renderOverlay();
      }
    });

    register("guiMouseClick", (mouseX, mouseY, button) => {
      if (this.isActive) {
        return this.handleMouseClick(mouseX, mouseY, button);
      }
    });

    register("guiMouseRelease", (mouseX, mouseY, button) => {
      if (this.isActive && this.scrollbarDragging && button === 0) {
        this.scrollbarDragging = false;
        return true;
      }
    });

    register("guiKey", (char, keyCode) => {
      if (this.isActive) {
        return this.handleKeyPress(keyCode, char);
      }
    });

    register("step", () => {
      if (!this.isActive) return;

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
      this.filteredFunctions.length - maxVisibleItems
    );

    this.scrollOffset += direction * 1;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  getListAvailableHeight() {
    const screenHeight = Renderer.screen.getHeight();
    const panelHeight = this.calculatePanelDimensions().height;
    return panelHeight - 90;
  }

  calculatePanelDimensions() {
    const screenWidth = Renderer.screen.getWidth();
    const screenHeight = Renderer.screen.getHeight();

    const chestGuiWidth = 176;
    const chestGuiHeight = 166;
    const chestGuiX = (screenWidth - chestGuiWidth) / 2;
    const chestGuiY = (screenHeight - chestGuiHeight) / 2;

    const rightEdgeOfChest = chestGuiX + chestGuiWidth;
    const availableWidthOnRight = screenWidth - rightEdgeOfChest - 20;

    const maxPanelWidth = 400;
    const minPanelWidth = 300;
    let panelWidth = Math.min(
      maxPanelWidth,
      Math.max(minPanelWidth, availableWidthOnRight)
    );

    let panelX;
    if (availableWidthOnRight < minPanelWidth) {
      panelWidth = Math.min(maxPanelWidth, chestGuiX - 20);
      panelX = 10;
    } else {
      panelX = rightEdgeOfChest + 10;
    }

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
    this.cachedFunctions = [];
    this.filteredFunctions = [];
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
    this.restoreAllKeybinds();
  }

  checkForFunctionsGUI(attempt) {
    if (this.isActive || this.isScanning) return;

    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const functionsRegex = /^\(\d+\/\d+\) Functions$|^Functions$/;
    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

    if (functionsRegex.test(cleanTitle)) {
      ChatLib.chat(PREFIX + "§aFunctions GUI detected! Starting scan...");

      // Parse page info from title
      const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Functions$/);
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
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Functions$/);

    if (pageMatch) {
      const newPage = parseInt(pageMatch[1]);
      const newTotalPages = parseInt(pageMatch[2]);

      if (newPage !== this.currentPage || newTotalPages !== this.totalPages) {
        this.currentPage = newPage;
        this.totalPages = newTotalPages;

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

    this.scannedPages.add(this.currentPage);

    // The functions are in specific slots in the chest GUI (same as regions)
    // prettier-ignore
    const functionSlots = [
      10, 11, 12, 13, 14, 15, 16, // Row 1 
      19, 20, 21, 22, 23, 24, 25, // Row 2
      28, 29, 30, 31, 32, 33, 34, // Row 3
    ];

    let newFunctionsFound = 0;

    functionSlots.forEach((slotIndex) => {
      const item = inventory.getStackInSlot(slotIndex);
      if (item && item.getName() !== "Air") {
        const functionData = this.parseFunctionItem(item, slotIndex);
        if (functionData) {
          const existingFunction = this.cachedFunctions.find(
            (f) => f.name === functionData.name
          );
          if (!existingFunction) {
            this.cachedFunctions.push(functionData);
            newFunctionsFound++;
          }
        }
      }
    });

    ChatLib.chat(
      PREFIX +
        `§aPage ${this.currentPage} scan complete. Found ${newFunctionsFound} new functions. Total: ${this.cachedFunctions.length}`
    );

    this.updateFilteredFunctions();

    if (!this.isActive) {
      this.isActive = true;
      this.initializeTextField = true;
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

  parseFunctionItem(item, slotIndex) {
    const itemName = item.getName();
    const cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");
    const lore = item.getLore();

    let descriptions = [];
    let hasFunctionData = false;

    lore.forEach((line) => {
      const cleanLine = line.replace(/§[0-9a-fk-or]/g, "");

      if (
        cleanLine.trim() === "" ||
        cleanLine.includes("Left Click") ||
        cleanLine.includes("Right Click") ||
        cleanLine.includes("SHIFT") ||
        cleanLine.includes("more options")
      ) {
        return;
      }

      if (line.includes("§7")) {
        descriptions.push(cleanLine.trim());
        hasFunctionData = true;
      }
    });

    let ctItem = null;
    let itemId = 0;
    let itemDamage = 0;

    try {
      itemId = item.getID();
      itemDamage = item.getMetadata ? item.getMetadata() : 0;

      if (itemId && itemId !== 0) {
        if (itemDamage > 0) {
          ctItem = new Item(itemId, itemDamage);
        } else {
          ctItem = new Item(itemId);
        }
      }
    } catch (error) {
      ctItem = null;
    }

    return {
      name: cleanName,
      displayName: itemName,
      description: descriptions.length > 0 ? descriptions.join(" ") : null,
      descriptions: descriptions,
      lore: lore,
      slotIndex: slotIndex,
      hasDescription: hasFunctionData,
      ctItem: ctItem,
      itemId: itemId,
      itemDamage: itemDamage,
      page: this.currentPage,
    };
  }

  updateFilteredFunctions() {
    const filterText = this.filterTextField
      ? this.filterTextField.getText()
      : "";

    if (!filterText) {
      this.filteredFunctions = [...this.cachedFunctions];
    } else {
      const filter = filterText.toLowerCase();
      this.filteredFunctions = this.cachedFunctions.filter(
        (func) =>
          func.name.toLowerCase().includes(filter) ||
          (func.description &&
            func.description.toLowerCase().includes(filter)) ||
          (func.descriptions &&
            func.descriptions.some((desc) =>
              desc.toLowerCase().includes(filter)
            ))
      );
    }

    if (this.selectedIndex >= this.filteredFunctions.length) {
      this.selectedIndex = -1;
    }

    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(
      0,
      this.filteredFunctions.length - maxVisibleItems
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

        if (this.filterTextField) {
          this.filterTextField.setText("");
          this.filterText = "";
          this.updateFilteredFunctions();
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

      const scannedInfo =
        this.totalPages > 0
          ? `(${this.scannedPages.size}/${this.totalPages} pages)`
          : "";
      const title = `${PREFIX}Functions (${this.cachedFunctions.length}) ${scannedInfo}`;
      const titleWidth = Renderer.getStringWidth(title);
      Renderer.drawStringWithShadow(
        title,
        panelX + (panelWidth - titleWidth) / 2,
        currentY
      );
      currentY += 20;

      if (this.filterTextField) {
        this.filterTextField.render();

        const currentText = this.filterTextField.getText();

        if (currentText !== this.filterText) {
          this.filterText = currentText;
          this.updateFilteredFunctions();
        }
      }

      currentY += 30;

      this.drawFunctionsList(
        panelX,
        currentY,
        panelWidth,
        panelHeight - (currentY - panelY) - 30
      );

      // Draw instructions at bottom
      const instructions = [
        "§eCAUTION: Functions with long names might not save to Last Function!",
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

  drawFunctionsList(panelX, listStartY, panelWidth, availableHeight) {
    const itemHeight = 22;
    const itemSpacing = 1;
    const maxVisibleItems = Math.floor(
      availableHeight / (itemHeight + itemSpacing)
    );
    const scrollbarWidth = 3;
    const scrollbarMargin = 3;
    const listWidth = panelWidth - 20;
    const iconSize = 16;
    const iconMargin = 4;

    let mouseX, mouseY;
    try {
      mouseX = Client.getMouseX();
      mouseY = Client.getMouseY();
    } catch (e) {
      mouseX = 0;
      mouseY = 0;
    }

    this.hoveredIndex = -1;

    const startIndex = this.scrollOffset;
    const endIndex = Math.min(
      startIndex + maxVisibleItems,
      this.filteredFunctions.length
    );

    const visibleItemCount = endIndex - startIndex;
    const actualContentHeight = visibleItemCount * (itemHeight + itemSpacing);

    if (this.filteredFunctions.length > maxVisibleItems) {
      const scrollbarX = panelX + panelWidth - scrollbarWidth - scrollbarMargin;
      const maxScrollRange = this.filteredFunctions.length - maxVisibleItems;

      const scrollbarHeight = actualContentHeight;

      Renderer.drawRect(
        this.colors.scrollbar,
        scrollbarX,
        listStartY,
        scrollbarWidth,
        scrollbarHeight
      );

      const thumbHeight = Math.max(
        10,
        (maxVisibleItems / this.filteredFunctions.length) * scrollbarHeight
      );

      const thumbY =
        maxScrollRange > 0
          ? listStartY +
            (this.scrollOffset / maxScrollRange) *
              (scrollbarHeight - thumbHeight)
          : listStartY;

      Renderer.drawRect(
        this.colors.scrollbarThumb,
        scrollbarX,
        thumbY,
        scrollbarWidth,
        thumbHeight
      );
    }

    for (let i = startIndex; i < endIndex; i++) {
      const func = this.filteredFunctions[i];
      if (!func) continue;

      const listIndex = i - startIndex;
      const itemX = panelX + 10;
      const itemY = listStartY + listIndex * (itemHeight + itemSpacing);

      const isHovered =
        mouseX >= itemX &&
        mouseX <= itemX + listWidth &&
        mouseY >= itemY &&
        mouseY <= itemY + itemHeight;

      if (isHovered) {
        this.hoveredIndex = i;
      }

      let bgColor = 0xff333333;
      if (i === this.selectedIndex) {
        bgColor = 0xff4caf50; // Green for selected
      } else if (isHovered) {
        bgColor = 0xff555555; // Lighter for hover
      }

      Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight);

      try {
        if (func.ctItem) {
          const iconX = itemX + iconMargin;
          const iconY = itemY + (itemHeight - iconSize) / 2;

          func.ctItem.draw(iconX, iconY, 1.0);
        } else {
          this.drawFallbackIcon(
            itemX + iconMargin,
            itemY + (itemHeight - iconSize) / 2,
            iconSize,
            func
          );
        }
      } catch (e) {
        this.drawFallbackIcon(
          itemX + iconMargin,
          itemY + (itemHeight - iconSize) / 2,
          iconSize,
          func
        );
      }

      const textStartX = itemX + iconSize + iconMargin * 2;
      const availableTextWidth = listWidth - iconSize - iconMargin * 3;

      // Draw function name
      const nameColor =
        i === this.selectedIndex ? "§a" : isHovered ? "§e" : "§f";
      const functionName = func.name || "Unknown Function";

      const maxChars = Math.floor(availableTextWidth / 6) - 2;
      const displayName =
        functionName.length > maxChars
          ? functionName.substring(0, maxChars - 3) + "..."
          : functionName;

      let nameY;
      if (!func.hasDescription || !func.description) {
        nameY = itemY + (itemHeight - 8) / 2;
      } else {
        nameY = itemY + 2;
      }

      Renderer.drawStringWithShadow(nameColor + displayName, textStartX, nameY);

      if (this.totalPages > 1 && panelWidth > 250) {
        const pageText = `§8[P${func.page}]`;
        const pageWidth = Renderer.getStringWidth(pageText);
        const pageHeight = 8;

        const pageY = itemY + (itemHeight - pageHeight) / 2;

        Renderer.drawStringWithShadow(
          pageText,
          itemX + listWidth - pageWidth - 5,
          pageY
        );
      }

      if (func.hasDescription && func.description) {
        const descText = `§7${func.description}`;
        const maxDescLength = Math.floor(availableTextWidth / 6);
        const finalDescText =
          descText.length > maxDescLength
            ? descText.substring(0, maxDescLength - 3) + "..."
            : descText;

        Renderer.drawStringWithShadow(finalDescText, textStartX, itemY + 12);
      }
    }
  }

  drawFallbackIcon(x, y, size, func) {
    let color = 0xff666666;

    if (func.name) {
      let hash = 0;
      for (let i = 0; i < func.name.length; i++) {
        hash = func.name.charCodeAt(i) + ((hash << 5) - hash);
      }

      // don't make colors too dark
      const r = (Math.abs(hash) % 128) + 127;
      const g = (Math.abs(hash >> 8) % 128) + 127;
      const b = (Math.abs(hash >> 16) % 128) + 127;

      color = (0xff << 24) | (r << 16) | (g << 8) | b;
    }

    Renderer.drawRect(color, x, y, size, size);

    Renderer.drawRect(0xff000000, x, y, size, 1); // top
    Renderer.drawRect(0xff000000, x, y + size - 1, size, 1); // bottom
    Renderer.drawRect(0xff000000, x, y, 1, size); // left
    Renderer.drawRect(0xff000000, x + size - 1, y, 1, size); // right

    if (func.name && func.name.length > 0) {
      const letter = func.name.charAt(0).toUpperCase();
      const letterWidth = Renderer.getStringWidth(letter);
      const centerX = x + (size - letterWidth) / 2;
      const centerY = y + (size - 8) / 2;
      Renderer.drawStringWithShadow("§f" + letter, centerX, centerY);
    }
  }

  handleMouseClick(mouseX, mouseY, button) {
    if (!this.isActive || button !== 0) return false;

    const panelDims = this.calculatePanelDimensions();
    const { width: panelWidth, x: panelX, y: panelY } = panelDims;

    if (this.filterTextField) {
      this.filterTextField.mouseClicked(mouseX, mouseY, button);
    }

    if (
      this.hoveredIndex >= 0 &&
      this.hoveredIndex < this.filteredFunctions.length
    ) {
      const func = this.filteredFunctions[this.hoveredIndex];
      this.selectedIndex = this.hoveredIndex;
      this.editFunction(func);
      return true;
    }

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

      this.filterTextField.keyTyped(char, keyCode);
      return true;
    }

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
        this.selectedIndex < this.filteredFunctions.length
      ) {
        this.editFunction(this.filteredFunctions[this.selectedIndex]);
        return true;
      }
    }

    return true;
  }

  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.ensureVisible();
    } else if (this.selectedIndex === -1 && this.filteredFunctions.length > 0) {
      this.selectedIndex = 0;
    }
  }

  navigateDown() {
    if (this.selectedIndex < this.filteredFunctions.length - 1) {
      this.selectedIndex++;
      this.ensureVisible();
    } else if (this.selectedIndex === -1 && this.filteredFunctions.length > 0) {
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

    const maxScroll = Math.max(
      0,
      this.filteredFunctions.length - maxVisibleItems
    );
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  editFunction(func) {
    ChatLib.command(`function edit ${func.name}`);
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
    this.restoreAllKeybinds();
  }
}

const functionsVisualCache = new FunctionsVisualCache();
export { functionsVisualCache };
