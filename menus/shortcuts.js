/// <reference types="../CTAutocomplete" />

import { PREFIX, playFailSound } from "../utils/constants";
import { keybindManager } from "../utils/keybindConfig.js";

const SETTINGS_PATH =
    "config/ChatTriggers/modules/terraidk-qol/json/shortcutsettings.json";

function readSettings() {
    try {
        if (!FileLib.exists(SETTINGS_PATH)) return null;
        const content = FileLib.read(SETTINGS_PATH);
        if (!content || !content.trim()) return null;
        return JSON.parse(content);
    } catch (e) {
        ChatLib.chat(PREFIX + "§cFailed to load shortcut settings: " + e);
        return null;
    }
}

function writeSettings(settings) {
    try {
        const json = JSON.stringify(settings, null, 2);
        FileLib.write(SETTINGS_PATH, json);
    } catch (e) {
        ChatLib.chat(PREFIX + "§cFailed to save shortcut settings: " + e);
    }
}

function ensureSettingsFile(defaults) {
    if (!FileLib.exists(SETTINGS_PATH)) {
        writeSettings(defaults);
    }
}

var globalThis = this;

class WheelMenu {
    constructor() {
        this.isOpen = false;
        this.gui = null;
        this.buttons = [];
        this.title = "Custom Menu";
        this.selectedButton = -1;
        this.radius = 150;
        this.sliceSegments = 32;
        this.buttonStates = {};
        this.loadButtonStates();
    }

    loadButtonStates() {
        const loaded = readSettings();
        if (loaded && typeof loaded === "object") {
            this.buttonStates = loaded;
        } else {
            // fallback to defaults if file is missing or invalid
            this.buttonStates = {
                Functions: true,
                Commands: true,
                Regions: true,
                Menus: true,
                "Go To Last": true,
                Layouts: true,
                Scoreboard: true,
                Teams: true,
                "Event Actions": true,
            };
        }
    }

    saveButtonStates() {
        writeSettings(this.buttonStates);
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    addButton(text, description, callback, color = null, icon = null) {
        this.buttons.push({ text, description, callback, color, icon });
        return this;
    }

    clearButtons() {
        this.buttons.length = 0;
        return this;
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;
        this.selectedButton = -1;
        const gui = new Gui();
        gui.registerDraw(() => {
            if (!this.isOpen) return;
            const screenWidth = Renderer.screen.getWidth();
            const screenHeight = Renderer.screen.getHeight();
            const centerX = screenWidth / 2;
            const centerY = screenHeight / 2;
            const mouseX = Client.getMouseX();
            const mouseY = Client.getMouseY();
            Renderer.drawRect(0xe0000000, 0, 0, screenWidth, screenHeight);
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            let mouseAngle = Math.atan2(dy, dx);
            let hoveredButton = null;
            const buttonCount = this.buttons.length;
            const anglePerButton =
                buttonCount > 0 ? (Math.PI * 2) / buttonCount : Math.PI * 2;
            const startAngle = -Math.PI / 2;
            const innerRadius = 60;
            const outerRadius = this.radius;
            if (buttonCount === 1) {
                if (
                    distanceFromCenter >= innerRadius &&
                    distanceFromCenter <= outerRadius
                ) {
                    this.selectedButton = 0;
                } else {
                    this.selectedButton = -1;
                }
            }
            this.buttons.forEach((button, index) => {
                const buttonAngle = startAngle + anglePerButton * index;
                const buttonEndAngle = buttonAngle + anglePerButton;
                const fillColor =
                    ((button.color ?? 0xff404040) & 0x00ffffff) | 0xff000000;
                let isHovered = false;
                if (
                    distanceFromCenter >= innerRadius &&
                    distanceFromCenter <= outerRadius
                ) {
                    let normalizedMouseAngle = mouseAngle;
                    let normalizedStartAngle = buttonAngle;
                    let normalizedEndAngle = buttonEndAngle;
                    while (normalizedMouseAngle < 0)
                        normalizedMouseAngle += Math.PI * 2;
                    while (normalizedStartAngle < 0)
                        normalizedStartAngle += Math.PI * 2;
                    while (normalizedEndAngle < 0)
                        normalizedEndAngle += Math.PI * 2;
                    if (normalizedEndAngle < normalizedStartAngle) {
                        normalizedEndAngle += Math.PI * 2;
                        if (normalizedMouseAngle < normalizedStartAngle) {
                            normalizedMouseAngle += Math.PI * 2;
                        }
                    }
                    isHovered =
                        normalizedMouseAngle >= normalizedStartAngle &&
                        normalizedMouseAngle <= normalizedEndAngle;
                }
                if (button._hoverProgress === undefined)
                    button._hoverProgress = 0;
                const speed = 0.18;
                button._hoverProgress +=
                    (isHovered ? 1 : 0 - button._hoverProgress) * speed;
                if (button._hoverProgress < 0.01) button._hoverProgress = 0;
                if (button._hoverProgress > 0.99) button._hoverProgress = 1;
                let drawOuterRadius = outerRadius + 10 * button._hoverProgress;
                if (button._hoverProgress > 0.01) {
                    hoveredButton = button;
                    if (isHovered) this.selectedButton = index;
                }
                const segments = this.sliceSegments;
                const angleStep = (buttonEndAngle - buttonAngle) / segments;
                for (let i = 0; i < segments; i++) {
                    const a1 = buttonAngle + angleStep * i;
                    const a2 = buttonAngle + angleStep * (i + 1);
                    const x1 = centerX + Math.cos(a1) * drawOuterRadius;
                    const y1 = centerY + Math.sin(a1) * drawOuterRadius;
                    const x2 = centerX + Math.cos(a2) * drawOuterRadius;
                    const y2 = centerY + Math.sin(a2) * drawOuterRadius;
                    const x3 = centerX + Math.cos(a1) * innerRadius;
                    const y3 = centerY + Math.sin(a1) * innerRadius;
                    const x4 = centerX + Math.cos(a2) * innerRadius;
                    const y4 = centerY + Math.sin(a2) * innerRadius;
                    Renderer.drawShape(fillColor, [x1, y1], [x2, y2], [x3, y3]);
                    Renderer.drawShape(fillColor, [x2, y2], [x4, y4], [x3, y3]);
                }
                if (button._hoverProgress > 0.01) {
                    const highlightAlpha = Math.floor(
                        0x40 * button._hoverProgress
                    );
                    const highlightColor = (highlightAlpha << 24) | 0xffffff;
                    for (let i = 0; i < segments; i++) {
                        const a1 = buttonAngle + angleStep * i;
                        const a2 = buttonAngle + angleStep * (i + 1);
                        const x1 = centerX + Math.cos(a1) * drawOuterRadius;
                        const y1 = centerY + Math.sin(a1) * drawOuterRadius;
                        const x2 = centerX + Math.cos(a2) * drawOuterRadius;
                        const y2 = centerY + Math.sin(a2) * drawOuterRadius;
                        const x3 = centerX + Math.cos(a1) * innerRadius;
                        const y3 = centerY + Math.sin(a1) * innerRadius;
                        const x4 = centerX + Math.cos(a2) * innerRadius;
                        const y4 = centerY + Math.sin(a2) * innerRadius;
                        Renderer.drawShape(
                            highlightColor,
                            [x1, y1],
                            [x2, y2],
                            [x3, y3]
                        );
                        Renderer.drawShape(
                            highlightColor,
                            [x2, y2],
                            [x4, y4],
                            [x3, y3]
                        );
                    }
                }
                const midAngle = buttonAngle + anglePerButton / 2;
                const textRadius = (innerRadius + outerRadius) / 2;
                const textX = centerX + Math.cos(midAngle) * textRadius;
                const textY = centerY + Math.sin(midAngle) * textRadius;
                const lines = button.text.split("\n");
                const iconSize = 16;
                const iconPadding = 4;
                const totalHeight = button.icon
                    ? iconSize + iconPadding + lines.length * 10
                    : lines.length * 10;
                let currentY = textY - totalHeight / 2;
                if (button.icon) {
                    const iconX = textX - iconSize / 2;
                    const iconY = currentY;
                    try {
                        new Item(button.icon).draw(iconX, iconY);
                    } catch (e) {}
                    currentY += iconSize + iconPadding;
                }
                lines.forEach((line) => {
                    const textWidth = Renderer.getStringWidth(line);
                    const textColor = isHovered ? "§e" : "§f";
                    Renderer.drawStringWithShadow(
                        textColor + line,
                        textX - textWidth / 2,
                        currentY
                    );
                    currentY += 10;
                });
            });
            const titleWidth = Renderer.getStringWidth(this.title);
            Renderer.drawStringWithShadow(
                "§f" + this.title,
                centerX - titleWidth / 2,
                centerY - 6
            );
            if (hoveredButton && hoveredButton.description) {
                this.drawTooltip(
                    hoveredButton.description,
                    mouseX,
                    mouseY,
                    screenWidth,
                    screenHeight
                );
            }
            const instructions =
                "ESC or click outside the wheel to close • Report bugs to terraidk on Discord";
            const instrX =
                (screenWidth - Renderer.getStringWidth(instructions)) / 2;
            const instrY = screenHeight - 40;
            Renderer.drawStringWithShadow("§7" + instructions, instrX, instrY);
            const cautionText =
                "§eNOTE: The speed of the buttons is dependant on your ping!";
            const cautionX =
                (screenWidth - Renderer.getStringWidth(cautionText)) / 2;
            const cautionY = screenHeight - 25;
            Renderer.drawStringWithShadow(cautionText, cautionX, cautionY);
            // RPC toggle
            const rpcWidth = 50;
            const rpcHeight = 22;
            const rpcX = 20;
            const rpcY = screenHeight - rpcHeight - 20;
            Renderer.drawRect(
                0xff111111,
                rpcX - 2,
                rpcY - 2,
                rpcWidth + 4,
                rpcHeight + 4
            );
            Renderer.drawRect(0xff212121, rpcX, rpcY, rpcWidth, rpcHeight);
            const rpcEnabled =
                typeof globalThis.discordRPCControl !== "undefined" &&
                typeof globalThis.discordRPCControl.isEnabled === "function"
                    ? globalThis.discordRPCControl.isEnabled()
                    : true;
            const rpcLabelColor = rpcEnabled ? "§a" : "§c";
            Renderer.drawStringWithShadow(
                rpcLabelColor + "RPC",
                rpcX + 8,
                rpcY + 8
            );
            const rpcIndicatorSize = 10;
            const rpcIndicatorX = rpcX + rpcWidth - 18;
            const rpcIndicatorY = rpcY + (rpcHeight - rpcIndicatorSize) / 2;
            const rpcIndicatorColor = rpcEnabled ? 0xff2e7d32 : 0xffe74c3c;
            Renderer.drawRect(
                rpcIndicatorColor,
                rpcIndicatorX,
                rpcIndicatorY,
                rpcIndicatorSize,
                rpcIndicatorSize
            );
            if (
                mouseX >= rpcX &&
                mouseX <= rpcX + rpcWidth &&
                mouseY >= rpcY &&
                mouseY <= rpcY + rpcHeight
            ) {
                this.drawTooltip(
                    rpcEnabled
                        ? "Click to disable TQoL Discord RPC"
                        : "Click to enable TQoL Discord RPC",
                    mouseX,
                    mouseY,
                    screenWidth,
                    screenHeight
                );
            }
            this.drawSideMenu(screenWidth, screenHeight, mouseX, mouseY);
        });
        gui.registerClicked((mouseX, mouseY, button) => {
            const screenWidth = Renderer.screen.getWidth();
            const screenHeight = Renderer.screen.getHeight();
            const centerX = screenWidth / 2;
            const centerY = screenHeight / 2;
            const rpcWidth = 50;
            const rpcHeight = 22;
            const rpcX = 20;
            const rpcY = screenHeight - rpcHeight - 20;
            const rpcClicked =
                mouseX >= rpcX &&
                mouseX <= rpcX + rpcWidth &&
                mouseY >= rpcY &&
                mouseY <= rpcY + rpcHeight;
            let inSideMenu = false;
            if (this._sideMenuRect) {
                const { x, y, w, h } = this._sideMenuRect;
                inSideMenu =
                    mouseX >= x &&
                    mouseX <= x + w &&
                    mouseY >= y &&
                    mouseY <= y + h;
            }
            if (rpcClicked) {
                if (typeof globalThis.discordRPCControl === "undefined") {
                    ChatLib.chat(
                        PREFIX + "§cDiscord RPC control not available"
                    );
                } else {
                    globalThis.discordRPCControl.toggle();
                }
                return;
            }
            if (button !== 0) return;
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            const innerRadius = 60;
            const outerRadius = this.radius;
            if (distanceFromCenter < innerRadius) {
                return;
            } else if (distanceFromCenter <= outerRadius) {
                if (
                    this.selectedButton >= 0 &&
                    this.selectedButton < this.buttons.length
                ) {
                    this.executeButton(this.selectedButton);
                    this.close();
                }
            } else if (inSideMenu) {
                this.handleSideMenuClick(
                    mouseX,
                    mouseY,
                    screenWidth,
                    screenHeight
                );
                return;
            } else {
                this.close();
            }
        });
        gui.registerKeyTyped((char, keyCode) => {
            if (keyCode === 1) {
                this.close();
            }
        });
        gui.open();
        this.gui = gui;
    }

    executeButton(index) {
        if (index >= 0 && index < this.buttons.length) {
            const button = this.buttons[index];
            if (button.callback) {
                try {
                    button.callback();
                } catch (e) {
                    ChatLib.chat(
                        PREFIX + "§cError executing function: " + e.message
                    );
                }
            }
        }
    }

    close() {
        if (this.gui) {
            this.gui.close();
        }
        this.isOpen = false;
        this.gui = null;
        this.selectedButton = -1;
    }

    refresh() {
        if (this.isOpen && this.gui) {
            this.gui.close();
            this.isOpen = false;
            this.gui = null;
            this.open();
        }
    }

    drawTooltip(text, mouseX, mouseY, screenWidth, screenHeight) {
        const lines = text.split("\n");
        const maxWidth = Math.max(
            ...lines.map((line) => Renderer.getStringWidth(line))
        );
        const tooltipWidth = maxWidth + 12;
        const tooltipHeight = lines.length * 12 + 8;

        let tooltipX = mouseX + 15;
        let tooltipY = mouseY - 10;

        if (tooltipX + tooltipWidth > screenWidth)
            tooltipX = mouseX - tooltipWidth - 15;
        if (tooltipY < 0) tooltipY = mouseY + 25;
        if (tooltipY + tooltipHeight > screenHeight)
            tooltipY = screenHeight - tooltipHeight - 5;

        Renderer.drawRect(
            0xff000000,
            tooltipX - 2,
            tooltipY - 2,
            tooltipWidth + 4,
            tooltipHeight + 4
        );
        Renderer.drawRect(
            0xff2c2c2c,
            tooltipX,
            tooltipY,
            tooltipWidth,
            tooltipHeight
        );

        lines.forEach((line, index) => {
            Renderer.drawStringWithShadow(
                "§f" + line,
                tooltipX + 6,
                tooltipY + 4 + index * 12
            );
        });
    }

    drawSideMenu(screenWidth, screenHeight, mouseX, mouseY) {
        if (this.title && this.title.toLowerCase().includes("go to last"))
            return;

        const toggleWidth = 50;
        const toggleHeight = 22;
        const fontSize = Math.max(11, Math.floor(screenHeight / 72));
        const rowHeight = Math.max(16, Math.floor(screenHeight / 48));
        const menuPadding = Math.max(8, Math.floor(screenHeight / 108));

        let maxKeyWidth = 0;
        Object.keys(this.buttonStates).forEach((key) => {
            if (key === "Go To Last") return;
            const width = Renderer.getStringWidth(key);
            if (width > maxKeyWidth) maxKeyWidth = width;
        });
        const menuWidth = Math.max(120, maxKeyWidth + 60);
        const buttonCount = Object.keys(this.buttonStates).filter(
            (k) => k !== "Go To Last"
        ).length;
        const menuHeight = menuPadding * 2 + fontSize + buttonCount * rowHeight;

        // Place menu bottom right
        const menuX = screenWidth - menuWidth - 20;
        const menuY = screenHeight - menuHeight - 20;

        // Draw background
        Renderer.drawRect(0xcc181818, menuX, menuY, menuWidth, menuHeight);
        Renderer.drawRect(
            0x80181818,
            menuX - 3,
            menuY - 3,
            menuWidth + 6,
            menuHeight + 6
        );

        const toggleText = "§bToggle";
        const toggleTextWidth = Renderer.getStringWidth("Toggle");
        Renderer.drawStringWithShadow(
            toggleText,
            menuX + (menuWidth - toggleTextWidth) / 2,
            menuY + menuPadding - 2
        );
        let y = menuY + menuPadding + fontSize;
        Object.keys(this.buttonStates).forEach((key, idx) => {
            if (key === "Go To Last") return;
            const enabled = this.buttonStates[key];

            if (
                mouseX >= menuX &&
                mouseX <= menuX + menuWidth &&
                mouseY >= y - 3 &&
                mouseY <= y + rowHeight - 5
            ) {
                Renderer.drawRect(
                    0x402e7d32,
                    menuX,
                    y - 3,
                    menuWidth,
                    rowHeight - 1
                );
            }
            Renderer.drawStringWithShadow("§7" + key, menuX + menuPadding, y);
            const label = enabled ? "§a✔" : "§c✖";
            Renderer.drawStringWithShadow(
                label,
                menuX + menuWidth - menuPadding - 14,
                y
            );
            y += rowHeight;
        });

        this._sideMenuRect = {
            x: menuX,
            y: menuY,
            w: menuWidth,
            h: menuHeight,
        };
    }

    handleSideMenuClick(mouseX, mouseY, screenWidth, screenHeight) {
        const fontSize = Math.max(11, Math.floor(screenHeight / 72));
        const rowHeight = Math.max(16, Math.floor(screenHeight / 48));
        const menuPadding = Math.max(8, Math.floor(screenHeight / 108));
        let maxKeyWidth = 0;
        Object.keys(this.buttonStates).forEach((key) => {
            if (key === "Go To Last") return;
            const width = Renderer.getStringWidth(key);
            if (width > maxKeyWidth) maxKeyWidth = width;
        });
        const menuWidth = Math.max(120, maxKeyWidth + 60);
        const buttonCount = Object.keys(this.buttonStates).filter(
            (k) => k !== "Go To Last"
        ).length;
        const menuHeight = menuPadding * 2 + fontSize + buttonCount * rowHeight;

        const menuX = screenWidth - menuWidth - 20;
        const menuY = screenHeight - menuHeight - 20;

        let y = menuY + menuPadding + fontSize;
        let toggled = false;
        Object.keys(this.buttonStates).forEach((key, idx) => {
            if (key === "Go To Last") return;
            if (
                mouseX >= menuX &&
                mouseX <= menuX + menuWidth &&
                mouseY >= y - 3 &&
                mouseY <= y + rowHeight - 5
            ) {
                this.buttonStates[key] = !this.buttonStates[key];
                toggled = true;
            }
            y += rowHeight;
        });
        if (toggled) {
            this.saveButtonStates();
            this.clearButtons();
            const mainButtons = [
                {
                    key: "Functions",
                    text: "Functions",
                    description: "Opens the Functions menu",
                    callback: () => {
                        ChatLib.command("functions");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Functions&f...");
                        this.close();
                    },
                    color: 0xffc62828,
                    icon: "minecraft:activator_rail",
                },
                {
                    key: "Commands",
                    text: "Commands",
                    description: "Opens the Commands menu",
                    callback: () => {
                        ChatLib.command("commands");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Commands&f...");
                        this.close();
                    },
                    color: 0xfff57c00,
                    icon: "minecraft:command_block",
                },
                {
                    key: "Regions",
                    text: "Regions",
                    description: "Opens the Regions menu",
                    callback: () => {
                        ChatLib.command("regions");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Regions&f...");
                        this.close();
                    },
                    color: 0xff388e3c,
                    icon: "minecraft:grass",
                },
                {
                    key: "Menus",
                    text: "Menus",
                    description: "Opens the Custom Menus menu",
                    callback: () => {
                        ChatLib.command("menus");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Menus&f...");
                        this.close();
                    },
                    color: 0xff6d4c41,
                    icon: "minecraft:chest",
                },
                {
                    key: "Go To Last",
                    text: "Go To\nLast",
                    description:
                        "Quick access to your last opened items\nFunctions, Commands, Regions, and Menus",
                    callback: () => {
                        World.playSound("random.click", 0.7, 1.0);
                        setTimeout(() => {
                            showGoToLastMenu();
                            this.open();
                        }, 50);
                        this.close();
                    },
                    color: 0xff424242,
                    icon: "minecraft:compass",
                },
                {
                    key: "Layouts",
                    text: "Layouts",
                    description: "Opens the Layouts menu",
                    callback: () => {
                        ChatLib.command("layouts");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Layouts&f...");
                        this.close();
                    },
                    color: 0xff1565c0,
                    icon: "minecraft:iron_axe",
                },
                {
                    key: "Scoreboard",
                    text: "Scoreboard",
                    description: "Opens the Scoreboard Editor",
                    callback: () => {
                        ChatLib.command("scoreboard");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Scoreboard&f...");
                        this.close();
                    },
                    color: 0xff6a1b9a,
                    icon: "minecraft:filled_map",
                },
                {
                    key: "Teams",
                    text: "Teams",
                    description: "Opens the Teams menu",
                    callback: () => {
                        ChatLib.command("teams");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Teams&f...");
                        this.close();
                    },
                    color: 0xff00838f,
                    icon: "minecraft:sign",
                },
                {
                    key: "Event Actions",
                    text: "Event\nActions",
                    description: "Opens the Event Actions menu",
                    callback: () => {
                        ChatLib.command("eventactions");
                        World.playSound("note.bassattack", 0.7, 2.0);
                        ChatLib.chat(PREFIX + "Opening &6Event Actions&f...");
                        this.close();
                    },
                    color: 0xffcfabf7,
                    icon: "minecraft:web",
                },
            ];
            mainButtons.forEach((btn) => {
                if (this.buttonStates[btn.key]) {
                    this.addButton(
                        btn.text,
                        btn.description,
                        (...args) => {
                            btn.callback(...args);
                            this.close();
                        },
                        btn.color,
                        btn.icon
                    );
                }
            });
        }
    }

    reloadSettings() {
        this.loadButtonStates();
        this.refresh();
    }
}

let lastOpenedFunction = null;
let lastOpenedCommand = null;
let lastOpenedRegion = null;
let lastOpenedMenu = null;

function getChestTitle(guiScreen) {
    let title = null;

    try {
        if (guiScreen.getTitle && guiScreen.getTitle()) {
            const titleComponent = guiScreen.getTitle();
            if (titleComponent.getFormattedText) {
                title = titleComponent.getFormattedText();
            } else if (titleComponent.getUnformattedText) {
                title = titleComponent.getUnformattedText();
            } else if (titleComponent.toString) {
                title = titleComponent.toString();
            }
        }
    } catch (e) {}

    if (!title) {
        try {
            if (guiScreen.inventoryTitle) {
                title = guiScreen.inventoryTitle;
            }
        } catch (e) {}
    }

    if (!title) {
        try {
            const container = Player.getContainer();
            if (container && container.getName) {
                title = container.getName();
            }
        } catch (e) {}
    }

    if (!title) {
        try {
            const inventory = Player.getOpenedInventory();
            if (inventory && inventory.getName) {
                title = inventory.getName();
            }
        } catch (e) {}
    }

    return title;
}

register("guiOpened", (guiEvent) => {
    const guiScreen = guiEvent.gui;
    if (!guiScreen) return;

    const className = guiScreen.getClass().getSimpleName();
    if (className !== "GuiChest") return;

    setTimeout(() => {
        const title = getChestTitle(guiScreen);
        if (!title) return;

        if (title.includes("Actions: ")) {
            if (title.includes("Actions: /")) {
                const commandName = title.split("Actions: /")[1];
                lastOpenedCommand = commandName;
            } else {
                const functionName = title.split("Actions: ")[1];
                lastOpenedFunction = functionName;
            }
        } else if (title.startsWith("Edit ") && title.endsWith(" Region")) {
            const regionName = title.substring(5, title.length - 7);
            lastOpenedRegion = regionName;
        } else if (title.startsWith("Edit Menu: ")) {
            const menuName = title.substring(11);
            lastOpenedMenu = menuName;
        }
    }, 50);
});

const wheelMenu = new WheelMenu();

function showMainMenu() {
    // Button definitions
    const mainButtons = [
        {
            key: "Functions",
            text: "Functions",
            description: "Opens the Functions menu",
            callback: () => {
                ChatLib.command("functions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Functions&f...");
                wheelMenu.close();
            },
            color: 0xffc62828,
            icon: "minecraft:activator_rail",
        },
        {
            key: "Commands",
            text: "Commands",
            description: "Opens the Commands menu",
            callback: () => {
                ChatLib.command("commands");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Commands&f...");
                wheelMenu.close();
            },
            color: 0xfff57c00,
            icon: "minecraft:command_block",
        },
        {
            key: "Regions",
            text: "Regions",
            description: "Opens the Regions menu",
            callback: () => {
                ChatLib.command("regions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Regions&f...");
                wheelMenu.close();
            },
            color: 0xff388e3c,
            icon: "minecraft:grass",
        },
        {
            key: "Menus",
            text: "Menus",
            description: "Opens the Custom Menus menu",
            callback: () => {
                ChatLib.command("menus");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Menus&f...");
                wheelMenu.close();
            },
            color: 0xff6d4c41,
            icon: "minecraft:chest",
        },
        {
            key: "Go To Last",
            text: "Go To\nLast",
            description:
                "Quick access to your last opened items\nFunctions, Commands, Regions, and Menus",
            callback: () => {
                World.playSound("random.click", 0.7, 1.0);
                wheelMenu.close();
                setTimeout(() => {
                    showGoToLastMenu();
                    wheelMenu.open();
                }, 50);
            },
            color: 0xff424242,
            icon: "minecraft:compass",
        },
        {
            key: "Layouts",
            text: "Layouts",
            description: "Opens the Layouts menu",
            callback: () => {
                ChatLib.command("layouts");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Layouts&f...");
                wheelMenu.close();
            },
            color: 0xff1565c0,
            icon: "minecraft:iron_axe",
        },
        {
            key: "Scoreboard",
            text: "Scoreboard",
            description: "Opens the Scoreboard Editor",
            callback: () => {
                ChatLib.command("scoreboard");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Scoreboard&f...");
                wheelMenu.close();
            },
            color: 0xff6a1b9a,
            icon: "minecraft:filled_map",
        },
        {
            key: "Teams",
            text: "Teams",
            description: "Opens the Teams menu",
            callback: () => {
                ChatLib.command("teams");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Teams&f...");
                wheelMenu.close();
            },
            color: 0xff00838f,
            icon: "minecraft:sign",
        },
        {
            key: "Event Actions",
            text: "Event\nActions",
            description: "Opens the Event Actions menu",
            callback: () => {
                ChatLib.command("eventactions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Event Actions&f...");
                wheelMenu.close();
            },
            color: 0xffcfabf7,
            icon: "minecraft:web",
        },
    ];

    // Initialize buttonStates
    if (Object.keys(wheelMenu.buttonStates).length === 0) {
        mainButtons.forEach((btn) => {
            wheelMenu.buttonStates[btn.key] = true;
        });
        wheelMenu.saveButtonStates();
    }

    wheelMenu.clearButtons().setTitle(PREFIX + "Shortcuts");
    mainButtons.forEach((btn) => {
        if (btn.key === "Go To Last" || wheelMenu.buttonStates[btn.key]) {
            wheelMenu.addButton(
                btn.text,
                btn.description,
                btn.callback,
                btn.color,
                btn.icon
            );
        }
    });
}

function showGoToLastMenu() {
    wheelMenu
        .clearButtons()
        .setTitle(PREFIX + "Go To Last")
        .addButton(
            "Last Function",
            "Go to the last function you worked on\nOpens function edit menu",
            () => {
                if (lastOpenedFunction) {
                    ChatLib.command(`function edit ${lastOpenedFunction}`);
                    World.playSound("note.bassattack", 0.7, 2.0);
                    ChatLib.chat(
                        PREFIX +
                            "§aReturning to last opened §6Function§a: §b" +
                            lastOpenedFunction
                    );
                    wheelMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo function has been opened yet!");
                }
            },
            0xffc62828,
            "minecraft:activator_rail"
        )
        .addButton(
            "Last Region",
            "Go to the last region you worked on\nOpens region edit menu",
            () => {
                if (lastOpenedRegion) {
                    ChatLib.command(`region edit ${lastOpenedRegion}`);
                    World.playSound("note.bassattack", 0.7, 2.0);
                    ChatLib.chat(
                        PREFIX +
                            "§aReturning to last opened §6Region§a: §b" +
                            lastOpenedRegion
                    );
                    wheelMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo region has been opened yet!");
                }
            },
            0xff388e3c,
            "minecraft:grass"
        )
        .addButton(
            "Back to Main Menu",
            "Go back to the main grid menu\nReturn to previous screen",
            () => {
                World.playSound("random.click", 0.7, 1.0);
                wheelMenu.close();
                setTimeout(() => {
                    showMainMenu();
                    wheelMenu.open();
                }, 50);
            },
            0xff424242,
            "minecraft:arrow"
        )
        .addButton(
            "Last Menu",
            "Go to the last menu you worked on\nOpens menu edit interface",
            () => {
                if (lastOpenedMenu) {
                    ChatLib.command(`menu edit ${lastOpenedMenu}`);
                    World.playSound("note.bassattack", 0.7, 2.0);
                    ChatLib.chat(
                        PREFIX +
                            "§aReturning to last opened §6Menu§a: §b" +
                            lastOpenedMenu
                    );
                    wheelMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo menu has been opened yet!");
                }
            },
            0xff6d4c41,
            "minecraft:chest"
        )
        .addButton(
            "Last Command",
            "Go to the last command you worked on\nOpens command actions menu",
            () => {
                if (lastOpenedCommand) {
                    ChatLib.command(`command actions ${lastOpenedCommand}`);
                    World.playSound("note.bassattack", 0.7, 2.0);
                    ChatLib.chat(
                        PREFIX +
                            "§aReturning to last opened §6Command§a: §b" +
                            lastOpenedCommand
                    );
                    wheelMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo command has been opened yet!");
                }
            },
            0xfff57c00,
            "minecraft:command_block"
        );
}

const gridMenuKeybind = keybindManager.getKeybind("shortcutMenu");
const goToLastMenuKeybind = keybindManager.getKeybind("goToLastShortcut");

let prevGridMenuState = false;
let prevGoToLastMenuState = false;

register("tick", () => {
    const currentState = gridMenuKeybind.func_151470_d();
    const currentGui = Client.currentGui.get();
    if (currentState && !prevGridMenuState) {
        if (
            currentGui &&
            (currentGui instanceof
                Java.type("net.minecraft.client.gui.GuiChat") ||
                currentGui.toString().includes("GuiChat"))
        ) {
            prevGridMenuState = currentState;
            return;
        }
        if (wheelMenu.isOpen) {
            wheelMenu.close();
        } else {
            showMainMenu();
            wheelMenu.open();
        }
    }
    prevGridMenuState = currentState;
});

register("tick", () => {
    const currentState = goToLastMenuKeybind.func_151470_d();
    const currentGui = Client.currentGui.get();
    if (currentState && !prevGoToLastMenuState) {
        if (
            currentGui &&
            (currentGui instanceof
                Java.type("net.minecraft.client.gui.GuiChat") ||
                currentGui.toString().includes("GuiChat"))
        ) {
            prevGoToLastMenuState = currentState;
            return;
        }
        if (wheelMenu.isOpen) {
            wheelMenu.close();
        } else {
            showGoToLastMenu();
            wheelMenu.open();
        }
    }
    prevGoToLastMenuState = currentState;
});
