/// <reference types="../CTAutocomplete" />

const KeyBinding = Java.type("net.minecraft.client.settings.KeyBinding");
if (typeof Keyboard === "undefined") {
    var Keyboard = Java.type("org.lwjgl.input.Keyboard");
}
const CONFIG_FILE =
    "config/ChatTriggers/modules/terraidk-qol/json/keybinds.json";

const DEFAULT_KEYBINDS = {
    functions: 0,
    commands: 0,
    regions: 0,
    eventActions: 0,
    teams: 0,
    menus: 0,
    backFunction: 0,
    backCommand: 0,
    backRegion: 0,
    backMenu: 0,
    backAnything: 0,
    editKey: 0,
    editLoreKey: 0,
    editActionKey: 0,
    shortcutMenu: 0,
    goToLastShortcut: 0,
};

class KeybindConfigManager {
    constructor() {
        this.config = this.loadConfig();
        this.keybinds = {};
        this.isMonitoring = false;
        this.lastKnownKeyCodes = {};
        this.category = "terraidk's QoL";
    }

    loadConfig() {
        try {
            if (!FileLib.exists(CONFIG_FILE)) {
                this.saveConfig(DEFAULT_KEYBINDS);
                return { ...DEFAULT_KEYBINDS };
            }

            const content = FileLib.read(CONFIG_FILE);
            const parsed = JSON.parse(content);

            // Merge with defaults to handle new keybinds
            return { ...DEFAULT_KEYBINDS, ...parsed };
        } catch (e) {
            ChatLib.chat(
                "§c[TQoL] Failed to load keybind config: " + e.message
            );
            return { ...DEFAULT_KEYBINDS };
        }
    }

    saveConfig(config) {
        try {
            const json = JSON.stringify(config || this.config, null, 2);
            FileLib.write(CONFIG_FILE, json);
        } catch (e) {
            ChatLib.chat(
                "§c[TQoL] Failed to save keybind config: " + e.message
            );
        }
    }

    getKeyCode(keybindName) {
        return this.config[keybindName] || 0;
    }

    setKeyCode(keybindName, keyCode) {
        this.config[keybindName] = keyCode;
        this.saveConfig();
    }

    registerKeybind(name, displayName, category) {
        // Check if we already registered this in our manager
        if (this.keybinds[name]) {
            return this.keybinds[name];
        }

        const keyCode = this.getKeyCode(name);
        const defaultKeyCode = DEFAULT_KEYBINDS[name] || 0;
        const gameSettings = Client.getMinecraft().field_71474_y;
        const currentKeybinds = gameSettings.field_74324_K;

        // Check if a keybind with this exact description already exists in Minecraft
        for (let i = 0; i < currentKeybinds.length; i++) {
            const existing = currentKeybinds[i];
            try {
                const existingDesc = existing.func_151464_g(); // getKeyDescription
                if (existingDesc === displayName) {
                    // Found existing keybind, reuse it
                    this.keybinds[name] = existing;
                    this.lastKnownKeyCodes[name] = existing.func_151463_i();

                    // Update the keycode if it changed
                    const currentKeyCode = existing.func_151463_i();
                    if (this.config[name] !== currentKeyCode) {
                        this.config[name] = currentKeyCode;
                        this.saveConfig();
                    }

                    return existing;
                }
            } catch (e) {
                // Skip if we can't read this keybind
                continue;
            }
        }

        // Create a new Minecraft KeyBinding with the DEFAULT keycode (0)
        const keyBinding = new KeyBinding(
            displayName,
            defaultKeyCode,
            category
        );

        // Use reflection to set the actual keycode if different from default
        if (keyCode !== defaultKeyCode) {
            try {
                const Field = Java.type("java.lang.reflect.Field");
                const keyCodeField =
                    KeyBinding.class.getDeclaredField("field_151463_i"); // keyCode field
                keyCodeField.setAccessible(true);
                keyCodeField.setInt(keyBinding, keyCode);
            } catch (e) {
                // If reflection fails, just use the setter method
                keyBinding.func_151462_b(keyCode);
            }
        }

        // Create new array with extra space using Java reflection
        const Array = Java.type("java.lang.reflect.Array");
        const newKeybinds = Array.newInstance(
            KeyBinding.class,
            currentKeybinds.length + 1
        );

        // Copy existing keybinds
        for (let i = 0; i < currentKeybinds.length; i++) {
            newKeybinds[i] = currentKeybinds[i];
        }

        // Add new keybind at the end
        newKeybinds[currentKeybinds.length] = keyBinding;

        // Set the new array
        gameSettings.field_74324_K = newKeybinds;

        // Store reference
        this.keybinds[name] = keyBinding;
        this.lastKnownKeyCodes[name] = keyCode;
        return keyBinding;
    }

    getKeybind(name) {
        return this.keybinds[name];
    }

    getAllKeybinds() {
        return { ...this.keybinds };
    }

    // Monitor for keybind changes while in controls menu
    startMonitoring() {
        this.isMonitoring = true;
        // Store current state
        Object.keys(this.keybinds).forEach((name) => {
            const keybind = this.keybinds[name];
            if (keybind) {
                this.lastKnownKeyCodes[name] = keybind.func_151463_i();
            }
        });
    }

    stopMonitoring() {
        this.isMonitoring = false;
    }

    // Check for changes (called every tick while monitoring)
    checkForChanges() {
        if (!this.isMonitoring) return false;

        let hasChanges = false;

        Object.keys(this.keybinds).forEach((name) => {
            const keybind = this.keybinds[name];
            if (keybind) {
                const currentKeyCode = keybind.func_151463_i();
                const lastKnown = this.lastKnownKeyCodes[name];

                if (currentKeyCode !== lastKnown) {
                    this.config[name] = currentKeyCode;
                    this.lastKnownKeyCodes[name] = currentKeyCode;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            this.saveConfig();
        }

        return hasChanges;
    }

    // Sync keybind changes from Minecraft's controls menu
    syncFromMinecraft() {
        let hasChanges = false;

        Object.keys(this.keybinds).forEach((name) => {
            const keybind = this.keybinds[name];
            if (keybind) {
                const currentKeyCode = keybind.func_151463_i();
                const savedKeyCode = this.config[name];

                if (currentKeyCode !== savedKeyCode) {
                    this.config[name] = currentKeyCode;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            this.saveConfig();
        }

        return hasChanges;
    }

    resetToDefaults() {
        this.config = { ...DEFAULT_KEYBINDS };
        this.saveConfig();
        ChatLib.chat(
            "§a[TQoL] Keybinds reset! Please reload CT (/ct load) for changes to take effect."
        );
    }

    getKeyName(keyCode) {
        if (keyCode === 0) return "None";
        return Keyboard.getKeyName(keyCode) || "Unknown";
    }
}

export const keybindManager = new KeybindConfigManager();
