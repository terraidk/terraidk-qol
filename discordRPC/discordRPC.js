/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";

const CLIENT_ID = "1413900772852236399";
let isRPCInitialized = false;
let currentServer = "Unknown";
let startTime = Date.now();
let isInGame = false;

var GLOBAL =
    typeof globalThis !== "undefined"
        ? globalThis
        : typeof global !== "undefined"
        ? global
        : typeof window !== "undefined"
        ? window
        : typeof self !== "undefined"
        ? self
        : this;

var globalThis = GLOBAL;

const File = Java.type("java.io.File");
const URLClassLoader = Java.type("java.net.URLClassLoader");
const URL = Java.type("java.net.URL");
const System = Java.type("java.lang.System");
if (typeof Thread === "undefined") {
    var Thread = Java.type("java.lang.Thread");
}

let rpcLibrary = null;
let updateTimeout = null;

let discordRPCEnabled = true;
const CONFIG_FILE =
    "config/ChatTriggers/modules/terraidk-qol/discordRPC/config.json";

function loadRPCSetting() {
    try {
        if (FileLib.exists(CONFIG_FILE)) {
            const cfg = JSON.parse(FileLib.read(CONFIG_FILE));
            discordRPCEnabled = !!cfg.enabled;
        } else {
            saveRPCSetting();
        }
    } catch (e) {
        discordRPCEnabled = true;
        saveRPCSetting();
    }
}

function saveRPCSetting() {
    try {
        FileLib.write(
            CONFIG_FILE,
            JSON.stringify({ enabled: !!discordRPCEnabled })
        );
    } catch (e) {}
}

function setDiscordRPCEnabled(enabled) {
    enabled = !!enabled;
    if (discordRPCEnabled === enabled) return;
    discordRPCEnabled = enabled;
    saveRPCSetting();
    if (discordRPCEnabled) {
        initializeRPC();
        ChatLib.chat(PREFIX + "&aTQoL Discord RPC enabled");
    } else {
        shutdownRPC();
        ChatLib.chat(PREFIX + "&cTQoL Discord RPC disabled");
    }
}

function toggleDiscordRPC() {
    setDiscordRPCEnabled(!discordRPCEnabled);
}

if (typeof GLOBAL.discordRPCControl === "undefined") {
    GLOBAL.discordRPCControl = {
        isEnabled: () => discordRPCEnabled,
        set: setDiscordRPCEnabled,
        toggle: toggleDiscordRPC,
    };
}

function getModuleFolder() {
    const modulesDir = new File("config/ChatTriggers/modules/");
    const folders = modulesDir.listFiles();
    for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        if (!FileLib.isDirectory(folder)) {
            continue;
        }
        const file = `${folder}/metadata.json`;
        if (!FileLib.exists(file)) {
            continue;
        }
        let metadata;
        try {
            metadata = JSON.parse(FileLib.read(file));
        } catch (e) {
            continue;
        }
        if (metadata.name !== "terraidk's QoL") {
            continue;
        }
        return folder;
    }
    return null;
}

function getLocalVersion() {
    try {
        const moduleFolder = getModuleFolder();
        if (!moduleFolder) {
            return "unknown";
        }
        const localMeta = FileLib.read(`${moduleFolder}/metadata.json`);
        if (localMeta) {
            return JSON.parse(localMeta).version || "unknown";
        }
    } catch (e) {
        return "unknown";
    }
    return "unknown";
}

function loadDiscordRPCLibrary() {
    if (rpcLibrary) return true;

    try {
        const modulePath =
            "config/ChatTriggers/modules/terraidk-qol/discordRPC";
        const jarFile = new File(modulePath + "/discord-rpc.jar");
        if (!jarFile.exists()) return false;

        const is64Bit = System.getProperty("sun.arch.data.model").equals("64");
        const sourceDll = is64Bit
            ? "discord-rpc-x64.dll"
            : "discord-rpc-x86.dll";
        const targetDll = new File(modulePath, "discord-rpc.dll");

        if (!targetDll.exists()) {
            try {
                java.nio.file.Files.copy(
                    new File(modulePath, sourceDll).toPath(),
                    targetDll.toPath(),
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING
                );
            } catch (e) {
                return false;
            }
        }

        try {
            System.load(targetDll.getAbsolutePath());
        } catch (e) {}

        const jarURL = jarFile.toURI().toURL();
        const classLoader = new URLClassLoader(
            [jarURL],
            Thread.currentThread().getContextClassLoader()
        );
        Thread.currentThread().setContextClassLoader(classLoader);

        const DiscordEventHandlers = Java.type(
            "net.arikia.dev.drpc.DiscordEventHandlers"
        );
        const DiscordRichPresence = Java.type(
            "net.arikia.dev.drpc.DiscordRichPresence"
        );
        const DiscordRPC = Java.type("net.arikia.dev.drpc.DiscordRPC");

        rpcLibrary = {
            DiscordRPC,
            DiscordRichPresence,
            DiscordEventHandlers,
            classLoader,
        };

        return true;
    } catch (e) {
        console.log("Failed to load Discord RPC library:", e);
        return false;
    }
}

function initializeRPC() {
    if (isRPCInitialized) return;

    try {
        if (!loadDiscordRPCLibrary()) return;

        if (rpcLibrary) {
            try {
                rpcLibrary.DiscordRPC.discordShutdown();
            } catch (e) {}
        }

        const handlers = new rpcLibrary.DiscordEventHandlers.Builder()
            .setReadyEventHandler((user) => {
                const presence = setupRichPresence();
                if (presence) {
                    rpcLibrary.DiscordRPC.discordUpdatePresence(presence);
                }
            })
            .build();

        rpcLibrary.DiscordRPC.discordInitialize(CLIENT_ID, handlers, true);
        isRPCInitialized = true;
        startTime = Date.now();

        setTimeout(() => {
            const presence = setupRichPresence();
            if (presence) {
                rpcLibrary.DiscordRPC.discordUpdatePresence(presence);
            }
        }, 1000);
    } catch (e) {
        setTimeout(() => {
            isRPCInitialized = false;
            initializeRPC();
        }, 5000);
    }
}

function capitalizeWords(str) {
    return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function getHypixelLocation() {
    if (!isInGame || !Server.getIP()?.includes("hypixel.net")) return null;

    const title = Scoreboard.getTitle();
    if (title) {
        const cleanTitle = ChatLib.removeFormatting(title).trim();
        if (cleanTitle && cleanTitle !== "www.hypixel.net") {
            const properTitle = capitalizeWords(cleanTitle);
            return "Hypixel - " + properTitle;
        }
    }

    return "Hypixel";
}

function setupRichPresence() {
    if (!isRPCInitialized || !rpcLibrary) return null;

    const presence = new rpcLibrary.DiscordRichPresence();
    const playerName = Player.getName();

    const hypixelLocation = getHypixelLocation();

    presence.details = `Playing as ${playerName}`;

    if (hypixelLocation) {
        presence.state = `${hypixelLocation}`;
    } else if (!isInGame) {
        presence.state = `In Main Menu`;
    } else if (currentServer === "Singleplayer") {
        presence.state = `In Singleplayer`;
    } else if (currentServer !== "Unknown") {
        presence.state = `On ${currentServer}`;
    }

    presence.startTimestamp = Math.floor(startTime / 1000);
    presence.largeImageKey = "tqol";
    presence.largeImageText = `v${getLocalVersion()}`;

    return presence;
}

function debouncedUpdatePresence() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
        updatePresence();
    }, 1000);
}

function updatePresence() {
    if (!isRPCInitialized || !rpcLibrary) return;

    try {
        const presence = setupRichPresence();
        if (presence) {
            rpcLibrary.DiscordRPC.discordUpdatePresence(presence);
        }
    } catch (e) {
        isRPCInitialized = false;
        setTimeout(() => initializeRPC(), 2000);
    }
}

function shutdownRPC() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }

    if (isRPCInitialized && rpcLibrary) {
        try {
            rpcLibrary.DiscordRPC.discordShutdown();
            isRPCInitialized = false;
        } catch (e) {}
    }
}

register("worldLoad", () => {
    isInGame = true;
    startTime = Date.now();
    const serverIP = Server.getIP();
    currentServer = serverIP ? serverIP.replace(/:\d+$/, "") : "Singleplayer";
    if (discordRPCEnabled) {
        if (!isRPCInitialized) {
            initializeRPC();
        } else {
            debouncedUpdatePresence();
        }
    }
});

register("worldUnload", () => {
    isInGame = false;
    currentServer = "Unknown";
    debouncedUpdatePresence();
});

register("gameUnload", () => {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }
    shutdownRPC();
});

register("step", () => {
    if (isRPCInitialized && rpcLibrary) {
        debouncedUpdatePresence();
    } else if (discordRPCEnabled && !isRPCInitialized) {
        initializeRPC();
    }
}).setFps(2);
(() => {
    loadRPCSetting();
    if (discordRPCEnabled) initializeRPC();
})();
