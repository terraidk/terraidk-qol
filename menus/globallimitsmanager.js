import { PREFIX } from "../utils/constants";

class GlobalLimitsManager {
    constructor() {
        this.limits = {
            Functions: 0,
            "Custom Menus": 0,
            Regions: 0,
            Commands: 0,
        };
        this.cached = false;
        this.isRequesting = false;
        this.isReading = false;
        this.buffer = [];
        this.subscribers = new Set();

        this.registerChatHandler();
    }

    registerChatHandler() {
        register("chat", (event) => {
            const message = ChatLib.getChatMessage(event, true);
            const trimmedMessage = message.trim();

            if (!this.isRequesting && !this.isReading) return;

            if (
                this.isReading &&
                (trimmedMessage === "" ||
                    trimmedMessage === "§r" ||
                    trimmedMessage.length === 0)
            ) {
                cancel(event);
                return;
            }

            if (message.includes("Your Housing Limits:")) {
                if (this.isRequesting) {
                    this.isReading = true;
                    this.buffer = [message];
                    cancel(event);
                }
                return;
            }

            if (this.isReading) {
                if (
                    trimmedMessage === "" ||
                    trimmedMessage === "§r" ||
                    trimmedMessage.length === 0
                ) {
                    cancel(event);
                    return;
                }

                this.buffer.push(message);
                cancel(event);

                if (this.buffer.length >= 16) {
                    this.isReading = false;
                    this.parseLimits();
                }
            }
        });

        register("worldLoad", () => {
            this.clearCache();
        });
    }

    parseLimits() {
        const lines = this.buffer;

        const parseLimit = (keyword) => {
            const line = lines.find((l) => l.includes(keyword));
            if (!line) return 0;

            const match = line.match(/(\d+)(?:§.)*\s*\/\s*(?:§.)*(\d+)/);
            if (match) return parseInt(match[2]);

            const nums = line.match(/\d+/g);
            if (nums && nums.length >= 2) return parseInt(nums[1]);

            return 0;
        };

        this.limits.Functions = parseLimit("Functions:");
        this.limits["Custom Menus"] = parseLimit("Custom Menus:");
        this.limits.Regions = parseLimit("Regions:");
        this.limits.Commands = parseLimit("Custom Commands:");

        this.cached = true;
        this.isRequesting = false;

        this.subscribers.forEach((callback) => callback(this.limits));

        this.buffer = [];
    }

    requestLimits(callback) {
        if (this.cached) {
            callback(this.limits);
            return;
        }

        if (callback) this.subscribers.add(callback);

        if (!this.isRequesting && !this.isReading) {
            this.isRequesting = true;
            
            try {
                const C01PacketChatMessage = Java.type(
                    "net.minecraft.network.play.client.C01PacketChatMessage"
                );
                Client.sendPacket(new C01PacketChatMessage("/limits"));
            } catch (e) {
                ChatLib.command("limits", true);
            }
        }
    }

    getLimit(menuType) {
        return this.limits[menuType] || 0;
    }

    clearCache() {
        this.limits = {
            Functions: 0,
            "Custom Menus": 0,
            Regions: 0,
            Commands: 0,
        };
        this.cached = false;
        this.isRequesting = false;
        this.isReading = false;
        this.buffer = [];
        this.subscribers.clear();
    }
}

export const limitsManager = new GlobalLimitsManager();
