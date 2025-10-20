import { BaseInventoryCache } from "./menus.js";
import { PREFIX } from "../utils/constants";

class LayoutsCache extends BaseInventoryCache {
    constructor() {
        super({
            title: "Inventory Layouts",
            inventoryPattern:
                /^Inventory Layouts$|^\(\d+\/\d+\) Inventory Layouts$/,
            slotIndices: [
                10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 28, 29,
                30, 31, 32, 33, 34,
            ],
            commands: {
                create: "layout create",
                edit: "layout edit",
                delete: "layout delete",
                list: "layouts",
            },
            chatPatterns: {
                created: "Created layout ${itemName}!",
                deleted: "Deleted the layout ${itemName}",
                renamed: "Renamed layout ${oldName} to ${newName}",
            },
            dropdownOptions: [
                { text: "Delete", action: "delete", color: "§c" },
            ],
        });

        // Track layout edit GUI state
        this.isInLayoutEditGUI = false;
        this.layoutEditGUITimeout = null;
        this.lastLayoutInventorySnapshot = null;

        // Register layout-specific events
        this.registerLayoutSpecificEvents();

        // Register rename handler if pattern exists
        if (this.config.chatPatterns.renamed) {
            register("chat", (oldName, newName) => {
                if (this.state.cachedItems.length > 0) {
                    this.handleItemRenamed(oldName, newName);
                }
            }).setChatCriteria(this.config.chatPatterns.renamed);
        }
    }

    registerLayoutSpecificEvents() {
        // Override guiOpened to handle layout edit detection
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
                    this.isInLayoutEditGUI = true;
                }
            }, 50);
        });

        // Override guiClosed to handle layout edit state
        register("guiClosed", () => {
            if (this.isInLayoutEditGUI) {
                this.isInLayoutEditGUI = false;
            } else if (this.state.isActive) {
                this.hideOverlay();
            }
        });
    }

    parseItem(item, slotIndex) {
        const itemName = item.getName();
        const cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");
        const lore = item.getLore();

        let descriptions = [];
        let hasLayoutData = false;

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
                hasLayoutData = true;
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
            hasDescription: hasLayoutData,
            page: this.state.currentPage,
            isPlaceholder: false,
            ctItem: ctItem,
            itemId: itemId,
            itemDamage: itemDamage,
        };
    }

    handleItemCreated(layoutName) {
        const existingLayout = this.state.cachedItems.find(
            (l) => l.name === layoutName
        );

        if (!existingLayout) {
            const newLayout = {
                name: layoutName,
                displayName: `§f${layoutName}`,
                description: "Newly created layout - data not yet scanned",
                descriptions: ["Newly created layout - data not yet scanned"],
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

            this.state.cachedItems.push(newLayout);
            this.updateFilteredItems();
            ChatLib.chat(
                PREFIX +
                    `§a+ Added layout "${layoutName}" to cache (${this.state.cachedItems.length} total)`
            );
        } else {
            ChatLib.chat(
                PREFIX + `§e Layout "${layoutName}" already exists in cache`
            );
        }
    }

    handleItemDeleted(layoutName) {
        const initialCount = this.state.cachedItems.length;
        this.state.cachedItems = this.state.cachedItems.filter(
            (l) => l.name !== layoutName
        );

        if (this.state.cachedItems.length < initialCount) {
            this.updateFilteredItems();
            if (this.state.selectedIndex >= this.state.cachedItems.length) {
                this.state.selectedIndex = -1;
            }
            ChatLib.chat(
                PREFIX +
                    `§c- Removed layout "${layoutName}" from cache (${this.state.cachedItems.length} total)`
            );
        } else {
            ChatLib.chat(
                PREFIX + `§e Layout "${layoutName}" was not found in cache`
            );
        }
    }

    handleItemRenamed(oldName, newName) {
        const layout = this.state.cachedItems.find((l) => l.name === oldName);

        if (layout) {
            layout.name = newName;
            layout.displayName = `§f${newName}`;
            this.updateFilteredItems();

            ChatLib.chat(
                PREFIX + `§6Renamed layout "${oldName}" → "${newName}" in cache`
            );
        } else {
            this.handleItemCreated(newName);
            ChatLib.chat(
                PREFIX +
                    `§e Layout "${oldName}" not found in cache, created placeholder for "${newName}"`
            );
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

    drawFallbackIcon(x, y, size, layout) {
        let color = 0xff666666;

        if (layout.isPlaceholder) {
            color = 0xffffaa00; // Orange for new layouts
        } else if (layout.name) {
            let hash = 0;
            for (let i = 0; i < layout.name.length; i++) {
                hash = layout.name.charCodeAt(i) + ((hash << 5) - hash);
            }

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

        if (layout.name && layout.name.length > 0) {
            const letter = layout.name.charAt(0).toUpperCase();
            const letterWidth = Renderer.getStringWidth(letter);
            const centerX = x + (size - letterWidth) / 2;
            const centerY = y + (size - 8) / 2;
            Renderer.drawStringWithShadow("§f" + letter, centerX, centerY);
        }
    }

    // Override the renderListItem method for custom layout rendering
    renderListItem(
        layout,
        itemX,
        itemY,
        listWidth,
        itemHeight,
        nameColor,
        index
    ) {
        const iconSize = 16;
        const iconMargin = 4;

        // Draw layout icon if available
        try {
            if (layout.ctItem) {
                const iconX = itemX + iconMargin;
                const iconY = itemY + (itemHeight - iconSize) / 2;
                layout.ctItem.draw(iconX, iconY, 1.0);
            } else {
                this.drawFallbackIcon(
                    itemX + iconMargin,
                    itemY + (itemHeight - iconSize) / 2,
                    iconSize,
                    layout
                );
            }
        } catch (e) {
            this.drawFallbackIcon(
                itemX + iconMargin,
                itemY + (itemHeight - iconSize) / 2,
                iconSize,
                layout
            );
        }

        const hasDescription =
            layout.hasDescription &&
            (layout.description ||
                (layout.descriptions && layout.descriptions.length > 0));
        const textStartX = itemX + iconSize + iconMargin * 2;
        const availableTextWidth = listWidth - iconSize - iconMargin * 3;

        const layoutName = layout.name || "Unknown Layout";

        const pageCounter = layout.page ? `§8[P${layout.page}]` : "";
        const pageCounterWidth = layout.page
            ? Renderer.getStringWidth(`[P${layout.page}]`)
            : 0;

        const maxCharsForName =
            Math.floor((availableTextWidth - pageCounterWidth - 10) / 6) - 2;
        const displayName =
            layoutName.length > maxCharsForName
                ? layoutName.substring(0, maxCharsForName - 3) + "..."
                : layoutName;

        const finalDisplayName = layout.isPlaceholder
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

        if (layout.page) {
            const pageX = itemX + listWidth - pageCounterWidth - 5;
            const pageY = itemY + (itemHeight - 8) / 2;
            Renderer.drawStringWithShadow(pageCounter, pageX, pageY);
        }

        if (hasDescription) {
            let descriptionText =
                layout.description ||
                (layout.descriptions && layout.descriptions[0]);
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

    // Override clearCache to include layout-specific cleanup
    clearCache() {
        super.clearCache();

        this.lastLayoutInventorySnapshot = null;
        this.isInLayoutEditGUI = false;
        if (this.layoutEditGUITimeout) {
            clearTimeout(this.layoutEditGUITimeout);
            this.layoutEditGUITimeout = null;
        }
    }
}

export const layoutsCache = new LayoutsCache();
