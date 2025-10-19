/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants";
import { keybindManager } from "../utils/keybindConfig.js";

var GLOBAL =
    typeof globalThis !== "undefined"
        ? globalThis
        : typeof global !== "undefined"
        ? global
        : typeof window !== "undefined"
        ? window
        : typeof self !== "undefined"
        ? self
        : this;
var globalThis = GLOBAL;

// Java type imports
if (typeof Keyboard === "undefined") {
    var Keyboard = Java.type("org.lwjgl.input.Keyboard");
}
if (typeof GuiScreen === "undefined") {
    var GuiScreen = Java.type("net.minecraft.client.gui.GuiScreen");
}
if (typeof ChatLib === "undefined")
    ChatLib = Java.type("com.chattriggers.ctjs.api.ChatLib");
if (typeof Player === "undefined") {
    var Player = Java.type("com.chattriggers.ctjs.minecraft.wrappers.Player");
}

class GridMenu {
    constructor() {
        this.isOpen = false;
        this.gui = null;
        this.buttons = [];
        this.title = "Custom Menu";
        this.selectedButton = -1;
        this.columns = 2; // Number of columns in the grid

        this.colors = {
            background: 0xc0000000, // Semi-transparent black
            menuBg: 0xff2c2c2c, // Dark gray menu background
            menuBorder: 0xff000000, // Black border
            buttonNormal: 0xff404040, // Normal button color
            buttonHover: 0xff505050, // Hovered button color
            buttonSelected: 0xff606060, // Selected button color
            buttonBorder: 0xff404040, // Same as button color (no outline)
            textNormal: "§f", // White text (Minecraft color code)
            textHover: "§e", // Yellow text on hover
            textSelected: "§a", // Green text when selected
        };

        this.toggle = {
            width: 50,
            height: 22,
            x: 0,
            y: 0,
            hovered: false,
        };
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    setColumns(cols) {
        this.columns = cols;
        return this;
    }

    addButton(text, description, callback, color = null) {
        this.buttons.push({
            text: text,
            description: description,
            callback: callback,
            color: color || this.colors.buttonNormal,
            hovered: false,
            x: 0,
            y: 0,
            width: 0,
            height: 0, // Will be calculated
        });
        return this;
    }

    clearButtons() {
        this.buttons = [];
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

            // Draw background overlay
            Renderer.drawRect(
                this.colors.background,
                0,
                0,
                screenWidth,
                screenHeight
            );

            // Calculate grid dimensions
            const buttonWidth = 160;
            const buttonHeight = 50;
            const buttonSpacing = 15;
            const padding = 30;
            const titleHeight = 25;

            const rows =
                this.buttons.length === 7
                    ? 4
                    : this.buttons.length === 5
                    ? 3
                    : Math.ceil(this.buttons.length / this.columns);

            const menuWidth =
                this.columns * buttonWidth +
                (this.columns - 1) * buttonSpacing +
                padding * 2;
            const menuHeight =
                titleHeight +
                padding * 2 +
                rows * buttonHeight +
                (rows - 1) * buttonSpacing;

            const menuX = (screenWidth - menuWidth) / 2;
            const menuY = (screenHeight - menuHeight) / 2;

            // Draw menu background
            Renderer.drawRect(
                this.colors.menuBorder,
                menuX - 3,
                menuY - 3,
                menuWidth + 6,
                menuHeight + 6
            );
            Renderer.drawRect(
                this.colors.menuBg,
                menuX,
                menuY,
                menuWidth,
                menuHeight
            );

            const titleX =
                menuX + (menuWidth - Renderer.getStringWidth(this.title)) / 2;
            Renderer.drawStringWithShadow(
                this.colors.textNormal + this.title,
                titleX,
                menuY + 10
            );

            // Draw buttons in grid
            const startY = menuY + titleHeight + padding;
            const startX = menuX + padding;
            const mouseX = Client.getMouseX();
            const mouseY = Client.getMouseY();

            let hoveredButton = null;

            this.buttons.forEach((button, index) => {
                let col, row;
                if (this.buttons.length === 8) {
                    col = index % this.columns;
                    row = Math.floor(index / this.columns);
                } else if (this.buttons.length === 7) {
                    if (index < 6) {
                        col = index % this.columns;
                        row = Math.floor(index / this.columns);
                    } else {
                        col = 0.5;
                        row = 3;
                    }
                } else if (this.buttons.length === 5) {
                    if (index < 4) {
                        col = index % this.columns;
                        row = Math.floor(index / this.columns);
                    } else {
                        col = 0.5;
                        row = 2;
                    }
                } else {
                    col = index % this.columns;
                    row = Math.floor(index / this.columns);
                }

                const buttonX = startX + col * (buttonWidth + buttonSpacing);
                const buttonY = startY + row * (buttonHeight + buttonSpacing);

                // Update button bounds for click detection
                button.x = buttonX;
                button.y = buttonY;
                button.width = buttonWidth;
                button.height = buttonHeight;

                // Check if mouse is hovering
                button.hovered =
                    mouseX >= buttonX &&
                    mouseX <= buttonX + buttonWidth &&
                    mouseY >= buttonY &&
                    mouseY <= buttonY + buttonHeight;

                // Track hovered button for tooltip
                if (button.hovered) hoveredButton = button;

                let bgColor = button.color;
                let textColorCode = this.colors.textNormal;
                let borderColor = button.color;

                if (index === this.selectedButton) {
                    bgColor = this.colors.buttonSelected;
                    textColorCode = this.colors.textSelected;
                    borderColor = 0xff00ff00;
                } else if (button.hovered) {
                    bgColor = this.colors.buttonHover;
                    textColorCode = this.colors.textHover;
                    borderColor = 0xffffff00;
                }

                const borderThickness = 2;
                Renderer.drawRect(
                    borderColor,
                    buttonX - borderThickness,
                    buttonY - borderThickness,
                    buttonWidth + borderThickness * 2,
                    buttonHeight + borderThickness * 2
                );
                Renderer.drawRect(
                    bgColor,
                    buttonX,
                    buttonY,
                    buttonWidth,
                    buttonHeight
                );

                Renderer.drawRect(
                    0x30ffffff,
                    buttonX,
                    buttonY,
                    buttonWidth,
                    buttonHeight / 3
                );

                const lines = button.text.split("\n");
                const totalTextHeight = lines.length * 10;
                let textStartY = buttonY + (buttonHeight - totalTextHeight) / 2;

                lines.forEach((line, lineIndex) => {
                    const cleanLine = line.replace(/§[0-9a-fk-or]/g, "");
                    const coloredLine = textColorCode + cleanLine;

                    const textWidth = Renderer.getStringWidth(cleanLine);
                    const textX = buttonX + (buttonWidth - textWidth) / 2;
                    const textY = textStartY + lineIndex * 12;

                    Renderer.drawStringWithShadow(coloredLine, textX, textY);
                });
            });

            // Draw tooltip for hovered button after all buttons are drawn
            if (hoveredButton && hoveredButton.description) {
                this.drawTooltip(
                    hoveredButton.description,
                    mouseX,
                    mouseY,
                    screenWidth,
                    screenHeight
                );
            }

            // Draw instructions
            const instructions =
                "ESC to close • Arrow keys to navigate • Enter to select • Report bugs to terraidk on Discord";
            const instrX =
                menuX + (menuWidth - Renderer.getStringWidth(instructions)) / 2;
            const instrY = menuY + menuHeight + 15;
            Renderer.drawStringWithShadow("§7" + instructions, instrX, instrY);

            const cautionText =
                "§eCAUTION: The speed of the buttons is dependant on your ping!";
            const cautionX =
                menuX + (menuWidth - Renderer.getStringWidth(cautionText)) / 2;
            const cautionY = menuY + menuHeight + 30;
            Renderer.drawStringWithShadow(cautionText, cautionX, cautionY);

            const toggleX = menuX + menuWidth - this.toggle.width - 12;
            const toggleY = menuY + menuHeight - this.toggle.height - 12;
            this.toggle.x = toggleX;
            this.toggle.y = toggleY;

            // Check hover for toggle
            this.toggle.hovered =
                mouseX >= toggleX &&
                mouseX <= toggleX + this.toggle.width &&
                mouseY >= toggleY &&
                mouseY <= toggleY + this.toggle.height;

            // Toggle background
            Renderer.drawRect(
                0xff111111,
                toggleX - 2,
                toggleY - 2,
                this.toggle.width + 4,
                this.toggle.height + 4
            );
            Renderer.drawRect(
                0xff212121,
                toggleX,
                toggleY,
                this.toggle.width,
                this.toggle.height
            );

            // Read current RPC state
            const rpcEnabled =
                typeof globalThis.discordRPCControl !== "undefined" &&
                typeof globalThis.discordRPCControl.isEnabled === "function"
                    ? globalThis.discordRPCControl.isEnabled()
                    : true;

            // Short label
            const label = rpcEnabled ? "RPC" : "RPC";
            const labelColor = rpcEnabled ? "§a" : "§c";
            Renderer.drawStringWithShadow(
                labelColor + label,
                toggleX + 8,
                toggleY + 8
            );

            const indicatorSize = 10;
            const indicatorX = toggleX + this.toggle.width - 18;
            const indicatorY =
                toggleY + (this.toggle.height - indicatorSize) / 2;
            const indicatorColor = rpcEnabled ? 0xff2e7d32 : 0xffe74c3c;
            Renderer.drawRect(
                indicatorColor,
                indicatorX,
                indicatorY,
                indicatorSize,
                indicatorSize
            );

            // Hover tooltip for toggle
            if (this.toggle.hovered) {
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
        });

        gui.registerClicked((mouseX, mouseY, button) => {
            // Calculate menu area
            const screenWidth = Renderer.screen.getWidth();
            const screenHeight = Renderer.screen.getHeight();
            const buttonWidth = 160;
            const buttonHeight = 50;
            const buttonSpacing = 15;
            const padding = 30;
            const titleHeight = 25;
            const rows =
                this.buttons.length === 7
                    ? 4
                    : this.buttons.length === 5
                    ? 3
                    : Math.ceil(this.buttons.length / this.columns);
            const menuWidth =
                this.columns * buttonWidth +
                (this.columns - 1) * buttonSpacing +
                padding * 2;
            const menuHeight =
                titleHeight +
                padding * 2 +
                rows * buttonHeight +
                (rows - 1) * buttonSpacing;

            const menuX = (screenWidth - menuWidth) / 2;
            const menuY = (screenHeight - menuHeight) / 2;

            // Check if click is inside menu area
            let insideMenu =
                mouseX >= menuX &&
                mouseX <= menuX + menuWidth &&
                mouseY >= menuY &&
                mouseY <= menuY + menuHeight;

            // Check if click is inside toggle area
            const toggleClicked =
                mouseX >= this.toggle.x &&
                mouseX <= this.toggle.x + this.toggle.width &&
                mouseY >= this.toggle.y &&
                mouseY <= this.toggle.y + this.toggle.height;

            if (toggleClicked) {
                // Toggle RPC setting
                if (typeof globalThis.discordRPCControl === "undefined") {
                    ChatLib.chat(PREFIX + "§cDiscord RPC control unavailable.");
                    World.playSound("note.bass", 0.7, 0.6);
                } else {
                    try {
                        globalThis.discordRPCControl.toggle();
                        World.playSound("random.click", 0.7, 1.0);
                    } catch (e) {
                        ChatLib.chat(
                            PREFIX + "§cFailed to toggle Discord RPC: " + e
                        );
                        World.playSound("note.bass", 0.7, 0.6);
                    }
                }
            }

            let clickedAny = false;
            this.buttons.forEach((btn, index) => {
                if (
                    mouseX >= btn.x &&
                    mouseX <= btn.x + btn.width &&
                    mouseY >= btn.y &&
                    mouseY <= btn.y + btn.height
                ) {
                    this.selectedButton = index;
                    btn.callback && btn.callback();
                    clickedAny = true;
                }
            });

            // Only close if click is OUTSIDE the menu
            if (!insideMenu && !toggleClicked) this.close();
        });

        gui.registerKeyTyped((char, keyCode) => {
            if (keyCode === 1) {
                // Escape
                this.close();
            } else if (keyCode === 200) {
                // Up arrow
                const newIndex = this.selectedButton - this.columns;
                this.selectedButton =
                    newIndex < 0 ? this.buttons.length - 1 : newIndex;
            } else if (keyCode === 208) {
                // Down arrow
                const newIndex = this.selectedButton + this.columns;
                this.selectedButton =
                    newIndex >= this.buttons.length ? 0 : newIndex;
            } else if (keyCode === 203) {
                // Left arrow
                this.selectedButton =
                    this.selectedButton <= 0
                        ? this.buttons.length - 1
                        : this.selectedButton - 1;
            } else if (keyCode === 205) {
                // Right arrow
                this.selectedButton =
                    this.selectedButton >= this.buttons.length - 1
                        ? 0
                        : this.selectedButton + 1;
            } else if (keyCode === 28) {
                // Enter
                if (
                    this.selectedButton >= 0 &&
                    this.selectedButton < this.buttons.length
                ) {
                    this.executeButton(this.selectedButton);
                }
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
}

let lastOpenedFunction = null;
let lastOpenedCommand = null;
let lastOpenedRegion = null;
let lastOpenedMenu = null;

// Function to get chest title
function getChestTitle(guiScreen) {
    let title = null;

    // Method 1: Try getTitle().getFormattedText()
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

    // Method 2: Try direct string access
    if (!title) {
        try {
            if (guiScreen.inventoryTitle) {
                title = guiScreen.inventoryTitle;
            }
        } catch (e) {}
    }

    // Method 3: Try accessing the container
    if (!title) {
        try {
            const container = Player.getContainer();
            if (container && container.getName) {
                title = container.getName();
            }
        } catch (e) {}
    }

    // Method 4: Use ChatTriggers' built-in Player.getOpenedInventory()
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

    // Add a small delay to ensure the GUI is fully loaded
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
            const menuName = title.substring(11); // "Edit Menu: ".length = 11
            lastOpenedMenu = menuName;
        }
    }, 50);
});

const gridMenu = new GridMenu();

function showMainMenu() {
    const rpcEnabled =
        typeof globalThis.discordRPCControl !== "undefined" &&
        globalThis.discordRPCControl.isEnabled()
            ? globalThis.discordRPCControl.isEnabled()
            : true;

    gridMenu
        .clearButtons()
        .setTitle(PREFIX + "Shortcut Menu")
        .setColumns(2)
        .addButton(
            "Functions",
            "Opens the /functions menu",
            () => {
                ChatLib.command("functions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Functions&f...");
                gridMenu.close();
            },
            0xffd32f2f
        )
        .addButton(
            "Commands",
            "Opens the /commands menu",
            () => {
                ChatLib.command("commands");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Commands&f...");
                gridMenu.close();
            },
            0xfff57f17
        )
        .addButton(
            "Regions",
            "Opens the /regions menu",
            () => {
                ChatLib.command("regions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Regions&f...");
                gridMenu.close();
            },
            0xff2e7d32
        )
        .addButton(
            "Menus",
            "Opens the /menus menu",
            () => {
                ChatLib.command("menus");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Menus&f...");
                gridMenu.close();
            },
            0xff964b00
        )
        .addButton(
            "Teams",
            "Opens the /teams menu",
            () => {
                ChatLib.command("teams");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Teams&f...");
                gridMenu.close();
            },
            0xff1976d2
        )
        .addButton(
            "§7Event Actions",
            "Opens the /eventactions menu",
            () => {
                ChatLib.command("eventactions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Event Actions&f...");
                gridMenu.close();
            },
            0xff424242
        )
        .addButton(
            "§6Go To Last",
            "Quick access to your last opened items\nFunctions, Commands, Regions, and Menus",
            () => {
                World.playSound("random.click", 0.7, 1.0);
                showGoToLastMenu();
            },
            0xffffd700
        );
}

function showGoToLastMenu() {
    gridMenu
        .clearButtons()
        .setTitle(PREFIX + "Shortcut Menu -> Go To Last")
        .setColumns(2)
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
                    gridMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo function has been opened yet!");
                }
            },
            0xffd32f2f
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
                    gridMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo region has been opened yet!");
                }
            },
            0xff2e7d32
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
                    gridMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo command has been opened yet!");
                }
            },
            0xffffa500
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
                    gridMenu.close();
                } else {
                    playFailSound();
                    ChatLib.chat(PREFIX + "§cNo menu has been opened yet!");
                }
            },
            0xff9c27b0
        )
        .addButton(
            "Back to Main Menu",
            "Go back to the main grid menu\nReturn to previous screen",
            () => {
                World.playSound("random.click", 0.7, 1.0);
                showMainMenu();
            },
            0xff424242
        );
}

// INSTEAD, get the already-registered keybinds:
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
        if (gridMenu.isOpen) {
            gridMenu.close();
        } else {
            showMainMenu();
            gridMenu.open();
        }
    }
    prevGridMenuState = currentState;
});

// Go To Last Menu hotkey
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
        if (gridMenu.isOpen) {
            gridMenu.close();
        } else {
            showGoToLastMenu();
            gridMenu.open();
        }
    }
    prevGoToLastMenuState = currentState;
});
