/// <reference types="./CTAutocomplete" />

import "./commands/reminder";
import "./commands/party";
import "./commands/var";
import "./commands/help";
import "./commands/hotkeys";
import "./commands/crud";


import { PREFIX } from "./utils/constants";

// Delay load message by 1 second (1000 milliseconds)
setTimeout(() => {
    ChatLib.chat(PREFIX + "&fv0.1.3 loaded.");
    ChatLib.chat(PREFIX + "&fChangelog:");
    ChatLib.chat(PREFIX + "https://github.com/terraidk/terraidk-qol/releases/tag/v0.1.3");
}, 1000);
