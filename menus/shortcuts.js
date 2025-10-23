/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants";
import { keybindManager } from "../utils/keybindConfig.js";

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
    }

    setTitle(title) {
        this.title = title;
        return this;
    }

    addButton(text, description, callback, color = null) {
        this.buttons.push({
            text,
            description,
            callback,
            color,
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
            const centerX = screenWidth / 2;
            const centerY = screenHeight / 2;
            const mouseX = Client.getMouseX();
            const mouseY = Client.getMouseY();

            // Dim the background
            Renderer.drawRect(0xe0000000, 0, 0, screenWidth, screenHeight);

            // Mouse angle from center
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            let mouseAngle = Math.atan2(dy, dx);

            // Figure out which slice is hovered
            let hoveredButton = null;
            const anglePerButton = (Math.PI * 2) / this.buttons.length;
            const startAngle = -Math.PI / 2; // Start from top
            const innerRadius = 60;
            const outerRadius = this.radius;

            // Draw each wheel slice
            this.buttons.forEach((button, index) => {
                const buttonAngle = startAngle + anglePerButton * index;
                const buttonEndAngle = buttonAngle + anglePerButton;

                const fillColor =
                    ((button.color ?? 0xff404040) & 0x00ffffff) | 0xff000000;

                // Check if mouse is over this slice
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
                if (isHovered) {
                    button._hoverProgress +=
                        (1 - button._hoverProgress) * speed;
                } else {
                    button._hoverProgress +=
                        (0 - button._hoverProgress) * speed;
                }
                if (button._hoverProgress < 0.01) button._hoverProgress = 0;
                if (button._hoverProgress > 0.99) button._hoverProgress = 1;

                let drawOuterRadius = outerRadius + 10 * button._hoverProgress;
                if (button._hoverProgress > 0.01) {
                    hoveredButton = button;
                    if (isHovered) this.selectedButton = index;
                }

                // Draw the slice (with possible hover scale)
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

                // Draw highlight overlay if hovered
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

                // Draw button label
                const midAngle = buttonAngle + anglePerButton / 2;
                const textRadius = (innerRadius + outerRadius) / 2;
                const textX = centerX + Math.cos(midAngle) * textRadius;
                const textY = centerY + Math.sin(midAngle) * textRadius;

                const lines = button.text.split("\n");
                const totalHeight = lines.length * 10;
                let currentY = textY - totalHeight / 2;

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

            // Draw menu title in the center
            const titleWidth = Renderer.getStringWidth(this.title);
            Renderer.drawStringWithShadow(
                "§f" + this.title,
                centerX - titleWidth / 2,
                centerY - 6
            );

            // Show tooltip for hovered button
            if (hoveredButton && hoveredButton.description) {
                this.drawTooltip(
                    hoveredButton.description,
                    mouseX,
                    mouseY,
                    screenWidth,
                    screenHeight
                );
            }

            // Show usage instructions at the bottom
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

            // Draw Discord RPC toggle in bottom right
            const toggleWidth = 50;
            const toggleHeight = 22;
            const toggleX = screenWidth - toggleWidth - 20;
            const toggleY = screenHeight - toggleHeight - 20;

            Renderer.drawRect(
                0xff111111,
                toggleX - 2,
                toggleY - 2,
                toggleWidth + 4,
                toggleHeight + 4
            );
            Renderer.drawRect(
                0xff212121,
                toggleX,
                toggleY,
                toggleWidth,
                toggleHeight
            );

            const rpcEnabled =
                typeof globalThis.discordRPCControl !== "undefined" &&
                typeof globalThis.discordRPCControl.isEnabled === "function"
                    ? globalThis.discordRPCControl.isEnabled()
                    : true;

            const label = rpcEnabled ? "RPC" : "RPC";
            const labelColor = rpcEnabled ? "§a" : "§c";
            Renderer.drawStringWithShadow(
                labelColor + label,
                toggleX + 8,
                toggleY + 8
            );

            const indicatorSize = 10;
            const indicatorX = toggleX + toggleWidth - 18;
            const indicatorY = toggleY + (toggleHeight - indicatorSize) / 2;
            const indicatorColor = rpcEnabled ? 0xff2e7d32 : 0xffe74c3c;
            Renderer.drawRect(
                indicatorColor,
                indicatorX,
                indicatorY,
                indicatorSize,
                indicatorSize
            );

            if (
                mouseX >= toggleX &&
                mouseX <= toggleX + toggleWidth &&
                mouseY >= toggleY &&
                mouseY <= toggleY + toggleHeight
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
        });

        gui.registerClicked((mouseX, mouseY, button) => {
            const screenWidth = Renderer.screen.getWidth();
            const screenHeight = Renderer.screen.getHeight();
            const centerX = screenWidth / 2;
            const centerY = screenHeight / 2;

            // Handle toggle click
            const toggleWidth = 50;
            const toggleHeight = 22;
            const toggleX = screenWidth - toggleWidth - 20;
            const toggleY = screenHeight - toggleHeight - 20;
            const toggleClicked =
                mouseX >= toggleX &&
                mouseX <= toggleX + toggleWidth &&
                mouseY >= toggleY &&
                mouseY <= toggleY + toggleHeight;

            if (toggleClicked) {
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

            // Check if click is inside the wheel
            const dx = mouseX - centerX;
            const dy = mouseY - centerY;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
            const innerRadius = 60;
            const outerRadius = this.radius;

            if (distanceFromCenter < innerRadius) {
                return;
            } else if (distanceFromCenter <= outerRadius) {
                // Clicked a button
                if (
                    this.selectedButton >= 0 &&
                    this.selectedButton < this.buttons.length
                ) {
                    this.executeButton(this.selectedButton);
                    this.close();
                }
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
    wheelMenu
        .clearButtons()
        .setTitle(PREFIX + "Shortcuts")
        .addButton(
            "Functions",
            "Opens the Functions menu",
            () => {
                ChatLib.command("functions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Functions&f...");
                wheelMenu.close();
            },
            0xffc62828
        )
        .addButton(
            "Commands",
            "Opens the Commands menu",
            () => {
                ChatLib.command("commands");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Commands&f...");
                wheelMenu.close();
            },
            0xfff57c00
        )
        .addButton(
            "Regions",
            "Opens the Regions menu",
            () => {
                ChatLib.command("regions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Regions&f...");
                wheelMenu.close();
            },
            0xff388e3c
        )
        .addButton(
            "Menus",
            "Opens the Custom Menus menu",
            () => {
                ChatLib.command("menus");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Menus&f...");
                wheelMenu.close();
            },
            0xff6d4c41
        )
        .addButton(
            "Go To\nLast",
            "Quick access to your last opened items\nFunctions, Commands, Regions, and Menus",
            () => {
                World.playSound("random.click", 0.7, 1.0);
                wheelMenu.close();
                setTimeout(() => {
                    showGoToLastMenu();
                    wheelMenu.open();
                }, 50);
            },
            0xff424242
        )
        .addButton(
            "Layouts",
            "Opens the Layouts menu",
            () => {
                ChatLib.command("layouts");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Layouts&f...");
                wheelMenu.close();
            },
            0xff1565c0
        )
        .addButton(
            "Scoreboard",
            "Opens the Scoreboard Editor",
            () => {
                ChatLib.command("scoreboard");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Scoreboard&f...");
                wheelMenu.close();
            },
            0xff6a1b9a
        )
        .addButton(
            "Teams",
            "Opens the Teams menu",
            () => {
                ChatLib.command("teams");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Teams&f...");
                wheelMenu.close();
            },
            0xff00838f
        )
        .addButton(
            "Event\nActions",
            "Opens the Event Actions menu",
            () => {
                ChatLib.command("eventactions");
                World.playSound("note.bassattack", 0.7, 2.0);
                ChatLib.chat(PREFIX + "Opening &6Event Actions&f...");
                wheelMenu.close();
            },
            0xffcfabf7
        );
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
            0xffc62828
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
            0xff388e3c
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
            0xff424242
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
            0xff6d4c41
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
            0xfff57c00
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
