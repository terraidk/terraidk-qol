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

class CommandsVisualCache {
  constructor() {
    this.cachedCommands = [];
    this.filteredCommands = [];
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

    // Command edit GUI detection
    this.lastCommandInventorySnapshot = null;
    this.isInCommandEditGUI = false;
    this.commandEditGUITimeout = null;

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

    // Command creation detection
    register("chat", (commandName, event) => {
      if (this.cachedCommands.length > 0) {
        this.handleCommandCreated(commandName);
      }
    }).setChatCriteria("Created command ${commandName}!");

    // Command deletion detection
    register("chat", (commandName, event) => {
      if (this.cachedCommands.length > 0) {
        this.handleCommandDeleted(commandName);
      }
    }).setChatCriteria("Deleted the command ${commandName}");

    // Initialize command edit GUI detection state
    this.lastCommandInventorySnapshot = null;
    this.isInCommandEditGUI = false;
    this.commandEditGUITimeout = null;

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

        // Detect command edit GUIs
        if (cleanTitle.startsWith("Edit: ") || cleanTitle === "Are you sure?") {
          this.isInCommandEditGUI = true;
        } else {
          // Check for commands GUI with multiple attempts
          for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
              this.checkForCommandsGUI(i);
            }, 50 * i);
          }
        }
      }, 50);
    });

    register("guiClosed", () => {
      if (this.isInCommandEditGUI) {
        this.isInCommandEditGUI = false;
      } else if (this.isActive) {
        this.hideOverlay();
      }
    });

    // Cache validation during GUI render
    register("guiRender", () => {
      if (this.isActive && !this.isScanning && !this.isAutoScanning) {
        this.performCacheValidation();
      }
    });

    // Page change detection
    register("itemTooltip", () => {
      if (this.isActive && !this.isScanning) {
        this.detectPageChange();
      }
    });

    register("guiRender", (mouseX, mouseY) => {
      if (this.isActive && this.cachedCommands.length > 0) {
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

  handleCommandCreated(commandName) {
    const existingCommand = this.cachedCommands.find(
      (c) => c.name === commandName
    );

    if (!existingCommand) {
      const newCommand = {
        name: commandName,
        displayName: `§f${commandName}`,
        description: "Newly created command - data not yet scanned",
        descriptions: ["Newly created command - data not yet scanned"],
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

      this.cachedCommands.push(newCommand);
      this.updateFilteredCommands();

      ChatLib.chat(
        PREFIX +
          `§a+ Added command "${commandName}" to cache (${this.cachedCommands.length} total)`
      );
    } else {
      ChatLib.chat(
        PREFIX + `§e Command "${commandName}" already exists in cache`
      );
    }
  }

  handleCommandDeleted(commandName) {
    const initialCount = this.cachedCommands.length;

    this.cachedCommands = this.cachedCommands.filter(
      (c) => c.name !== commandName
    );

    if (this.cachedCommands.length < initialCount) {
      this.updateFilteredCommands();

      if (this.selectedIndex >= this.cachedCommands.length) {
        this.selectedIndex = -1;
      }

      ChatLib.chat(
        PREFIX +
          `§c- Removed command "${commandName}" from cache (${this.cachedCommands.length} total)`
      );
    } else {
      ChatLib.chat(
        PREFIX + `§e Command "${commandName}" was not found in cache`
      );
    }
  }

  refreshPlaceholderCommands() {
    const placeholders = this.cachedCommands.filter((c) => c.isPlaceholder);
    if (placeholders.length > 0) {
      ChatLib.chat(
        PREFIX +
          `§e${placeholders.length} placeholder command(s) detected. Consider rescanning to get full data.`
      );
    }
  }

  validateCacheAgainstCurrentPage() {
    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";
    const commandsRegex = /^\(\d+\/\d+\) Commands$|^Commands$/;

    if (!commandsRegex.test(cleanTitle)) return;

    // Get current page number
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Commands$/);
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

    // Only validate if we're in the commands GUI
    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";
    const commandsRegex = /^\(\d+\/\d+\) Commands$|^Commands$/;

    if (commandsRegex.test(cleanTitle)) {
      this.validateCacheAgainstCurrentPage();
    }
  }

  cleanStaleCommands() {
    const beforeCount = this.cachedCommands.length;

    this.cachedCommands = this.cachedCommands.filter((cmd) => {
      if (cmd.deleted) return false;

      // Remove stale placeholder commands older than 5 minutes
      if (
        cmd.isPlaceholder &&
        cmd.createdAt &&
        Date.now() - cmd.createdAt > 300000
      ) {
        return false;
      }

      return true;
    });

    const removedCount = beforeCount - this.cachedCommands.length;
    if (removedCount > 0) {
      this.updateFilteredCommands();
    }
  }

  handleMouseScroll(direction) {
    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(
      0,
      this.filteredCommands.length - maxVisibleItems
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
    this.cachedCommands = [];
    this.filteredCommands = [];
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

    this.lastCommandInventorySnapshot = null;
    this.isInCommandEditGUI = false;
    if (this.commandEditGUITimeout) {
      clearTimeout(this.commandEditGUITimeout);
      this.commandEditGUITimeout = null;
    }

    this.restoreAllKeybinds();
  }

  checkForCommandsGUI(attempt) {
    if (this.isActive || this.isScanning) return;

    const inventory = Player.getOpenedInventory();
    if (!inventory) return;

    const commandsRegex = /^\(\d+\/\d+\) Commands$|^Commands$/;
    const title = inventory.getName();
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

    if (commandsRegex.test(cleanTitle)) {
      const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Commands$/);
      if (pageMatch) {
        this.currentPage = parseInt(pageMatch[1]);
        this.totalPages = parseInt(pageMatch[2]);
      } else if (cleanTitle === "Commands") {
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
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Commands$/);

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
    } else if (cleanTitle === "Commands") {
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
    const commandSlots = [
      10, 11, 12, 13, 14, 15, 16, // Row 1 
      19, 20, 21, 22, 23, 24, 25, // Row 2
      28, 29, 30, 31, 32, 33, 34, // Row 3
    ];

    const currentPageCommands = new Set();
    let newCommandsFound = 0;
    let updatedPlaceholders = 0;
    let renamedCommands = 0;

    commandSlots.forEach((slotIndex) => {
      const item = inventory.getStackInSlot(slotIndex);
      if (item && item.getName() !== "Air") {
        const commandData = this.parseCommandItem(item, slotIndex);
        if (commandData) {
          currentPageCommands.add(commandData.name);

          const existingCommand = this.cachedCommands.find(
            (c) => c.name === commandData.name
          );

          if (!existingCommand) {
            const possibleRename = this.cachedCommands.find(
              (c) =>
                c.page === this.currentPage &&
                c.slotIndex === slotIndex &&
                c.name !== commandData.name
            );

            if (possibleRename) {
              Object.assign(possibleRename, commandData);
              renamedCommands++;
            } else {
              this.cachedCommands.push(commandData);
              newCommandsFound++;
            }
          } else if (existingCommand.isPlaceholder) {
            Object.assign(existingCommand, commandData);
            existingCommand.isPlaceholder = false;
            updatedPlaceholders++;
          } else {
            Object.assign(existingCommand, commandData);
          }
        }
      }
    });

    const deletedCommands = this.cachedCommands.filter(
      (c) =>
        c.page === this.currentPage &&
        !c.isPlaceholder &&
        !currentPageCommands.has(c.name)
    );

    if (deletedCommands.length > 0) {
      deletedCommands.forEach((cmd) => {
        const index = this.cachedCommands.indexOf(cmd);
        if (index > -1) {
          this.cachedCommands.splice(index, 1);
        }
      });
    }

    if (this.isAutoScanning) {
      let message = `§bPage ${this.currentPage}:`;
      if (newCommandsFound > 0) message += ` +${newCommandsFound} new`;
      if (updatedPlaceholders > 0)
        message += ` ~${updatedPlaceholders} updated`;

      // Only show rename message if 2 or fewer renames
      if (renamedCommands > 0 && renamedCommands <= 2)
        message += ` ↻${renamedCommands} renamed`;

      // Only show deletion message if 2 or fewer deletions
      if (deletedCommands.length > 0 && deletedCommands.length <= 2)
        message += ` -${deletedCommands.length} deleted`;

      message += ` (Total: ${this.cachedCommands.length})`;

      if (
        newCommandsFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedCommands > 0 && renamedCommands <= 2) ||
        (deletedCommands.length > 0 && deletedCommands.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message);
        World.playSound("random.orb", 1, 2);
      }
    } else {
      let message = `§aPage ${this.currentPage} scan complete.`;
      if (newCommandsFound > 0)
        message += ` Found ${newCommandsFound} new commands.`;
      if (updatedPlaceholders > 0)
        message += ` Updated ${updatedPlaceholders} placeholders.`;

      // Only show rename message if 2 or fewer renames
      if (renamedCommands > 0 && renamedCommands <= 2)
        message += ` Detected ${renamedCommands} renames.`;

      // Only show deletion message if 2 or fewer deletions
      if (deletedCommands.length > 0 && deletedCommands.length <= 2)
        message += ` Removed ${deletedCommands.length} deleted commands.`;

      message += ` Total: ${this.cachedCommands.length}`;

      if (
        newCommandsFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedCommands > 0 && renamedCommands <= 2) ||
        (deletedCommands.length > 0 && deletedCommands.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message);
      }
    }

    this.updateFilteredCommands();

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

    // Go to first page before starting
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

    // Left click to go to next page if it exists
    if (nextPageItem && nextPageItem.getName() !== "Air") {
      inventory.click(53, false, "LEFT");
      this.autoScanTimeout = setTimeout(() => this.continueAutoScan(), 500);
      return;
    }

    ChatLib.chat(
      PREFIX +
        `§aAuto-scan complete! Scanned all ${this.totalPages} pages with ${this.cachedCommands.length} total commands.`
    );
    this.isAutoScanning = false;
    this.refreshPlaceholderCommands();
  }

  parseCommandItem(item, slotIndex) {
    const itemName = item.getName();
    const cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");
    const lore = item.getLore();

    let descriptions = [];
    let hasCommandData = false;

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
        hasCommandData = true;
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
      hasDescription: hasCommandData,
      ctItem: ctItem,
      itemId: itemId,
      itemDamage: itemDamage,
      page: this.currentPage,
      isPlaceholder: false,
    };
  }

  updateFilteredCommands() {
    const filterText = this.filterTextField
      ? this.filterTextField.getText()
      : "";

    if (!filterText) {
      this.filteredCommands = [...this.cachedCommands];
    } else {
      const filter = filterText.toLowerCase();
      this.filteredCommands = this.cachedCommands.filter(
        (cmd) =>
          cmd.name.toLowerCase().includes(filter) ||
          (cmd.description && cmd.description.toLowerCase().includes(filter)) ||
          (cmd.descriptions &&
            cmd.descriptions.some((desc) =>
              desc.toLowerCase().includes(filter)
            ))
      );
    }

    if (this.selectedIndex >= this.filteredCommands.length) {
      this.selectedIndex = -1;
    }

    const availableHeight = this.getListAvailableHeight();
    const itemHeight = 23;
    const maxVisibleItems = Math.floor(availableHeight / itemHeight);
    const maxScroll = Math.max(
      0,
      this.filteredCommands.length - maxVisibleItems
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
          this.updateFilteredCommands();
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
      const placeholderCount = this.cachedCommands.filter(
        (c) => c.isPlaceholder
      ).length;
      const scannedInfo =
        this.totalPages === 999
          ? `(${this.scannedPages.size}/?)`
          : `(${this.scannedPages.size}/${this.totalPages})`;

      let title = `${PREFIX}Commands (${this.cachedCommands.length}) ${scannedInfo}`;
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
          this.updateFilteredCommands();
        }
      }

      currentY += 30;

      // Draw commands list
      const listHeight = panelHeight - (currentY - panelY) - 70;
      this.drawCommandsList(panelX, currentY, panelWidth, listHeight);

      const buttonY = currentY + listHeight + 10;
      this.drawAutoScanButton(panelX, buttonY, panelWidth);

      const instructions = [
        "§eCAUTION: Commands with long names might not save to Last Command!",
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

  drawCommandsList(panelX, listStartY, panelWidth, availableHeight) {
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
      this.filteredCommands.length
    );

    const visibleItemCount = endIndex - startIndex;
    const actualContentHeight = visibleItemCount * (itemHeight + itemSpacing);

    // Draw scrollbar if needed
    if (this.filteredCommands.length > maxVisibleItems) {
      const scrollbarX = panelX + panelWidth - scrollbarWidth - scrollbarMargin;
      const maxScrollRange = this.filteredCommands.length - maxVisibleItems;
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
        (maxVisibleItems / this.filteredCommands.length) * scrollbarHeight
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

    // Draw command items
    for (let i = startIndex; i < endIndex; i++) {
      const cmd = this.filteredCommands[i];
      if (!cmd) continue;

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

      if (cmd.isPlaceholder) {
        bgColor = cmd.isPlaceholder ? 0xff4a4a00 : bgColor;
      }

      Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight);

      // Draw command icon
      try {
        if (cmd.ctItem) {
          const iconX = itemX + iconMargin;
          const iconY = itemY + (itemHeight - iconSize) / 2;
          cmd.ctItem.draw(iconX, iconY, 1.0);
        } else {
          this.drawFallbackIcon(
            itemX + iconMargin,
            itemY + (itemHeight - iconSize) / 2,
            iconSize,
            cmd
          );
        }
      } catch (e) {
        this.drawFallbackIcon(
          itemX + iconMargin,
          itemY + (itemHeight - iconSize) / 2,
          iconSize,
          cmd
        );
      }

      // Check if command has description
      const hasDescription =
        cmd.hasDescription &&
        (cmd.description || (cmd.descriptions && cmd.descriptions.length > 0));

      // Draw command name
      const textStartX = itemX + iconSize + iconMargin * 2;
      const availableTextWidth = listWidth - iconSize - iconMargin * 3;

      const nameColor =
        i === this.selectedIndex
          ? "§a"
          : isHovered
          ? "§e"
          : cmd.isPlaceholder
          ? "§6"
          : "§f";
      const commandName = cmd.name || "Unknown Command";

      const maxChars = Math.floor(availableTextWidth / 6) - 2;
      const displayName =
        commandName.length > maxChars
          ? commandName.substring(0, maxChars - 3) + "..."
          : commandName;

      const finalDisplayName = cmd.isPlaceholder
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
        const pageText = `§8[P${cmd.page}]`;
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
        if (cmd.description) {
          descriptionText = cmd.description;
        } else if (cmd.descriptions && cmd.descriptions.length > 0) {
          descriptionText = cmd.descriptions[0];
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

  drawFallbackIcon(x, y, size, cmd) {
    let color = 0xff666666;

    if (cmd.isPlaceholder) {
      color = 0xffffaa00; // Orange for new commands
    } else if (cmd.name) {
      let hash = 0;
      for (let i = 0; i < cmd.name.length; i++) {
        hash = cmd.name.charCodeAt(i) + ((hash << 5) - hash);
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

    if (cmd.name && cmd.name.length > 0) {
      const letter = cmd.name.charAt(0).toUpperCase();
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
      this.hoveredIndex < this.filteredCommands.length
    ) {
      const cmd = this.filteredCommands[this.hoveredIndex];
      this.selectedIndex = this.hoveredIndex;
      this.editCommand(cmd);
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
        this.selectedIndex < this.filteredCommands.length
      ) {
        this.editCommand(this.filteredCommands[this.selectedIndex]);
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
    } else if (this.selectedIndex === -1 && this.filteredCommands.length > 0) {
      this.selectedIndex = 0;
    }
  }

  navigateDown() {
    if (this.selectedIndex < this.filteredCommands.length - 1) {
      this.selectedIndex++;
      this.ensureVisible();
    } else if (this.selectedIndex === -1 && this.filteredCommands.length > 0) {
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
      this.filteredCommands.length - maxVisibleItems
    );
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
  }

  editCommand(cmd) {
    ChatLib.command(`command actions ${cmd.name}`);
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

const commandsVisualCache = new CommandsVisualCache();
export { commandsVisualCache };
