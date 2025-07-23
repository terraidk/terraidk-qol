/// <reference types="../CTAutocomplete" />
import { PREFIX } from "../utils/constants";

const COMMAND_LIST = [
    "&a/pt <player> &7- Transfer party to player",
    "&a/pd &7- Disband party",
    "&a/lh &7- Go to housing lobby",
    "&a/pcp &7- Go to parkour checkpoint",
    "&a/pw &7- Party warp",
    "&a/var <global|playername> <list|inc|dec|set|unset> <var> [value]",
    "&a/selfvar <list|inc|dec|set|unset> <var> [value] &7- Manage your own variables",
    "&a/remind <1h 20m | HH:MM[am/pm]> <message> &7- Set a reminder",
    "&a/reminders &7- View/edit/delete reminders",
    "&a/tqol &7- Show this command list",
];

const COMMANDS_PER_PAGE = 5;

register("command", (...args) => {
    if (!Array.isArray(args)) args = [];

    let pageNum = 1;
    let filter = "";

    if (args.length > 0) {
        const last = args[args.length - 1];
        if (!isNaN(parseInt(last))) {
            pageNum = parseInt(last);
            filter = args.slice(0, -1).join(" ").toLowerCase();
        } else if (!isNaN(parseInt(args[0]))) {
            pageNum = parseInt(args[0]);
            filter = args.slice(1).join(" ").toLowerCase();
        } else {
            filter = args.join(" ").toLowerCase();
        }
    }

    const filtered = filter
        ? COMMAND_LIST.filter(cmd => cmd.toLowerCase().includes(filter))
        : COMMAND_LIST;

    const maxPage = Math.max(1, Math.ceil(filtered.length / COMMANDS_PER_PAGE));

    if (pageNum < 1 || pageNum > maxPage || filtered.length === 0) {
        ChatLib.chat("&cInvalid page number! &7| &7&oNeed help? -> &b/tqol");
        return;
    }

    ChatLib.chat("&8&m----------------&r " + "&9[&aterraidk's QoL&r&9]&r " + "&8&m----------------");
    ChatLib.chat(`&r                 &3Commands &7(Page &e${pageNum}&7 of &6${maxPage}&7)`);

    filtered
        .slice((pageNum - 1) * COMMANDS_PER_PAGE, pageNum * COMMANDS_PER_PAGE)
        .forEach(cmd => ChatLib.chat(cmd));

    ChatLib.chat("&5Use /tqol <page> [filter] to view more or filter.");
    ChatLib.chat("&8&m-----------------------------------------------");
}).setName("tqol").setAliases(["tqolhelp", "tqolcmds"]);
