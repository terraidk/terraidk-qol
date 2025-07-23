module.exports = function parseTime(args) {
    if (args[0] === "in") {
        let totalMs = 0;
        let i = 1;
        for (; i < args.length; i++) {
            let match = args[i].match(/^(\d+)(h|m)$/i);
            if (match) {
                let value = parseInt(match[1]);
                let unit = match[2].toLowerCase();
                if (unit === "h") totalMs += value * 60 * 60 * 1000;
                if (unit === "m") totalMs += value * 60 * 1000;
            } else {
                break;
            }
        }
        return { ms: totalMs, msg: args.slice(i).join(" ") };
    }

    let timeStr = args[0].toLowerCase();
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
        if (target <= now) target.setTime(target.getTime() + 86400000); // Next day
        return { ms: target - now, msg: args.slice(1).join(" ") };
    }
    return null;
}
