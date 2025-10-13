/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants.js";

register("command", (name) => {
    if (!name) {
        ChatLib.chat(
            PREFIX +
                "&cYou must specify a player name to transfer the party to! &7| &7&oNeed help? -> &b/tqol help"
        );
        playFailSound();
        return;
    }
    ChatLib.command(`p transfer ${name}`);
})
    .setName("pt")
    .setAliases("ptrans", "ptransfer", "ptr");

register("command", () => {
    ChatLib.command("p disband");
})
    .setName("pd")
    .setAliases("pdis", "pds", "pdisband", "pdb");

register("command", () => {
    ChatLib.command("l housing");
}).setName("lh");

register("command", () => {
    ChatLib.command("parkour checkpoint");
    ChatLib.chat(
        PREFIX +
            "&aYou have been teleported to the last checkpoint in your current parkour course! &7| &7&oNeed help? -> &b/tqol help"
    );
}).setName("pcp");

register("command", () => {
    ChatLib.command("party warp");
})
    .setName("pw")
    .setAliases("pwarp");
