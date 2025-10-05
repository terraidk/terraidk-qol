import { BaseInventoryCache } from "./menus.js";
import { PREFIX } from "../utils/constants";

class CommandsCache extends BaseInventoryCache {
    constructor() {
        super({
            title: "Commands",
            inventoryPattern: /^\(\d+\/\d+\) Commands$|^Commands$/,
            slotIndices: [
                10,
                11,
                12,
                13,
                14,
                15,
                16, // Row 1
                19,
                20,
                21,
                22,
                23,
                24,
                25, // Row 2
                28,
                29,
                30,
                31,
                32,
                33,
                34, // Row 3
            ],
            commands: {
                create: "command create",
                edit: "command edit",
                delete: "command delete",
                actions: "command actions",
                list: "commands",
            },
            chatPatterns: {
                created: "Created command ${itemName}!",
                deleted: "Deleted the command ${itemName}",
            },
            dropdownOptions: [
                { text: "Edit", action: "edit", color: "§e" },
                { text: "Actions", action: "actions", color: "§a" },
                { text: "Delete", action: "delete", color: "§c" },
            ],
        });

        // Track command edit GUI state
        this.isInCommandEditGUI = false;
        this.commandEditGUITimeout = null;
        this.lastCommandInventorySnapshot = null;

        // Register command-specific events
        this.registerCommandSpecificEvents();
    }

    registerCommandSpecificEvents() {
        // Override guiOpened to handle command edit detection
        register("guiOpened", (guiEvent) => {
            const guiScreen = guiEvent.gui;
            if (!guiScreen) return;

            const className = guiScreen.getClass().getSimpleName();
            if (className !== "GuiChest") return;

            setTimeout(() => {
                const inventory = Player.getOpenedInventory();
                if (!inventory) return;

                const title = inventory.getName();
                const cleanTitle = title
                    ? title.replace(/§[0-9a-fk-or]/g, "")
                    : "";

                if (
                    cleanTitle.startsWith("Edit: ") ||
                    cleanTitle === "Are you sure?"
                ) {
                    this.isInCommandEditGUI = true;
                }
            }, 50);
        });

        // Override guiClosed to handle command edit state
        register("guiClosed", () => {
            if (this.isInCommandEditGUI) {
                this.isInCommandEditGUI = false;
            } else if (this.state.isActive) {
                this.hideOverlay();
            }
        });
    }

    parseItem(item, slotIndex) {
        const itemName = item.getName();
        let cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");

        // Remove leading slash if present
        if (cleanName.startsWith("/")) {
            cleanName = cleanName.substring(1);
        }

        const lore = item.getLore();

        let descriptions = [];
        let hasCommandData = false;

        lore.forEach((line) => {
            const cleanLine = line.replace(/§[0-9a-fk-or]/g, "");

            if (
                cleanLine.trim() === "" ||
                cleanLine.includes("Left Click") ||
                cleanLine.includes("Right Click") ||
                cleanLine.includes("SHIFT") ||
                cleanLine.includes("more options")
            ) {
                return;
            }

            if (line.includes("§7")) {
                descriptions.push(cleanLine.trim());
                hasCommandData = true;
            }
        });

        // Try to get CT item for rendering
        let ctItem = null;
        let itemId = 0;
        let itemDamage = 0;

        try {
            itemId = item.getID();
            itemDamage = item.getMetadata ? item.getMetadata() : 0;

            if (itemId && itemId !== 0) {
                if (itemDamage > 0) {
                    ctItem = new Item(itemId, itemDamage);
                } else {
                    ctItem = new Item(itemId);
                }
            }
        } catch (error) {
            ctItem = null;
        }

        return {
            name: cleanName,
            displayName: itemName,
            description:
                descriptions.length > 0 ? descriptions.join(" ") : null,
            descriptions: descriptions,
            lore: lore,
            slotIndex: slotIndex,
            hasDescription: hasCommandData,
            page: this.state.currentPage,
            isPlaceholder: false,
            ctItem: ctItem,
            itemId: itemId,
            itemDamage: itemDamage,
        };
    }

    handleItemCreated(commandName) {
        const existingCommand = this.state.cachedItems.find(
            (c) => c.name === commandName
        );

        if (!existingCommand) {
            const newCommand = {
                name: commandName,
                displayName: `§f${commandName}`,
                description: "Newly created command - data not yet scanned",
                descriptions: ["Newly created command - data not yet scanned"],
                lore: [],
                slotIndex: -1,
                hasDescription: true,
                page: this.state.currentPage || 1,
                isPlaceholder: true,
                createdAt: Date.now(),
                ctItem: null,
                itemId: 0,
                itemDamage: 0,
            };

            this.state.cachedItems.push(newCommand);
            this.updateFilteredItems();
            ChatLib.chat(
                PREFIX +
                    `§a+ Added command "${commandName}" to cache (${this.state.cachedItems.length} total)`
            );
        } else {
            ChatLib.chat(
                PREFIX + `§e Command "${commandName}" already exists in cache`
            );
        }
    }

    handleItemDeleted(commandName) {
        const initialCount = this.state.cachedItems.length;
        this.state.cachedItems = this.state.cachedItems.filter(
            (c) => c.name !== commandName
        );

        if (this.state.cachedItems.length < initialCount) {
            this.updateFilteredItems();
            if (this.state.selectedIndex >= this.state.cachedItems.length) {
                this.state.selectedIndex = -1;
            }
            ChatLib.chat(
                PREFIX +
                    `§c- Removed command "${commandName}" from cache (${this.state.cachedItems.length} total)`
            );
        } else {
            ChatLib.chat(
                PREFIX + `§e Command "${commandName}" was not found in cache`
            );
        }
    }

    executeAction(action, item) {
        switch (action) {
            case "edit":
                ChatLib.command(`${this.config.commands.edit} ${item.name}`);
                break;
            case "actions":
                ChatLib.command(`${this.config.commands.actions} ${item.name}`);
                break;
            case "delete":
                ChatLib.command(`${this.config.commands.delete} ${item.name}`);
                setTimeout(() => {
                    ChatLib.command(this.config.commands.list);
                }, 50);
                break;
            case "create":
                ChatLib.command(`${this.config.commands.create} ${item.name}`);
                break;
        }
    }

    updateFilteredItems() {
        const filterText = this.ui.filterTextField
            ? this.ui.filterTextField.getText()
            : "";

        if (!filterText) {
            this.state.filteredItems = [...this.state.cachedItems];
        } else {
            const filter = filterText.toLowerCase();
            this.state.filteredItems = this.state.cachedItems.filter(
                (item) =>
                    item.name.toLowerCase().includes(filter) ||
                    (item.description &&
                        item.description.toLowerCase().includes(filter)) ||
                    (item.descriptions &&
                        item.descriptions.some((desc) =>
                            desc.toLowerCase().includes(filter)
                        ))
            );
        }

        if (this.state.selectedIndex >= this.state.filteredItems.length) {
            this.state.selectedIndex = -1;
        }

        // Fix scrolling when filter changes
        const availableHeight = this.getListAvailableHeight();
        const itemHeight = 23;
        const maxVisibleItems = Math.floor(availableHeight / itemHeight);
        const maxScroll = Math.max(
            0,
            this.state.filteredItems.length - maxVisibleItems
        );
        this.state.scrollOffset = Math.max(
            0,
            Math.min(this.state.scrollOffset, maxScroll)
        );
    }

    drawFallbackIcon(x, y, size, command) {
        let color = 0xff666666;

        if (command.isPlaceholder) {
            color = 0xffffaa00; // Orange for new commands
        } else if (command.name) {
            let hash = 0;
            for (let i = 0; i < command.name.length; i++) {
                hash = command.name.charCodeAt(i) + ((hash << 5) - hash);
            }

            // Don't make colors too dark
            const r = (Math.abs(hash) % 128) + 127;
            const g = (Math.abs(hash >> 8) % 128) + 127;
            const b = (Math.abs(hash >> 16) % 128) + 127;

            color = (0xff << 24) | (r << 16) | (g << 8) | b;
        }

        Renderer.drawRect(color, x, y, size, size);

        // Draw border
        Renderer.drawRect(0xff000000, x, y, size, 1);
        Renderer.drawRect(0xff000000, x, y + size - 1, size, 1);
        Renderer.drawRect(0xff000000, x, y, 1, size);
        Renderer.drawRect(0xff000000, x + size - 1, y, 1, size);

        if (command.name && command.name.length > 0) {
            const letter = command.name.charAt(0).toUpperCase();
            const letterWidth = Renderer.getStringWidth(letter);
            const centerX = x + (size - letterWidth) / 2;
            const centerY = y + (size - 8) / 2;
            Renderer.drawStringWithShadow("§f" + letter, centerX, centerY);
        }
    }

    // Override the renderListItem method for custom command rendering
    renderListItem(
        command,
        itemX,
        itemY,
        listWidth,
        itemHeight,
        nameColor,
        index
    ) {
        const iconSize = 16;
        const iconMargin = 4;

        // Draw command icon if available
        try {
            if (command.ctItem) {
                const iconX = itemX + iconMargin;
                const iconY = itemY + (itemHeight - iconSize) / 2;
                command.ctItem.draw(iconX, iconY, 1.0);
            } else {
                this.drawFallbackIcon(
                    itemX + iconMargin,
                    itemY + (itemHeight - iconSize) / 2,
                    iconSize,
                    command
                );
            }
        } catch (e) {
            this.drawFallbackIcon(
                itemX + iconMargin,
                itemY + (itemHeight - iconSize) / 2,
                iconSize,
                command
            );
        }

        const hasDescription =
            command.hasDescription &&
            (command.description ||
                (command.descriptions && command.descriptions.length > 0));
        const textStartX = itemX + iconSize + iconMargin * 2;
        const availableTextWidth = listWidth - iconSize - iconMargin * 3;

        const commandName = command.name || "Unknown Command";

        const pageCounter = command.page ? `§8[P${command.page}]` : "";
        const pageCounterWidth = command.page
            ? Renderer.getStringWidth(`[P${command.page}]`)
            : 0;

        const maxCharsForName =
            Math.floor((availableTextWidth - pageCounterWidth - 10) / 6) - 2;
        const displayName =
            commandName.length > maxCharsForName
                ? commandName.substring(0, maxCharsForName - 3) + "..."
                : commandName;

        const finalDisplayName = command.isPlaceholder
            ? displayName + " §8[NEW]"
            : displayName;

        if (hasDescription) {
            Renderer.drawStringWithShadow(
                nameColor + finalDisplayName,
                textStartX,
                itemY + 2
            );
        } else {
            Renderer.drawStringWithShadow(
                nameColor + finalDisplayName,
                textStartX,
                itemY + (itemHeight - 8) / 2
            );
        }

        if (command.page) {
            const pageX = itemX + listWidth - pageCounterWidth - 5;
            const pageY = itemY + (itemHeight - 8) / 2;
            Renderer.drawStringWithShadow(pageCounter, pageX, pageY);
        }

        if (hasDescription) {
            let descriptionText =
                command.description ||
                (command.descriptions && command.descriptions[0]);
            if (descriptionText) {
                const descText = `§7${descriptionText}`;
                const maxDescLength = Math.floor(availableTextWidth / 6);
                const finalDescText =
                    descText.length > maxDescLength
                        ? descText.substring(0, maxDescLength - 3) + "..."
                        : descText;
                Renderer.drawStringWithShadow(
                    finalDescText,
                    textStartX,
                    itemY + 12
                );
            }
        }
    }

    // Override clearCache to include command-specific cleanup
    clearCache() {
        super.clearCache();

        this.lastCommandInventorySnapshot = null;
        this.isInCommandEditGUI = false;
        if (this.commandEditGUITimeout) {
            clearTimeout(this.commandEditGUITimeout);
            this.commandEditGUITimeout = null;
        }
    }
}

export const commandsCache = new CommandsCache();
