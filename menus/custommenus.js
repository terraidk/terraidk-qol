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

class MenusVisualCache {
  constructor() {
    this.cachedMenus = [];
    this.filteredMenus = [];
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

    this.keybindBlocker = null;

    this.lastMenuInventorySnapshot = null;
    this.isInMenuEditGUI = false;
    this.menuEditGUITimeout = null;

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

    register("chat", (menuName, event) => {
      if (this.cachedMenus.length > 0) {
        this.handleMenuCreated(menuName);
      }
    }).setChatCriteria("Created custom menu with the title ${menuName}!");

    register("chat", (menuName, event) => {
      if (this.cachedMenus.length > 0) {
        this.handleMenuDeleted(menuName);
      }
    }).setChatCriteria("Deleted the menu ${menuName}");

    this.lastMenuInventorySnapshot = null;
    this.isInMenuEditGUI = false;
    this.menuEditGUITimeout = null;

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
          this.isInMenuEditGUI = true;
        } else {
          for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
              this.checkForMenusGUI(i);
            }, 50 * i);
          }
        }
      }, 50);
    });

    register("guiClosed", () => {
      if (this.isInMenuEditGUI) {
        this.isInMenuEditGUI = false;
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
      if (this.isActive && this.cachedMenus.length > 0) {
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

  handleMenuCreated(menuName) {
    const existingMenu = this.cachedMenus.find((m) => m.name === menuName);

    if (!existingMenu) {
      const newMenu = {
        name: menuName,
        displayName: `§f${menuName}`,
        description: "Newly created menu - data not yet scanned",
        descriptions: ["Newly created menu - data not yet scanned"],
        lore: [],
        slotIndex: -1,
        hasDescription: true,
        ctItem: null,
        itemId: 0,
        itemDamage: 0,
        page: this.currentPage || 1,
        isPlaceholder: true,
        createdAt: Date.now(),
      };

      this.cachedMenus.push(newMenu);
      this.updateFilteredMenus();

      ChatLib.chat(
        PREFIX +
          `§a+ Added menu "${menuName}" to cache (${this.cachedMenus.length} total)`
      );
    } else {
      ChatLib.chat(PREFIX + `§e Menu "${menuName}" already exists in cache`);
    }
  }

  handleMenuDeleted(menuName) {
    const initialCount = this.cachedMenus.length;

    this.cachedMenus = this.cachedMenus.filter((m) => m.name !== menuName);

    if (this.cachedMenus.length < initialCount) {
      this.updateFilteredMenus();

      if (this.selectedIndex >= this.cachedMenus.length) {
        this.selectedIndex = -1;
      }

      ChatLib.chat(
        PREFIX +
          `§c- Removed menu "${menuName}" from cache (${this.cachedMenus.length} total)`
      );
    } else {
      ChatLib.chat(PREFIX + `§e Menu "${menuName}" was not found in cache`);
    }
  }

  refreshPlaceholderMenus() {
    const placeholders = this.cachedMenus.filter((m) => m.isPlaceholder);
    if (placeholders.length > 0) {
      ChatLib.chat(
        PREFIX +
          `§e${placeholders.length} placeholder menu(s) detected. Consider rescanning to get full data.`
      );
    }
  }

  validateCacheAgainstCurrentPage() {
    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";
    const menusRegex = /^\(\d+\/\d+\) Custom Menus$|^Custom Menus$/;

    if (!menusRegex.test(cleanTitle)) return;

    // Get current page number
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Custom Menus$/);
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

    // Only validate if we're in the menus GUI
    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";
    const menusRegex = /^\(\d+\/\d+\) Custom Menus$|^Custom Menus$/;

    if (menusRegex.test(cleanTitle)) {
      this.validateCacheAgainstCurrentPage();
    }
  }

  cleanStaleMenus() {
    const beforeCount = this.cachedMenus.length;

    this.cachedMenus = this.cachedMenus.filter((menu) => {
      if (menu.deleted) return false;

      if (
        menu.isPlaceholder &&
        menu.createdAt &&
        Date.now() - menu.createdAt > 300000
      ) {
        return false;
      }

      return true;
    });

    const removedCount = beforeCount - this.cachedMenus.length;
    if (removedCount > 0) {
      this.updateFilteredMenus();
    }
  }

  handleMouseScroll(direction) {
    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(0, this.filteredMenus.length - maxVisibleItems);

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
    this.cachedMenus = [];
    this.filteredMenus = [];
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

    this.lastMenuInventorySnapshot = null;
    this.isInMenuEditGUI = false;
    if (this.menuEditGUITimeout) {
      clearTimeout(this.menuEditGUITimeout);
      this.menuEditGUITimeout = null;
    }

    this.restoreAllKeybinds();
  }

  checkForMenusGUI(attempt) {
    if (this.isActive || this.isScanning) return;

    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const menusRegex = /^\(\d+\/\d+\) Custom Menus$|^Custom Menus$/;
    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

    if (menusRegex.test(cleanTitle)) {
      const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Custom Menus$/);
      if (pageMatch) {
        this.currentPage = parseInt(pageMatch[1]);
        this.totalPages = parseInt(pageMatch[2]);
      } else if (cleanTitle === "Custom Menus") {
        this.currentPage = 1;
        this.totalPages = this.detectTotalPages(inventory);
      }

      this.isScanning = true;
      this.scanCurrentPage();
    }
  }

  detectTotalPages(inventory) {
    const nextPageItem = inventory.getStackInSlot(53);
    const previousPageItem = inventory.getStackInSlot(45);

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
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Custom Menus$/);

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
    } else if (cleanTitle === "Custom Menus") {
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
    const menuSlots = [
      10, 11, 12, 13, 14, 15, 16, // Row 1 
      19, 20, 21, 22, 23, 24, 25, // Row 2
      28, 29, 30, 31, 32, 33, 34, // Row 3
    ];

    const currentPageMenus = new Set();
    let newMenusFound = 0;
    let updatedPlaceholders = 0;
    let renamedMenus = 0;

    menuSlots.forEach((slotIndex) => {
      const item = inventory.getStackInSlot(slotIndex);
      if (item && item.getName() !== "Air") {
        const menuData = this.parseMenuItem(item, slotIndex);
        if (menuData) {
          currentPageMenus.add(menuData.name);

          const existingMenu = this.cachedMenus.find(
            (m) => m.name === menuData.name
          );

          if (!existingMenu) {
            const possibleRename = this.cachedMenus.find(
              (m) =>
                m.page === this.currentPage &&
                m.slotIndex === slotIndex &&
                m.name !== menuData.name
            );

            if (possibleRename) {
              // Only show individual rename message if 2 or fewer total renames expected
              if (renamedMenus < 2) {
                ChatLib.chat(
                  PREFIX +
                    `§6Detected rename: "${possibleRename.name}" → "${menuData.name}"`
                );
              }

              Object.assign(possibleRename, menuData);
              renamedMenus++;
            } else {
              this.cachedMenus.push(menuData);
              newMenusFound++;
            }
          } else if (existingMenu.isPlaceholder) {
            Object.assign(existingMenu, menuData);
            existingMenu.isPlaceholder = false;
            updatedPlaceholders++;
          } else {
            Object.assign(existingMenu, menuData);
          }
        }
      }
    });

    const deletedMenus = this.cachedMenus.filter(
      (m) =>
        m.page === this.currentPage &&
        !m.isPlaceholder &&
        !currentPageMenus.has(m.name)
    );

    if (deletedMenus.length > 0) {
      deletedMenus.forEach((menu) => {
        // Only show individual deletion message if 2 or fewer deletions
        if (deletedMenus.length <= 2) {
          ChatLib.chat(PREFIX + `§cDeleted menu detected: "${menu.name}"`);
        }
        const index = this.cachedMenus.indexOf(menu);
        if (index > -1) {
          this.cachedMenus.splice(index, 1);
        }
      });
    }

    if (this.isAutoScanning) {
      let message = `§bPage ${this.currentPage}:`;
      if (newMenusFound > 0) message += ` +${newMenusFound} new`;
      if (updatedPlaceholders > 0)
        message += ` ~${updatedPlaceholders} updated`;

      // Only show rename message if 2 or fewer renames
      if (renamedMenus > 0 && renamedMenus <= 2)
        message += ` ↻${renamedMenus} renamed`;

      // Only show deletion message if 2 or fewer deletions
      if (deletedMenus.length > 0 && deletedMenus.length <= 2)
        message += ` -${deletedMenus.length} deleted`;

      message += ` (Total: ${this.cachedMenus.length})`;

      if (
        newMenusFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedMenus > 0 && renamedMenus <= 2) ||
        (deletedMenus.length > 0 && deletedMenus.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message);
        World.playSound("random.orb", 1, 2);
      }
    } else {
      let message = `§aPage ${this.currentPage} scan complete.`;
      if (newMenusFound > 0) message += ` Found ${newMenusFound} new menus.`;
      if (updatedPlaceholders > 0)
        message += ` Updated ${updatedPlaceholders} placeholders.`;

      // Only show rename message if 2 or fewer renames
      if (renamedMenus > 0 && renamedMenus <= 2)
        message += ` Detected ${renamedMenus} renames.`;

      // Only show deletion message if 2 or fewer deletions
      if (deletedMenus.length > 0 && deletedMenus.length <= 2)
        message += ` Removed ${deletedMenus.length} deleted menus.`;

      message += ` Total: ${this.cachedMenus.length}`;

      if (
        newMenusFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedMenus > 0 && renamedMenus <= 2) ||
        (deletedMenus.length > 0 && deletedMenus.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message);
      }
    }

    this.updateFilteredMenus();

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

    // left click to go to next page if it exists
    if (nextPageItem && nextPageItem.getName() !== "Air") {
      inventory.click(53, false, "LEFT");
      this.autoScanTimeout = setTimeout(() => this.continueAutoScan(), 500);
      return;
    }

    ChatLib.chat(
      PREFIX +
        `§aAuto-scan complete! Scanned all ${this.totalPages} pages with ${this.cachedMenus.length} total menus.`
    );
    this.isAutoScanning = false;
    this.refreshPlaceholderMenus();
  }

  parseMenuItem(item, slotIndex) {
    const itemName = item.getName();
    const cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");
    const lore = item.getLore();

    let descriptions = [];
    let hasMenuData = false;

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
        hasMenuData = true;
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
      hasDescription: hasMenuData,
      ctItem: ctItem,
      itemId: itemId,
      itemDamage: itemDamage,
      page: this.currentPage,
      isPlaceholder: false,
    };
  }

  updateFilteredMenus() {
    const filterText = this.filterTextField
      ? this.filterTextField.getText()
      : "";

    if (!filterText) {
      this.filteredMenus = [...this.cachedMenus];
    } else {
      const filter = filterText.toLowerCase();
      this.filteredMenus = this.cachedMenus.filter(
        (menu) =>
          menu.name.toLowerCase().includes(filter) ||
          (menu.description &&
            menu.description.toLowerCase().includes(filter)) ||
          (menu.descriptions &&
            menu.descriptions.some((desc) =>
              desc.toLowerCase().includes(filter)
            ))
      );
    }

    if (this.selectedIndex >= this.filteredMenus.length) {
      this.selectedIndex = -1;
    }

    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(0, this.filteredMenus.length - maxVisibleItems);
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
          this.updateFilteredMenus();
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

      // Draw title
      const placeholderCount = this.cachedMenus.filter(
        (m) => m.isPlaceholder
      ).length;
      const scannedInfo =
        this.totalPages === 999
          ? `(${this.scannedPages.size}/?)`
          : `(${this.scannedPages.size}/${this.totalPages})`;

      let title = `${PREFIX}Custom Menus (${this.cachedMenus.length}) ${scannedInfo}`;
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

      // Render filter text field
      if (this.filterTextField) {
        this.filterTextField.render();

        const currentText = this.filterTextField.getText();
        if (currentText !== this.filterText) {
          this.filterText = currentText;
          this.updateFilteredMenus();
        }
      }

      currentY += 30;

      // Draw menus list
      const listHeight = panelHeight - (currentY - panelY) - 70;
      this.drawMenusList(panelX, currentY, panelWidth, listHeight);

      const buttonY = currentY + listHeight + 10;
      this.drawAutoScanButton(panelX, buttonY, panelWidth);

      const instructions = [
        "§eCAUTION: Menus with long names might not save to Last Menu!",
        "§eCAUTION: The speed of the buttons is dependant on your ping!",
      ];
      instructions.forEach((instruction, index) => {
        const instrWidth = Renderer.getStringWidth(instruction);
        const instrX = panelX + (panelWidth - instrWidth) / 2;
        const instrY = panelY + panelHeight - 35 + index * 10;
        Renderer.drawStringWithShadow(instruction, instrX, instrY);
      });
    } catch (error) {
      ChatLib.chat(PREFIX + `§c[ERROR] Rendering failed: ${error.message}`);
    }
  }

  drawMenusList(panelX, listStartY, panelWidth, availableHeight) {
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
      this.filteredMenus.length
    );

    const visibleItemCount = endIndex - startIndex;
    const actualContentHeight = visibleItemCount * (itemHeight + itemSpacing);

    // Draw scrollbar if needed
    if (this.filteredMenus.length > maxVisibleItems) {
      const scrollbarX = panelX + panelWidth - scrollbarWidth - scrollbarMargin;
      const maxScrollRange = this.filteredMenus.length - maxVisibleItems;
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
        (maxVisibleItems / this.filteredMenus.length) * scrollbarHeight
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

    // Draw menu items
    for (let i = startIndex; i < endIndex; i++) {
      const menu = this.filteredMenus[i];
      if (!menu) continue;

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

      if (menu.isPlaceholder) {
        bgColor = menu.isPlaceholder ? 0xff4a4a00 : bgColor;
      }

      Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight);

      // Draw menu icon
      try {
        if (menu.ctItem) {
          const iconX = itemX + iconMargin;
          const iconY = itemY + (itemHeight - iconSize) / 2;
          menu.ctItem.draw(iconX, iconY, 1.0);
        } else {
          this.drawFallbackIcon(
            itemX + iconMargin,
            itemY + (itemHeight - iconSize) / 2,
            iconSize,
            menu
          );
        }
      } catch (e) {
        this.drawFallbackIcon(
          itemX + iconMargin,
          itemY + (itemHeight - iconSize) / 2,
          iconSize,
          menu
        );
      }

      // Check if menu has description
      const hasDescription =
        menu.hasDescription &&
        (menu.description ||
          (menu.descriptions && menu.descriptions.length > 0));

      // Draw menu name
      const textStartX = itemX + iconSize + iconMargin * 2;
      const availableTextWidth = listWidth - iconSize - iconMargin * 3;

      const nameColor =
        i === this.selectedIndex
          ? "§a"
          : isHovered
          ? "§e"
          : menu.isPlaceholder
          ? "§6"
          : "§f";
      const menuName = menu.name || "Unknown Menu";

      const maxChars = Math.floor(availableTextWidth / 6) - 2;
      const displayName =
        menuName.length > maxChars
          ? menuName.substring(0, maxChars - 3) + "..."
          : menuName;

      const finalDisplayName = menu.isPlaceholder
        ? displayName + " §8[NEW]"
        : displayName;

      if (hasDescription) {
        Renderer.drawStringWithShadow(
          nameColor + finalDisplayName,
          textStartX,
          itemY + 2
        );
      } else {
        const nameY = itemY + (itemHeight - 8) / 2;
        Renderer.drawStringWithShadow(
          nameColor + finalDisplayName,
          textStartX,
          nameY
        );
      }

      // Draw page number if multiple pages
      if (this.totalPages > 1 && panelWidth > 250) {
        const pageText = `§8[P${menu.page}]`;
        const pageWidth = Renderer.getStringWidth(pageText);
        const pageHeight = 8;
        const pageY = itemY + itemHeight / 2 - pageHeight / 2;

        Renderer.drawStringWithShadow(
          pageText,
          itemX + listWidth - pageWidth - 5,
          pageY
        );
      }

      if (hasDescription) {
        let descriptionText = "";
        if (menu.description) {
          descriptionText = menu.description;
        } else if (menu.descriptions && menu.descriptions.length > 0) {
          descriptionText = menu.descriptions[0];
        }

        if (descriptionText) {
          const descText = `§7${descriptionText}`;
          const maxDescLength = Math.floor(availableTextWidth / 6);
          const finalDescText =
            descText.length > maxDescLength
              ? descText.substring(0, maxDescLength - 3) + "..."
              : descText;

          Renderer.drawStringWithShadow(finalDescText, textStartX, itemY + 12);
        }
      }
    }
  }

  drawFallbackIcon(x, y, size, menu) {
    let color = 0xff666666;

    if (menu.isPlaceholder) {
      color = 0xffffaa00; // Orange for new menus
    } else if (menu.name) {
      let hash = 0;
      for (let i = 0; i < menu.name.length; i++) {
        hash = menu.name.charCodeAt(i) + ((hash << 5) - hash);
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

    if (menu.name && menu.name.length > 0) {
      const letter = menu.name.charAt(0).toUpperCase();
      const letterWidth = Renderer.getStringWidth(letter);
      const centerX = x + (size - letterWidth) / 2;
      const centerY = y + (size - 8) / 2;
      Renderer.drawStringWithShadow("§f" + letter, centerX, centerY);
    }
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
    if (!this.isActive || button !== 0) return false;

    const panelDims = this.calculatePanelDimensions();
    const { width: panelWidth, x: panelX, y: panelY } = panelDims;

    if (
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

    if (this.filterTextField) {
      this.filterTextField.mouseClicked(mouseX, mouseY, button);
    }

    if (
      this.hoveredIndex >= 0 &&
      this.hoveredIndex < this.filteredMenus.length
    ) {
      const menu = this.filteredMenus[this.hoveredIndex];
      this.selectedIndex = this.hoveredIndex;
      this.editMenu(menu);
      return true;
    }

    // Check if click is within panel bounds
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
        this.selectedIndex < this.filteredMenus.length
      ) {
        this.editMenu(this.filteredMenus[this.selectedIndex]);
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
    } else if (this.selectedIndex === -1 && this.filteredMenus.length > 0) {
      this.selectedIndex = 0;
    }
  }

  navigateDown() {
    if (this.selectedIndex < this.filteredMenus.length - 1) {
      this.selectedIndex++;
      this.ensureVisible();
    } else if (this.selectedIndex === -1 && this.filteredMenus.length > 0) {
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

    const maxScroll = Math.max(0, this.filteredMenus.length - maxVisibleItems);
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  editMenu(menu) {
    ChatLib.command(`menu edit ${menu.name}`);
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

const menusVisualCache = new MenusVisualCache();
export { menusVisualCache };
