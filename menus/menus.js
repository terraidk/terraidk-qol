/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { limitsManager } from "./GlobalLimitsManager";
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
    }

    getX = () => this.mcObject.field_146209_f;
    getY = () => this.mcObject.field_146210_g;
    getWidth = () => this.mcObject.field_146218_h;
    getHeight = () => this.mcObject.field_146219_i;
    setX = (x) => {
        this.mcObject.field_146209_f = x;
    };
    setY = (y) => {
        this.mcObject.field_146210_g = y;
    };
    setWidth = (width) => {
        this.mcObject.field_146218_h = width;
    };
    setHeight = (height) => {
        this.mcObject.field_146219_i = height;
    };

    setEnabled = (enabled) => {
        const field = this.mcObject.class.getDeclaredField("field_146226_p");
        field.setAccessible(true);
        field.set(this.mcObject, enabled);
    };

    setText = (text) => {
        const field = this.mcObject.class.getDeclaredField("field_146216_j");
        field.setAccessible(true);
        field.set(this.mcObject, text);
    };

    getText = () => {
        const field = this.mcObject.class.getDeclaredField("field_146216_j");
        field.setAccessible(true);
        return field.get(this.mcObject);
    };

    setIsFocused = (focused) => {
        const field = this.mcObject.class.getDeclaredField("field_146213_o");
        field.setAccessible(true);
        field.set(this.mcObject, focused);
    };

    isFocused = () => {
        const field = this.mcObject.class.getDeclaredField("field_146213_o");
        field.setAccessible(true);
        return field.get(this.mcObject);
    };

    render = () => this.mcObject.func_146194_f();
    mouseClicked = (mouseX, mouseY, button) =>
        this.mcObject.func_146192_a(mouseX, mouseY, button);
    keyTyped = (char, keyCode) => this.mcObject.func_146201_a(char, keyCode);
}

// Generic Dropdown Component
class Dropdown {
    constructor(options = []) {
        this.isVisible = false;
        this.item = null;
        this.x = 0;
        this.y = 0;
        this.width = 30;
        this.height = 0;
        this.hoveredOption = -1;
        this.deleteConfirmationActive = false;
        this.options = options;
    }

    show(item, mouseX, mouseY) {
        this.isVisible = true;
        this.item = item;
        this.hoveredOption = -1;
        this.deleteConfirmationActive = false;

        const itemHeight = 20;
        this.height = this.options.length * itemHeight;

        let maxWidth = 80;
        this.options.forEach((option) => {
            const textWidth = Renderer.getStringWidth(option.text) + 16;
            maxWidth = Math.max(maxWidth, textWidth);
        });

        const confirmTextWidth = Renderer.getStringWidth("CONFIRM") + 16;
        maxWidth = Math.min(maxWidth, confirmTextWidth);

        this.width = maxWidth;
        const screenWidth = Renderer.screen.getWidth();
        const screenHeight = Renderer.screen.getHeight();

        this.x = Math.min(mouseX, screenWidth - this.width - 10);
        this.y = Math.min(mouseY, screenHeight - this.height - 10);
        this.x = Math.max(10, this.x);
        this.y = Math.max(10, this.y);
    }

    hide() {
        this.isVisible = false;
        this.item = null;
        this.hoveredOption = -1;
        this.deleteConfirmationActive = false;
    }

    render(colors) {
        if (!this.isVisible || !this.item) return;

        const { x, y, width, height } = this;
        const itemHeight = 20;

        let mouseX = 0,
            mouseY = 0;
        try {
            mouseX = Client.getMouseX();
            mouseY = Client.getMouseY();
        } catch (e) {}

        // Draw header with full name (no truncation)
        const headerText = `§7${this.item.name}`;
        const headerWidth = Renderer.getStringWidth(headerText);
        const headerHeight = 12;
        const headerY = y - headerHeight - 4;

        if (headerWidth > 0 && headerY > 10) {
            const headerTextX = x + (width - headerWidth) / 2;
            Renderer.drawStringWithShadow(headerText, headerTextX, headerY + 2);
        }

        // Draw main dropdown background and border
        Renderer.drawRect(0xff000000, x - 1, y - 1, width + 2, height + 2);
        Renderer.drawRect(colors.dropdownBg, x, y, width, height);

        this.hoveredOption = -1;

        this.options.forEach((option, index) => {
            const itemY = y + index * itemHeight;
            const isHovered =
                mouseX >= x &&
                mouseX <= x + width &&
                mouseY >= itemY &&
                mouseY <= itemY + itemHeight;

            if (isHovered) this.hoveredOption = index;

            let backgroundColor = colors.dropdownHover;
            let optionText = option.text;
            let textColor = option.color;

            if (option.action === "delete") {
                if (this.deleteConfirmationActive) {
                    optionText = "CONFIRM";
                    textColor = "§c§l";
                    backgroundColor = isHovered
                        ? colors.deleteConfirmationHover
                        : colors.deleteConfirmation;
                } else {
                    backgroundColor = isHovered
                        ? colors.dropdownHover
                        : 0x00000000;
                }
            } else {
                backgroundColor = isHovered ? colors.dropdownHover : 0x00000000;
            }

            if (backgroundColor !== 0x00000000) {
                Renderer.drawRect(backgroundColor, x, itemY, width, itemHeight);
            }

            const textX = x + 8;
            const textY = itemY + (itemHeight - 8) / 2;
            Renderer.drawStringWithShadow(textColor + optionText, textX, textY);
        });
    }

    handleClick(mouseX, mouseY, callback) {
        if (!this.isVisible) return false;

        const { x, y, width, height } = this;

        if (
            mouseX >= x &&
            mouseX <= x + width &&
            mouseY >= y &&
            mouseY <= y + height
        ) {
            if (this.hoveredOption >= 0) {
                const option = this.options[this.hoveredOption];

                if (option.action === "delete") {
                    if (this.deleteConfirmationActive) {
                        callback(option.action, this.item);
                        this.hide();
                        return true;
                    } else {
                        this.deleteConfirmationActive = true;
                        return true;
                    }
                } else {
                    callback(option.action, this.item);
                    this.hide();
                    return true;
                }
            }
        }

        this.hide();
        return false;
    }

    handleKeyPress(keyCode, callback) {
        if (!this.isVisible) return false;

        if (keyCode === 1) {
            // ESC
            this.hide();
            return true;
        } else if (keyCode === 200) {
            // Up arrow
            if (this.hoveredOption > 0) {
                this.hoveredOption--;
            } else {
                this.hoveredOption = this.options.length - 1;
            }
            return true;
        } else if (keyCode === 208) {
            // Down arrow
            if (this.hoveredOption < this.options.length - 1) {
                this.hoveredOption++;
            } else {
                this.hoveredOption = 0;
            }
            return true;
        } else if (keyCode === 28) {
            // Enter
            if (this.hoveredOption >= 0) {
                const option = this.options[this.hoveredOption];

                if (option.action === "delete") {
                    if (this.deleteConfirmationActive) {
                        callback(option.action, this.item);
                        this.hide();
                    } else {
                        this.deleteConfirmationActive = true;
                    }
                } else {
                    callback(option.action, this.item);
                    this.hide();
                }
            }
            return true;
        }

        return true;
    }
}

// Base Inventory Cache System
class BaseInventoryCache {
    constructor(config = {}) {
        this.config = Object.assign(
            {
                title: "Items",
                inventoryPattern: /^Items$/,
                slotIndices: [
                    10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 28,
                    29, 30, 31, 32, 33, 34,
                ],
                commands: {
                    create: "create",
                    actions: "command actions",
                    edit: "edit",
                    delete: "delete",
                    list: "list",
                },
                chatPatterns: {
                    created: "Created ${itemName}!",
                    deleted: "Deleted ${itemName}",
                },
                dropdownOptions: [
                    { text: "Edit", action: "edit", color: "§e" },
                    { text: "Delete", action: "delete", color: "§c" },
                ],
            },
            config
        );

        if (config.commands) {
            this.config.commands = Object.assign(
                this.config.commands,
                config.commands
            );
        }
        if (config.chatPatterns) {
            this.config.chatPatterns = Object.assign(
                this.config.chatPatterns,
                config.chatPatterns
            );
        }

        // State management
        this.state = {
            cachedItems: [],
            filteredItems: [],
            isActive: false,
            isScanning: false,
            hoveredIndex: -1,
            selectedIndex: -1,
            scrollOffset: 0,
            currentWorld: null,
            persistentFilterText: "",
            scannedPages: new Set(),
            totalPages: 0,
            currentPage: 1,
            isAutoScanning: false,
            autoScanTimeout: null,
            scrollbarDragging: false,
            scrollbarDragStartY: 0,
            scrollbarDragStartOffset: 0,
        };

        // UI Components
        this.ui = {
            filterTextField: null,
            initializeTextField: true,
            keybindBlocker: null,
            dropdown: new Dropdown(this.config.dropdownOptions),
            clearFilterButton: null,
            autoScanButton: null,
            createButton: null,
        };

        // Colors
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

        if (config.colors) {
            this.colors = Object.assign(this.colors, config.colors);
        }

        this.registerEvents();
    }

    // Event System
    registerEvents() {
        register("worldLoad", () => {
            const newWorld = World.getWorld();
            if (
                this.state.currentWorld &&
                newWorld !== this.state.currentWorld
            ) {
                this.clearCache();
            }
            this.state.currentWorld = newWorld;
        });

        register("chat", (itemName) => {
            if (this.state.cachedItems.length > 0) {
                this.handleItemCreated(itemName);
            }
        }).setChatCriteria(this.config.chatPatterns.created);

        register("chat", (itemName) => {
            if (this.state.cachedItems.length > 0) {
                this.handleItemDeleted(itemName);
            }
        }).setChatCriteria(this.config.chatPatterns.deleted);

        register("guiOpened", () => {
            setTimeout(() => this.checkForInventoryGUI(), 50);
        });

        register("guiClosed", () => {
            if (this.state.isActive) this.hideOverlay();
        });

        register("guiRender", () => {
            if (
                this.state.isActive &&
                !this.state.isScanning &&
                !this.state.isAutoScanning
            ) {
                this.performCacheValidation();
            }
        });

        register("itemTooltip", () => {
            if (this.state.isActive && !this.state.isScanning) {
                this.detectPageChange();
            }
        });

        register("guiRender", () => {
            if (this.state.isActive && this.state.cachedItems.length > 0) {
                this.renderOverlay();
            }
        });

        register("guiMouseClick", (mouseX, mouseY, button) => {
            if (this.state.isActive) {
                return this.handleMouseClick(mouseX, mouseY, button);
            }
        });

        register("guiMouseDrag", (mouseX, mouseY, button) => {
            if (
                this.state.isActive &&
                this.state.scrollbarDragging &&
                button === 0
            ) {
                const panelDims = this.calculatePanelDimensions();
                const listStartY = panelDims.y + 60;
                const listHeight = panelDims.height - 130;
                const itemHeight = 23;
                const maxVisibleItems = Math.floor(listHeight / itemHeight);

                let totalItems = this.state.filteredItems.length;
                const maxScrollRange = Math.max(
                    0,
                    totalItems - maxVisibleItems
                );

                if (maxScrollRange > 0) {
                    const scrollbarHeight = listHeight;
                    const thumbHeight = Math.max(
                        10,
                        (maxVisibleItems / totalItems) * scrollbarHeight
                    );
                    const scrollRange = scrollbarHeight - thumbHeight;
                    const dragDistance =
                        mouseY - this.state.scrollbarDragStartY;
                    let newOffset =
                        this.state.scrollbarDragStartOffset +
                        Math.round(
                            (dragDistance / scrollRange) * maxScrollRange
                        );
                    newOffset = Math.max(
                        0,
                        Math.min(newOffset, maxScrollRange)
                    );
                    this.state.scrollOffset = newOffset;
                }
                return true;
            }
        });

        register("guiMouseRelease", (mouseX, mouseY, button) => {
            if (
                this.state.isActive &&
                this.state.scrollbarDragging &&
                button === 0
            ) {
                this.state.scrollbarDragging = false;
                return true;
            }
        });

        register("guiKey", (char, keyCode) => {
            if (this.state.isActive) {
                return this.handleKeyPress(keyCode, char);
            }
        });

        register("step", () => {
            if (this.state.isActive) {
                const scroll = Mouse.getDWheel();
                if (scroll !== 0) this.handleMouseScroll(scroll > 0 ? -1 : 1);
            }
        }).setFps(60);

        register("guiRender", () => {
            if (this.state.isActive && this.state.scrollbarDragging) {
                let mouseY = 0;
                try {
                    mouseY = Client.getMouseY();
                } catch (e) {}

                const panelDims = this.calculatePanelDimensions();
                const listStartY = panelDims.y + 60;
                const listHeight = panelDims.height - 130;
                const itemHeight = 23;
                const maxVisibleItems = Math.floor(listHeight / itemHeight);

                let totalItems = this.state.filteredItems.length;
                const maxScrollRange = Math.max(
                    0,
                    totalItems - maxVisibleItems
                );

                if (maxScrollRange > 0) {
                    const scrollbarHeight = listHeight;
                    const thumbHeight = Math.max(
                        10,
                        (maxVisibleItems / totalItems) * scrollbarHeight
                    );
                    const scrollRange = scrollbarHeight - thumbHeight;
                    const dragDistance =
                        mouseY - this.state.scrollbarDragStartY;
                    let newOffset =
                        this.state.scrollbarDragStartOffset +
                        Math.round(
                            (dragDistance / scrollRange) * maxScrollRange
                        );
                    newOffset = Math.max(
                        0,
                        Math.min(newOffset, maxScrollRange)
                    );
                    this.state.scrollOffset = newOffset;
                }
            }
        });
    }

    // Utility Methods
    createTextField(x, y, width, height) {
        try {
            const textField = new Input(x, y, width, height);
            textField.setEnabled(true);
            textField.setIsFocused(false);
            textField.setText("");
            return textField;
        } catch (error) {
            ChatLib.chat(
                PREFIX +
                    `§c[ERROR] Failed to create text field: ${error.message}`
            );
            return null;
        }
    }

    disableAllKeybinds() {
        if (this.ui.keybindBlocker) return;
        this.ui.keybindBlocker = register(
            "guiKey",
            (char, keyCode, gui, event) => {
                if (keyCode !== 1) cancel(event);
            }
        );
    }

    restoreAllKeybinds() {
        if (this.ui.keybindBlocker) {
            this.ui.keybindBlocker.unregister();
            this.ui.keybindBlocker = null;
        }
    }

    getListAvailableHeight() {
        const panelHeight = this.calculatePanelDimensions().height;
        return panelHeight - 130;
    }

    performCacheValidation() {
        if (!this.state.isActive || this.state.isScanning) return;

        const inventory = Player.getOpenedInventory();
        if (!inventory) return;

        const title = inventory.getName();
        const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

        if (this.config.inventoryPattern.test(cleanTitle)) {
            this.validateCacheAgainstCurrentPage();
        }
    }

    validateCacheAgainstCurrentPage() {
        const inventory = Player.getOpenedInventory();
        if (!inventory) return;

        const title = inventory.getName();
        const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

        if (!this.config.inventoryPattern.test(cleanTitle)) return;

        const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\)/);
        const currentPageNum = pageMatch ? parseInt(pageMatch[1]) : 1;

        if (
            currentPageNum !== this.state.currentPage ||
            !this.state.scannedPages.has(currentPageNum)
        ) {
            this.state.currentPage = currentPageNum;
            this.scanCurrentPage();
        }
    }

    // Core Methods (Override these in subclasses)
    parseItem(item, slotIndex) {
        const itemName = item.getName();
        const cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");

        return {
            name: cleanName,
            displayName: itemName,
            description: null,
            page: this.state.currentPage,
            isPlaceholder: false,
            ctItem: item,
        };
    }

    handleItemCreated(itemName) {
        // Override in subclass
    }

    handleItemDeleted(itemName) {
        // Override in subclass
    }

    checkForInventoryGUI() {
        const inventory = Player.getOpenedInventory();
        if (!inventory || this.state.isActive || this.state.isScanning) return;

        const title = inventory.getName();
        const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, "") : "";

        if (this.config.inventoryPattern.test(cleanTitle)) {
            // Request limits with callback
            limitsManager.requestLimits((limits) => {
                this.state.totalItems = limits[this.config.title] || 0;
                this.updateFilteredItems();
            });

            setTimeout(() => {
                this.detectPageInfo(cleanTitle, inventory);
                this.startScanning();
            }, 50);
        }
    }

    detectPageInfo(cleanTitle, inventory) {
        const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\)/);
        if (pageMatch) {
            this.state.currentPage = parseInt(pageMatch[1]);
            this.state.totalPages = parseInt(pageMatch[2]);
        } else if (cleanTitle === this.config.title) {
            this.state.currentPage = 1;
            this.state.totalPages = this.detectTotalPages(inventory);
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

        const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\)/);

        if (pageMatch) {
            const newPage = parseInt(pageMatch[1]);
            const newTotalPages = parseInt(pageMatch[2]);

            if (
                newPage !== this.state.currentPage ||
                newTotalPages !== this.state.totalPages
            ) {
                this.state.currentPage = newPage;

                if (
                    this.state.totalPages === 999 ||
                    newTotalPages !== this.state.totalPages
                ) {
                    this.state.totalPages = newTotalPages;
                }

                if (!this.state.scannedPages.has(newPage)) {
                    if (this.state.isAutoScanning) {
                        ChatLib.chat(
                            PREFIX +
                                `§bAuto-scanning page ${newPage}/${this.state.totalPages}...`
                        );
                    } else {
                        ChatLib.chat(
                            PREFIX +
                                `§eNew page detected: ${newPage}/${this.state.totalPages}, scanning...`
                        );
                    }
                    this.scanCurrentPage();
                } else if (this.state.isAutoScanning) {
                    setTimeout(() => {
                        this.continueAutoScan();
                    }, 250);
                }
            }
        } else if (cleanTitle === this.config.title) {
            if (this.state.currentPage !== 1) {
                this.state.currentPage = 1;

                if (!this.state.scannedPages.has(1)) {
                    ChatLib.chat(PREFIX + `§eBack to page 1, scanning...`);
                    this.scanCurrentPage();
                } else if (this.state.isAutoScanning) {
                    setTimeout(() => {
                        this.continueAutoScan();
                    }, 250);
                }
            }
        }
    }

    getDefaultAction() {
        try {
            const title = (this.config.title || "").toLowerCase();
            if (title.includes("command")) return "actions";
        } catch (e) {}
        return "edit";
    }

    executeAction(action, item) {
        switch (action) {
            case "edit":
                ChatLib.command(`${this.config.commands.edit} ${item.name}`);
                break;
            case "actions":
                ChatLib.command(`${this.config.commands.actions} ${item.name}`);
                break;
            case "delete":
                ChatLib.command(`${this.config.commands.delete} ${item.name}`);
                setTimeout(() => {
                    ChatLib.command(this.config.commands.list);
                }, 50);
                break;
            case "create":
                ChatLib.command(`${this.config.commands.create} ${item.name}`);
                break;
        }
    }

    // UI Methods
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

    updateFilteredItems() {
        const filterText = this.ui.filterTextField
            ? this.ui.filterTextField.getText()
            : "";

        if (!filterText) {
            this.state.filteredItems = [...this.state.cachedItems];
        } else {
            const filter = filterText.toLowerCase();
            this.state.filteredItems = this.state.cachedItems.filter(
                (item) =>
                    item.name.toLowerCase().includes(filter) ||
                    (item.description &&
                        item.description.toLowerCase().includes(filter))
            );
        }

        if (this.state.selectedIndex >= this.state.filteredItems.length) {
            this.state.selectedIndex = -1;
        }

        // Fix scrolling when filter changes
        const availableHeight = this.getListAvailableHeight();
        const itemHeight = 23;
        const maxVisibleItems = Math.floor(availableHeight / itemHeight);
        const maxScroll = Math.max(
            0,
            this.state.filteredItems.length - maxVisibleItems
        );
        this.state.scrollOffset = Math.max(
            0,
            Math.min(this.state.scrollOffset, maxScroll)
        );
    }

    getScannedPagesDisplay() {
        const cached = this.state.cachedItems.length;
        const total = this.state.totalItems > 0 ? this.state.totalItems : "?";

        // Page info
        let pageInfo = "";
        if (this.state.totalPages > 0 && this.state.totalPages !== 999) {
            pageInfo = ` [${this.state.scannedPages.size}/${this.state.totalPages}]`;
        } else if (this.state.scannedPages.size > 0) {
            pageInfo = ` [${this.state.scannedPages.size}/?]`;
        }

        return `(${cached}/${total})${pageInfo}`;
    }

    // Scanning Methods
    startScanning() {
        this.state.isScanning = true;
        this.scanCurrentPage();
    }

    scanCurrentPage() {
        const inventory = Player.getOpenedInventory();
        if (!inventory) {
            this.state.isScanning = false;
            return;
        }

        this.state.scannedPages.add(this.state.currentPage);

        const currentPageItems = new Set();
        let newItemsFound = 0;
        let updatedPlaceholders = 0;
        let renamedItems = 0;

        this.config.slotIndices.forEach((slotIndex) => {
            const item = inventory.getStackInSlot(slotIndex);
            if (item && item.getName() !== "Air") {
                const itemData = this.parseItem(item, slotIndex);
                if (itemData) {
                    currentPageItems.add(itemData.name);

                    const existingItem = this.state.cachedItems.find(
                        (r) => r.name === itemData.name
                    );

                    if (!existingItem) {
                        const possibleRename = this.state.cachedItems.find(
                            (r) =>
                                r.page === this.state.currentPage &&
                                r.slotIndex === slotIndex &&
                                r.name !== itemData.name
                        );

                        if (possibleRename) {
                            if (renamedItems < 2) {
                                ChatLib.chat(
                                    PREFIX +
                                        `§6Detected rename: "${possibleRename.name}" → "${itemData.name}"`
                                );
                            }

                            Object.assign(possibleRename, itemData);
                            renamedItems++;
                        } else {
                            this.state.cachedItems.push(itemData);
                            newItemsFound++;
                        }
                    } else if (existingItem.isPlaceholder) {
                        Object.assign(existingItem, itemData);
                        existingItem.isPlaceholder = false;
                        updatedPlaceholders++;
                    } else {
                        Object.assign(existingItem, itemData);
                    }
                }
            }
        });

        // Check for deleted items
        const deletedItems = this.state.cachedItems.filter(
            (r) =>
                r.page === this.state.currentPage &&
                !r.isPlaceholder &&
                !currentPageItems.has(r.name)
        );

        if (deletedItems.length > 0) {
            deletedItems.forEach((item) => {
                if (deletedItems.length <= 2) {
                    ChatLib.chat(
                        PREFIX + `§cDeleted item detected: "${item.name}"`
                    );
                }
                const index = this.state.cachedItems.indexOf(item);
                if (index > -1) {
                    this.state.cachedItems.splice(index, 1);
                }
            });
        }

        // Log results for auto-scanning
        if (this.state.isAutoScanning) {
            let message = `§bPage ${this.state.currentPage}:`;
            if (newItemsFound > 0) message += ` +${newItemsFound} new`;
            if (updatedPlaceholders > 0)
                message += ` ~${updatedPlaceholders} updated`;

            if (renamedItems > 0 && renamedItems <= 2)
                message += ` ↻${renamedItems} renamed`;

            if (deletedItems.length > 0 && deletedItems.length <= 2)
                message += ` -${deletedItems.length} deleted`;

            message += ` (Total: ${this.state.cachedItems.length})`;

            if (
                newItemsFound > 0 ||
                updatedPlaceholders > 0 ||
                (renamedItems > 0 && renamedItems <= 2) ||
                (deletedItems.length > 0 && deletedItems.length <= 2)
            ) {
                ChatLib.chat(PREFIX + message);
                World.playSound("random.orb", 1, 2);
            }
        } else {
            let message = `§aPage ${this.state.currentPage} scan complete.`;
            if (newItemsFound > 0)
                message += ` Found ${newItemsFound} new items.`;
            if (updatedPlaceholders > 0)
                message += ` Updated ${updatedPlaceholders} placeholders.`;

            if (renamedItems > 0 && renamedItems <= 2)
                message += ` Detected ${renamedItems} renames.`;

            if (deletedItems.length > 0 && deletedItems.length <= 2)
                message += ` Removed ${deletedItems.length} deleted items.`;

            message += ` Total: ${this.state.cachedItems.length}`;

            if (
                newItemsFound > 0 ||
                updatedPlaceholders > 0 ||
                (renamedItems > 0 && renamedItems <= 2) ||
                (deletedItems.length > 0 && deletedItems.length <= 2)
            ) {
                ChatLib.chat(PREFIX + message);
            }
        }

        this.updateFilteredItems();

        if (!this.state.isActive) {
            this.state.isActive = true;
            this.ui.initializeTextField = true;
            this.disableAllKeybinds();
        }

        this.state.isScanning = false;

        if (
            this.state.scannedPages.size < this.state.totalPages &&
            !this.state.isAutoScanning
        ) {
            const unscannedPages = [];
            for (let i = 1; i <= this.state.totalPages; i++) {
                if (!this.state.scannedPages.has(i)) {
                    unscannedPages.push(i);
                }
            }
        }
    }

    startAutoScan() {
        if (this.state.isAutoScanning || !this.state.isActive) return;

        this.state.isAutoScanning = true;

        const inventory = Player.getOpenedInventory();
        const previousPageItem = inventory.getStackInSlot(45);

        if (previousPageItem && previousPageItem.getName() !== "Air") {
            inventory.click(45, false, "RIGHT");
        }

        ChatLib.chat(PREFIX + `§bStarting auto-scan of all pages...`);
        this.state.autoScanTimeout = setTimeout(
            () => this.continueAutoScan(),
            100
        );
    }

    stopAutoScan() {
        if (!this.state.isAutoScanning) return;

        this.state.isAutoScanning = false;
        if (this.state.autoScanTimeout) {
            clearTimeout(this.state.autoScanTimeout);
            this.state.autoScanTimeout = null;
        }

        ChatLib.chat(
            PREFIX +
                `§eAuto-scan stopped. Scanned ${this.state.scannedPages.size}/${this.state.totalPages} pages.`
        );
    }

    continueAutoScan() {
        if (!this.state.isAutoScanning) return;

        const inventory = Player.getOpenedInventory();
        if (!inventory) {
            this.state.autoScanTimeout = setTimeout(
                () => this.continueAutoScan(),
                200
            );
            return;
        }

        if (!this.state.scannedPages.has(this.state.currentPage)) {
            this.scanCurrentPage();
        }

        const nextPageItem = inventory.getStackInSlot(53);

        if (nextPageItem && nextPageItem.getName() !== "Air") {
            inventory.click(53, false, "LEFT");
            this.state.autoScanTimeout = setTimeout(
                () => this.continueAutoScan(),
                500
            );
            return;
        }

        ChatLib.chat(
            PREFIX +
                `§aAuto-scan complete! Scanned all ${this.state.totalPages} pages with ${this.state.cachedItems.length} total items.`
        );
        this.state.isAutoScanning = false;
        this.refreshPlaceholderItems();
    }

    refreshPlaceholderItems() {
        const placeholders = this.state.cachedItems.filter(
            (r) => r.isPlaceholder
        );
        if (placeholders.length > 0) {
            ChatLib.chat(
                PREFIX +
                    `§e${placeholders.length} placeholder item(s) detected. Consider rescanning to get full data.`
            );
        }
    }

    areAllPagesScanned() {
        if (this.state.scannedPages.size === 0) return false;
        if (this.state.totalPages === 0 || this.state.totalPages === 999) {
            return false;
        }
        return this.state.scannedPages.size >= this.state.totalPages;
    }

    // Event Handlers
    handleMouseClick(mouseX, mouseY, button) {
        if (
            this.ui.dropdown.handleClick(mouseX, mouseY, (action, item) =>
                this.executeAction(action, item)
            )
        ) {
            return true;
        }

        // Handle auto-scan button
        if (
            this.ui.autoScanButton &&
            button === 0 &&
            mouseX >= this.ui.autoScanButton.x &&
            mouseX <= this.ui.autoScanButton.x + this.ui.autoScanButton.width &&
            mouseY >= this.ui.autoScanButton.y &&
            mouseY <= this.ui.autoScanButton.y + this.ui.autoScanButton.height
        ) {
            if (this.state.isAutoScanning) {
                this.stopAutoScan();
            } else {
                this.startAutoScan();
            }
            return true;
        }

        // Handle create button (when no results)
        if (
            this.ui.createButton &&
            button === 0 &&
            mouseX >= this.ui.createButton.x &&
            mouseX <= this.ui.createButton.x + this.ui.createButton.width &&
            mouseY >= this.ui.createButton.y &&
            mouseY <= this.ui.createButton.y + this.ui.createButton.height
        ) {
            if (!this.ui.createButton.isDisabled) {
                const itemName = this.ui.createButton.itemName;
                if (itemName && itemName.trim().length > 0) {
                    this.createItem(itemName);
                }
            } else {
                ChatLib.chat(
                    PREFIX +
                        `§cPlease scan all pages before creating new items!`
                );
            }
            return true;
        }

        // Handle clear filter button
        if (
            this.ui.clearFilterButton &&
            button === 0 &&
            mouseX >= this.ui.clearFilterButton.x &&
            mouseX <=
                this.ui.clearFilterButton.x + this.ui.clearFilterButton.width &&
            mouseY >= this.ui.clearFilterButton.y &&
            mouseY <=
                this.ui.clearFilterButton.y + this.ui.clearFilterButton.height
        ) {
            if (this.ui.filterTextField) {
                this.ui.filterTextField.setText("");
                this.state.persistentFilterText = "";
                this.ui.filterTextField.setIsFocused(false);
                this.updateFilteredItems();
            }
            return true;
        }

        // Handle filter field clicks
        if (this.ui.filterTextField && button === 0) {
            this.ui.filterTextField.mouseClicked(mouseX, mouseY, button);
        }

        // Handle scrollbar clicking and dragging
        const panelDims = this.calculatePanelDimensions();
        const listStartY = panelDims.y + 60;
        const listHeight = panelDims.height - 130;

        if (this.state.filteredItems.length > 0) {
            const itemHeight = 23;
            const maxVisibleItems = Math.floor(listHeight / itemHeight);

            if (this.state.filteredItems.length > maxVisibleItems) {
                const scrollbarWidth = 3;
                const scrollbarMargin = 3;
                const scrollbarX =
                    panelDims.x +
                    panelDims.width -
                    scrollbarWidth -
                    scrollbarMargin;
                const maxScrollRange =
                    this.state.filteredItems.length - maxVisibleItems;
                const scrollbarHeight = listHeight;

                if (
                    button === 0 &&
                    mouseX >= scrollbarX &&
                    mouseX <= scrollbarX + scrollbarWidth &&
                    mouseY >= listStartY &&
                    mouseY <= listStartY + scrollbarHeight
                ) {
                    const thumbHeight = Math.max(
                        10,
                        (maxVisibleItems / this.state.filteredItems.length) *
                            scrollbarHeight
                    );
                    const thumbY =
                        maxScrollRange > 0
                            ? listStartY +
                              (this.state.scrollOffset / maxScrollRange) *
                                  (scrollbarHeight - thumbHeight)
                            : listStartY;

                    if (mouseY >= thumbY && mouseY <= thumbY + thumbHeight) {
                        // Start dragging
                        this.state.scrollbarDragging = true;
                        this.state.scrollbarDragStartY = mouseY;
                        this.state.scrollbarDragStartOffset =
                            this.state.scrollOffset;
                        return true;
                    } else {
                        // Click outside thumb - jump to position
                        const clickRatio =
                            (mouseY - listStartY) / scrollbarHeight;
                        this.state.scrollOffset = Math.round(
                            clickRatio * maxScrollRange
                        );
                        this.state.scrollOffset = Math.max(
                            0,
                            Math.min(this.state.scrollOffset, maxScrollRange)
                        );
                        return true;
                    }
                }
            }
        }

        // Handle item clicks (including create items in list)
        const listWidth = panelDims.width - 20;
        const itemHeight = 23;
        const maxVisibleItems = Math.floor(listHeight / itemHeight);

        // Add create item to list if there's filter text
        const filterText = this.ui.filterTextField
            ? this.ui.filterTextField.getText().trim()
            : "";
        let listItems = [...this.state.filteredItems];

        if (filterText.length > 0) {
            const existingItem = this.state.cachedItems.find(
                (f) => f.name === filterText
            );
            if (!existingItem) {
                listItems.push({
                    name: `+ Create "${filterText}"`,
                    isCreateItem: true,
                    itemName: filterText,
                    description: "Create new item",
                });
            }
        }

        const startIndex = this.state.scrollOffset;
        const endIndex = Math.min(
            startIndex + maxVisibleItems,
            listItems.length
        );

        for (let i = startIndex; i < endIndex; i++) {
            const item = listItems[i];
            if (!item) continue;

            const listIndex = i - startIndex;
            const itemX = panelDims.x + 10;
            const itemY = listStartY + listIndex * itemHeight;

            if (
                mouseX >= itemX &&
                mouseX <= itemX + listWidth &&
                mouseY >= itemY &&
                mouseY <= itemY + itemHeight
            ) {
                if (item.isCreateItem) {
                    if (button === 0) {
                        const currentFilterText = this.ui.filterTextField
                            ? this.ui.filterTextField.getText().trim()
                            : "";

                        if (
                            !currentFilterText ||
                            currentFilterText.length === 0
                        ) {
                            ChatLib.chat(PREFIX + `§cNo item name entered!`);
                            return true;
                        }

                        // Check if item already exists
                        const existingItem = this.state.cachedItems.find(
                            (r) => r.name === currentFilterText
                        );
                        if (existingItem) {
                            ChatLib.chat(
                                PREFIX +
                                    `§cItem "${currentFilterText}" already exists!`
                            );
                            return true;
                        }

                        ChatLib.chat(
                            PREFIX + `§aCreating item: "${currentFilterText}"`
                        );
                        this.executeAction("create", {
                            name: currentFilterText,
                        });

                        setTimeout(() => {
                            if (this.ui.filterTextField) {
                                this.ui.filterTextField.setText("");
                                this.state.persistentFilterText = "";
                                this.updateFilteredItems();
                            }
                        }, 100);

                        return true;
                    }
                    return true;
                } else {
                    this.state.selectedIndex = i;
                    if (button === 0) {
                        this.executeAction(this.getDefaultAction(), item);
                    } else if (button === 1) {
                        this.ui.dropdown.show(item, mouseX, mouseY);
                    }
                    return true;
                }
            }
        }

        // Handle scrollbar dragging
        if (this.state.scrollbarDragging && button === 0) {
            const itemHeight = 23;
            const maxVisibleItems = Math.floor(listHeight / itemHeight);
            const maxScrollRange = Math.max(
                0,
                listItems.length - maxVisibleItems
            );

            if (maxScrollRange > 0) {
                const scrollbarHeight = listHeight;
                const thumbHeight = Math.max(
                    10,
                    (maxVisibleItems / listItems.length) * scrollbarHeight
                );
                const dragDistance = mouseY - this.state.scrollbarDragStartY;
                const scrollRange = scrollbarHeight - thumbHeight;
                const scrollDelta =
                    scrollRange > 0
                        ? (dragDistance / scrollRange) * maxScrollRange
                        : 0;

                this.state.scrollOffset =
                    this.state.scrollbarDragStartOffset +
                    Math.round(scrollDelta);
                this.state.scrollOffset = Math.max(
                    0,
                    Math.min(this.state.scrollOffset, maxScrollRange)
                );
            }
            return true;
        }

        // Check if click is within panel bounds
        if (
            mouseX >= panelDims.x &&
            mouseX <= panelDims.x + panelDims.width &&
            mouseY >= panelDims.y &&
            mouseY <= panelDims.y + panelDims.height
        ) {
            return true;
        }

        return false;
    }

    createItem(itemName) {
        if (itemName && itemName.trim().length > 0) {
            let cleanName = itemName;
            if (cleanName.startsWith('+ Create "') && cleanName.endsWith('"')) {
                cleanName = cleanName
                    .replace(/^\+ Create "/, "")
                    .replace(/"$/, "");
            }

            if (cleanName.trim().length === 0) {
                ChatLib.chat(PREFIX + `§cItem name cannot be empty!`);
                return;
            }

            const existingItem = this.state.cachedItems.find(
                (r) => r.name === cleanName
            );
            if (existingItem) {
                ChatLib.chat(PREFIX + `§cItem "${cleanName}" already exists!`);
                return;
            }

            ChatLib.chat(PREFIX + `§aCreating new item: "${cleanName}"`);
            this.executeAction("create", { name: cleanName });

            if (this.ui.filterTextField) {
                this.ui.filterTextField.setText("");
                this.state.persistentFilterText = "";
                this.updateFilteredItems();
            }
        } else {
            ChatLib.chat(PREFIX + `§cInvalid item name!`);
        }
    }

    handleKeyPress(keyCode, char) {
        // Handle dropdown key presses first
        if (
            this.ui.dropdown.handleKeyPress(keyCode, (action, item) =>
                this.executeAction(action, item)
            )
        ) {
            return true;
        }

        // Handle filter field input
        if (this.ui.filterTextField && this.ui.filterTextField.isFocused()) {
            if (keyCode === 1) {
                // ESC
                this.ui.filterTextField.setIsFocused(false);
                this.hideOverlay();
                return true;
            } else if (keyCode === 28) {
                // Enter
                this.ui.filterTextField.setIsFocused(false);
                return true;
            } else if (keyCode === 15) {
                // Tab
                this.ui.filterTextField.setIsFocused(false);
                return true;
            }

            this.ui.filterTextField.keyTyped(char, keyCode);
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
                this.state.selectedIndex >= 0 &&
                this.state.selectedIndex < this.state.filteredItems.length
            ) {
                this.executeAction(
                    this.getDefaultAction(),
                    this.state.filteredItems[this.state.selectedIndex]
                );
                return true;
            }
        } else if (keyCode === 57) {
            // Space bar - toggle auto-scan
            if (this.state.isAutoScanning) {
                this.stopAutoScan();
            } else {
                this.startAutoScan();
            }
            return true;
        }

        return true;
    }

    navigateUp() {
        if (this.state.selectedIndex > 0) {
            this.state.selectedIndex--;
            this.ensureVisible();
        } else if (
            this.state.selectedIndex === -1 &&
            this.state.filteredItems.length > 0
        ) {
            this.state.selectedIndex = 0;
        }
    }

    navigateDown() {
        if (this.state.selectedIndex < this.state.filteredItems.length - 1) {
            this.state.selectedIndex++;
            this.ensureVisible();
        } else if (
            this.state.selectedIndex === -1 &&
            this.state.filteredItems.length > 0
        ) {
            this.state.selectedIndex = 0;
        }
    }

    ensureVisible() {
        const availableHeight = this.getListAvailableHeight();
        const itemHeight = 23;
        const maxVisibleItems = Math.floor(availableHeight / itemHeight);

        if (this.state.selectedIndex < this.state.scrollOffset) {
            this.state.scrollOffset = this.state.selectedIndex;
        } else if (
            this.state.selectedIndex >=
            this.state.scrollOffset + maxVisibleItems
        ) {
            this.state.scrollOffset =
                this.state.selectedIndex - maxVisibleItems + 1;
        }

        const maxScroll = Math.max(
            0,
            this.state.filteredItems.length - maxVisibleItems
        );
        this.state.scrollOffset = Math.max(
            0,
            Math.min(this.state.scrollOffset, maxScroll)
        );
    }

    handleMouseScroll(direction) {
        if (this.ui.dropdown.isVisible) {
            this.ui.dropdown.hide();
        }

        const availableHeight = this.getListAvailableHeight();
        const itemHeight = 23;
        const maxVisibleItems = Math.floor(availableHeight / itemHeight);
        const maxScroll = Math.max(
            0,
            this.state.filteredItems.length - maxVisibleItems
        );

        this.state.scrollOffset += direction * 1;
        this.state.scrollOffset = Math.max(
            0,
            Math.min(this.state.scrollOffset, maxScroll)
        );
    }

    // Rendering Methods
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
            if (this.ui.initializeTextField || !this.ui.filterTextField) {
                const filterY = panelY + 30;
                const filterHeight = 20;
                this.ui.filterTextField = this.createTextField(
                    panelX + 10,
                    filterY,
                    panelWidth - 20,
                    filterHeight
                );
                this.ui.initializeTextField = false;

                if (this.ui.filterTextField) {
                    const savedFilterText = this.state.persistentFilterText;
                    this.ui.filterTextField.setText(savedFilterText);
                    this.updateFilteredItems();
                }
            }

            // Draw panel background and border
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
            Renderer.drawRect(
                0xcc222222,
                panelX,
                panelY,
                panelWidth,
                panelHeight
            );

            let currentY = panelY + 10;

            // Draw title
            const placeholderCount = this.state.cachedItems.filter(
                (f) => f.isPlaceholder
            ).length;
            const scannedInfo = this.getScannedPagesDisplay();
            let title = `${PREFIX}${this.config.title} ${scannedInfo}`;
            if (placeholderCount > 0) title += ` §e[${placeholderCount} new]`;

            const titleWidth = Renderer.getStringWidth(title);
            Renderer.drawStringWithShadow(
                title,
                panelX + (panelWidth - titleWidth) / 2,
                currentY
            );
            currentY += 20;

            // Render filter field and clear button
            if (this.ui.filterTextField) {
                const filterText = this.ui.filterTextField.getText();
                const hasText = filterText && filterText.length > 0;
                const filterFieldWidth = hasText
                    ? panelWidth - 40
                    : panelWidth - 20;
                this.ui.filterTextField.setWidth(filterFieldWidth);
                this.ui.filterTextField.render();

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
                    Renderer.drawRect(
                        color,
                        buttonX,
                        buttonY,
                        buttonSize,
                        buttonSize
                    );
                    Renderer.drawRect(
                        0xff000000,
                        buttonX,
                        buttonY,
                        buttonSize,
                        1
                    );
                    Renderer.drawRect(
                        0xff000000,
                        buttonX,
                        buttonY + buttonSize - 1,
                        buttonSize,
                        1
                    );
                    Renderer.drawRect(
                        0xff000000,
                        buttonX,
                        buttonY,
                        1,
                        buttonSize
                    );
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

                    this.ui.clearFilterButton = {
                        x: buttonX,
                        y: buttonY,
                        width: buttonSize,
                        height: buttonSize,
                    };
                } else {
                    this.ui.clearFilterButton = null;
                }

                if (filterText !== this.state.persistentFilterText) {
                    this.state.persistentFilterText = filterText;
                    this.updateFilteredItems();
                }
            }

            currentY += 30;

            // Draw items list
            const listHeight = panelHeight - (currentY - panelY) - 70;
            this.drawItemsList(panelX, currentY, panelWidth, listHeight);

            // Draw buttons at bottom
            const buttonY = currentY + listHeight + 10;
            this.drawAutoScanButton(panelX, buttonY, panelWidth);

            // Draw instructions
            const instructions = [
                "§7Left click to edit • Right click for more options",
                "§eCAUTION: The speed of the buttons is dependent on your ping!",
            ];
            instructions.forEach((instruction, index) => {
                const instrWidth = Renderer.getStringWidth(instruction);
                const instrX = panelX + (panelWidth - instrWidth) / 2;
                const instrY = panelY + panelHeight - 35 + index * 10;
                Renderer.drawStringWithShadow(instruction, instrX, instrY);
            });

            this.ui.dropdown.render(this.colors);
        } catch (error) {
            ChatLib.chat(
                PREFIX + `§c[ERROR] Rendering failed: ${error.message}`
            );
        }
    }

    drawAutoScanButton(panelX, buttonY, panelWidth) {
        const buttonHeight = 20;
        const buttonWidth = 120;
        const buttonX = panelX + (panelWidth - buttonWidth) / 2;

        let mouseX = 0,
            mouseY = 0;
        try {
            mouseX = Client.getMouseX();
            mouseY = Client.getMouseY();
        } catch (e) {}

        const isHovered =
            mouseX >= buttonX &&
            mouseX <= buttonX + buttonWidth &&
            mouseY >= buttonY &&
            mouseY <= buttonY + buttonHeight;

        const buttonColor = this.state.isAutoScanning
            ? isHovered
                ? this.colors.scanButtonActive
                : this.colors.scanButtonHover
            : isHovered
            ? this.colors.scanButtonHover
            : this.colors.scanButton;

        const buttonText = this.state.isAutoScanning
            ? "§fStop Scanning"
            : "§fScan All Pages";

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

        this.ui.autoScanButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight,
        };
    }

    drawItemsList(panelX, listStartY, panelWidth, availableHeight) {
        const itemHeight = 22;
        const itemSpacing = 1;
        const maxVisibleItems = Math.floor(
            availableHeight / (itemHeight + itemSpacing)
        );
        const scrollbarWidth = 3;
        const scrollbarMargin = 3;
        const listWidth = panelWidth - 20;

        let mouseX = 0,
            mouseY = 0;
        try {
            mouseX = Client.getMouseX();
            mouseY = Client.getMouseY();
        } catch (e) {}

        this.state.hoveredIndex = -1;

        const filterText = this.ui.filterTextField
            ? this.ui.filterTextField.getText().trim()
            : "";

        let listItems = [...this.state.filteredItems];
        if (filterText.length > 0) {
            const existingItem = this.state.cachedItems.find(
                (f) => f.name === filterText
            );
            if (!existingItem) {
                listItems.push({
                    name: `+ Create "${filterText}"`,
                    isCreateItem: true,
                    itemName: filterText,
                    description: "Create new item",
                });
            }
        }

        if (listItems.length === 0) {
            this.ui.createButton =
                filterText.length > 0
                    ? { x: 0, y: 0, width: 0, height: 0, itemName: filterText }
                    : null;
            return;
        }

        const startIndex = this.state.scrollOffset;
        const endIndex = Math.min(
            startIndex + maxVisibleItems,
            listItems.length
        );
        const visibleItemCount = endIndex - startIndex;
        const actualContentHeight =
            visibleItemCount * (itemHeight + itemSpacing);

        // Draw scrollbar
        if (listItems.length > maxVisibleItems) {
            const scrollbarX =
                panelX + panelWidth - scrollbarWidth - scrollbarMargin;
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
                      (this.state.scrollOffset / maxScrollRange) *
                          (scrollbarHeight - thumbHeight)
                    : listStartY;

            const isHovered =
                mouseX >= scrollbarX &&
                mouseX <= scrollbarX + scrollbarWidth &&
                mouseY >= thumbY &&
                mouseY <= thumbY + thumbHeight;

            const thumbColor =
                this.state.scrollbarDragging || isHovered
                    ? this.colors.scrollbarThumbHover
                    : this.colors.scrollbarThumb;

            Renderer.drawRect(
                thumbColor,
                scrollbarX,
                thumbY,
                scrollbarWidth,
                thumbHeight
            );

            // store drag start position for scrolling
            if (!this.state.scrollbarDragStartY)
                this.state.scrollbarDragStartY = 0;
            if (!this.state.scrollbarDragStartOffset)
                this.state.scrollbarDragStartOffset = this.state.scrollOffset;

            this.state.scrollbarThumb = {
                x: scrollbarX,
                y: thumbY,
                width: scrollbarWidth,
                height: thumbHeight,
                maxScrollRange,
                listStartY,
                scrollbarHeight,
                listItems,
                maxVisibleItems,
            };
        }

        for (let i = startIndex; i < endIndex; i++) {
            const item = listItems[i];
            if (!item) continue;

            const listIndex = i - startIndex;
            const itemX = panelX + 10;
            const itemY = listStartY + listIndex * (itemHeight + itemSpacing);

            const isHovered =
                mouseX >= itemX &&
                mouseX <= itemX + listWidth &&
                mouseY >= itemY &&
                mouseY <= itemY + itemHeight;

            if (isHovered) this.state.hoveredIndex = i;

            let bgColor = 0xff333333;
            if (i === this.state.selectedIndex) bgColor = 0xff4caf50;
            else if (isHovered) bgColor = 0xff555555;
            if (item.isPlaceholder) bgColor = 0xff4a4a00;
            if (item.isCreateItem) {
                bgColor = isHovered
                    ? this.colors.createButtonHover
                    : this.colors.createButton;
            }

            Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight);

            const nameColor = item.isCreateItem
                ? "§f"
                : i === this.state.selectedIndex
                ? "§a"
                : isHovered
                ? "§e"
                : item.isPlaceholder
                ? "§6"
                : "§f";

            if (item.isCreateItem) {
                const textWidth = Renderer.getStringWidth(item.name);
                const centerX = itemX + (listWidth - textWidth) / 2;
                Renderer.drawStringWithShadow(
                    nameColor + item.name,
                    centerX,
                    itemY + (itemHeight - 8) / 2
                );
            } else {
                this.renderListItem(
                    item,
                    itemX,
                    itemY,
                    listWidth,
                    itemHeight,
                    nameColor,
                    i
                );
            }
        }
    }

    renderListItem(
        item,
        itemX,
        itemY,
        listWidth,
        itemHeight,
        nameColor,
        index
    ) {
        Renderer.drawStringWithShadow(
            nameColor + item.name,
            itemX + 8,
            itemY + (itemHeight - 8) / 2
        );
    }

    // State Management
    clearCache() {
        this.state.cachedItems = [];
        this.state.filteredItems = [];
        this.state.isActive = false;
        this.state.hoveredIndex = -1;
        this.state.selectedIndex = -1;
        this.state.scrollOffset = 0;
        this.state.isScanning = false;
        this.state.persistentFilterText = "";
        this.state.scannedPages.clear();
        this.state.totalPages = 0;
        this.state.currentPage = 1;
        this.state.scrollbarDragging = false;
        this.ui.filterTextField = null;
        this.ui.initializeTextField = true;

        this.state.isAutoScanning = false;
        if (this.state.autoScanTimeout) {
            clearTimeout(this.state.autoScanTimeout);
            this.state.autoScanTimeout = null;
        }

        this.ui.createButton = null;
        this.restoreAllKeybinds();
    }

    hideOverlay() {
        this.state.isActive = false;
        this.state.hoveredIndex = -1;
        this.state.selectedIndex = -1;
        this.state.scrollOffset = 0;
        this.state.isScanning = false;
        this.state.scrollbarDragging = false;
        this.ui.filterTextField = null;
        this.ui.initializeTextField = true;

        this.ui.dropdown.hide();
        this.restoreAllKeybinds();
    }
}

export { BaseInventoryCache, Input, Dropdown };
