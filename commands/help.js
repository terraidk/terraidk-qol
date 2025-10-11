/// <reference types="../CTAutocomplete" />

import config from "../utils/command_config.js";

// Categorized command data
const CATEGORIES = {
    party: {
        name: "Party Management",
        commands: [
            {
                syntax: "/pt <player>",
                description: "Transfer party to player",
                configKey: "enablePartyTransfer",
            },
            {
                syntax: "/pd",
                description: "Disband party",
                configKey: "enablePartyDisband",
            },
            {
                syntax: "/pw",
                description: "Warp party",
                configKey: "enablePartyWarp",
            },
        ],
    },
    navigation: {
        name: "Navigation",
        commands: [
            {
                syntax: "/lh",
                description: "Lobby housing",
                configKey: "enableLobbyHousing",
            },
            {
                syntax: "/pcp",
                description: "Parkour checkpoint",
                configKey: "enableParkourCheckpoint",
            },
        ],
    },
    variables: {
        name: "Variables",
        commands: [
            {
                syntax: "/var <global|playername> <list|inc|dec|set|unset> <name> [value]",
                description: "Manage variables",
                configKey: "enableVariables",
            },
            {
                syntax: "/selfvar <action> <name> [value]",
                description: "Manage your variables",
                configKey: "enableSelfVariables",
            },
        ],
    },
    reminder: {
        name: "Reminders",
        commands: [
            {
                syntax: "/remind <time> <message>",
                description: "Set reminder",
                configKey: "enableReminders",
            },
            {
                syntax: "/reminders",
                description: "List reminders",
                configKey: "enableReminderList",
            },
            {
                syntax: "/reminders delete <#>",
                description: "Delete reminder",
                configKey: "enableReminderList",
            },
            {
                syntax: "/reminders edit <#> <text>",
                description: "Edit reminder",
                configKey: "enableReminderList",
            },
            {
                syntax: "/reminders clearall",
                description: "Clear all reminders",
                configKey: "enableReminderList",
            },
        ],
    },
    functions: {
        name: "Functions",
        commands: [
            {
                syntax: "/func <action> <name>",
                description: "Manage functions (create|run|edit|delete)",
                configKey: "enableFunc",
            },
            {
                syntax: "/fc <name>",
                description: "Create function",
                configKey: "enableFuncAliases",
            },
            {
                syntax: "/fr <name>",
                description: "Run function",
                configKey: "enableFuncAliases",
            },
            {
                syntax: "/fe <name>",
                description: "Edit function",
                configKey: "enableFuncAliases",
            },
            {
                syntax: "/fd <name>",
                description: "Delete function",
                configKey: "enableFuncAliases",
            },
            {
                syntax: "/functions",
                description: "Open functions browser",
                configKey: null,
            },
        ],
    },
    regions: {
        name: "Regions",
        commands: [
            {
                syntax: "/region <action> <name>",
                description: "Manage regions (create|edit|delete)",
                configKey: "enableRegion",
            },
            {
                syntax: "/rc <name>",
                description: "Create region",
                configKey: "enableRegionAliases",
            },
            {
                syntax: "/re <name>",
                description: "Edit region",
                configKey: "enableRegionAliases",
            },
            {
                syntax: "/rd <name>",
                description: "Delete region",
                configKey: "enableRegionAliases",
            },
            {
                syntax: "/regions",
                description: "Open regions browser",
                configKey: null,
            },
        ],
    },
    commands: {
        name: "Commands",
        commands: [
            {
                syntax: "/command <action> <name>",
                description: "Manage commands (create|edit|actions|delete)",
                configKey: "enableCommand",
            },
            {
                syntax: "/cc <name>",
                description: "Create command",
                configKey: "enableCommandAliases",
            },
            {
                syntax: "/ce <name>",
                description: "Edit command",
                configKey: "enableCommandAliases",
            },
            {
                syntax: "/ca <name>",
                description: "View actions",
                configKey: "enableCommandAliases",
            },
            {
                syntax: "/cd <name>",
                description: "Delete command",
                configKey: "enableCommandAliases",
            },
            {
                syntax: "/commands",
                description: "Open commands browser",
                configKey: null,
            },
        ],
    },
    menus: {
        name: "Menus",
        commands: [
            {
                syntax: "/menu <action> <name>",
                description: "Manage menus (create|edit|display|delete)",
                configKey: "enableMenu",
            },
            {
                syntax: "/mc <name>",
                description: "Create menu",
                configKey: "enableMenuAliases",
            },
            {
                syntax: "/me <name>",
                description: "Edit menu",
                configKey: "enableMenuAliases",
            },
            {
                syntax: "/md <name>",
                description: "Display menu",
                configKey: "enableMenuAliases",
            },
            {
                syntax: "/mdel <name>",
                description: "Delete menu",
                configKey: "enableMenuAliases",
            },
            {
                syntax: "/menus",
                description: "Open menus browser",
                configKey: null,
            },
        ],
    },
    other: {
        name: "Other",
        commands: [
            {
                syntax: "/hcs",
                description: "Scan housing commands",
                configKey: "enableHousingCommandScan",
            },
            {
                syntax: "/shc",
                description: "Show scanned commands",
                configKey: "enableShowHousingCommands",
            },
        ],
    },
};

function showCategoryList() {
    ChatLib.chat("&8&m----------&r &9[&aterraidk's QoL&9]&r &8&m----------");
    ChatLib.chat("\n&aAvailable Categories:");

    const categoryKeys = Object.keys(CATEGORIES);

    categoryKeys.forEach(function (key) {
        const cat = CATEGORIES[key];

        let enabledCount = 0;
        cat.commands.forEach(function (cmd) {
            if (!cmd.configKey || config.get(cmd.configKey)) {
                enabledCount++;
            }
        });

        ChatLib.chat(
            "  &b" +
                key +
                " &7- " +
                cat.name +
                " &8(" +
                enabledCount +
                " commands)"
        );
    });

    ChatLib.chat("\n&7Usage: &b/tqol help <category>");
    ChatLib.chat("&7Example: &b/tqol help party");
    ChatLib.chat("&8&m---------------------------------------");
}

function showCategoryHelp(category, filter) {
    if (!CATEGORIES[category]) {
        ChatLib.chat("&cUnknown category: &e" + category);
        ChatLib.chat("&7Use &b/tqol help &7to see all categories");
        return;
    }

    const cat = CATEGORIES[category];
    const commands = [];

    // Build list of enabled commands
    cat.commands.forEach(function(cmd) {
        if (!cmd.configKey || config.get(cmd.configKey)) {
            commands.push({
                syntax: cmd.syntax,
                description: cmd.description,
            });
        }
    });

    if (commands.length === 0) {
        ChatLib.chat("&cNo commands found for that category!");
        return;
    }

    // Apply filter if provided
    let filtered = commands;
    if (filter) {
        filtered = commands.filter(function(cmd) {
            return cmd.syntax.toLowerCase().indexOf(filter) !== -1 || 
                   cmd.description.toLowerCase().indexOf(filter) !== -1;
        });
    }

    if (filtered.length === 0) {
        ChatLib.chat("&cNo commands match that filter!");
        return;
    }

    ChatLib.chat("&8&m----------&r &9[&aterraidk's QoL&9]&r &8&m----------");
    ChatLib.chat("\n&2&l" + cat.name.toUpperCase());

    filtered.forEach(function(cmd) {
        ChatLib.chat("&a" + cmd.syntax + " &8- &7" + cmd.description);
    });

    ChatLib.chat("\n&7Use &b/tqol help &7to see all categories");
    ChatLib.chat("&8&m---------------------------------------");
}

register("command", function (command) {
    const args = [];
    for (let i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    // Config command
    if (command === "config") {
        config.handleConfigCommand(args);
        return;
    }

    // Help command
    if (command === "help" || !command) {
        const subCommand = args[0];

        // No subcategory
        if (!subCommand) {
            showCategoryList();
            return;
        }

        // Check if its a valid category
        let filter = "";
        for (let i = 1; i < args.length; i++) {
            if (i > 1) filter += " ";
            filter += args[i];
        }
        showCategoryHelp(subCommand.toLowerCase(), filter.toLowerCase());
        return;
    }

    // Passthrough any other command
    let fullCommand = command;
    for (let i = 0; i < args.length; i++) {
        fullCommand += " " + args[i];
    }
    ChatLib.command(fullCommand);
}).setName("tqol");
