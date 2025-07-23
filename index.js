/// <reference types="./CTAutocomplete" />

import "./commands/reminder";
import "./commands/party";
import "./commands/var";
import "./commands/help";

import { PREFIX } from "./utils/constants";

// Delay load message by 1 second (1000 milliseconds)
setTimeout(() => {
    ChatLib.chat(PREFIX + "&fv0.1.1 loaded.");
}, 1000);
