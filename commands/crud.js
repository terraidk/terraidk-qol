/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";


register("command", function(...args) {
    if (!args || args.length === 0) {
        ChatLib.chat(PREFIX + "&cUsage: /func <create|run|edit|delete> <name>");
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args[1];

    switch (sub) {
        case "c":
        case "create":
            if (!name) {
                ChatLib.chat(PREFIX + "&cYou must specify a function name to create");
                return;
            }
            ChatLib.command(`function create ${name}`);
            break;

        case "r":
        case "run":
            if (!name) {
                ChatLib.chat(PREFIX + "&cYou must specify a function name to run");
                return;
            }
            ChatLib.command(`function run ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) {
                ChatLib.chat(PREFIX + "&cYou must specify a function name to edit");
                return;
            }
            ChatLib.command(`function edit ${name}`);
            break;

        case "d":
        case "del":
        case "delete":
            if (!name) {
                ChatLib.chat(PREFIX + "&cYou must specify a function name to delete");
                return;
            }
            ChatLib.command(`function delete ${name}`);
            break;

        default:
            ChatLib.chat(PREFIX + "&cUnknown subcommand. Use create, run, or delete.");
    }
}).setName("func");

// Aliases
register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to create");
    ChatLib.command(`function create ${name}`);
}).setName("fc", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to run");
    ChatLib.command(`function run ${name}`);
}).setName("fr", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to edit");
    ChatLib.command(`function edit ${name}`);
}).setName("fe", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to delete");
    ChatLib.command(`function delete ${name}`);
}).setName("fd", true);


register("command", function(...args) {
    if (!args || args.length === 0) {
        ChatLib.chat(PREFIX + "&cUsage: /region <create|edit|delete> <name>");
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args[1];

    switch (sub) {
        case "c":
        case "create":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to create");
            ChatLib.command(`region create ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to edit");
            ChatLib.command(`region edit ${name}`);
            break;

        case "d":
        case "del":
        case "delete":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to delete");
            ChatLib.command(`region delete ${name}`);
            break;

        default:
            ChatLib.chat(PREFIX + "&cUnknown subcommand. Use create, edit, or delete.");
    }
}).setName("region");

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to create");
    ChatLib.command(`region create ${name}`);
}).setName("rc", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to edit");
    ChatLib.command(`region edit ${name}`);
}).setName("re", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to delete");
    ChatLib.command(`region delete ${name}`);
}).setName("rd", true);

// handler for /command and /cmd
function handleCommand(...args) {
    if (!args || args.length === 0) {
        ChatLib.chat(PREFIX + "&cUsage: /command <create|edit|actions|delete> <name>");
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args[1];

    switch (sub) {
        case "c":
        case "cr":
        case "create":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to create");
            ChatLib.command(`command create ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to edit");
            ChatLib.command(`command edit ${name}`);
            break;

        case "a":
        case "action":
        case "act":
        case "actions":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to view actions");
            ChatLib.command(`command actions ${name}`);
            break;

        case "d":
        case "del":
        case "delete":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to delete");
            ChatLib.command(`command delete ${name}`);
            break;

        default:
            ChatLib.chat(PREFIX + "&cUnknown subcommand. Use create, edit, actions, or delete.");
    }
}

register("command", handleCommand).setName("command");
register("command", handleCommand).setName("cmd");

// Shortcuts
register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to create");
    ChatLib.command(`command create ${name}`);
}).setName("cc", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to edit");
    ChatLib.command(`command edit ${name}`);
}).setName("ce", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to view actions");
    ChatLib.command(`command actions ${name}`);
}).setName("ca", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to delete");
    ChatLib.command(`command delete ${name}`);
}).setName("cd", true);

// Main handler for /menu and /mn
function handleMenu(...args) {
    if (!args || args.length === 0) {
        ChatLib.chat(PREFIX + "&cUsage: /menu <create|edit|display|delete> <name>");
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args[1];

    switch (sub) {
        case "c":
        case "create":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to create");
            ChatLib.command(`menu create ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to edit");
            ChatLib.command(`menu edit ${name}`);
            break;

        case "dis":
        case "display":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to display");
            ChatLib.command(`menu display ${name}`);
            break;

        case "del":
        case "delete":
            if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to delete");
            ChatLib.command(`menu delete ${name}`);
            break;

        default:
            ChatLib.chat(PREFIX + "&cUnknown subcommand. Use create, edit, display, or delete.");
    }
}

// Register both main commands
register("command", handleMenu).setName("menu");
register("command", handleMenu).setName("mn");

// Shortcuts
register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to create");
    ChatLib.command(`menu create ${name}`);
}).setName("mc", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to edit");
    ChatLib.command(`menu edit ${name}`);
}).setName("me", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to display");
    ChatLib.command(`menu display ${name}`);
}).setName("md", true);

register("command", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to delete");
    ChatLib.command(`menu delete ${name}`);
}).setName("mdel", true);
