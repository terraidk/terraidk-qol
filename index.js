/// <reference types="./CTAutocomplete" />

import "./commands/reminder";
import "./commands/party";
import "./commands/var";
import "./commands/help";
import "./commands/hotkeys";
import "./commands/crud";
import "./menus/shortcuts";

import { PREFIX } from "./utils/constants";

// Read local version from metadata.json
let LOCAL_VERSION = "unknown";
try {
    const localMeta = FileLib.read("config/ChatTriggers/modules/terraidk-qol/metadata.json");
    if (localMeta) {
        LOCAL_VERSION = JSON.parse(localMeta).version || "unknown";
    }
} catch (e) {}

const LATEST_VERSION_URL = "https://raw.githubusercontent.com/terraidk/terraidk-qol/main/metadata.json";

// Delay load message by 0.5 second (500 milliseconds)
setTimeout(() => {
  ChatLib.chat(
    new TextComponent(PREFIX + "&f" + LOCAL_VERSION + " Loaded successfully. | " + "&b&nChangelog")
      .setClick('open_url', 'https://github.com/terraidk/terraidk-qol/releases/v' + LOCAL_VERSION)
      .setHover('show_text', '&fClick to view &aTQoL&f on &9&lGitHub')
  )
}, 500)

function checkForUpdate() {
    new Thread(() => {
        try {
            const content = FileLib.getUrlContent(LATEST_VERSION_URL);
            let latestVersion = null;
            if (content) {
                latestVersion = JSON.parse(content).version;
            }
            if (latestVersion && latestVersion !== LOCAL_VERSION) {
                ChatLib.chat(
                    new TextComponent("&cA new version of &aTQoL&c is available! &7[&eClick to update&7]")
                        .setClick("open_url", "https://github.com/terraidk/terraidk-qol/releases/latest")
                        .setHover("show_text", "&aClick to download the latest version\n&7Current: &c" + LOCAL_VERSION + "\n&7Latest: &a" + latestVersion)
                );
            }
        } catch (e) {
        }
    }).start();
}
setTimeout(checkForUpdate, 2000);
