/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants";
import config, { registerToggledCommand } from "../utils/command_config.js";

const actions = [
    "list",
    "inc",
    "increment",
    "dec",
    "decrement",
    "set",
    "unset",
];

registerToggledCommand(
    "enableVariables",
    (...args) => {
        if (!args || args.length < 2) {
            playFailSound();
            ChatLib.chat(
                PREFIX +
                    "&cUsage: /var <global|playername> <list|inc|dec|set|unset> <var> [value] &7| &7&oNeed help? -> &b/tqol"
            );
            return;
        }

        let target, action, variable, value;

        const [first, second] = args.map((a) => a.toLowerCase());

        if (first === "global" || first === Player.getName().toLowerCase()) {
            target = first;
            if (actions.includes(second)) {
                action = second;
                variable = args[2];
                value = args[3];
            } else {
                variable = second;
                action = args[2]?.toLowerCase();
                value = args[3];
            }
        } else if (actions.includes(first)) {
            action = first;
            target = args[1];
            variable = args[2];
            value = args[3];
        } else {
            target = first;
            action = second;
            variable = args[2];
            value = args[3];
        }

        if (!actions.includes(action)) {
            playFailSound();
            ChatLib.chat(
                PREFIX +
                    "&cInvalid action: must be list, inc, dec, set or unset."
            );
            return;
        }

        if (!variable && action !== "list") {
            playFailSound();
            ChatLib.chat(PREFIX + "&cMissing variable name.");
            return;
        }

        const isGlobal = target.toLowerCase() === "global";
        const cmd = `var ${isGlobal ? "global" : "player"} ${action} ${
            isGlobal ? "" : target
        }${variable ? " " + variable : ""}${value ? " " + value : ""}`;
        ChatLib.command(cmd.trim());
    },
    "var"
);

// /selfvar command (for current player)
registerToggledCommand(
    "enableSelfVariables",
    (...args) => {
        const player = Player.getName();
        if (!args || args.length < 1) {
            playFailSound();
            ChatLib.chat(
                PREFIX +
                    "&cUsage: /selfvar <list|inc|dec|set|unset> <var> [value]"
            );
            return;
        }

        let action, variable, value;
        const [first, second] = args.map((a) => a.toLowerCase());

        if (actions.includes(first)) {
            action = first;
            variable = args[1];
            value = args[2];
        } else if (actions.includes(second)) {
            variable = first;
            action = second;
            value = args[2];
        } else {
            playFailSound();
            ChatLib.chat(PREFIX + "&cInvalid action.");
            return;
        }

        if (!variable && action !== "list") {
            playFailSound();
            ChatLib.chat(PREFIX + "&cMissing variable name.");
            return;
        }

        const cmd = `var player ${action} ${player}${
            variable ? " " + variable : ""
        }${value ? " " + value : ""}`;
        ChatLib.command(cmd.trim());
    },
    "selfvar"
);
