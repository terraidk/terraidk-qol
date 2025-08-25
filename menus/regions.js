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

    this.isAutoScanning = false;
    this.autoScanTimeout = null;

    this.filterTextField = null;
    this.initializeTextField = true;
    this.persistentFilterText = "";

    this.keybindBlocker = null;

    this.lastRegionInventorySnapshot = null;
    this.isInRegionEditGUI = false;
    this.regionEditGUITimeout = null;

    this.dropdown = {
      isVisible: false,
      region: null,
      x: 0,
      y: 0,
      width: 30,
      height: 0,
      hoveredOption: -1,
      deleteConfirmationActive: false,
      options: [
        { text: "Edit", action: "edit", color: "§e" },
        { text: "Delete", action: "delete", color: "§c" },
      ],
    };

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
      buttonBg: 0xff4a4a4a,
      buttonHover: 0xff5a5a5a,
      buttonText: 0xffffffff,
      scanButton: 0xff2196f3,
      scanButtonHover: 0xff1976d2,
      scanButtonActive: 0xff0d47a1,
      dropdownBg: 0xf0222222,
      dropdownBorder: 0xff666666,
      dropdownHover: 0xff555555,
      deleteConfirmation: 0xff660000,
      deleteConfirmationHover: 0xff880000,
      createButton: 0xff4caf50,
      createButtonHover: 0xff45a049,
      createButtonDisabled: 0xff666666,
    };

    this.createButton = null;

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

  showDropdown(region, mouseX, mouseY) {
    this.dropdown.isVisible = true;
    this.dropdown.region = region;
    this.dropdown.hoveredOption = -1;
    this.dropdown.deleteConfirmationActive = false;

    const itemHeight = 20;
    this.dropdown.height = this.dropdown.options.length * itemHeight;

    let maxWidth = 80;
    this.dropdown.options.forEach((option) => {
      const textWidth = Renderer.getStringWidth(option.text) + 16;
      maxWidth = Math.max(maxWidth, textWidth);
    });

    const confirmTextWidth = Renderer.getStringWidth("CONFIRM") + 16;
    maxWidth = Math.min(maxWidth, confirmTextWidth);

    this.dropdown.width = maxWidth;

    const screenWidth = Renderer.screen.getWidth();
    const screenHeight = Renderer.screen.getHeight();

    this.dropdown.x = Math.min(mouseX, screenWidth - this.dropdown.width - 10);
    this.dropdown.y = Math.min(
      mouseY,
      screenHeight - this.dropdown.height - 10
    );

    this.dropdown.x = Math.max(10, this.dropdown.x);
    this.dropdown.y = Math.max(10, this.dropdown.y);
  }

  hideDropdown() {
    this.dropdown.isVisible = false;
    this.dropdown.region = null;
    this.dropdown.hoveredOption = -1;
    this.dropdown.deleteConfirmationActive = false;
  }

  renderDropdown() {
    if (!this.dropdown.isVisible || !this.dropdown.region) return;

    const { x, y, width, height } = this.dropdown;
    const itemHeight = 20;

    let mouseX, mouseY;
    try {
      mouseX = Client.getMouseX();
      mouseY = Client.getMouseY();
    } catch (e) {
      mouseX = 0;
      mouseY = 0;
    }

    Renderer.drawRect(0xff000000, x - 1, y - 1, width + 2, height + 2);
    Renderer.drawRect(this.colors.dropdownBg, x, y, width, height);

    this.dropdown.hoveredOption = -1;

    this.dropdown.options.forEach((option, index) => {
      const itemY = y + index * itemHeight;

      const isHovered =
        mouseX >= x &&
        mouseX <= x + width &&
        mouseY >= itemY &&
        mouseY <= itemY + itemHeight;

      if (isHovered) {
        this.dropdown.hoveredOption = index;
      }

      let backgroundColor = this.colors.dropdownHover;
      let optionText = option.text;
      let textColor = option.color;

      if (option.action === "delete") {
        if (this.dropdown.deleteConfirmationActive) {
          optionText = "CONFIRM";
          textColor = "§c§l";
          backgroundColor = isHovered
            ? this.colors.deleteConfirmationHover
            : this.colors.deleteConfirmation;
        } else {
          backgroundColor = isHovered ? this.colors.dropdownHover : 0x00000000;
        }
      } else {
        backgroundColor = isHovered ? this.colors.dropdownHover : 0x00000000;
      }

      if (backgroundColor !== 0x00000000) {
        Renderer.drawRect(backgroundColor, x, itemY, width, itemHeight);
      }

      const textX = x + 8;
      const textY = itemY + (itemHeight - 8) / 2;
      Renderer.drawStringWithShadow(textColor + optionText, textX, textY);
    });

    const headerText = `§7${this.dropdown.region.name}`;
    const headerWidth = Renderer.getStringWidth(headerText);
    if (headerWidth <= width - 16) {
      Renderer.drawStringWithShadow(
        headerText,
        x + (width - headerWidth) / 2,
        y - 12
      );
    }
  }

  handleDropdownClick(mouseX, mouseY) {
    if (!this.dropdown.isVisible) return false;

    const { x, y, width, height } = this.dropdown;

    if (
      mouseX >= x &&
      mouseX <= x + width &&
      mouseY >= y &&
      mouseY <= y + height
    ) {
      if (this.dropdown.hoveredOption >= 0) {
        const option = this.dropdown.options[this.dropdown.hoveredOption];
        const region = this.dropdown.region;

        if (option.action === "delete") {
          if (this.dropdown.deleteConfirmationActive) {
            ChatLib.chat(PREFIX + `§cDeleting region: ${region.name}`);
            ChatLib.command(`region delete ${region.name}`);
            this.hideDropdown();

            setTimeout(() => {
              ChatLib.command("regions");
            }, 50);

            return true;
          } else {
            this.dropdown.deleteConfirmationActive = true;
            return true;
          }
        } else {
          this.executeDropdownAction(option.action, region);
          this.hideDropdown();
          return true;
        }
      }
    }

    this.hideDropdown();
    return false;
  }

  executeDropdownAction(action, region) {
    switch (action) {
      case "edit":
        ChatLib.command(`region edit ${region.name}`);
        break;
      case "delete":
        ChatLib.command(`region delete ${region.name}`);
        break;
      default:
        ChatLib.chat(PREFIX + `§cUnknown action: ${action}`);
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

    register("chat", (regionName, event) => {
      if (this.cachedRegions.length > 0) {
        this.handleRegionCreated(regionName);
      }
    }).setChatCriteria("Created region ${regionName}!");

    register("chat", (regionName, event) => {
      if (this.cachedRegions.length > 0) {
        this.handleRegionDeleted(regionName);
      }
    }).setChatCriteria("Deleted the region ${regionName}");

    register("chat", (oldName, newName, event) => {
      if (this.cachedRegions.length > 0) {
        this.handleRegionRenamed(oldName, newName);
      }
    }).setChatCriteria("Renamed region ${oldName} to ${newName}");

    this.lastRegionInventorySnapshot = null;
    this.isInRegionEditGUI = false;
    this.regionEditGUITimeout = null;

    register("guiOpened", (guiEvent) => {
      const guiScreen = guiEvent.gui;
      if (!guiScreen) return;

      const className = guiScreen.getClass().getSimpleName();
      if (className !== "GuiChest") return;

      setTimeout(() => {
        const inventory = Player.getOpenedInventory();
        if (!inventory) return;

        const title = inventory.getName();
        const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

        if (cleanTitle.startsWith("Edit: ") || cleanTitle === "Are you sure?") {
          this.isInRegionEditGUI = true;
        } else {
          for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
              this.checkForRegionsGUI(i);
            }, 50 * i);
          }
        }
      }, 50);
    });

    register("guiClosed", () => {
      if (this.isInRegionEditGUI) {
        this.isInRegionEditGUI = false;
      } else if (this.isActive) {
        this.hideOverlay();
      }
    });

    register("guiRender", () => {
      if (this.isActive && !this.isScanning && !this.isAutoScanning) {
        this.performCacheValidation();
      }
    });

    register("itemTooltip", () => {
      if (this.isActive && !this.isScanning) {
        this.detectPageChange();
      }
    });

    register("guiRender", (mouseX, mouseY) => {
      if (this.isActive && this.cachedRegions.length > 0) {
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

  handleRegionCreated(regionName) {
    const existingRegion = this.cachedRegions.find(
      (r) => r.name === regionName
    );

    if (!existingRegion) {
      const newRegion = {
        name: regionName,
        displayName: `§f${regionName}`,
        from: "Newly created region - data not yet scanned",
        to: "Newly created region - data not yet scanned",
        lore: [],
        slotIndex: -1,
        hasCoords: false,
        ctItem: null,
        itemId: 0,
        itemDamage: 0,
        page: this.currentPage || 1,
        isPlaceholder: true,
        createdAt: Date.now(),
      };

      this.cachedRegions.push(newRegion);
      this.updateFilteredRegions();

      ChatLib.chat(
        PREFIX +
          `§a+ Added region "${regionName}" to cache (${this.cachedRegions.length} total)`
      );
    } else {
      ChatLib.chat(
        PREFIX + `§e Region "${regionName}" already exists in cache`
      );
    }
  }

  handleRegionDeleted(regionName) {
    const initialCount = this.cachedRegions.length;

    this.cachedRegions = this.cachedRegions.filter(
      (r) => r.name !== regionName
    );

    if (this.cachedRegions.length < initialCount) {
      this.updateFilteredRegions();

      if (this.selectedIndex >= this.cachedRegions.length) {
        this.selectedIndex = -1;
      }

      ChatLib.chat(
        PREFIX +
          `§c- Removed region "${regionName}" from cache (${this.cachedRegions.length} total)`
      );
    } else {
      ChatLib.chat(PREFIX + `§e Region "${regionName}" was not found in cache`);
    }
  }

  handleRegionRenamed(oldName, newName) {
    const region = this.cachedRegions.find((r) => r.name === oldName);

    if (region) {
      region.name = newName;
      region.displayName = `§f${newName}`;
      this.updateFilteredRegions();

      ChatLib.chat(
        PREFIX + `§6Renamed region "${oldName}" → "${newName}" in cache`
      );
    } else {
      this.handleRegionCreated(newName);
      ChatLib.chat(
        PREFIX +
          `§e Region "${oldName}" not found in cache, created placeholder for "${newName}"`
      );
    }
  }

  refreshPlaceholderRegions() {
    const placeholders = this.cachedRegions.filter((r) => r.isPlaceholder);
    if (placeholders.length > 0) {
      ChatLib.chat(
        PREFIX +
          `§e${placeholders.length} placeholder region(s) detected. Consider rescanning to get full data.`
      );
    }
  }

  validateCacheAgainstCurrentPage() {
    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";
    const regionsRegex = /^\(\d+\/\d+\) Regions$|^Regions$/;

    if (!regionsRegex.test(cleanTitle)) return;

    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Regions$/);
    const currentPageNum = pageMatch ? parseInt(pageMatch[1]) : 1;

    if (
      currentPageNum !== this.currentPage ||
      !this.scannedPages.has(currentPageNum)
    ) {
      this.currentPage = currentPageNum;
      this.scanCurrentPage();
    }
  }

  performCacheValidation() {
    if (!this.isActive || this.isScanning) return;

    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";
    const regionsRegex = /^\(\d+\/\d+\) Regions$|^Regions$/;

    if (regionsRegex.test(cleanTitle)) {
      this.validateCacheAgainstCurrentPage();
    }
  }

  cleanStaleRegions() {
    const beforeCount = this.cachedRegions.length;

    this.cachedRegions = this.cachedRegions.filter((region) => {
      if (region.deleted) return false;

      if (
        region.isPlaceholder &&
        region.createdAt &&
        Date.now() - region.createdAt > 300000
      ) {
        return false;
      }

      return true;
    });

    const removedCount = beforeCount - this.cachedRegions.length;
    if (removedCount > 0) {
      this.updateFilteredRegions();
    }
  }

  handleMouseScroll(direction) {
    if (this.dropdown.isVisible) {
      this.hideDropdown();
    }

    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(
      0,
      this.filteredRegions.length - maxVisibleItems
    );

    this.scrollOffset += direction * 1;
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  getListAvailableHeight() {
    const screenHeight = Renderer.screen.getHeight();
    const panelHeight = this.calculatePanelDimensions().height;
    return panelHeight - 130;
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

    this.isAutoScanning = false;
    if (this.autoScanTimeout) {
      clearTimeout(this.autoScanTimeout);
      this.autoScanTimeout = null;
    }

    this.lastRegionInventorySnapshot = null;
    this.isInRegionEditGUI = false;
    if (this.regionEditGUITimeout) {
      clearTimeout(this.regionEditGUITimeout);
      this.regionEditGUITimeout = null;
    }
    this.createButton = null;

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
      const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Regions$/);
      if (pageMatch) {
        this.currentPage = parseInt(pageMatch[1]);
        this.totalPages = parseInt(pageMatch[2]);
      } else if (cleanTitle === "Regions") {
        this.currentPage = 1;
        this.totalPages = this.detectTotalPages(inventory);
      }

      this.isScanning = true;
      this.scanCurrentPage();
    }
  }

  detectTotalPages(inventory) {
    const nextPageItem = inventory.getStackInSlot(53);

    if (nextPageItem && nextPageItem.getName() !== "Air") {
      const lore = nextPageItem.getLore() || [];
      const itemName = nextPageItem.getName() || "";

      const linesToCheck = [...lore, itemName].filter(
        (line) => line != null && line !== ""
      );

      for (const line of linesToCheck) {
        try {
          const cleanLine = line.replace(/§[0-9a-fk-or]/g, "");
          const pagePattern = cleanLine.match(/(\d+)\/(\d+)/);
          if (pagePattern) {
            return parseInt(pagePattern[2]);
          }
        } catch (error) {
          continue;
        }
      }

      return 999;
    } else {
      return 1;
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

        if (this.totalPages === 999 || newTotalPages !== this.totalPages) {
          this.totalPages = newTotalPages;
        }

        if (!this.scannedPages.has(newPage)) {
          if (this.isAutoScanning) {
            ChatLib.chat(
              PREFIX + `§bAuto-scanning page ${newPage}/${this.totalPages}...`
            );
          } else {
            ChatLib.chat(
              PREFIX +
                `§eNew page detected: ${newPage}/${this.totalPages}, scanning...`
            );
          }
          this.scanCurrentPage();
        } else if (this.isAutoScanning) {
          setTimeout(() => {
            this.continueAutoScan();
          }, this.autoScanDelay / 2);
        }
      }
    } else if (cleanTitle === "Regions") {
      if (this.currentPage !== 1) {
        this.currentPage = 1;

        if (!this.scannedPages.has(1)) {
          ChatLib.chat(PREFIX + `§eBack to page 1, scanning...`);
          this.scanCurrentPage();
        } else if (this.isAutoScanning) {
          setTimeout(() => {
            this.continueAutoScan();
          }, this.autoScanDelay / 2);
        }
      }
    }
  }

  stopAutoScan() {
    if (!this.isAutoScanning) return;

    this.isAutoScanning = false;
    if (this.autoScanTimeout) {
      clearTimeout(this.autoScanTimeout);
      this.autoScanTimeout = null;
    }

    ChatLib.chat(
      PREFIX +
        `§eAuto-scan stopped. Scanned ${this.scannedPages.size}/${this.totalPages} pages.`
    );
  }

  scanCurrentPage() {
    const inventory = Player.getOpenedInventory();
    if (!inventory) {
      this.isScanning = false;
      return;
    }

    this.scannedPages.add(this.currentPage);

    // prettier-ignore
    const regionSlots = [
      10, 11, 12, 13, 14, 15, 16, // Row 1 
      19, 20, 21, 22, 23, 24, 25, // Row 2
      28, 29, 30, 31, 32, 33, 34, // Row 3
    ];

    const currentPageRegions = new Set();
    let newRegionsFound = 0;
    let updatedPlaceholders = 0;
    let renamedRegions = 0;

    regionSlots.forEach((slotIndex) => {
      const item = inventory.getStackInSlot(slotIndex);
      if (item && item.getName() !== "Air") {
        const regionData = this.parseRegionItem(item, slotIndex);
        if (regionData) {
          currentPageRegions.add(regionData.name);

          const existingRegion = this.cachedRegions.find(
            (r) => r.name === regionData.name
          );

          if (!existingRegion) {
            const possibleRename = this.cachedRegions.find(
              (r) =>
                r.page === this.currentPage &&
                r.slotIndex === slotIndex &&
                r.name !== regionData.name
            );

            if (possibleRename) {
              if (renamedRegions < 2) {
                ChatLib.chat(
                  PREFIX +
                    `§6Detected rename: "${possibleRename.name}" → "${regionData.name}"`
                );
              }

              Object.assign(possibleRename, regionData);
              renamedRegions++;
            } else {
              this.cachedRegions.push(regionData);
              newRegionsFound++;
            }
          } else if (existingRegion.isPlaceholder) {
            Object.assign(existingRegion, regionData);
            existingRegion.isPlaceholder = false;
            updatedPlaceholders++;
          } else {
            Object.assign(existingRegion, regionData);
          }
        }
      }
    });

    const deletedRegions = this.cachedRegions.filter(
      (r) =>
        r.page === this.currentPage &&
        !r.isPlaceholder &&
        !currentPageRegions.has(r.name)
    );

    if (deletedRegions.length > 0) {
      deletedRegions.forEach((region) => {
        if (deletedRegions.length <= 2) {
          ChatLib.chat(PREFIX + `§cDeleted region detected: "${region.name}"`);
        }
        const index = this.cachedRegions.indexOf(region);
        if (index > -1) {
          this.cachedRegions.splice(index, 1);
        }
      });
    }

    if (this.isAutoScanning) {
      let message = `§bPage ${this.currentPage}:`;
      if (newRegionsFound > 0) message += ` +${newRegionsFound} new`;
      if (updatedPlaceholders > 0)
        message += ` ~${updatedPlaceholders} updated`;

      if (renamedRegions > 0 && renamedRegions <= 2)
        message += ` ↻${renamedRegions} renamed`;

      if (deletedRegions.length > 0 && deletedRegions.length <= 2)
        message += ` -${deletedRegions.length} deleted`;

      message += ` (Total: ${this.cachedRegions.length})`;

      if (
        newRegionsFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedRegions > 0 && renamedRegions <= 2) ||
        (deletedRegions.length > 0 && deletedRegions.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message);
        World.playSound("random.orb", 1, 2);
      }
    } else {
      let message = `§aPage ${this.currentPage} scan complete.`;
      if (newRegionsFound > 0)
        message += ` Found ${newRegionsFound} new regions.`;
      if (updatedPlaceholders > 0)
        message += ` Updated ${updatedPlaceholders} placeholders.`;

      if (renamedRegions > 0 && renamedRegions <= 2)
        message += ` Detected ${renamedRegions} renames.`;

      if (deletedRegions.length > 0 && deletedRegions.length <= 2)
        message += ` Removed ${deletedRegions.length} deleted regions.`;

      message += ` Total: ${this.cachedRegions.length}`;

      if (
        newRegionsFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedRegions > 0 && renamedRegions <= 2) ||
        (deletedRegions.length > 0 && deletedRegions.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message);
      }
    }

    this.updateFilteredRegions();

    if (!this.isActive) {
      this.isActive = true;
      this.initializeTextField = true;
      this.disableAllKeybinds();
    }

    this.isScanning = false;

    if (this.scannedPages.size < this.totalPages && !this.isAutoScanning) {
      const unscannedPages = [];
      for (let i = 1; i <= this.totalPages; i++) {
        if (!this.scannedPages.has(i)) {
          unscannedPages.push(i);
        }
      }
    }
  }
  startAutoScan() {
    if (this.isAutoScanning || !this.isActive) return;

    this.isAutoScanning = true;

    const inventory = Player.getOpenedInventory();
    const previousPageItem = inventory.getStackInSlot(45);

    if (previousPageItem && previousPageItem.getName() !== "Air") {
      inventory.click(45, false, "RIGHT");
    }

    ChatLib.chat(PREFIX + `§bStarting auto-scan of all pages...`);
    setTimeout(() => this.continueAutoScan(), 100);
  }

  scanLastPageOnly() {
    if (this.totalPages <= 1) {
      this.scanCurrentPage();
      return;
    }

    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const nextPageItem = inventory.getStackInSlot(53);
    if (nextPageItem && nextPageItem.getName() !== "Air") {
      ChatLib.chat(PREFIX + `§bGoing to last page (${this.totalPages})...`);
      inventory.click(53, false, "RIGHT");

      setTimeout(() => {
        this.scanCurrentPage();
      }, 500);
    } else {
      this.scanCurrentPage();
    }
  }

  continueAutoScan() {
    if (!this.isAutoScanning) return;

    const inventory = Player.getOpenedInventory();
    if (!inventory) {
      this.autoScanTimeout = setTimeout(() => this.continueAutoScan(), 200);
      return;
    }

    if (!this.scannedPages.has(this.currentPage)) {
      this.scanCurrentPage();
    }

    const nextPageItem = inventory.getStackInSlot(53);

    if (nextPageItem && nextPageItem.getName() !== "Air") {
      inventory.click(53, false, "LEFT");
      this.autoScanTimeout = setTimeout(() => this.continueAutoScan(), 500);
      return;
    }

    ChatLib.chat(
      PREFIX +
        `§aAuto-scan complete! Scanned all ${this.totalPages} pages with ${this.cachedRegions.length} total regions.`
    );
    this.isAutoScanning = false;
    this.refreshPlaceholderRegions();
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
      from: fromCoords || "Unknown",
      to: toCoords || "Unknown",
      lore: lore,
      slotIndex: slotIndex,
      hasCoords: hasRegionData,
      ctItem: ctItem,
      itemId: itemId,
      itemDamage: itemDamage,
      page: this.currentPage,
      isPlaceholder: false,
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

    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(
      0,
      this.filteredRegions.length - maxVisibleItems
    );
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  saveFilterText() {
    if (this.filterTextField) {
      this.persistentFilterText = this.filterTextField.getText();
    }
  }

  loadFilterText() {
    return this.persistentFilterText;
  }

  getScannedPagesDisplay() {
    if (this.totalPages === 999) {
      return `(${this.scannedPages.size}/?)`;
    } else if (this.totalPages === 0) {
      return `(${this.scannedPages.size}/?)`;
    } else {
      return `(${this.scannedPages.size}/${this.totalPages})`;
    }
  }

  areAllPagesScanned() {
    if (this.scannedPages.size === 0) return false;
    if (this.totalPages === 0 || this.totalPages === 999) {
      return false;
    }
    return this.scannedPages.size >= this.totalPages;
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
          const savedFilterText = this.loadFilterText();
          this.filterTextField.setText(savedFilterText);
          this.filterText = savedFilterText;
          this.updateFilteredRegions();
        }
      }

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

      const placeholderCount = this.cachedRegions.filter(
        (r) => r.isPlaceholder
      ).length;
      const scannedInfo = this.getScannedPagesDisplay();

      let title = `${PREFIX}Regions (${this.cachedRegions.length}) ${scannedInfo}`;
      if (placeholderCount > 0) {
        title += ` §e[${placeholderCount} new]`;
      }

      const titleWidth = Renderer.getStringWidth(title);
      Renderer.drawStringWithShadow(
        title,
        panelX + (panelWidth - titleWidth) / 2,
        currentY
      );
      currentY += 20;

      if (this.filterTextField) {
        const filterText = this.filterTextField.getText();
        const hasText = filterText && filterText.length > 0;
        const filterFieldWidth = hasText ? panelWidth - 40 : panelWidth - 20;
        this.filterTextField.setWidth(filterFieldWidth);
        this.filterTextField.render();

        if (hasText) {
          const buttonSize = 20;
          const buttonX = panelX + 10 + filterFieldWidth + 4;
          const buttonY = currentY;
          let mouseX = 0,
            mouseY = 0;
          try {
            mouseX = Client.getMouseX();
            mouseY = Client.getMouseY();
          } catch (e) {}
          const isHovered =
            mouseX >= buttonX &&
            mouseX <= buttonX + buttonSize &&
            mouseY >= buttonY &&
            mouseY <= buttonY + buttonSize;
          const color = isHovered ? 0xffff5555 : 0xffff0000;
          Renderer.drawRect(color, buttonX, buttonY, buttonSize, buttonSize);
          Renderer.drawRect(0xff000000, buttonX, buttonY, buttonSize, 1);
          Renderer.drawRect(
            0xff000000,
            buttonX,
            buttonY + buttonSize - 1,
            buttonSize,
            1
          );
          Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonSize);
          Renderer.drawRect(
            0xff000000,
            buttonX + buttonSize - 1,
            buttonY,
            1,
            buttonSize
          );
          const xTextWidth = Renderer.getStringWidth("X");
          Renderer.drawStringWithShadow(
            "§fX",
            buttonX + (buttonSize - xTextWidth) / 2,
            buttonY + 4
          );

          this.clearFilterButton = {
            x: buttonX,
            y: buttonY,
            width: buttonSize,
            height: buttonSize,
          };
        } else {
          this.clearFilterButton = null;
        }

        if (filterText !== this.filterText) {
          this.filterText = filterText;
          this.persistentFilterText = filterText;
          this.updateFilteredRegions();
        }
      }

      currentY += 30;

      const listHeight = panelHeight - (currentY - panelY) - 70;
      this.drawRegionsList(panelX, currentY, panelWidth, listHeight);

      const buttonY = currentY + listHeight + 10;
      this.drawAutoScanButton(panelX, buttonY, panelWidth);

      const instructions = [
        "§7Left click to edit • Right click for more options",
        "§eCAUTION: Regions with long names might not save to Last Region!",
        "§eCAUTION: The speed of the buttons is dependant on your ping!",
      ];
      instructions.forEach((instruction, index) => {
        const instrWidth = Renderer.getStringWidth(instruction);
        const instrX = panelX + (panelWidth - instrWidth) / 2;
        const instrY = panelY + panelHeight - 35 + index * 10;
        Renderer.drawStringWithShadow(instruction, instrX, instrY);
      });

      this.renderDropdown();
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

    const filterText = this.filterTextField
      ? this.filterTextField.getText().trim()
      : "";

    // No results case
    const shouldShowCreateButton =
      this.filteredRegions.length === 0 && filterText.length > 0;
    if (this.filteredRegions.length === 0) {
      const noResultsText = "§7No regions match your search";
      const noResultsWidth = Renderer.getStringWidth(noResultsText);
      const noResultsX = panelX + (panelWidth - noResultsWidth) / 2;
      const noResultsY = listStartY + 20;
      Renderer.drawStringWithShadow(noResultsText, noResultsX, noResultsY);

      // Draw separate create button
      if (shouldShowCreateButton) {
        const buttonY = listStartY + 50;
        const buttonHeight = 25;
        const buttonWidth = Math.min(250, panelWidth - 40);
        const buttonX = panelX + (panelWidth - buttonWidth) / 2;

        const isHovered =
          mouseX >= buttonX &&
          mouseX <= buttonX + buttonWidth &&
          mouseY >= buttonY &&
          mouseY <= buttonY + buttonHeight;

        const buttonColor = isHovered
          ? this.colors.createButtonHover
          : this.colors.createButton;
        const buttonText = `§f+ Create "${filterText}"`;

        Renderer.drawRect(
          buttonColor,
          buttonX,
          buttonY,
          buttonWidth,
          buttonHeight
        );
        Renderer.drawRect(0xff000000, buttonX, buttonY, buttonWidth, 1);
        Renderer.drawRect(
          0xff000000,
          buttonX,
          buttonY + buttonHeight - 1,
          buttonWidth,
          1
        );
        Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonHeight);
        Renderer.drawRect(
          0xff000000,
          buttonX + buttonWidth - 1,
          buttonY,
          1,
          buttonHeight
        );

        const textWidth = Renderer.getStringWidth(buttonText);
        const textX = buttonX + (buttonWidth - textWidth) / 2;
        const textY = buttonY + (buttonHeight - 8) / 2;
        Renderer.drawStringWithShadow(buttonText, textX, textY);

        this.createButton = {
          x: buttonX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight,
          regionName: filterText,
          isDisabled: false,
        };
      } else {
        this.createButton = null;
      }

      return;
    }

    this.createButton = null;

    const listItems = [...this.filteredRegions];
    if (filterText.length > 0) {
      listItems.push({
        name: `+ Create "${filterText}"`,
        isPlaceholder: false,
        ctItem: null,
        hasCoords: false,
        from: null,
        to: null,
        regionName: filterText,
        isCreateItem: true,
      });
    }

    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + maxVisibleItems, listItems.length);
    const visibleItemCount = endIndex - startIndex;
    const actualContentHeight = visibleItemCount * (itemHeight + itemSpacing);

    // Draw scrollbar
    if (listItems.length > maxVisibleItems) {
      const scrollbarX = panelX + panelWidth - scrollbarWidth - scrollbarMargin;
      const maxScrollRange = listItems.length - maxVisibleItems;
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
        (maxVisibleItems / listItems.length) * scrollbarHeight
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

    // Draw list items including the last "create" item
    for (let i = startIndex; i < endIndex; i++) {
      const region = listItems[i];
      if (!region) continue;

      const listIndex = i - startIndex;
      const itemX = panelX + 10;
      const itemY = listStartY + listIndex * (itemHeight + itemSpacing);

      const isHovered =
        mouseX >= itemX &&
        mouseX <= itemX + listWidth &&
        mouseY >= itemY &&
        mouseY <= itemY + itemHeight;

      if (isHovered) this.hoveredIndex = i;

      let bgColor = 0xff333333;
      if (i === this.selectedIndex) bgColor = 0xff4caf50;
      else if (isHovered) bgColor = 0xff555555;
      if (region.isPlaceholder) bgColor = 0xff4a4a00;
      if (region.isCreateItem) {
        bgColor = isHovered
          ? this.colors.createButtonHover
          : this.colors.createButton;
      }

      Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight);

      // Draw icon
      try {
        if (region.ctItem) {
          const iconX = itemX + iconMargin;
          const iconY = itemY + (itemHeight - iconSize) / 2;
          region.ctItem.draw(iconX, iconY, 1.0);
        } else if (!region.isCreateItem) {
          this.drawFallbackIcon(
            itemX + iconMargin,
            itemY + (itemHeight - iconSize) / 2,
            iconSize,
            region
          );
        }
      } catch (e) {
        if (!region.isCreateItem) {
          this.drawFallbackIcon(
            itemX + iconMargin,
            itemY + (itemHeight - iconSize) / 2,
            iconSize,
            region
          );
        }
      }

      const hasCoords =
        region.hasCoords &&
        region.from &&
        region.to &&
        region.from !== "Unknown" &&
        region.to !== "Unknown";

      let textStartX, availableTextWidth;

      if (region.isCreateItem) {
        textStartX = itemX;
        availableTextWidth = listWidth;
      } else {
        textStartX = itemX + iconSize + iconMargin * 2;
        availableTextWidth = listWidth - iconSize - iconMargin * 3;
      }

      const nameColor = region.isCreateItem
        ? "§f"
        : i === this.selectedIndex
        ? "§a"
        : isHovered
        ? "§e"
        : region.isPlaceholder
        ? "§6"
        : "§f";
      const regionName = region.name || "Unknown Region";

      if (region.isCreateItem) {
        const textWidth = Renderer.getStringWidth(regionName);
        const centerX = textStartX + (availableTextWidth - textWidth) / 2;
        Renderer.drawStringWithShadow(
          nameColor + regionName,
          centerX,
          itemY + (itemHeight - 8) / 2
        );
      } else {
        const pageCounter = region.page ? `§8[P${region.page}]` : "";
        const pageCounterWidth = region.page
          ? Renderer.getStringWidth(`[P${region.page}]`)
          : 0;

        // Calculate available space for region name
        const maxCharsForName =
          Math.floor((availableTextWidth - pageCounterWidth - 10) / 6) - 2;
        const displayName =
          regionName.length > maxCharsForName
            ? regionName.substring(0, maxCharsForName - 3) + "..."
            : regionName;

        const finalDisplayName = region.isPlaceholder
          ? displayName + " §8[NEW]"
          : displayName;

        if (hasCoords) {
          Renderer.drawStringWithShadow(
            nameColor + finalDisplayName,
            textStartX,
            itemY + 2
          );
        } else {
          Renderer.drawStringWithShadow(
            nameColor + finalDisplayName,
            textStartX,
            itemY + (itemHeight - 8) / 2
          );
        }

        if (region.page) {
          const pageX = itemX + listWidth - pageCounterWidth - 5;
          const pageY = itemY + (itemHeight - 8) / 2;
          Renderer.drawStringWithShadow(pageCounter, pageX, pageY);
        }

        if (hasCoords) {
          const formattedFrom = this.formatCoordinates(region.from);
          const formattedTo = this.formatCoordinates(region.to);
          const coordText = `§7${formattedFrom} → ${formattedTo}`;
          const maxCoordLength = Math.floor(availableTextWidth / 6);
          const finalCoordText =
            coordText.length > maxCoordLength
              ? coordText.substring(0, maxCoordLength - 3) + "..."
              : coordText;
          Renderer.drawStringWithShadow(finalCoordText, textStartX, itemY + 12);
        }
      }
    }
  }
  drawFallbackIcon(x, y, size, region) {
    let color = 0xff666666;

    if (region.isPlaceholder) {
      color = 0xffffaa00; // Orange for new regions
    } else if (region.name) {
      let hash = 0;
      for (let i = 0; i < region.name.length; i++) {
        hash = region.name.charCodeAt(i) + ((hash << 5) - hash);
      }

      // don't make colors too dark
      const r = (Math.abs(hash) % 128) + 127;
      const g = (Math.abs(hash >> 8) % 128) + 127;
      const b = (Math.abs(hash >> 16) % 128) + 127;

      color = (0xff << 24) | (r << 16) | (g << 8) | b;
    }

    Renderer.drawRect(color, x, y, size, size);

    // Draw a border
    Renderer.drawRect(0xff000000, x, y, size, 1); // top
    Renderer.drawRect(0xff000000, x, y + size - 1, size, 1); // bottom
    Renderer.drawRect(0xff000000, x, y, 1, size); // left
    Renderer.drawRect(0xff000000, x + size - 1, y, 1, size); // right

    if (region.name && region.name.length > 0) {
      const letter = region.name.charAt(0).toUpperCase();
      const letterWidth = Renderer.getStringWidth(letter);
      const centerX = x + (size - letterWidth) / 2;
      const centerY = y + (size - 8) / 2;
      Renderer.drawStringWithShadow("§f" + letter, centerX, centerY);
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

  drawAutoScanButton(panelX, buttonY, panelWidth) {
    const buttonHeight = 20;
    const buttonWidth = 120;
    const buttonX = panelX + (panelWidth - buttonWidth) / 2;

    let mouseX, mouseY;
    try {
      mouseX = Client.getMouseX();
      mouseY = Client.getMouseY();
    } catch (e) {
      mouseX = 0;
      mouseY = 0;
    }

    const isHovered =
      mouseX >= buttonX &&
      mouseX <= buttonX + buttonWidth &&
      mouseY >= buttonY &&
      mouseY <= buttonY + buttonHeight;

    const buttonColor = this.isAutoScanning
      ? isHovered
        ? this.colors.scanButtonActive
        : this.colors.scanButtonHover
      : isHovered
      ? this.colors.scanButtonHover
      : this.colors.scanButton;

    const buttonText = this.isAutoScanning
      ? "§fStop Scanning"
      : "§fScan All Pages";

    Renderer.drawRect(buttonColor, buttonX, buttonY, buttonWidth, buttonHeight);
    Renderer.drawRect(0xff000000, buttonX, buttonY, buttonWidth, 1);
    Renderer.drawRect(
      0xff000000,
      buttonX,
      buttonY + buttonHeight - 1,
      buttonWidth,
      1
    );
    Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonHeight);
    Renderer.drawRect(
      0xff000000,
      buttonX + buttonWidth - 1,
      buttonY,
      1,
      buttonHeight
    );

    const textWidth = Renderer.getStringWidth(buttonText);
    const textX = buttonX + (buttonWidth - textWidth) / 2;
    const textY = buttonY + (buttonHeight - 8) / 2;
    Renderer.drawStringWithShadow(buttonText, textX, textY);

    this.autoScanButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
    };
  }

  handleMouseClick(mouseX, mouseY, button) {
    if (!this.isActive) return false;

    const panelDims = this.calculatePanelDimensions();
    const { width: panelWidth, x: panelX, y: panelY } = panelDims;

    if (this.dropdown.isVisible) {
      return this.handleDropdownClick(mouseX, mouseY);
    }

    if (
      this.clearFilterButton &&
      button === 0 &&
      mouseX >= this.clearFilterButton.x &&
      mouseX <= this.clearFilterButton.x + this.clearFilterButton.width &&
      mouseY >= this.clearFilterButton.y &&
      mouseY <= this.clearFilterButton.y + this.clearFilterButton.height
    ) {
      if (this.filterTextField) {
        this.filterTextField.setText("");
        this.persistentFilterText = "";
        this.filterTextField.setIsFocused(false);
        this.updateFilteredRegions();
      }
      return true;
    }

    // Handle create button when no results (default)
    if (
      button === 0 &&
      this.createButton &&
      mouseX >= this.createButton.x &&
      mouseX <= this.createButton.x + this.createButton.width &&
      mouseY >= this.createButton.y &&
      mouseY <= this.createButton.y + this.createButton.height
    ) {
      if (!this.createButton.isDisabled) {
        const regionName = this.createButton.regionName;
        if (regionName && regionName.trim().length > 0) {
          this.createRegion(regionName);
        }
      } else {
        ChatLib.chat(
          PREFIX + `§cPlease scan all pages before creating new regions!`
        );
      }
      return true;
    }

    if (
      button === 0 &&
      this.autoScanButton &&
      mouseX >= this.autoScanButton.x &&
      mouseX <= this.autoScanButton.x + this.autoScanButton.width &&
      mouseY >= this.autoScanButton.y &&
      mouseY <= this.autoScanButton.y + this.autoScanButton.height
    ) {
      if (this.isAutoScanning) {
        this.stopAutoScan();
      } else {
        this.startAutoScan();
      }
      return true;
    }

    if (this.filterTextField && button === 0) {
      this.filterTextField.mouseClicked(mouseX, mouseY, button);
    }

    let currentY = panelY + 10;
    currentY += 20;
    currentY += 30;
    const listStartY = currentY;

    const itemHeight = 22;
    const itemSpacing = 1;
    const listWidth = panelWidth - 20;
    const availableHeight = panelDims.height - 130;
    const maxVisibleItems = Math.floor(
      availableHeight / (itemHeight + itemSpacing)
    );
    const startIndex = this.scrollOffset;

    let listItems = [...this.filteredRegions];
    const filterText = this.filterTextField
      ? this.filterTextField.getText().trim()
      : "";

    if (filterText.length > 0) {
      listItems.push({
        name: `+ Create "${filterText}"`,
        isCreateItem: true,
        regionName: filterText,
      });
    }

    const endIndex = Math.min(startIndex + maxVisibleItems, listItems.length);

    for (let i = startIndex; i < endIndex; i++) {
      const region = listItems[i];
      if (!region) continue;

      const listIndex = i - startIndex;
      const itemX = panelX + 10;
      const itemY = listStartY + listIndex * (itemHeight + itemSpacing);

      if (
        mouseX >= itemX &&
        mouseX <= itemX + listWidth &&
        mouseY >= itemY &&
        mouseY <= itemY + itemHeight
      ) {
        if (region.isCreateItem) {
          if (button === 0) {
            const currentFilterText = this.filterTextField
              ? this.filterTextField.getText().trim()
              : "";

            if (!currentFilterText || currentFilterText.length === 0) {
              ChatLib.chat(PREFIX + `§cNo region name entered!`);
              return true;
            }

            // Check if region already exists
            const existingRegion = this.cachedRegions.find(
              (r) => r.name === currentFilterText
            );
            if (existingRegion) {
              ChatLib.chat(
                PREFIX + `§cRegion "${currentFilterText}" already exists!`
              );
              return true;
            }

            ChatLib.chat(PREFIX + `§aCreating region: "${currentFilterText}"`);
            ChatLib.command(`region create ${currentFilterText}`);

            setTimeout(() => {
              if (this.filterTextField) {
                this.filterTextField.setText("");
                this.filterText = "";
                this.persistentFilterText = "";
                this.updateFilteredRegions();
              }
            }, 100);

            return true;
          }
          return true;
        } else {
          this.selectedIndex = i;
          if (button === 0) {
            this.editRegion(region);
          } else if (button === 1) {
            this.showDropdown(region, mouseX, mouseY);
          }
          return true;
        }
      }
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

  createRegion(regionName) {
    if (regionName && regionName.trim().length > 0) {
      let cleanName = regionName;
      if (cleanName.startsWith('+ Create "') && cleanName.endsWith('"')) {
        cleanName = cleanName.replace(/^\+ Create "/, "").replace(/"$/, "");
      }

      if (cleanName.trim().length === 0) {
        ChatLib.chat(PREFIX + `§cRegion name cannot be empty!`);
        return;
      }

      const existingRegion = this.cachedRegions.find(
        (r) => r.name === cleanName
      );
      if (existingRegion) {
        ChatLib.chat(PREFIX + `§cRegion "${cleanName}" already exists!`);
        return;
      }

      ChatLib.chat(PREFIX + `§aCreating new region: "${cleanName}"`);
      ChatLib.command(`region create ${cleanName}`);

      if (this.filterTextField) {
        this.filterTextField.setText("");
        this.filterText = "";
        this.persistentFilterText = "";
        this.updateFilteredRegions();
      }
    } else {
      ChatLib.chat(PREFIX + `§cInvalid region name!`);
    }
  }

  handleKeyPress(keyCode, char) {
    // Handle dropdown key presses
    if (this.dropdown.isVisible) {
      if (keyCode === 1) {
        // ESC - close dropdown
        this.hideDropdown();
        return true;
      } else if (keyCode === 200) {
        // Up arrow - navigate dropdown up
        if (this.dropdown.hoveredOption > 0) {
          this.dropdown.hoveredOption--;
        } else {
          this.dropdown.hoveredOption = this.dropdown.options.length - 1;
        }
        return true;
      } else if (keyCode === 208) {
        // Down arrow - navigate dropdown down
        if (this.dropdown.hoveredOption < this.dropdown.options.length - 1) {
          this.dropdown.hoveredOption++;
        } else {
          this.dropdown.hoveredOption = 0;
        }
        return true;
      } else if (keyCode === 28) {
        // Enter - execute dropdown option
        if (this.dropdown.hoveredOption >= 0) {
          const option = this.dropdown.options[this.dropdown.hoveredOption];
          const region = this.dropdown.region;

          if (option.action === "delete") {
            if (this.dropdown.deleteConfirmationActive) {
              this.executeDropdownAction(option.action, region);
              this.hideDropdown();
            } else {
              this.dropdown.deleteConfirmationActive = true;
            }
          } else {
            this.executeDropdownAction(option.action, region);
            this.hideDropdown();
          }
        }
        return true;
      }
      return true;
    }

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
        this.selectedIndex < this.filteredRegions.length
      ) {
        this.editRegion(this.filteredRegions[this.selectedIndex]);
        return true;
      }
    } else if (keyCode === 57) {
      // Space bar - toggle auto-scan
      if (this.isAutoScanning) {
        this.stopAutoScan();
      } else {
        this.startAutoScan();
      }
      return true;
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

    const maxScroll = Math.max(
      0,
      this.filteredRegions.length - maxVisibleItems
    );
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  editRegion(region) {
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

    this.hideDropdown();

    this.restoreAllKeybinds();
  }
}

export const regionsVisualCache = new RegionsVisualCache();