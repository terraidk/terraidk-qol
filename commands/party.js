/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants.js";

import config, { registerToggledCommand } from "../utils/command_config.js";

registerToggledCommand(
  "enablePartyTransfer",
  (name) => {
    if (!name) {
      ChatLib.chat(
        PREFIX +
          "&cYou must specify a player name to transfer the party to! &7| &7&oNeed help? -> &b/tqol help"
      );
      playFailSound();
      return;
    }
    ChatLib.command(`p transfer ${name}`);
  },
  "pt",
  ["ptrans", "ptransfer", "ptr"],
  true
);

registerToggledCommand(
  "enablePartyDisband",
  () => {
    ChatLib.command("p disband");
  },
  "pd",
  ["pdis", "pds", "pdisband", "pdb"]
);

registerToggledCommand(
  "enableLobbyHousing",
  () => {
    ChatLib.command("l housing");
  },
  "lh"
);

registerToggledCommand(
  "enableParkourCheckpoint",
  () => {
    ChatLib.command("parkour checkpoint");
    ChatLib.chat(
      PREFIX +
        "&aYou have been teleported to the last checkpoint in your current parkour course! &7| &7&oNeed help? -> &b/tqol help"
    );
  },
  "pcp"
);

registerToggledCommand(
  "enablePartyWarp",
  () => {
    ChatLib.command("party warp");
  },
  "pw",
  ["pwarp"]
);
