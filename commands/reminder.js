/// <reference types="../CTAutocomplete" />

import { PREFIX } from "../utils/constants";
import { playFailSound } from "../utils/constants.js";

const reminderFile = new java.io.File(
    "config/ChatTriggers/modules/terraidk-qol/reminders.json"
);
let reminders = loadReminders();
let lastClearAllAttempt = 0;

function saveReminders() {
    try {
        const json = JSON.stringify(reminders);
        FileLib.write(reminderFile, json);
    } catch (e) {
        playFailSound();
        ChatLib.chat(PREFIX + "&cFailed to save reminders.");
    }
}

function loadReminders() {
    try {
        if (!reminderFile.exists()) return [];
        const content = FileLib.read(reminderFile);
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
            return parsed.map((r) => ({
                msg: r.msg,
                time: r.time,
                triggered: false,
            }));
        }
        return [];
    } catch (e) {
        return [];
    }
}

function parseTime(args) {
    if (
        !Array.isArray(args) ||
        args.length === 0 ||
        typeof args[0] !== "string"
    )
        return null;

    let totalMs = 0;
    let i = 0;

    if (args[0].toLowerCase() === "in") i = 1;

    while (i < args.length) {
        let match = args[i]?.match(/^(\d+)(h|m|s)$/i);
        if (match) {
            let value = parseInt(match[1]);
            let unit = match[2].toLowerCase();
            if (unit === "h") totalMs += value * 3600000;
            else if (unit === "m") totalMs += value * 60000;
            else if (unit === "s") totalMs += value * 1000;
            i++;
        } else {
            break;
        }
    }

    if (totalMs > 0) {
        return { ms: totalMs, msg: args.slice(i).join(" ") };
    }

    let timeStr = args[0]?.toLowerCase();
    if (!timeStr) return null;

    let now = new Date();
    let timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(am|pm)?$/);
    if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        let min = parseInt(timeMatch[2]);
        let ampm = timeMatch[3];
        if (ampm === "pm" && hour < 12) hour += 12;
        if (ampm === "am" && hour === 12) hour = 0;
        let target = new Date(now);
        target.setHours(hour, min, 0, 0);
        if (target <= now) target.setTime(target.getTime() + 86400000);
        return { ms: target - now, msg: args.slice(1).join(" ") };
    }

    return null;
}

function formatDuration(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    let parts = [];
    if (hours > 0) parts.push(hours + "h");
    if (minutes > 0) parts.push(minutes + "m");
    if (seconds > 0) parts.push(seconds + "s");
    return parts.length > 0 ? parts.join(" ") : "0s";
}

function addReminder(ms, msg) {
    const time = Date.now() + ms;
    reminders.push({ msg, time, triggered: false });
    saveReminders();
    return reminders.length;
}

register("step", () => {
    const now = Date.now();
    let changed = false;

    for (let i = 0; i < reminders.length; i++) {
        const r = reminders[i];
        if (!r.triggered && r.time <= now) {
            ChatLib.chat(PREFIX + "&eReminder: &r" + r.msg);
            World.playSound("random.orb", 1, 1);
            r.triggered = true;
            changed = true;
        }
    }

    if (changed) {
        reminders = reminders.filter((r) => !r.triggered);
        saveReminders();
    }
}).setDelay(1);

register("command", (...args) => {
    if (!Array.isArray(args) || args.length < 1) {
        playFailSound();
        ChatLib.chat(
            PREFIX + "&cUsage: /remind <1h 20m | HH:MM[am/pm]> <message>"
        );
        return;
    }

    let parsed = parseTime(args);
    if (!parsed || parsed.ms <= 0) {
        playFailSound();
        ChatLib.chat(PREFIX + "&cInvalid time format!");
        World.playSound("mob.endermen.portal", 0.5, 0.5);
        return;
    }

    let msg = parsed.msg || "Reminder!";
    let formattedTime = formatDuration(parsed.ms);
    addReminder(parsed.ms, msg);
    ChatLib.chat(
        PREFIX +
            `&aReminder set for &b${formattedTime}&a: &e${msg}&a. &7&o/reminders to view.`
    );
    World.playSound("random.orb", 0.7, 2);
})
    .setName("remind")
    .setAliases("reminder", "remindme");

register("command", (...args) => {
    if (!Array.isArray(args)) args = [];

    reminders = reminders.filter((r) => Date.now() < r.time && !r.triggered);
    reminders.sort((a, b) => a.time - b.time);
    saveReminders();

    if (args.length === 0) {
        if (reminders.length === 0) {
            ChatLib.chat(PREFIX + "&7No active reminders.");
            World.playSound("note.pling", 1, 2);
            return;
        }

        ChatLib.chat(PREFIX + "&aActive Reminders:");
        reminders.forEach((r, i) => {
            let timeLeft = r.time - Date.now();
            let formattedTime = formatDuration(timeLeft);
            ChatLib.chat(`&b${i + 1}. &e${r.msg} &7(in ${formattedTime})`);
        });
        ChatLib.chat(
            "&7&o/reminders [delete <#> | edit <#> <new message/time> | clearall]"
        );
        World.playSound("note.pling", 1, 2);
        return;
    }

    const sub = args[0].toLowerCase();

    if (sub === "delete" && args[1]) {
        const idx = parseInt(args[1]) - 1;
        if (isNaN(idx) || idx < 0 || idx >= reminders.length) {
            ChatLib.chat(PREFIX + "&cInvalid reminder number.");
            playFailSound();
            World.playSound("mob.endermen.portal", 0.5, 0.5);
            return;
        }
        reminders.splice(idx, 1);
        saveReminders();
        ChatLib.chat(PREFIX + `&aDeleted reminder #${idx + 1}.`);
        World.playSound("note.bass", 1, 1);
        return;
    }

    if (sub === "edit" && args[1] && args.length > 2) {
        const idx = parseInt(args[1]) - 1;
        if (isNaN(idx) || idx < 0 || idx >= reminders.length) {
            ChatLib.chat(PREFIX + "&cInvalid reminder number.");
            World.playSound("mob.endermen.portal", 0.5, 0.5);
            return;
        }

        const editArgs = args.slice(2);
        let timeMs = null;
        let msgParts = [];

        for (let i = 0; i < editArgs.length; i++) {
            const tryTime = parseTime([editArgs[i]]);
            if (tryTime && tryTime.ms > 0 && timeMs === null) {
                timeMs = tryTime.ms;
            } else {
                msgParts.push(editArgs[i]);
            }
        }

        const newMsg = msgParts.join(" ").trim();
        if (newMsg.length > 0) {
            reminders[idx].msg = newMsg;
        }

        if (timeMs !== null) {
            reminders[idx].time = Date.now() + timeMs;
        }

        if (timeMs !== null && newMsg.length > 0) {
            ChatLib.chat(
                PREFIX +
                    `&aEdited reminder #${
                        idx + 1
                    }: &e${newMsg} &7(in ${formatDuration(timeMs)})`
            );
        } else if (timeMs !== null) {
            ChatLib.chat(
                PREFIX +
                    `&aEdited reminder #${idx + 1} time: &7(in ${formatDuration(
                        timeMs
                    )})`
            );
        } else if (newMsg.length > 0) {
            ChatLib.chat(PREFIX + `&aEdited reminder #${idx + 1}: &e${newMsg}`);
        } else {
            ChatLib.chat(PREFIX + "&cNo valid changes provided.");
            return;
        }

        saveReminders();
        World.playSound("note.harp", 1, 1.2);
        return;
    }

    if (sub === "clearall") {
        const now = Date.now();
        if (now - lastClearAllAttempt < 10000) {
            reminders = [];
            saveReminders();
            ChatLib.chat(PREFIX + "&eAll reminders cleared.");
            World.playSound("random.break", 1, 1);
        } else {
            lastClearAllAttempt = now;
            ChatLib.chat(
                PREFIX +
                    "&6Run &b/reminders clearall &6again within 10 seconds to confirm."
            );
            World.playSound("note.snare", 1, 1);
        }
        return;
    }

    ChatLib.chat(
        PREFIX +
            "&cUsage: /reminders [delete <#> | edit <#> <new message/time> | clearall]"
    );
}).setName("reminders");
