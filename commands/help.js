/// <reference types="../CTAutocomplete" />

// Categorized command data
const CATEGORIES = {
    party: {
        name: "Party Management",
        commands: [
            { syntax: "/pt <player>", description: "Transfer party to player" },
            { syntax: "/pd", description: "Disband party" },
            { syntax: "/pw", description: "Warp party" },
        ],
    },
    navigation: {
        name: "Navigation",
        commands: [
            { syntax: "/lh", description: "Lobby housing" },
            { syntax: "/pcp", description: "Parkour checkpoint" },
        ],
    },
    variables: {
        name: "Variables",
        commands: [
            {
                syntax: "/var <global|playername> <list|inc|dec|set|unset> <name> [value]",
                description: "Manage variables",
            },
            {
                syntax: "/selfvar <action> <name> [value]",
                description: "Manage your variables",
            },
        ],
    },
    reminder: {
        name: "Reminders",
        commands: [
            { syntax: "/remind <time> <message>", description: "Set reminder" },
            { syntax: "/reminders", description: "List reminders" },
            { syntax: "/reminders delete <#>", description: "Delete reminder" },
            { syntax: "/reminders edit <#> <text>", description: "Edit reminder" },
            { syntax: "/reminders clearall", description: "Clear all reminders" },
        ],
    },
    functions: {
        name: "Functions",
        commands: [
            {
                syntax: "/func <action> <name>",
                description: "Manage functions (create|run|edit|delete)",
            },
            { syntax: "/fc <name>", description: "Create function" },
            { syntax: "/fr <name>", description: "Run function" },
            { syntax: "/fe <name>", description: "Edit function" },
            { syntax: "/fd <name>", description: "Delete function" },
            { syntax: "/functions", description: "Open functions browser" },
        ],
    },
    regions: {
        name: "Regions",
        commands: [
            {
                syntax: "/region <action> <name>",
                description: "Manage regions (create|edit|delete)",
            },
            { syntax: "/rc <name>", description: "Create region" },
            { syntax: "/re <name>", description: "Edit region" },
            { syntax: "/rd <name>", description: "Delete region" },
            { syntax: "/regions", description: "Open regions browser" },
        ],
    },
    commands: {
        name: "Commands",
        commands: [
            {
                syntax: "/command <action> <name>",
                description: "Manage commands (create|edit|actions|delete)",
            },
            { syntax: "/cc <name>", description: "Create command" },
            { syntax: "/ce <name>", description: "Edit command" },
            { syntax: "/ca <name>", description: "View actions" },
            { syntax: "/cd <name>", description: "Delete command" },
            { syntax: "/commands", description: "Open commands browser" },
        ],
    },
    menus: {
        name: "Menus",
        commands: [
            {
                syntax: "/menu <action> <name>",
                description: "Manage menus (create|edit|display|delete)",
            },
            { syntax: "/mc <name>", description: "Create menu" },
            { syntax: "/me <name>", description: "Edit menu" },
            { syntax: "/md <name>", description: "Display menu" },
            { syntax: "/mdel <name>", description: "Delete menu" },
            { syntax: "/menus", description: "Open menus browser" },
        ],
    },
    other: {
        name: "Other",
        commands: [
            { syntax: "/hcs", description: "Scan housing commands" },
            { syntax: "/shc", description: "Show scanned commands" },
        ],
    },
};

function showCategoryList() {
    ChatLib.chat("&8&m----------&r &9[&aterraidk's QoL&9]&r &8&m----------");
    ChatLib.chat("\n&aAvailable Categories:");

    const categoryKeys = Object.keys(CATEGORIES);

    categoryKeys.forEach(function (key) {
        const cat = CATEGORIES[key];
        ChatLib.chat(
            "  &b" +
                key +
                " &7- " +
                cat.name +
                " &8(" +
                cat.commands.length +
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
    let commands = cat.commands;

    // Apply filter if provided
    if (filter) {
        commands = commands.filter(function (cmd) {
            return (
                cmd.syntax.toLowerCase().indexOf(filter) !== -1 ||
                cmd.description.toLowerCase().indexOf(filter) !== -1
            );
        });
    }

    if (commands.length === 0) {
        ChatLib.chat("&cNo commands match that filter!");
        return;
    }

    ChatLib.chat("&8&m----------&r &9[&aterraidk's QoL&9]&r &8&m----------");
    ChatLib.chat("\n&2&l" + cat.name.toUpperCase());

    commands.forEach(function (cmd) {
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
