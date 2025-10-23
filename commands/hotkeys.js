/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants.js";
import { keybindManager } from "../utils/keybindConfig.js";

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

// Register all keybinds with the manager
const functionsKey = keybindManager.registerKeybind(
    "functions",
    "/functions",
    "terraidk's QoL"
);
const commandsKey = keybindManager.registerKeybind(
    "commands",
    "/commands",
    "terraidk's QoL"
);
const regionsKey = keybindManager.registerKeybind(
    "regions",
    "/regions",
    "terraidk's QoL"
);
const eventActionsKey = keybindManager.registerKeybind(
    "eventActions",
    "/eventactions",
    "terraidk's QoL"
);
const teamsKey = keybindManager.registerKeybind(
    "teams",
    "/teams",
    "terraidk's QoL"
);
const menusKey = keybindManager.registerKeybind(
    "menus",
    "/menus",
    "terraidk's QoL"
);
const layoutsKey = keybindManager.registerKeybind(
    "layouts",
    "/layouts",
    "terraidk's QoL"
);
const scoreboardKey = keybindManager.registerKeybind(
    "scoreboard",
    "/scoreboard",
    "terraidk's QoL"
);
const backFunctionKey = keybindManager.registerKeybind(
    "backFunction",
    "Back to last opened function",
    "terraidk's QoL"
);
const backCommandKey = keybindManager.registerKeybind(
    "backCommand",
    "Back to last opened command",
    "terraidk's QoL"
);
const backRegionKey = keybindManager.registerKeybind(
    "backRegion",
    "Back to last opened region",
    "terraidk's QoL"
);
const backMenuKey = keybindManager.registerKeybind(
    "backMenu",
    "Back to last opened menu",
    "terraidk's QoL"
);
const backAnythingKey = keybindManager.registerKeybind(
    "backAnything",
    "Back to last opened anything",
    "terraidk's QoL"
);
const editKey = keybindManager.registerKeybind(
    "editKey",
    "Edit inhand item",
    "terraidk's QoL"
);
const editLoreKey = keybindManager.registerKeybind(
    "editLoreKey",
    "Edit inhand item lore",
    "terraidk's QoL"
);
const editActionKey = keybindManager.registerKeybind(
    "editActionKey",
    "Edit inhand item actions",
    "terraidk's QoL"
);
const shortcutMenuKey = keybindManager.registerKeybind(
    "shortcutMenu",
    "Shortcut Menu",
    "terraidk's QoL"
);
const goToLastShortcutKey = keybindManager.registerKeybind(
    "goToLastShortcut",
    "Go To Last Shortcut Menu",
    "terraidk's QoL"
);

// Track previous states for key presses
let prevStates = {
    functions: false,
    commands: false,
    regions: false,
    eventActions: false,
    teams: false,
    menus: false,
    layouts: false,
    scoreboard: false,
    backFunction: false,
    backCommand: false,
    backRegion: false,
    backMenu: false,
    backAnything: false,
    editKey: false,
    editLoreKey: false,
    editActionKey: false,
};

// Track different types separately
let lastOpenedFunction = null;
let lastOpenedCommand = null;
let lastOpenedRegion = null;
let lastOpenedMenu = null;

// Track the most recently opened item of any type
let lastOpenedAnything = {
    type: null,
    name: null,
    timestamp: 0,
};

let pendingEditClick = null;

// Track if we're in the controls menu
let inControlsMenu = false;

// Monitor when controls menu is opened
register("guiOpened", (event) => {
    try {
        const gui = event.gui;
        if (gui && gui.getClass().getSimpleName() === "GuiControls") {
            inControlsMenu = true;
            keybindManager.startMonitoring();
        }
    } catch (e) {
        // Silent fail
    }
});

// Sync keybinds when controls menu is closed
register("guiClosed", () => {
    try {
        const gui = Client.currentGui.get();
        if (gui && gui.getClass().getSimpleName() === "GuiControls") {
            inControlsMenu = false;
            keybindManager.stopMonitoring();
            if (keybindManager.syncFromMinecraft()) {
                ChatLib.chat(PREFIX + "§aKeybind settings saved!");
            }
        }
    } catch (e) {
        // Fallback if we lose track
        if (inControlsMenu) {
            inControlsMenu = false;
            keybindManager.stopMonitoring();
            keybindManager.syncFromMinecraft();
        }
    }
});

// Tick handler for keybinds and monitoring
register("tick", () => {
    // Check for keybind changes while in controls menu
    if (inControlsMenu) {
        keybindManager.checkForChanges();
        return; // Don't process keybind actions while in controls menu
    }

    const states = {
        functions: functionsKey.func_151470_d(),
        commands: commandsKey.func_151470_d(),
        regions: regionsKey.func_151470_d(),
        eventActions: eventActionsKey.func_151470_d(),
        teams: teamsKey.func_151470_d(),
        menus: menusKey.func_151470_d(),
        layouts: layoutsKey.func_151470_d(),
        scoreboard: scoreboardKey.func_151470_d(),
        backFunction: backFunctionKey.func_151470_d(),
        backCommand: backCommandKey.func_151470_d(),
        backRegion: backRegionKey.func_151470_d(),
        backMenu: backMenuKey.func_151470_d(),
        backAnything: backAnythingKey.func_151470_d(),
        editKey: editKey.func_151470_d(),
        editLoreKey: editLoreKey.func_151470_d(),
        editActionKey: editActionKey.func_151470_d(),
    };

    if (states.functions && !prevStates.functions) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening functions...");
        ChatLib.command("functions");
    }
    if (states.commands && !prevStates.commands) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening commands...");
        ChatLib.command("commands");
    }
    if (states.regions && !prevStates.regions) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening regions...");
        ChatLib.command("regions");
    }
    if (states.eventActions && !prevStates.eventActions) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening event actions...");
        ChatLib.command("eventactions");
    }
    if (states.teams && !prevStates.teams) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening teams...");
        ChatLib.command("teams");
    }
    if (states.menus && !prevStates.menus) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening menus...");
        ChatLib.command("menus");
    }
    if (states.layouts && !prevStates.layouts) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening layouts...");
        ChatLib.command("layouts");
    }
    if (states.scoreboard && !prevStates.scoreboard) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.chat(PREFIX + "Opening scoreboard...");
        ChatLib.command("scoreboard");
    }

    if (states.backFunction && !prevStates.backFunction) {
        if (lastOpenedFunction) {
            World.playSound("note.bassattack", 0.7, 2.0);
            ChatLib.command(`function edit ${lastOpenedFunction}`);
            ChatLib.chat(
                PREFIX +
                    `&aReturning to last opened &6Function&a: &b${lastOpenedFunction}`
            );
        } else {
            playFailSound();
            ChatLib.chat(PREFIX + "&cNo function has been opened yet!");
        }
    }

    if (states.backCommand && !prevStates.backCommand) {
        if (lastOpenedCommand) {
            World.playSound("note.bassattack", 0.7, 2.0);
            ChatLib.command(`command actions ${lastOpenedCommand}`);
            ChatLib.chat(
                PREFIX +
                    `&aReturning to last opened &6Command&a: &b${lastOpenedCommand}`
            );
        } else {
            playFailSound();
            ChatLib.chat(PREFIX + "&cNo command has been opened yet!");
        }
    }

    if (states.backRegion && !prevStates.backRegion) {
        if (lastOpenedRegion) {
            World.playSound("note.bassattack", 0.7, 2.0);
            ChatLib.command(`region edit ${lastOpenedRegion}`);
            ChatLib.chat(
                PREFIX +
                    `&aReturning to last opened &6Region&a: &b${lastOpenedRegion}`
            );
        } else {
            playFailSound();
            ChatLib.chat(PREFIX + "&cNo region has been opened yet!");
        }
    }

    if (states.backMenu && !prevStates.backMenu) {
        if (lastOpenedMenu) {
            World.playSound("note.bassattack", 0.7, 2.0);
            ChatLib.command(`menu edit ${lastOpenedMenu}`);
            ChatLib.chat(
                PREFIX +
                    `&aReturning to last opened &6Menu&a: &b${lastOpenedMenu}`
            );
        } else {
            playFailSound();
            ChatLib.chat(PREFIX + "&cNo menu has been opened yet!");
        }
    }

    if (states.backAnything && !prevStates.backAnything) {
        if (lastOpenedAnything.type && lastOpenedAnything.name) {
            World.playSound("note.bassattack", 0.7, 2.0);

            switch (lastOpenedAnything.type) {
                case "function":
                    ChatLib.command(`function edit ${lastOpenedAnything.name}`);
                    ChatLib.chat(
                        PREFIX +
                            `&aReturning to last opened &6Function&a: &b${lastOpenedAnything.name}`
                    );
                    break;
                case "command":
                    ChatLib.command(
                        `command actions ${lastOpenedAnything.name}`
                    );
                    ChatLib.chat(
                        PREFIX +
                            `&aReturning to last opened &6Command&a: &b${lastOpenedAnything.name}`
                    );
                    break;
                case "region":
                    ChatLib.command(`region edit ${lastOpenedAnything.name}`);
                    ChatLib.chat(
                        PREFIX +
                            `&aReturning to last opened &6Region&a: &b${lastOpenedAnything.name}`
                    );
                    break;
                case "menu":
                    ChatLib.command(`menu edit ${lastOpenedAnything.name}`);
                    ChatLib.chat(
                        PREFIX +
                            `&aReturning to last opened &6Menu&a: &b${lastOpenedAnything.name}`
                    );
                    break;
            }
        } else {
            playFailSound();
            ChatLib.chat(PREFIX + "&cNothing has been opened yet!");
        }
    }

    if (states.editKey && !prevStates.editKey) {
        World.playSound("note.bassattack", 0.7, 2.0);
        ChatLib.command("edit");
    }

    if (states.editLoreKey && !prevStates.editLoreKey) {
        World.playSound("note.bassattack", 0.7, 2.0);
        pendingEditClick = 30;
        ChatLib.command("edit");
    }

    if (states.editActionKey && !prevStates.editActionKey) {
        World.playSound("note.bassattack", 0.7, 2.0);
        pendingEditClick = 34;
        ChatLib.command("edit");
    }

    prevStates = states;
});

// Helper function to update last opened anything
function updateLastOpenedAnything(type, name) {
    lastOpenedAnything = {
        type: type,
        name: name,
        timestamp: Date.now(),
    };
}

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

        if (title === "Edit Item" && pendingEditClick !== null) {
            const inventory = Player.getOpenedInventory();
            if (inventory) {
                inventory.click(pendingEditClick);
            }
            pendingEditClick = null;
            return;
        }

        if (title.includes("Actions: ")) {
            if (title.includes("Actions: /")) {
                const commandName = title.split("Actions: /")[1];
                lastOpenedCommand = commandName;
                updateLastOpenedAnything("command", commandName);
            } else {
                const functionName = title.split("Actions: ")[1];
                lastOpenedFunction = functionName;
                updateLastOpenedAnything("function", functionName);
            }
        } else if (title.startsWith("Edit ") && title.endsWith(" Region")) {
            const regionName = title.substring(5, title.length - 7);
            lastOpenedRegion = regionName;
            updateLastOpenedAnything("region", regionName);
        } else if (title.startsWith("Edit Menu: ")) {
            const menuName = title.substring(11);
            lastOpenedMenu = menuName;
            updateLastOpenedAnything("menu", menuName);
        }
    }, 50);
});
