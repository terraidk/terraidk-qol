/// <reference types="../CTAutocomplete" />

import { PREFIX } from '../utils/constants'

// Java type imports
if (typeof GuiScreen === 'undefined') {
  var GuiScreen = Java.type('net.minecraft.client.gui.GuiScreen')
}
if (typeof ChatLib === 'undefined') ChatLib = Java.type('com.chattriggers.ctjs.api.ChatLib')
if (typeof Player === 'undefined') {
  var Player = Java.type('com.chattriggers.ctjs.minecraft.wrappers.Player')
}

class RegionsVisualCache {
  constructor() {
    this.cachedRegions = []
    this.filteredRegions = [] // For filtered results
    this.isActive = false
    this.isScanning = false
    this.hoveredIndex = -1
    this.selectedIndex = -1
    this.scrollOffset = 0
    this.currentWorld = null
    this.filterText = ''
    this.showingFilter = false
    this.scannedPages = new Set() // Track which pages we've scanned
    this.totalPages = 0
    this.currentPage = 1

    this.colors = {
      panelBg: 0xe0000000,
      panelBorder: 0xff333333,
      itemBg: 0xff2a2a2a,
      itemHover: 0xff404040,
      itemSelected: 0xff4caf50,
      filterBg: 0xff1a1a1a,
      filterBorder: 0xff666666,
      scrollbar: 0xff555555,
      scrollbarThumb: 0xff888888,
    }

    this.registerEvents()
  }

  registerEvents() {
    // Clear cache when world changes
    register('worldLoad', () => {
      const newWorld = World.getWorld()
      if (this.currentWorld && newWorld !== this.currentWorld) {
        ChatLib.chat(PREFIX + '§eWorld changed - clearing regions cache')
        this.clearCache()
      }
      this.currentWorld = newWorld
    })

    // Detect when regions GUI opens
    register('guiOpened', guiEvent => {
      const guiScreen = guiEvent.gui
      if (!guiScreen) return

      const className = guiScreen.getClass().getSimpleName()
      if (className !== 'GuiChest') return

      // Try multiple delays to catch the title and scan
      setTimeout(() => {
        this.checkForRegionsGUI(1)
      }, 50)

      setTimeout(() => {
        this.checkForRegionsGUI(2)
      }, 200)

      setTimeout(() => {
        this.checkForRegionsGUI(3)
      }, 500)
    })

    // Monitor inventory changes to detect page changes
    register('itemTooltip', () => {
      if (this.isActive && !this.isScanning) {
        this.detectPageChange()
      }
    })

    // Clean up when GUI closes
    register('guiClosed', () => {
      if (this.isActive) {
        this.hideOverlay()
      }
    })

    register('guiRender', (mouseX, mouseY) => {
      if (this.isActive && this.cachedRegions.length > 0) {
        this.renderOverlay()
      }
    })

    // Handle mouse clicks
    register('guiMouseClick', (mouseX, mouseY, button) => {
      if (this.isActive) {
        return this.handleMouseClick(mouseX, mouseY, button)
      }
    })

    // Handle key presses
    register('guiKey', (char, keyCode) => {
      if (this.isActive) {
        return this.handleKeyPress(keyCode, char)
      }
    })
  }

  clearCache() {
    this.cachedRegions = []
    this.filteredRegions = []
    this.isActive = false
    this.hoveredIndex = -1
    this.selectedIndex = -1
    this.scrollOffset = 0
    this.isScanning = false
    this.filterText = ''
    this.showingFilter = false
    this.scannedPages.clear()
    this.totalPages = 0
    this.currentPage = 1
  }

  checkForRegionsGUI(attempt) {
    if (this.isActive || this.isScanning) return

    const inventory = Player.getOpenedInventory()
    if (!inventory) {
      ChatLib.chat(PREFIX + `§7[DEBUG] No inventory found on attempt ${attempt}`)
      return
    }

    const regionsRegex = /^\(\d+\/\d+\) Regions$|^Regions$/
    const title = inventory.getName()
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, '') : ''
    ChatLib.chat(PREFIX + `§7[DEBUG] Attempt ${attempt}: Title = "${cleanTitle}"`)

    if (regionsRegex.test(cleanTitle)) {
      ChatLib.chat(PREFIX + '§a[DEBUG] Regions GUI detected! Starting scan...')

      // Parse page info from title
      const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Regions$/)
      if (pageMatch) {
        this.currentPage = parseInt(pageMatch[1])
        this.totalPages = parseInt(pageMatch[2])
        ChatLib.chat(PREFIX + `§7[DEBUG] Detected page ${this.currentPage}/${this.totalPages}`)
      }

      this.isScanning = true
      this.scanCurrentPage()
    }
  }

  detectPageChange() {
    const inventory = Player.getOpenedInventory()
    if (!inventory) return

    const title = inventory.getName()
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, '') : ''
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Regions$/)

    if (pageMatch) {
      const newPage = parseInt(pageMatch[1])
      const newTotalPages = parseInt(pageMatch[2])

      if (newPage !== this.currentPage || newTotalPages !== this.totalPages) {
        this.currentPage = newPage
        this.totalPages = newTotalPages

        // Only scan if we haven't scanned this page yet
        if (!this.scannedPages.has(newPage)) {
          ChatLib.chat(PREFIX + `§e[DEBUG] New page detected: ${newPage}/${newTotalPages}, scanning...`)
          this.scanCurrentPage()
        }
      }
    }
  }

  scanCurrentPage() {
    const inventory = Player.getOpenedInventory()
    if (!inventory) {
      ChatLib.chat(PREFIX + '§c[DEBUG] No inventory found for scanning')
      this.isScanning = false
      return
    }

    // Mark this page as scanned
    this.scannedPages.add(this.currentPage)

    // The regions are in specific slots in the chest GUI
    const regionSlots = [
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
    ]

    ChatLib.chat(PREFIX + `§7[DEBUG] Scanning page ${this.currentPage}, slots: ${regionSlots.join(', ')}`)

    let newRegionsFound = 0

    // Scan the specific region slots
    regionSlots.forEach(slotIndex => {
      const item = inventory.getStackInSlot(slotIndex)
      if (item && item.getName() !== 'Air') {
        const itemName = item.getName()
        const itemId = item.getID()
        const lore = item.getLore()

        const regionData = this.parseRegionItem(item, slotIndex)
        if (regionData) {
          // Check if we already have this region (avoid duplicates)
          const existingRegion = this.cachedRegions.find(r => r.name === regionData.name)
          if (!existingRegion) {
            this.cachedRegions.push(regionData)
            newRegionsFound++
            ChatLib.chat(PREFIX + `§a[DEBUG] Found new region: ${regionData.name}`)
          }
        }
      }
    })

    ChatLib.chat(
      PREFIX + `§a[DEBUG] Page ${this.currentPage} scan complete. Found ${newRegionsFound} new regions. Total: ${this.cachedRegions.length}`
    )

    // Update filtered regions
    this.updateFilteredRegions()

    if (!this.isActive) {
      this.isActive = true
      ChatLib.chat(PREFIX + `§aRegions cache is now active! Use /filter to search regions.`)
    }

    this.isScanning = false

    // If there are more pages to scan, suggest scanning them
    if (this.scannedPages.size < this.totalPages) {
      const unscannedPages = []
      for (let i = 1; i <= this.totalPages; i++) {
        if (!this.scannedPages.has(i)) {
          unscannedPages.push(i)
        }
      }
      ChatLib.chat(PREFIX + `§e[INFO] ${unscannedPages.length} pages remaining to scan: ${unscannedPages.join(', ')}`)
      ChatLib.chat(PREFIX + '§e[INFO] Navigate to other pages to scan all regions automatically!')
    }
  }

  parseRegionItem(item, slotIndex) {
    const itemName = item.getName()
    const cleanName = itemName.replace(/§[0-9a-fk-or]/g, '')
    const lore = item.getLore()

    let fromCoords = null
    let toCoords = null
    let hasRegionData = false

    // Parse lore for coordinates
    lore.forEach(line => {
      const cleanLine = line.replace(/§[0-9a-fk-or]/g, '')

      if (cleanLine.startsWith('From:')) {
        fromCoords = cleanLine.substring(5).trim()
        hasRegionData = true
      } else if (cleanLine.startsWith('To:')) {
        toCoords = cleanLine.substring(3).trim()
        hasRegionData = true
      }
    })

    const regionData = {
      name: cleanName,
      displayName: itemName,
      from: fromCoords || 'Unknown',
      to: toCoords || 'Unknown',
      lore: lore,
      slotIndex: slotIndex,
      hasCoords: hasRegionData,
      page: this.currentPage,
    }

    return regionData
  }

  updateFilteredRegions() {
    if (!this.filterText) {
      this.filteredRegions = [...this.cachedRegions]
    } else {
      const filter = this.filterText.toLowerCase()
      this.filteredRegions = this.cachedRegions.filter(
        region =>
          region.name.toLowerCase().includes(filter) ||
          (region.from && region.from.toLowerCase().includes(filter)) ||
          (region.to && region.to.toLowerCase().includes(filter))
      )
    }

    // Reset selection if it's out of bounds
    if (this.selectedIndex >= this.filteredRegions.length) {
      this.selectedIndex = -1
    }
  }

  renderOverlay() {
    try {
      const screenWidth = Renderer.screen.getWidth()
      const screenHeight = Renderer.screen.getHeight()

      const panelWidth = 400
      const panelHeight = Math.min(screenHeight - 40, 650)
      const panelX = screenWidth - panelWidth - 10
      const panelY = 20

      // Draw panel
      Renderer.drawRect(0xdd000000, panelX - 2, panelY - 2, panelWidth + 4, panelHeight + 4)
      Renderer.drawRect(0xff444444, panelX - 1, panelY - 1, panelWidth + 2, panelHeight + 2)
      Renderer.drawRect(0xcc222222, panelX, panelY, panelWidth, panelHeight)

      let currentY = panelY + 10

      // Draw title
      const scannedInfo = this.totalPages > 0 ? `(${this.scannedPages.size}/${this.totalPages} pages)` : ''
      const title = `§6Regions (${this.cachedRegions.length}) ${scannedInfo}`
      const titleWidth = Renderer.getStringWidth(title)
      Renderer.drawStringWithShadow(title, panelX + (panelWidth - titleWidth) / 2, currentY)
      currentY += 20

      // Draw filter box
      const filterHeight = 20
      const filterY = currentY

      // Filter background
      Renderer.drawRect(this.colors.filterBg, panelX + 10, filterY, panelWidth - 20, filterHeight)
      Renderer.drawRect(this.colors.filterBorder, panelX + 10, filterY, panelWidth - 20, 1)
      Renderer.drawRect(this.colors.filterBorder, panelX + 10, filterY + filterHeight - 1, panelWidth - 20, 1)
      Renderer.drawRect(this.colors.filterBorder, panelX + 10, filterY, 1, filterHeight)
      Renderer.drawRect(this.colors.filterBorder, panelX + panelWidth - 11, filterY, 1, filterHeight)

      // Filter text
      const filterDisplayText = this.filterText || 'Type /filter <text> to search...'
      const filterColor = this.filterText ? '§f' : '§7'
      Renderer.drawStringWithShadow(filterColor + filterDisplayText, panelX + 15, filterY + 6)

      if (this.filteredRegions.length !== this.cachedRegions.length) {
        Renderer.drawStringWithShadow(`§e(${this.filteredRegions.length} filtered)`, panelX + panelWidth - 120, filterY + 6)
      }

      currentY += filterHeight + 10

      // Draw regions list with scrollbar
      this.drawRegionsList(panelX, currentY, panelWidth, panelHeight - (currentY - panelY) - 30)

      // Draw instructions at bottom
      const instructions = [
        '§7Click to edit • Arrow keys to navigate • /filter to search',
        '§7ESC to close • Navigate pages to scan all regions',
      ]
      instructions.forEach((instruction, index) => {
        const instrWidth = Renderer.getStringWidth(instruction)
        const instrX = panelX + (panelWidth - instrWidth) / 2
        const instrY = panelY + panelHeight - 25 + index * 10
        Renderer.drawStringWithShadow(instruction, instrX, instrY)
      })
    } catch (error) {
      ChatLib.chat(PREFIX + `§c[ERROR] Rendering failed: ${error.message}`)
    }
  }

  drawRegionsList(panelX, listStartY, panelWidth, availableHeight) {
    const itemHeight = 22
    const itemSpacing = 1
    const maxVisibleItems = Math.floor(availableHeight / (itemHeight + itemSpacing))
    const scrollbarWidth = 8
    const listWidth = panelWidth - scrollbarWidth - 20

    let mouseX, mouseY
    try {
      mouseX = Client.getMouseX()
      mouseY = Client.getMouseY()
    } catch (e) {
      mouseX = 0
      mouseY = 0
    }

    this.hoveredIndex = -1

    // Calculate visible range
    const startIndex = this.scrollOffset
    const endIndex = Math.min(startIndex + maxVisibleItems, this.filteredRegions.length)

    // Draw scrollbar background
    const scrollbarX = panelX + panelWidth - scrollbarWidth - 5
    Renderer.drawRect(0xff333333, scrollbarX, listStartY, scrollbarWidth, availableHeight)

    // Draw scrollbar thumb
    if (this.filteredRegions.length > maxVisibleItems) {
      const thumbHeight = Math.max(20, (maxVisibleItems / this.filteredRegions.length) * availableHeight)
      const thumbY = listStartY + (this.scrollOffset / (this.filteredRegions.length - maxVisibleItems)) * (availableHeight - thumbHeight)
      Renderer.drawRect(this.colors.scrollbarThumb, scrollbarX, thumbY, scrollbarWidth, thumbHeight)
    }

    // Draw regions list
    for (let i = startIndex; i < endIndex; i++) {
      const region = this.filteredRegions[i]
      if (!region) continue

      const listIndex = i - startIndex
      const itemX = panelX + 5
      const itemY = listStartY + listIndex * (itemHeight + itemSpacing)

      // Check if mouse is hovering
      const isHovered = mouseX >= itemX && mouseX <= itemX + listWidth && mouseY >= itemY && mouseY <= itemY + itemHeight

      if (isHovered) {
        this.hoveredIndex = i
      }

      // Determine colors
      let bgColor = 0xff333333
      if (i === this.selectedIndex) {
        bgColor = 0xff4caf50 // Green for selected
      } else if (isHovered) {
        bgColor = 0xff555555 // Lighter for hover
      }

      // Draw item background
      Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight)

      // Draw region name
      const nameColor = i === this.selectedIndex ? '§a' : isHovered ? '§e' : '§f'
      const regionName = region.name || 'Unknown Region'
      const displayName = regionName.length > 35 ? regionName.substring(0, 32) + '...' : regionName

      Renderer.drawStringWithShadow(nameColor + displayName, itemX + 5, itemY + 2)

      // Draw page info
      if (this.totalPages > 1) {
        Renderer.drawStringWithShadow(`§8[P${region.page}]`, itemX + listWidth - 35, itemY + 2)
      }

      // Format coordinates
      if (region.hasCoords && region.from && region.to) {
        const formattedFrom = this.formatCoordinates(region.from)
        const formattedTo = this.formatCoordinates(region.to)
        const coordText = `§7${formattedFrom} → ${formattedTo}`
        Renderer.drawStringWithShadow(coordText, itemX + 5, itemY + 12)
      } else {
        Renderer.drawStringWithShadow('§8No coordinates', itemX + 5, itemY + 12)
      }
    }
  }

  formatCoordinates(coords) {
    if (!coords || coords === 'Unknown') return coords

    const clean = coords.replace(/\s/g, '').replace(/[()]/g, '')
    const parts = clean.split(',')
    if (parts.length === 3) {
      return `${parts[0]}, ${parts[1]}, ${parts[2]}`
    }

    return coords
  }

  handleMouseClick(mouseX, mouseY, button) {
    if (!this.isActive) return false

    const screenWidth = Renderer.screen.getWidth()
    const panelWidth = 400
    const panelX = screenWidth - panelWidth - 10

    // Check if click is within our panel
    if (mouseX >= panelX && mouseX <= panelX + panelWidth) {
      if (this.hoveredIndex >= 0 && this.hoveredIndex < this.filteredRegions.length) {
        const region = this.filteredRegions[this.hoveredIndex]
        this.selectedIndex = this.hoveredIndex
        this.editRegion(region)
        return true
      }
    }

    return false
  }

  handleKeyPress(keyCode, char) {
    if (keyCode === 1) {
      // ESC
      this.hideOverlay()
      return true
    } else if (keyCode === 200) {
      // Up arrow
      this.navigateUp()
      return true
    } else if (keyCode === 208) {
      // Down arrow
      this.navigateDown()
      return true
    } else if (keyCode === 28) {
      // Enter
      if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredRegions.length) {
        const region = this.filteredRegions[this.selectedIndex]
        this.editRegion(region)
        return true
      }
    }
    return false
  }

  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--
      this.ensureVisible()
    } else if (this.selectedIndex === -1 && this.filteredRegions.length > 0) {
      this.selectedIndex = 0
    }
  }

  navigateDown() {
    if (this.selectedIndex < this.filteredRegions.length - 1) {
      this.selectedIndex++
      this.ensureVisible()
    } else if (this.selectedIndex === -1 && this.filteredRegions.length > 0) {
      this.selectedIndex = 0
    }
  }

  ensureVisible() {
    const availableHeight = 520
    const itemHeight = 23
    const maxVisibleItems = Math.floor(availableHeight / itemHeight)

    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex
    } else if (this.selectedIndex >= this.scrollOffset + maxVisibleItems) {
      this.scrollOffset = this.selectedIndex - maxVisibleItems + 1
    }

    // Ensure scroll offset is within bounds
    const maxScroll = Math.max(0, this.filteredRegions.length - maxVisibleItems)
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll))
  }

  setFilter(filterText) {
    this.filterText = filterText
    this.scrollOffset = 0
    this.selectedIndex = -1
    this.updateFilteredRegions()
    ChatLib.chat(PREFIX + `§aFilter set to: "${filterText}" (${this.filteredRegions.length} results)`)
  }

  clearFilter() {
    this.filterText = ''
    this.scrollOffset = 0
    this.selectedIndex = -1
    this.updateFilteredRegions()
    ChatLib.chat(PREFIX + `§aFilter cleared (${this.filteredRegions.length} regions)`)
  }

  editRegion(region) {
    ChatLib.chat(PREFIX + `§aOpening region: §b${region.name} §7(from page ${region.page})`)
    World.playSound('note.bassattack', 0.7, 2.0)

    Player.getPlayer().closeScreen()

    setTimeout(() => {
      ChatLib.command(`region edit ${region.name}`)
    }, 100)
  }

  hideOverlay() {
    this.isActive = false
    this.hoveredIndex = -1
    this.selectedIndex = -1
    this.scrollOffset = 0
    this.isScanning = false
    ChatLib.chat(PREFIX + `§e[DEBUG] Overlay hidden, keeping ${this.cachedRegions.length} regions cached`)
  }
}

// Create the visual cache instance
const regionsVisualCache = new RegionsVisualCache()

// Commands
register('command', () => {
  if (regionsVisualCache.isActive) {
    regionsVisualCache.hideOverlay()
    ChatLib.chat(PREFIX + '§eRegions visual cache hidden')
  } else {
    ChatLib.chat(PREFIX + '§cRegions visual cache is only available when regions GUI is open')
  }
}).setName('toggleregionscache')

register('command', (...args) => {
  if (!regionsVisualCache.isActive) {
    ChatLib.chat(PREFIX + '§cRegions visual cache must be active to use filters')
    return
  }

  if (args.length === 0) {
    regionsVisualCache.clearFilter()
  } else {
    const filterText = args.join(' ')
    regionsVisualCache.setFilter(filterText)
  }
}).setName('filter')

register('command', () => {
  ChatLib.chat(PREFIX + `§eRegions Cache Status:`)
  ChatLib.chat(`§7- Active: ${regionsVisualCache.isActive}`)
  ChatLib.chat(`§7- Total Regions: ${regionsVisualCache.cachedRegions.length}`)
  ChatLib.chat(`§7- Filtered Regions: ${regionsVisualCache.filteredRegions.length}`)
  ChatLib.chat(`§7- Pages Scanned: ${regionsVisualCache.scannedPages.size}/${regionsVisualCache.totalPages}`)
  ChatLib.chat(`§7- Current Filter: "${regionsVisualCache.filterText}"`)
}).setName('regionsstatus')

// Export for potential use in other modules
export { regionsVisualCache }
