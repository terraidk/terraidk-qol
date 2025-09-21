/// <reference types="../CTAutocomplete" />

import config from "../utils/command_config.js";

// Dynamic command list based on config
function getEnabledCommands() {
    const commands = [];

    if (config.enablePartyTransfer) {
        commands.push({
            category: "Party",
            syntax: "/pt <player>",
            description: "Short for /party transfer",
        });
    }

    if (config.enablePartyDisband) {
        commands.push({
            category: "Party",
            syntax: "/pd",
            description: "Short for /party disband",
        });
    }

    if (config.enablePartyWarp) {
        commands.push({
            category: "Party",
            syntax: "/pw",
            description: "Short for /party warp",
        });
    }

    if (config.enableLobbyHousing) {
        commands.push({
            category: "Navigation",
            syntax: "/lh",
            description: "Short for /lobby housing",
        });
    }

    if (config.enableParkourCheckpoint) {
        commands.push({
            category: "Navigation",
            syntax: "/pcp",
            description: "Short for /parkour checkpoint",
        });
    }

    if (config.enableVariables) {
        commands.push({
            category: "Variables",
            syntax: "/var <global|playername> <list|inc|dec|set|unset> <var> [value]",
            description: "Manage variables with a more intuitive syntax",
        });
    }

    if (config.enableSelfVariables) {
        commands.push({
            category: "Variables",
            syntax: "/selfvar <list|inc|dec|set|unset> <var> [value]",
            description: "Manage your own variables",
        });
    }

    if (config.enableReminders) {
        commands.push({
            category: "Reminders",
            syntax: "/remind <1h 20m | HH:MM[am/pm]> <message>",
            description: "Set a reminder",
        });
    }

    if (config.enableReminderList) {
        commands.push({
            category: "Reminders",
            syntax: "/reminders",
            description: "View, edit, or delete reminders",
        });
    }

    if (config.enableFunc) {
        commands.push({
            category: "Housing Functions",
            syntax: "/func <create|run|edit|delete> <name>",
            description: "Manage housing functions",
        });
        commands.push({
            category: "Housing Functions",
            syntax: "/fc <name>",
            description: "Create function",
        });
        commands.push({
            category: "Housing Functions",
            syntax: "/fr <name>",
            description: "Run function",
        });
        commands.push({
            category: "Housing Functions",
            syntax: "/fe <name>",
            description: "Edit function",
        });
        commands.push({
            category: "Housing Functions",
            syntax: "/fd <name>",
            description: "Delete function",
        });
    }

    if (config.enableRegion) {
        commands.push({
            category: "Housing Regions",
            syntax: "/region <create|edit|delete> <name>",
            description: "Manage housing regions",
        });
        commands.push({
            category: "Housing Regions",
            syntax: "/rc <name>",
            description: "Create region",
        });
        commands.push({
            category: "Housing Regions",
            syntax: "/re <name>",
            description: "Edit region",
        });
        commands.push({
            category: "Housing Regions",
            syntax: "/rd <name>",
            description: "Delete region",
        });
    }

    if (config.enableCommand) {
        commands.push({
            category: "Housing Commands",
            syntax: "/command <create|edit|actions|delete> <name>",
            description: "Manage housing commands",
        });
        commands.push({
            category: "Housing Commands",
            syntax: "/cc <name>",
            description: "Create command",
        });
        commands.push({
            category: "Housing Commands",
            syntax: "/ce <name>",
            description: "Edit command",
        });
        commands.push({
            category: "Housing Commands",
            syntax: "/ca <name>",
            description: "View command actions",
        });
        commands.push({
            category: "Housing Commands",
            syntax: "/cd <name>",
            description: "Delete command",
        });
    }

    if (config.enableMenu) {
        commands.push({
            category: "Housing Menus",
            syntax: "/menu <create|edit|display|delete> <name>",
            description: "Manage housing menus",
        });
        commands.push({
            category: "Housing Menus",
            syntax: "/mc <name>",
            description: "Create menu",
        });
        commands.push({
            category: "Housing Menus",
            syntax: "/me <name>",
            description: "Edit menu",
        });
        commands.push({
            category: "Housing Menus",
            syntax: "/md <name>",
            description: "Display menu",
        });
        commands.push({
            category: "Housing Menus",
            syntax: "/mdel <name>",
            description: "Delete menu",
        });
    }

    if (config.enableHousingCommandScan) {
        commands.push({
            category: "Housing Commands",
            syntax: "/hcs",
            description: "Scan for housing commands",
        });
        if (config.enableShowHousingCommands) {
            commands.push({
                category: "Housing Commands",
                syntax: "/shc",
                description: "Show all housing commands",
            });
        }
    }

    // add more commands here...

    return commands;
} // <-- This closing brace was missing!

register("command", (command, ...args) => {
    if (!Array.isArray(args)) args = [];

    // Config command
    if (command === "config") {
        config.handleConfigCommand(args);
        return;
    }

    // If the command is NOT "help", treat it as a passthrough command
    if (command && command !== "help") {
        ChatLib.command(command + " " + args.join(" "));
        return;
    }

    const COMMAND_LIST = getEnabledCommands();
    // Sort commands (alphabetically) on category
    COMMAND_LIST.sort((a, b) => a.category.localeCompare(b.category));

    let filter = args.join(" ").toLowerCase();
    const filtered = filter
        ? COMMAND_LIST.filter((cmd) =>
              cmd.syntax.toLowerCase().includes(filter)
          )
        : COMMAND_LIST;

    ChatLib.chat(
        "&8&m----------------&r " +
            "&9[&aterraidk's QoL&r&9]&r " +
            "&8&m----------------"
    );

    let currentCategory = "";

    filtered.forEach((cmd) => {
        // Only print the category header when it changes from the previous command
        if (cmd.category !== currentCategory) {
            ChatLib.chat("\n&2&l" + cmd.category.toUpperCase());
            currentCategory = cmd.category;
        }

        ChatLib.chat("&a" + cmd.syntax + " &7 " + cmd.description);
    });

    ChatLib.chat("\n&b/tqol help [filter] &7 Show only certain commands");
    ChatLib.chat("&b/tqol config &7 Enable/disable commands");
    ChatLib.chat("&8&m-----------------------------------------------");
})
    .setName("tqol")
    .setAliases(["tqolhelp", "tqolcmds"]);
