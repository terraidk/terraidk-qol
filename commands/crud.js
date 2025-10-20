/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants.js";

if (typeof Keyboard === "undefined") {
    var Keyboard = Java.type("org.lwjgl.input.Keyboard");
}

register("command", function (...args) {
    if (!args || args.length === 0) {
        playFailSound();
        ChatLib.chat(PREFIX + "&cUsage: /func <create|run|edit|delete> <name>");
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args.slice(1).join(" ");

    switch (sub) {
        case "c":
        case "create":
            if (!name) {
                playFailSound();
                ChatLib.chat(
                    PREFIX + "&cYou must specify a function name to create"
                );
                return;
            }
            ChatLib.command(`function create ${name}`);
            break;

        case "r":
        case "run":
            if (!name) {
                playFailSound();
                ChatLib.chat(
                    PREFIX + "&cYou must specify a function name to run"
                );
                return;
            }
            ChatLib.command(`function run ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) {
                playFailSound();
                ChatLib.chat(
                    PREFIX + "&cYou must specify a function name to edit"
                );
                return;
            }
            ChatLib.command(`function edit ${name}`);
            break;

        case "d":
        case "del":
        case "delete":
            if (!name) {
                playFailSound();
                ChatLib.chat(
                    PREFIX + "&cYou must specify a function name to delete"
                );
                return;
            }
            ChatLib.command(`function delete ${name}`);
            break;

        default:
            playFailSound();
            ChatLib.chat(
                PREFIX + "&cUnknown subcommand. Use create, run, or delete."
            );
    }
}).setName("func");

// /fc, /fr, /fe, /fd
register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a function name to create"
        );
    }
    ChatLib.command(`function create ${name}`);
}).setName("fc");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a function name to run"
        );
    }
    ChatLib.command(`function run ${name}`);
}).setName("fr");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a function name to edit"
        );
    }
    ChatLib.command(`function edit ${name}`);
}).setName("fe");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a function name to delete"
        );
    }
    ChatLib.command(`function delete ${name}`);
}).setName("fd");

register("command", function (...args) {
    if (!args || args.length === 0) {
        playFailSound();
        ChatLib.chat(PREFIX + "&cUsage: /region <create|edit|delete> <name>");
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args.slice(1).join(" ");

    switch (sub) {
        case "c":
        case "create":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a region name to create"
                );
            }
            ChatLib.command(`region create ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a region name to edit"
                );
            }
            ChatLib.command(`region edit ${name}`);
            break;

        case "d":
        case "del":
        case "delete":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a region name to delete"
                );
            }
            ChatLib.command(`region delete ${name}`);
            break;

        default:
            playFailSound();
            ChatLib.chat(
                PREFIX + "&cUnknown subcommand. Use create, edit, or delete."
            );
    }
}).setName("region");

// /rc, /re, /rd
register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a region name to create"
        );
    }
    ChatLib.command(`region create ${name}`);
}).setName("rc");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a region name to edit"
        );
    }
    ChatLib.command(`region edit ${name}`);
}).setName("re");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a region name to delete"
        );
    }
    ChatLib.command(`region delete ${name}`);
}).setName("rd");

// handler for /command and /cmd
function handleCommand(...args) {
    if (!args || args.length === 0) {
        playFailSound();
        ChatLib.chat(
            PREFIX + "&cUsage: /command <create|edit|actions|delete> <name>"
        );
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args.slice(1).join(" ");

    switch (sub) {
        case "c":
        case "cr":
        case "create":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a command name to create"
                );
            }
            ChatLib.command(`command create ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a command name to edit"
                );
            }
            ChatLib.command(`command edit ${name}`);
            break;

        case "a":
        case "action":
        case "act":
        case "actions":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a command name to view actions"
                );
            }
            ChatLib.command(`command actions ${name}`);
            break;

        case "d":
        case "del":
        case "delete":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a command name to delete"
                );
            }
            ChatLib.command(`command delete ${name}`);
            break;

        default:
            playFailSound();
            ChatLib.chat(
                PREFIX +
                    "&cUnknown subcommand. Use create, edit, actions, or delete."
            );
    }
}

// /command
register("command", function (...args) {
    handleCommand(...args);
}).setName("command");

// /cmd
register("command", function (...args) {
    handleCommand(...args);
}).setName("cmd");

// /cc, /ce, /ca, /cd - These don't need fixing since commands don't need multi-word support
register("command", (name) => {
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a command name to create"
        );
    }
    ChatLib.command(`command create ${name}`);
}).setName("cc");

register("command", (name) => {
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a command name to edit"
        );
    }
    ChatLib.command(`command edit ${name}`);
}).setName("ce");

register("command", (name) => {
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a command name to view actions"
        );
    }
    ChatLib.command(`command actions ${name}`);
}).setName("ca");

register("command", (name) => {
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a command name to delete"
        );
    }
    ChatLib.command(`command delete ${name}`);
}).setName("cd");

function handleMenu(...args) {
    if (!args || args.length === 0) {
        playFailSound();
        ChatLib.chat(
            PREFIX + "&cUsage: /menu <create|edit|display|delete> <name>"
        );
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args.slice(1).join(" ");

    switch (sub) {
        case "c":
        case "create":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a menu name to create"
                );
            }
            ChatLib.command(`menu create ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a menu name to edit"
                );
            }
            ChatLib.command(`menu edit ${name}`);
            break;

        case "dis":
        case "display":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a menu name to display"
                );
            }
            ChatLib.command(`menu display ${name}`);
            break;

        case "del":
        case "delete":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a menu name to delete"
                );
            }
            ChatLib.command(`menu delete ${name}`);
            break;

        default:
            playFailSound();
            ChatLib.chat(
                PREFIX +
                    "&cUnknown subcommand. Use create, edit, display, or delete."
            );
    }
}

// /menu
register("command", function (...args) {
    handleMenu(...args);
}).setName("menu");

// /mn
register("command", function (...args) {
    handleMenu(...args);
}).setName("mn");

// /mc, /me, /md, /mdel
register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a menu name to create"
        );
    }
    ChatLib.command(`menu create ${name}`);
}).setName("mc");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(PREFIX + "&cYou must specify a menu name to edit");
    }
    ChatLib.command(`menu edit ${name}`);
}).setName("me");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a menu name to display"
        );
    }
    ChatLib.command(`menu display ${name}`);
}).setName("md");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a menu name to delete"
        );
    }
    ChatLib.command(`menu delete ${name}`);
}).setName("mdel");

function handleLayout(...args) {
    if (!args || args.length === 0) {
        playFailSound();
        ChatLib.chat(PREFIX + "&cUsage: /layout <create|edit|delete> <name>");
        return;
    }

    let sub = args[0] ? args[0].toLowerCase() : "";
    let name = args.slice(1).join(" ");

    switch (sub) {
        case "c":
        case "create":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a layout name to create"
                );
            }
            ChatLib.command(`layout create ${name}`);
            break;

        case "e":
        case "edit":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a layout name to edit"
                );
            }
            ChatLib.command(`layout edit ${name}`);
            break;

        case "d":
        case "del":
        case "delete":
            if (!name) {
                playFailSound();
                return ChatLib.chat(
                    PREFIX + "&cYou must specify a layout name to delete"
                );
            }
            ChatLib.command(`layout delete ${name}`);
            break;

        default:
            playFailSound();
            ChatLib.chat(
                PREFIX + "&cUnknown subcommand. Use create, edit, or delete."
            );
    }
}

// /layout
register("command", function (...args) {
    handleLayout(...args);
}).setName("layout");

// /lc, /le, /ld
register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a layout name to create"
        );
    }
    ChatLib.command(`layout create ${name}`);
}).setName("lc");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a layout name to edit"
        );
    }
    ChatLib.command(`layout edit ${name}`);
}).setName("le");

register("command", (...args) => {
    const name = args.join(" ");
    if (!name) {
        playFailSound();
        return ChatLib.chat(
            PREFIX + "&cYou must specify a layout name to delete"
        );
    }
    ChatLib.command(`layout delete ${name}`);
}).setName("ld");

register("chat", (message, event) => {
    if (
        message.includes(
            "Please use the chat to provide the value you wish to set"
        )
    ) {
        try {
            ChatLib.command("chat a");
            const mc = Client.getMinecraft();
            const keyBindChat = mc.field_71474_y.field_74310_D; // gameSettings.keyBindChat
            const chatKeyCode = keyBindChat.func_151463_i(); // getKeyCode()

            const KeyBinding = Java.type(
                "net.minecraft.client.settings.KeyBinding"
            );
            KeyBinding.func_74510_a(chatKeyCode, true); // setKeyBindState(keyCode, true)
            KeyBinding.func_74507_a(chatKeyCode); // onTick(keyCode)
        } catch (e) {}
    }
}).setCriteria("${message}");
