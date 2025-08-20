import { PREFIX } from "../utils/constants";

const CONFIG_FILE = "config/ChatTriggers/modules/terraidk-qol/command_config.json";

class Config {
    constructor() {
        this.defaults = {
            // Party.js
            enablePartyTransfer: true,
            enablePartyDisband: true,
            enableLobbyHousing: true,
            enableParkourCheckpoint: true,
            enablePartyWarp: true,

            // var.js
            enableVariables: true,
            enableSelfVariables: true,

            // reminder.js
            enableReminders: true,
            enableReminderList: true,

            // crud.js
            enableFunc: true,
            enableFuncAliases: true,
            enableRegion: true,
            enableRegionAliases: true,
            enableCommand: true,
            enableCommandAliases: true,
            enableMenu: true,
            enableMenuAliases: true
        };
        
        this.settings = { ...this.defaults };
        this.load();
    }

    load() {
        try {
            const file = FileLib.read(CONFIG_FILE);
            if (file) {
                const loaded = JSON.parse(file);
                this.settings = { ...this.defaults, ...loaded };
            }
        } catch (e) {
            ChatLib.chat(PREFIX + "&cError loading config, using defaults");
            this.settings = { ...this.defaults };
        }
    }

    save() {
        try {
            FileLib.write(CONFIG_FILE, JSON.stringify(this.settings, null, 2));
        } catch (e) {
            ChatLib.chat(PREFIX + "&cError saving config!");
        }
    }

    get(key) {
        return this.settings[key] !== undefined ? this.settings[key] : this.defaults[key];
    }

    set(key, value) {
        if (this.defaults.hasOwnProperty(key)) {
            this.settings[key] = value;
            this.save();
            return true;
        }
        return false;
    }

    toggle(key) {
        if (this.defaults.hasOwnProperty(key)) {
            this.settings[key] = !this.get(key);
            this.save();
            return this.settings[key];
        }
        return false;
    }

    reset() {
        this.settings = { ...this.defaults };
        this.save();
    }

    // Getters for easy access
    get enablePartyTransfer() { return this.get('enablePartyTransfer'); }
    get enablePartyDisband() { return this.get('enablePartyDisband'); }
    get enableLobbyHousing() { return this.get('enableLobbyHousing'); }
    get enableParkourCheckpoint() { return this.get('enableParkourCheckpoint'); }
    get enablePartyWarp() { return this.get('enablePartyWarp'); }
    get enableVariables() { return this.get('enableVariables'); }
    get enableSelfVariables() { return this.get('enableSelfVariables'); }
    get enableReminders() { return this.get('enableReminders'); }
    get enableReminderList() { return this.get('enableReminderList'); }
    get enableFunc() { return this.get('enableFunc'); }
    get enableFuncAliases() { return this.get('enableFuncAliases'); }
    get enableRegion() { return this.get('enableRegion'); }
    get enableRegionAliases() { return this.get('enableRegionAliases'); }
    get enableCommand() { return this.get('enableCommand'); }
    get enableCommandAliases() { return this.get('enableCommandAliases'); }
    get enableMenu() { return this.get('enableMenu'); }
    get enableMenuAliases() { return this.get('enableMenuAliases'); }

    showConfig() {
        const commands = [
            // Party.js
            { key: 'enablePartyTransfer', name: 'Party Transfer (/pt)' },
            { key: 'enablePartyDisband', name: 'Party Disband (/pd)' },
            { key: 'enableLobbyHousing', name: 'Lobby Housing (/lh)' },
            { key: 'enableParkourCheckpoint', name: 'Parkour Checkpoint (/pcp)' },
            { key: 'enablePartyWarp', name: 'Party Warp (/pw)' },

            // var.js
            { key: 'enableVariables', name: 'Variables (/var)' },
            { key: 'enableSelfVariables', name: 'Self Variables (/selfvar)' },

            // reminder.js
            { key: 'enableReminders', name: 'Reminders (/remind)' },
            { key: 'enableReminderList', name: 'Reminder List (/reminders)' },

            // crud.js
            { key: 'enableFunc', name: 'Function Main (/func)' },
            { key: 'enableFuncAliases', name: 'Function Aliases (/fc, /fr, /fe, /fd)' },
            { key: 'enableRegion', name: 'Region Main (/region)' },
            { key: 'enableRegionAliases', name: 'Region Aliases (/rc, /re, /rd)' },
            { key: 'enableCommand', name: 'Command Main (/command, /cmd)' },
            { key: 'enableCommandAliases', name: 'Command Aliases (/cc, /ce, /ca, /cd)' },
            { key: 'enableMenu', name: 'Menu Main (/menu, /mn)' },
            { key: 'enableMenuAliases', name: 'Menu Aliases (/mc, /me, /md, /mdel)' }
        ];

        ChatLib.chat("&8&m----------------&r " + "&9[&aterraidk's QoL Config&r&9]&r " + "&8&m----------------");
        ChatLib.chat("&3Command Toggles:");
        
        commands.forEach((cmd, index) => {
            const enabled = this.get(cmd.key);
            const status = enabled ? "&a✓ Enabled" : "&c✗ Disabled";
            ChatLib.chat(`&7${index + 1}. &e${cmd.name} &7- ${status}`);
        });

        ChatLib.chat("");
        ChatLib.chat("&6Usage:");
        ChatLib.chat("&a/tqol config toggle <number> &7- Toggle command on/off");
        ChatLib.chat("&a/tqol config reset &7- Reset all to defaults");
        ChatLib.chat("&8&m-----------------------------------------------");
    }

    handleConfigCommand(args) {
        if (args.length === 0) {
            this.showConfig();
            return;
        }

        const commands = [
            // Party.js
            { key: 'enablePartyTransfer', name: 'Party Transfer (/pt)' },
            { key: 'enablePartyDisband', name: 'Party Disband (/pd)' },
            { key: 'enableLobbyHousing', name: 'Lobby Housing (/lh)' },
            { key: 'enableParkourCheckpoint', name: 'Parkour Checkpoint (/pcp)' },
            { key: 'enablePartyWarp', name: 'Party Warp (/pw)' },

            // var.js
            { key: 'enableVariables', name: 'Variables (/var)' },
            { key: 'enableSelfVariables', name: 'Self Variables (/selfvar)' },

            // reminder.js
            { key: 'enableReminders', name: 'Reminders (/remind)' },
            { key: 'enableReminderList', name: 'Reminder List (/reminders)' },

            // crud.js
            { key: 'enableFunc', name: 'Function Main (/func)' },
            { key: 'enableFuncAliases', name: 'Function Aliases (/fc, /fr, /fe, /fd)' },
            { key: 'enableRegion', name: 'Region Main (/region)' },
            { key: 'enableRegionAliases', name: 'Region Aliases (/rc, /re, /rd)' },
            { key: 'enableCommand', name: 'Command Main (/command, /cmd)' },
            { key: 'enableCommandAliases', name: 'Command Aliases (/cc, /ce, /ca, /cd)' },
            { key: 'enableMenu', name: 'Menu Main (/menu, /mn)' },
            { key: 'enableMenuAliases', name: 'Menu Aliases (/mc, /me, /md, /mdel)' }
        ];

        if (args[0] === "toggle" && args[1]) {
            const num = parseInt(args[1]);
            if (num >= 1 && num <= commands.length) {
                const cmd = commands[num - 1];
                const newState = this.toggle(cmd.key);
                const status = newState ? "&aEnabled" : "&cDisabled";
                ChatLib.chat(PREFIX + `${status} &7${cmd.name}`);
                if (newState) {
                    World.playSound("random.orb", 1, 1.2); 
                } else {
                    World.playSound("random.orb", 1, 0.7);
                }
                ChatLib.chat(PREFIX + "&b/ct reload &crequired for changes to take effect!");
            } else {
                World.playSound("mob.endermen.portal", 1, 0.5);
                ChatLib.chat(PREFIX + "&cInvalid command number! Use 1-" + commands.length);
            }
        } else if (args[0] === "reset") {
            this.reset();
            ChatLib.chat(PREFIX + "&aConfig reset to defaults!");
            World.playSound("note.bass", 2, 0.6); 
            ChatLib.chat(PREFIX + "&b/ct reload &crequired for changes to take effect!");
        } else {
            World.playSound("mob.endermen.portal", 1, 0.5);
            ChatLib.chat(PREFIX + "&cUsage: /tqol config [toggle <1-" + commands.length + ">|reset]");
        }
    }
}

/**
 * Conditionally register a command if enabled in config.
 * @param {string} configKey - The config key to check (e.g. "enableFunc")
 * @param {function} handler - The command handler function
 * @param {string} name - The command name
 * @param {boolean|string[]} [aliases] - Optional: true for alias, or array of aliases
 */
export function registerToggledCommand(configKey, handler, name, aliases) {
    if (!config.get(configKey)) return;
    let cmd = register("command", handler).setName(name, !!aliases && aliases === true);
    if (Array.isArray(aliases)) cmd.setAliases(...aliases);
    return cmd;
}

const config = new Config();
export default config;