/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";

register("command", (name) => {
    if (!name) {
        ChatLib.chat(PREFIX + "&cYou must specify a player name to transfer the party to! &7| &7&oNeed help? -> &b/tqol");
        return;
    }
    ChatLib.command(`p transfer ${name}`);
}).setName('pt', true).setAliases(['ptrans', 'ptransfer', 'ptr']);

register("command", () => {
    ChatLib.command("p disband");
}).setName('pd').setAliases(['pdis', 'pds', 'pdisband', 'pdb']);

register("command", () => {
    ChatLib.command("l housing");
}).setName('lh').setAliases('');

register("command", () => {
    ChatLib.command("parkour checkpoint");
}).setName('pcp');

register("command", () => {
    ChatLib.command("party warp");
}).setName('pw').setAliases('pwarp');
