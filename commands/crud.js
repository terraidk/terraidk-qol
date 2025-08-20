/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import config, { registerToggledCommand } from "../utils/command_config.js";

// /func main handler
registerToggledCommand("enableFunc", function(...args) {
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
}, "func");

// /fc, /fr, /fe, /fd
registerToggledCommand("enableFuncAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to create");
    ChatLib.command(`function create ${name}`);
}, "fc", true);

registerToggledCommand("enableFuncAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to run");
    ChatLib.command(`function run ${name}`);
}, "fr", true);

registerToggledCommand("enableFuncAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to edit");
    ChatLib.command(`function edit ${name}`);
}, "fe", true);

registerToggledCommand("enableFuncAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a function name to delete");
    ChatLib.command(`function delete ${name}`);
}, "fd", true);

// /region main handler
registerToggledCommand("enableRegion", function(...args) {
    if (!config.enableRegion) return;
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
}, "region");

// /rc, /re, /rd
registerToggledCommand("enableRegionAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to create");
    ChatLib.command(`region create ${name}`);
}, "rc", true);

registerToggledCommand("enableRegionAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to edit");
    ChatLib.command(`region edit ${name}`);
}, "re", true);

registerToggledCommand("enableRegionAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a region name to delete");
    ChatLib.command(`region delete ${name}`);
}, "rd", true);

// handler for /command and /cmd
function handleCommand(...args) {
    if (!config.enableCommand) return;
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

// /command
registerToggledCommand("enableCommand", function(...args) {
    if (!config.enableCommand) return;
    handleCommand(...args);
}, "command");

// /cmd
registerToggledCommand("enableCommand", function(...args) {
    if (!config.enableCommand) return;
    handleCommand(...args);
}, "cmd");

// /cc, /ce, /ca, /cd
registerToggledCommand("enableCommandAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to create");
    ChatLib.command(`command create ${name}`);
}, "cc", true);

registerToggledCommand("enableCommandAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to edit");
    ChatLib.command(`command edit ${name}`);
}, "ce", true);

registerToggledCommand("enableCommandAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to view actions");
    ChatLib.command(`command actions ${name}`);
}, "ca", true);

registerToggledCommand("enableCommandAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a command name to delete");
    ChatLib.command(`command delete ${name}`);
}, "cd", true);

// Main handler for /menu and /mn
function handleMenu(...args) {
    if (!config.enableMenu) return;
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

// /menu
registerToggledCommand("enableMenu", function(...args) {
    if (!config.enableMenu) return;
    handleMenu(...args);
}, "menu");

// /mn
registerToggledCommand("enableMenu", function(...args) {
    if (!config.enableMenu) return;
    handleMenu(...args);
}, "mn");

// /mc, /me, /md, /mdel
registerToggledCommand("enableMenuAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to create");
    ChatLib.command(`menu create ${name}`);
}, "mc", true);

registerToggledCommand("enableMenuAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to edit");
    ChatLib.command(`menu edit ${name}`);
}, "me", true);

registerToggledCommand("enableMenuAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to display");
    ChatLib.command(`menu display ${name}`);
}, "md", true);

registerToggledCommand("enableMenuAliases", (name) => {
    if (!name) return ChatLib.chat(PREFIX + "&cYou must specify a menu name to delete");
    ChatLib.command(`menu delete ${name}`);
}, "mdel", true);
