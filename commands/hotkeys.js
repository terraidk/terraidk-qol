/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants.js";

if (typeof Keyboard === "undefined") {
  var Keyboard = Java.type("org.lwjgl.input.Keyboard");
}
if (typeof KeyBind === "undefined") {
  var KeyBind = Java.type("com.chattriggers.ctjs.engine.keybind.KeyBind");
}
if (typeof GuiScreen === "undefined") {
  var GuiScreen = Java.type("net.minecraft.client.gui.GuiScreen");
}
if (typeof ChatLib === "undefined")
  ChatLib = Java.type("com.chattriggers.ctjs.api.ChatLib");
if (typeof Player === "undefined") {
  var Player = Java.type("com.chattriggers.ctjs.minecraft.wrappers.Player");
}

// Helper function to safely create a keybind
function createKeyBind(name, key, category) {
  return new KeyBind(name, key, category);
}

// Keybinds (unbound by default)
const functionsKey = createKeyBind("/functions", 0, "terraidk's QoL");
const commandsKey = createKeyBind("/commands", 0, "terraidk's QoL");
const regionsKey = createKeyBind("/regions", 0, "terraidk's QoL");
const eventActionsKey = createKeyBind("/eventactions", 0, "terraidk's QoL");
const teamsKey = createKeyBind("/teams", 0, "terraidk's QoL");
const menusKey = createKeyBind("/menus", 0, "terraidk's QoL");
const backFunctionKey = createKeyBind(
  "Back to last opened function",
  0,
  "terraidk's QoL"
);
const backCommandKey = createKeyBind(
  "Back to last opened command",
  0,
  "terraidk's QoL"
);
const backRegionKey = createKeyBind(
  "Back to last opened region",
  0,
  "terraidk's QoL"
);
const backMenuKey = createKeyBind(
  "Back to last opened menu",
  0,
  "terraidk's QoL"
);
const backAnythingKey = createKeyBind(
  "Back to last opened anything",
  0,
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
  backFunction: false,
  backCommand: false,
  backRegion: false,
  backMenu: false,
  backAnything: false,
};

// Track different types separately
let lastOpenedFunction = null;
let lastOpenedCommand = null;
let lastOpenedRegion = null;
let lastOpenedMenu = null;

// Track the most recently opened item of any type
let lastOpenedAnything = {
  type: null, // 'function', 'command', 'region', or 'menu'
  name: null,
  timestamp: 0,
};

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
    backRegion: backRegionKey.isPressed(),
    backMenu: backMenuKey.isPressed(),
    backAnything: backAnythingKey.isPressed(),
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
        PREFIX + `&aReturning to last opened &6Region&a: &b${lastOpenedRegion}`
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
        PREFIX + `&aReturning to last opened &6Menu&a: &b${lastOpenedMenu}`
      );
    } else {
      playFailSound();
      ChatLib.chat(PREFIX + "&cNo menu has been opened yet!");
    }
  }

  // New "back to anything" functionality
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
          ChatLib.command(`command actions ${lastOpenedAnything.name}`);
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
      const menuName = title.substring(11); // "Edit Menu: ".length = 11
      lastOpenedMenu = menuName;
      updateLastOpenedAnything("menu", menuName);
    }
  }, 50);
});
