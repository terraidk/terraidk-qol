/// <reference types="./CTAutocomplete" />

const PREFIX = "&9[&aterraidk's QoL&r&9]&r ";

register("command", (name) => {
    if (!name) {
        ChatLib.chat(PREFIX + "&cYou must specify a player name to transfer the party to! &7| &7&oNeed help? -> &b/tqol");
        return;
    }
    ChatLib.command(`p transfer ${name}`);
}).setName('pt').setAliases(['ptrans', 'ptransfer', 'ptr']);

register("command", () => {
    ChatLib.command("p disband");
}).setName('pd').setAliases(['pdis', 'pds', 'pdisband', 'pdb']);

register("command", () => {
    ChatLib.command("l housing");
}).setName('lh').setAliases('lobby h');

register("command", () => {
    ChatLib.command("parkour checkpoint");
}).setName('pcp');

register("command", () => {
    ChatLib.command("party warp");
}).setName('pw').setAliases('pwarp');

register("command", (...args) => {
    if (args.length < 2) {
        ChatLib.chat(PREFIX + "&cUsage: /var <global|playername> <list|inc|dec|set|unset> <var> [value] &7| &7&oNeed help? -> &b/tqol");
        return;
    }

    const actions = ["list", "inc", "increment", "dec", "decrement", "set", "unset"];
    let first = args[0]?.toLowerCase();
    let second = args[1]?.toLowerCase();
    let action, target, variable, value;

    // Allow action to be first or second argument
    if (actions.includes(first)) {
        action = first;
        target = args[1];
        variable = args[2];
        value = args[3];
    } else if (actions.includes(second)) {
        target = args[0];
        action = second;
        variable = args[2];
        value = args[3];
    } else {
        ChatLib.chat(PREFIX + "&cInvalid action: must be list, inc, dec, set, or unset. &7| &7&oNeed help? -> &b/tqol");
        return;
    }

    let command;

    if (target.toLowerCase() === "global") {
        if (!variable && action !== "list") {
            ChatLib.chat(PREFIX + "&cMissing variable name. &7| &7&oNeed help? -> &b/tqol");
            return;
        }
        command = `var global ${action}${variable ? " " + variable : ""}${value ? " " + value : ""}`;
    } else {
        const player = target;
        if (!variable && action !== "list") {
            ChatLib.chat(PREFIX + "&cMissing variable name. &7| &7&oNeed help? -> &b/tqol");
            return;
        }
        command = `var player ${action} ${player}${variable ? " " + variable : ""}${value ? " " + value : ""}`;
    }

    ChatLib.command(command);
}).setName("var");

// /selfvar command
register("command", (...args) => {
    if (args.length < 1) {
        ChatLib.chat(PREFIX + "&cUsage: /selfvar <list|inc|dec|set|unset> <var> [value] &7| &7&oNeed help? -> &b/tqol");
        return;
    }

    let action, variable, value;
    const first = args[0]?.toLowerCase();
    const second = args[1]?.toLowerCase();

    if (["list", "inc", "increment", "dec", "decrement", "set", "unset"].includes(first)) {
        action = first;
        variable = args[1];
        value = args[2];
    } else if (["list", "inc", "increment", "dec", "decrement", "set", "unset"].includes(second)) {
        variable = args[0];
        action = second;
        value = args[2];
    } else {
        ChatLib.chat(PREFIX + "&cInvalid action: must be list, inc, dec, set, or unset. &7| &7&oNeed help? -> &b/tqol");
        return;
    }

    const player = Player.getName();

    if (!variable && action !== "list") {
        ChatLib.chat(PREFIX + "&cMissing variable name. &7| &7&oNeed help? -> &b/tqol");
        return;
    }

    const command = `var player ${action} ${player}${variable ? " " + variable : ""}${value ? " " + value : ""}`;
    ChatLib.command(command);
}).setName("selfvar");

const COMMAND_LIST = [
    "&a/pt <player> &7- Transfer party to player",
    "&a/pd &7- Disband party",
    "&a/lh &7- Go to housing lobby",
    "&a/pcp &7- Go to parkour checkpoint",
    "&a/pw &7- Party warp",
    "&a/var <global|playername> <list|inc|dec|set|unset> <var> [value]",
    "&a/selfvar <list|inc|dec|set|unset> <var> [value] &7- Manage your own variables",
    "&a/tqol &7- Show this command list",
];

const COMMANDS_PER_PAGE = 5;

register("command", (...args) => {
    let pageNum = 1;
    let filter = "";

    // Support both [filter] <page> and <page> [filter]
    if (args.length > 0) {
        // Check if last argument is a number (for [filter] <page>)
        const lastArg = args[args.length - 1];
        if (!isNaN(parseInt(lastArg))) {
            pageNum = parseInt(lastArg);
            filter = args.slice(0, -1).join(" ").toLowerCase();
        }
        // Check if first argument is a number (for <page> [filter])
        else if (!isNaN(parseInt(args[0]))) {
            pageNum = parseInt(args[0]);
            filter = args.slice(1).join(" ").toLowerCase();
        } else {
            filter = args.join(" ").toLowerCase();
        }
    }

    // Filter the command list if a filter is provided
    let filteredList = filter
        ? COMMAND_LIST.filter(cmd => cmd.toLowerCase().includes(filter))
        : COMMAND_LIST;

    let maxPage = Math.ceil(filteredList.length / COMMANDS_PER_PAGE);

    // If no filter and no page argument, show page 1 of all commands
    if (args.length === 0) {
        filteredList = COMMAND_LIST;
        pageNum = 1;
    }

    if (pageNum < 1 || pageNum > maxPage || filteredList.length == 0) {
        ChatLib.chat("&cInvalid page number! &7| &7&oNeed help? -> &b/tqol");
        return;
    }

    ChatLib.chat("&f");
    ChatLib.chat("&8&m----------------&r &f" + PREFIX + "&8&m----------------");
    ChatLib.chat("&r          &3Commands &7(Page &e" + pageNum + "&r &7of &6" + maxPage + "&7)");

    let start = (pageNum - 1) * COMMANDS_PER_PAGE;
    let end = start + COMMANDS_PER_PAGE;
    filteredList.slice(start, end).forEach(cmd => ChatLib.chat(cmd));

    ChatLib.chat("&5Use /tqol <page> [filter] to view more or filter.");
    ChatLib.chat("&8&m-----------------------------------------------");
    ChatLib.chat("&f");
}).setName("tqol").setAliases(["tqolhelp", "tqolcmds"]);
