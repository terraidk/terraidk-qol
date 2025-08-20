/// <reference types="./CTAutocomplete" />

import "./commands/reminder";
import "./commands/party";
import "./commands/var";
import "./commands/help";
import "./commands/hotkeys";
import "./commands/crud";
import "./menus/shortcuts";

import { PREFIX } from "./utils/constants";

// Delay load message by 1 second (1000 milliseconds)
setTimeout(() => {
    ChatLib.chat(PREFIX + "&fv0.2.0 loaded.");
    ChatLib.chat(PREFIX + "&fChangelog:");
    ChatLib.chat(PREFIX + "https://github.com/terraidk/terraidk-qol/releases/v0.2.0");
}, 1000);
