/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";

if (typeof Keyboard === "undefined") { var Keyboard = Java.type("org.lwjgl.input.Keyboard"); }
if (typeof KeyBind === "undefined") { var KeyBind = Java.type("com.chattriggers.ctjs.engine.keybind.KeyBind"); }
if (typeof GuiScreen === "undefined") {var GuiScreen = Java.type("net.minecraft.client.gui.GuiScreen"); }
if (typeof ChatLib === "undefined") ChatLib = Java.type("com.chattriggers.ctjs.api.ChatLib");
if (typeof Player === "undefined") { var Player = Java.type("com.chattriggers.ctjs.minecraft.wrappers.Player"); }

// Helper function to safely create a keybind
function createKeyBind(name, key, category) {
    return new KeyBind(name, key, category);
}

// Keybinds (unbound by default)
const functionsKey    = createKeyBind("/functions", 0, "terraidk's QoL");      
const commandsKey     = createKeyBind("/commands", 0, "terraidk's QoL");      
const regionsKey      = createKeyBind("/regions", 0, "terraidk's QoL");
const eventActionsKey = createKeyBind("/eventactions", 0, "terraidk's QoL");
const teamsKey        = createKeyBind("/teams", 0, "terraidk's QoL");
const menusKey        = createKeyBind("/menus", 0, "terraidk's QoL");
const backFunctionKey = createKeyBind("Back to last opened function", 0, "terraidk's QoL");
const backCommandKey  = createKeyBind("Back to last opened command", 0, "terraidk's QoL");
const backRegionKey   = createKeyBind("Back to last opened region", 0, "terraidk's QoL");

// Track previous states for key presses
let prevStates = {
    functions: false,
    commands: false,
    regions: false,
    eventActions: false,
    teams: false,
    menus: false,
    backFunction: false,
    backCommand: false,
    backRegion: false
};

// Track different types separately
let lastOpenedFunction = null;
let lastOpenedCommand = null;
let lastOpenedRegion = null;

// Tick handler for keybinds
register("tick", () => {
    const states = {    
        functions: functionsKey.isPressed(),
        commands: commandsKey.isPressed(),
        regions: regionsKey.isPressed(),
        eventActions: eventActionsKey.isPressed(),
        teams: teamsKey.isPressed(),
        menus: menusKey.isPressed(),
        backFunction: backFunctionKey.isPressed(),
        backCommand: backCommandKey.isPressed(),
        backRegion: backRegionKey.isPressed()
    };

    if (states.functions && !prevStates.functions) {
        ChatLib.chat(PREFIX + "Opening functions...");
        ChatLib.command("functions");
    }
    if (states.commands && !prevStates.commands) {
        ChatLib.chat(PREFIX + "Opening commands...");
        ChatLib.command("commands");
    }
    if (states.regions && !prevStates.regions) {
        ChatLib.chat(PREFIX + "Opening regions...");
        ChatLib.command("regions");
    }
    if (states.eventActions && !prevStates.eventActions) {
        ChatLib.chat(PREFIX + "Opening event actions...");
        ChatLib.command("eventactions");
    }
    if (states.teams && !prevStates.teams) {
        ChatLib.chat(PREFIX + "Opening teams...");
        ChatLib.command("teams");
    }
    if (states.menus && !prevStates.menus) {
        ChatLib.chat(PREFIX + "Opening menus...");
        ChatLib.command("menus");
    }


if (states.backFunction && !prevStates.backFunction) {
    if (lastOpenedFunction) {
        ChatLib.command(`function edit ${lastOpenedFunction}`);
        ChatLib.chat(PREFIX + `&aReturning to last opened &6Function&a: &b${lastOpenedFunction}`);
    } else {
        ChatLib.chat(PREFIX + "&cNo function has been opened yet!");
    }
}

if (states.backCommand && !prevStates.backCommand) {
    if (lastOpenedCommand) {
        ChatLib.command(`command actions ${lastOpenedCommand}`);
        ChatLib.chat(PREFIX + `&aReturning to last opened &6Command&a: &b${lastOpenedCommand}`);
    } else {
        ChatLib.chat(PREFIX + "&cNo command has been opened yet!");
    }
}

if (states.backRegion && !prevStates.backRegion) {
    if (lastOpenedRegion) {
        ChatLib.command(`region edit ${lastOpenedRegion}`);
        ChatLib.chat(PREFIX + `&aReturning to last opened &6Region&a: &b${lastOpenedRegion}`);
    } else {
        ChatLib.chat(PREFIX + "&cNo region has been opened yet!");
    }
}


    prevStates = states;
});

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

register("guiOpened", guiEvent => {
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
        }
    }, 50); 
});