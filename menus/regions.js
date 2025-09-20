import { BaseInventoryCache } from "./menus.js";
import { PREFIX } from "../utils/constants";

class RegionsCache extends BaseInventoryCache {
    constructor() {
        super({
            title: "Regions",
            inventoryPattern: /^\(\d+\/\d+\) Regions$|^Regions$/,
            slotIndices: [
                10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 28, 29,
                30, 31, 32, 33, 34,
            ],
            commands: {
                create: "region create",
                edit: "region edit",
                delete: "region delete",
                list: "regions",
            },
            chatPatterns: {
                created: "Created region ${itemName}!",
                deleted: "Deleted the region ${itemName}",
                renamed: "Renamed region ${oldName} to ${newName}",
            },
            dropdownOptions: [
                { text: "Edit", action: "edit", color: "§e" },
                { text: "Delete", action: "delete", color: "§c" },
            ],
        });

        // Track region edit GUI state
        this.isInRegionEditGUI = false;
        this.regionEditGUITimeout = null;
        this.lastRegionInventorySnapshot = null;

        // Register region-specific events
        this.registerRegionSpecificEvents();

        // Register rename handler
        if (this.config.chatPatterns.renamed) {
            register("chat", (oldName, newName) => {
                if (this.state.cachedItems.length > 0) {
                    this.handleItemRenamed(oldName, newName);
                }
            }).setChatCriteria(this.config.chatPatterns.renamed);
        }
    }

    registerRegionSpecificEvents() {
        // Override guiOpened to handle region edit detection
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
                    this.isInRegionEditGUI = true;
                }
            }, 50);
        });

        // Override guiClosed to handle region edit state
        register("guiClosed", () => {
            if (this.isInRegionEditGUI) {
                this.isInRegionEditGUI = false;
            } else if (this.state.isActive) {
                this.hideOverlay();
            }
        });
    }

    parseItem(item, slotIndex) {
        const itemName = item.getName();
        const cleanName = itemName.replace(/§[0-9a-fk-or]/g, "");
        const lore = item.getLore();

        let fromCoords = null;
        let toCoords = null;
        let hasRegionData = false;

        lore.forEach((line) => {
            const cleanLine = line.replace(/§[0-9a-fk-or]/g, "");

            if (cleanLine.startsWith("From:")) {
                fromCoords = cleanLine.substring(5).trim();
                hasRegionData = true;
            } else if (cleanLine.startsWith("To:")) {
                toCoords = cleanLine.substring(3).trim();
                hasRegionData = true;
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
            description: hasRegionData
                ? `${fromCoords || "Unknown"} → ${toCoords || "Unknown"}`
                : null,
            from: fromCoords || "Unknown",
            to: toCoords || "Unknown",
            lore: lore,
            slotIndex: slotIndex,
            hasCoords: hasRegionData,
            ctItem: ctItem,
            itemId: itemId,
            itemDamage: itemDamage,
            page: this.state.currentPage,
            isPlaceholder: false,
        };
    }

    handleItemCreated(regionName) {
        const existingRegion = this.state.cachedItems.find(
            (r) => r.name === regionName
        );

        if (!existingRegion) {
            const newRegion = {
                name: regionName,
                displayName: `§f${regionName}`,
                description:
                    "Newly created region - data not yet scanned → Unknown",
                from: "Newly created region - data not yet scanned",
                to: "Newly created region - data not yet scanned",
                lore: [],
                slotIndex: -1,
                hasCoords: false,
                ctItem: null,
                itemId: 0,
                itemDamage: 0,
                page: this.state.currentPage || 1,
                isPlaceholder: true,
                createdAt: Date.now(),
            };

            this.state.cachedItems.push(newRegion);
            this.updateFilteredItems();

            ChatLib.chat(
                PREFIX +
                    `§a+ Added region "${regionName}" to cache (${this.state.cachedItems.length} total)`
            );

            // Refresh the regions page to show the new region
            setTimeout(() => {
                ChatLib.command(this.config.commands.list);
            }, 50);
        } else {
            ChatLib.chat(
                PREFIX + `§e Region "${regionName}" already exists in cache`
            );
        }
    }

    handleItemDeleted(regionName) {
        const initialCount = this.state.cachedItems.length;
        this.state.cachedItems = this.state.cachedItems.filter(
            (r) => r.name !== regionName
        );

        if (this.state.cachedItems.length < initialCount) {
            this.updateFilteredItems();
            if (this.state.selectedIndex >= this.state.cachedItems.length) {
                this.state.selectedIndex = -1;
            }
            ChatLib.chat(
                PREFIX +
                    `§c- Removed region "${regionName}" from cache (${this.state.cachedItems.length} total)`
            );
        } else {
            ChatLib.chat(
                PREFIX + `§e Region "${regionName}" was not found in cache`
            );
        }
    }

    handleItemRenamed(oldName, newName) {
        const region = this.state.cachedItems.find((r) => r.name === oldName);

        if (region) {
            region.name = newName;
            region.displayName = `§f${newName}`;
            this.updateFilteredItems();

            ChatLib.chat(
                PREFIX + `§6Renamed region "${oldName}" → "${newName}" in cache`
            );
        } else {
            this.handleItemCreated(newName);
            ChatLib.chat(
                PREFIX +
                    `§e Region "${oldName}" not found in cache, created placeholder for "${newName}"`
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
                (region) =>
                    region.name.toLowerCase().includes(filter) ||
                    (region.from &&
                        region.from.toLowerCase().includes(filter)) ||
                    (region.to && region.to.toLowerCase().includes(filter)) ||
                    (region.description &&
                        region.description.toLowerCase().includes(filter))
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

    formatCoordinates(coords) {
        if (!coords || coords === "Unknown") return coords;

        const clean = coords.replace(/\s/g, "").replace(/[()]/g, "");
        const parts = clean.split(",");
        if (parts.length === 3) {
            return `${parts[0]}, ${parts[1]}, ${parts[2]}`;
        }

        return coords;
    }

    drawFallbackIcon(x, y, size, region) {
        let color = 0xff666666;

        if (region.isPlaceholder) {
            color = 0xffffaa00; // Orange for new regions
        } else if (region.name) {
            let hash = 0;
            for (let i = 0; i < region.name.length; i++) {
                hash = region.name.charCodeAt(i) + ((hash << 5) - hash);
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

        if (region.name && region.name.length > 0) {
            const letter = region.name.charAt(0).toUpperCase();
            const letterWidth = Renderer.getStringWidth(letter);
            const centerX = x + (size - letterWidth) / 2;
            const centerY = y + (size - 8) / 2;
            Renderer.drawStringWithShadow("§f" + letter, centerX, centerY);
        }
    }

    // Override the renderListItem method for custom region rendering
    renderListItem(
        region,
        itemX,
        itemY,
        listWidth,
        itemHeight,
        nameColor,
        index
    ) {
        const iconSize = 16;
        const iconMargin = 4;

        // Draw region icon if available
        try {
            if (region.ctItem) {
                const iconX = itemX + iconMargin;
                const iconY = itemY + (itemHeight - iconSize) / 2;
                region.ctItem.draw(iconX, iconY, 1.0);
            } else {
                this.drawFallbackIcon(
                    itemX + iconMargin,
                    itemY + (itemHeight - iconSize) / 2,
                    iconSize,
                    region
                );
            }
        } catch (e) {
            this.drawFallbackIcon(
                itemX + iconMargin,
                itemY + (itemHeight - iconSize) / 2,
                iconSize,
                region
            );
        }

        const hasCoords =
            region.hasCoords &&
            region.from &&
            region.to &&
            region.from !== "Unknown" &&
            region.to !== "Unknown";

        const textStartX = itemX + iconSize + iconMargin * 2;
        const availableTextWidth = listWidth - iconSize - iconMargin * 3;

        const regionName = region.name || "Unknown Region";

        const pageCounter = region.page ? `§8[P${region.page}]` : "";
        const pageCounterWidth = region.page
            ? Renderer.getStringWidth(`[P${region.page}]`)
            : 0;

        // Calculate available space for region name
        const maxCharsForName =
            Math.floor((availableTextWidth - pageCounterWidth - 10) / 6) - 2;
        const displayName =
            regionName.length > maxCharsForName
                ? regionName.substring(0, maxCharsForName - 3) + "..."
                : regionName;

        const finalDisplayName = region.isPlaceholder
            ? displayName + " §8[NEW]"
            : displayName;

        if (hasCoords) {
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

        if (region.page) {
            const pageX = itemX + listWidth - pageCounterWidth - 5;
            const pageY = itemY + (itemHeight - 8) / 2;
            Renderer.drawStringWithShadow(pageCounter, pageX, pageY);
        }

        if (hasCoords) {
            const formattedFrom = this.formatCoordinates(region.from);
            const formattedTo = this.formatCoordinates(region.to);
            const coordText = `§7${formattedFrom} → ${formattedTo}`;
            const maxCoordLength = Math.floor(availableTextWidth / 6);
            const finalCoordText =
                coordText.length > maxCoordLength
                    ? coordText.substring(0, maxCoordLength - 3) + "..."
                    : coordText;
            Renderer.drawStringWithShadow(
                finalCoordText,
                textStartX,
                itemY + 12
            );
        }
    }

    // Override clearCache to include region-specific cleanup
    clearCache() {
        super.clearCache();

        this.lastRegionInventorySnapshot = null;
        this.isInRegionEditGUI = false;
        if (this.regionEditGUITimeout) {
            clearTimeout(this.regionEditGUITimeout);
            this.regionEditGUITimeout = null;
        }
    }
}

export const regionsCache = new RegionsCache();
