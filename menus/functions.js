/// <reference types="../CTAutocomplete" />

import { PREFIX } from '../utils/constants'
importPackage(Packages.org.lwjgl.input)

if (typeof GuiScreen === 'undefined') {
  var GuiScreen = Java.type('net.minecraft.client.gui.GuiScreen')
}
if (typeof Player === 'undefined') {
  var Player = Java.type('com.chattriggers.ctjs.minecraft.wrappers.Player')
}
if (typeof GuiTextField === 'undefined') {
  var GuiTextField = Java.type('net.minecraft.client.gui.GuiTextField')
}

class Input {
  constructor(x, y, width, height) {
    const GuiTextField = Java.type('net.minecraft.client.gui.GuiTextField')
    this.mcObject = new GuiTextField(0, Client.getMinecraft().field_71466_p, x, y, width, height)

    this.getX = () => {
      return this.mcObject.field_146209_f
    }
    this.getY = () => {
      return this.mcObject.field_146210_g
    }
    this.getWidth = () => {
      return this.mcObject.field_146218_h
    }
    this.getHeight = () => {
      return this.mcObject.field_146219_i
    }
    this.setX = x => {
      this.mcObject.field_146209_f = x
    }
    this.setY = y => {
      this.mcObject.field_146210_g = y
    }
    this.setWidth = width => {
      this.mcObject.field_146218_h = width
    }
    this.setHeight = height => {
      this.mcObject.field_146219_i = height
    }

    this.setEnabled = enabled => {
      const isEnabledField = this.mcObject.class.getDeclaredField('field_146226_p')
      isEnabledField.setAccessible(true)
      isEnabledField.set(this.mcObject, enabled)
    }

    this.setText = text => {
      const textField = this.mcObject.class.getDeclaredField('field_146216_j')
      textField.setAccessible(true)
      textField.set(this.mcObject, text)
    }

    this.getText = () => {
      const textField = this.mcObject.class.getDeclaredField('field_146216_j')
      textField.setAccessible(true)
      return textField.get(this.mcObject)
    }

    this.setIsFocused = isFocused => {
      const isFocusedField = this.mcObject.class.getDeclaredField('field_146213_o')
      isFocusedField.setAccessible(true)
      isFocusedField.set(this.mcObject, isFocused)
    }

    this.isFocused = () => {
      const isFocusedField = this.mcObject.class.getDeclaredField('field_146213_o')
      isFocusedField.setAccessible(true)
      return isFocusedField.get(this.mcObject)
    }

    this.render = () => {
      this.mcObject.func_146194_f()
    }

    this.mouseClicked = (mouseX, mouseY, button) => {
      this.mcObject.func_146192_a(mouseX, mouseY, button)
    }

    this.keyTyped = (char, keyCode) => {
      this.mcObject.func_146201_a(char, keyCode)
    }
  }
}

class FunctionsVisualCache {
  constructor() {
    this.cachedFunctions = []
    this.filteredFunctions = []
    this.isActive = false
    this.isScanning = false
    this.hoveredIndex = -1
    this.selectedIndex = -1
    this.scrollOffset = 0
    this.currentWorld = null
    this.filterText = this.persistentFilterText
    this.showingFilter = false
    this.scannedPages = new Set()
    this.totalPages = 0
    this.currentPage = 1
    this.scrollbarDragging = false
    this.scrollbarDragStartY = 0
    this.scrollbarDragStartOffset = 0

    this.isAutoScanning = false
    this.autoScanTimeout = null

    this.filterTextField = null
    this.initializeTextField = true
    this.persistentFilterText = ''

    this.keybindBlocker = null

    this.lastFunctionInventorySnapshot = null
    this.isInFunctionEditGUI = false
    this.functionEditGUITimeout = null

    this.dropdown = {
      isVisible: false,
      function: null,
      x: 0,
      y: 0,
      width: 30,
      height: 0,
      hoveredOption: -1,
      deleteConfirmationActive: false,
      options: [
        { text: 'Edit', action: 'edit', color: '§e' },
        { text: 'Delete', action: 'delete', color: '§c' },
      ],
    }

    this.colors = {
      panelBg: 0xe0000000,
      panelBorder: 0xff333333,
      itemBg: 0xff2a2a2a,
      itemHover: 0xff404040,
      itemSelected: 0xff4caf50,
      filterBg: 0xff1a1a1a,
      filterBorder: 0xff666666,
      scrollbar: 0xff444444,
      scrollbarThumb: 0xff777777,
      scrollbarThumbHover: 0xff999999,
      buttonBg: 0xff4a4a4a,
      buttonHover: 0xff5a5a5a,
      buttonText: 0xffffffff,
      scanButton: 0xff2196f3,
      scanButtonHover: 0xff1976d2,
      scanButtonActive: 0xff0d47a1,
      dropdownBg: 0xf0222222,
      dropdownBorder: 0xff666666,
      dropdownHover: 0xff555555,
      deleteConfirmation: 0xff660000,
      deleteConfirmationHover: 0xff880000,
      createButton: 0xff4caf50,
      createButtonHover: 0xff45a049,
      createButtonDisabled: 0xff666666,
    }

    this.registerEvents()
  }

  createTextField(x, y, width, height) {
    try {
      const textField = new Input(x, y, width, height)
      textField.setEnabled(true)
      textField.setIsFocused(false)
      textField.setText('')

      return textField
    } catch (error) {
      ChatLib.chat(PREFIX + `§c[ERROR] Failed to create text field: ${error.message}`)
      return null
    }
  }

  disableAllKeybinds() {
    if (this.keybindBlocker) return

    this.keybindBlocker = register('guiKey', (char, keyCode, gui, event) => {
      if (keyCode !== 1) {
        cancel(event)
      }
    })
  }

  restoreAllKeybinds() {
    if (this.keybindBlocker) {
      this.keybindBlocker.unregister()
      this.keybindBlocker = null
    }
  }

  showDropdown(func, mouseX, mouseY) {
    this.dropdown.isVisible = true
    this.dropdown.function = func
    this.dropdown.hoveredOption = -1
    this.dropdown.deleteConfirmationActive = false

    const itemHeight = 20
    this.dropdown.height = this.dropdown.options.length * itemHeight

    let maxWidth = 80
    this.dropdown.options.forEach(option => {
      const textWidth = Renderer.getStringWidth(option.text) + 16
      maxWidth = Math.max(maxWidth, textWidth)
    })

    const confirmTextWidth = Renderer.getStringWidth('CONFIRM') + 16
    maxWidth = Math.min(maxWidth, confirmTextWidth)

    this.dropdown.width = maxWidth

    const screenWidth = Renderer.screen.getWidth()
    const screenHeight = Renderer.screen.getHeight()

    this.dropdown.x = Math.min(mouseX, screenWidth - this.dropdown.width - 10)
    this.dropdown.y = Math.min(mouseY, screenHeight - this.dropdown.height - 10)

    this.dropdown.x = Math.max(10, this.dropdown.x)
    this.dropdown.y = Math.max(10, this.dropdown.y)
  }

  hideDropdown() {
    this.dropdown.isVisible = false
    this.dropdown.function = null
    this.dropdown.hoveredOption = -1
    this.dropdown.deleteConfirmationActive = false
  }

  renderDropdown() {
    if (!this.dropdown.isVisible || !this.dropdown.function) return

    const { x, y, width, height } = this.dropdown
    const itemHeight = 20

    let mouseX, mouseY
    try {
      mouseX = Client.getMouseX()
      mouseY = Client.getMouseY()
    } catch (e) {
      mouseX = 0
      mouseY = 0
    }

    Renderer.drawRect(0xff000000, x - 1, y - 1, width + 2, height + 2)
    Renderer.drawRect(this.colors.dropdownBg, x, y, width, height)

    this.dropdown.hoveredOption = -1

    this.dropdown.options.forEach((option, index) => {
      const itemY = y + index * itemHeight

      const isHovered = mouseX >= x && mouseX <= x + width && mouseY >= itemY && mouseY <= itemY + itemHeight

      if (isHovered) {
        this.dropdown.hoveredOption = index
      }

      let backgroundColor = this.colors.dropdownHover
      let optionText = option.text
      let textColor = option.color

      if (option.action === 'delete') {
        if (this.dropdown.deleteConfirmationActive) {
          optionText = 'CONFIRM'
          textColor = '§c§l'
          backgroundColor = isHovered ? this.colors.deleteConfirmationHover : this.colors.deleteConfirmation
        } else {
          backgroundColor = isHovered ? this.colors.dropdownHover : 0x00000000
        }
      } else {
        backgroundColor = isHovered ? this.colors.dropdownHover : 0x00000000
      }

      // Draw background if needed
      if (backgroundColor !== 0x00000000) {
        Renderer.drawRect(backgroundColor, x, itemY, width, itemHeight)
      }

      // Draw option text
      const textX = x + 8
      const textY = itemY + (itemHeight - 8) / 2
      Renderer.drawStringWithShadow(textColor + optionText, textX, textY)
    })

    const headerText = `§7${this.dropdown.function.name}`
    const headerWidth = Renderer.getStringWidth(headerText)
    if (headerWidth <= width - 16) {
      Renderer.drawStringWithShadow(headerText, x + (width - headerWidth) / 2, y - 12)
    }
  }

  handleDropdownClick(mouseX, mouseY) {
    if (!this.dropdown.isVisible) return false

    const { x, y, width, height } = this.dropdown

    if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
      if (this.dropdown.hoveredOption >= 0) {
        const option = this.dropdown.options[this.dropdown.hoveredOption]
        const func = this.dropdown.function

        if (option.action === 'delete') {
          if (this.dropdown.deleteConfirmationActive) {
            ChatLib.chat(PREFIX + `§cDeleting function: ${func.name}`)
            ChatLib.command(`function delete ${func.name}`)
            this.hideDropdown()

            setTimeout(() => {
              ChatLib.command('functions')
            }, 50)

            return true
          } else {
            this.dropdown.deleteConfirmationActive = true
            return true
          }
        } else {
          this.executeDropdownAction(option.action, func)
          this.hideDropdown()
          return true
        }
      }
    }

    this.hideDropdown()
    return false
  }

  executeDropdownAction(action, func) {
    switch (action) {
      case 'edit':
        ChatLib.command(`function edit ${func.name}`)
        break
      case 'delete':
        ChatLib.command(`function delete ${func.name}`)
        break
      default:
        ChatLib.chat(PREFIX + `§cUnknown action: ${action}`)
    }
  }

  registerEvents() {
    register('worldLoad', () => {
      const newWorld = World.getWorld()
      if (this.currentWorld && newWorld !== this.currentWorld) {
        this.clearCache()
      }
      this.currentWorld = newWorld
    })

    register('chat', (functionName, event) => {
      if (this.cachedFunctions.length > 0) {
        this.handleFunctionCreated(functionName)
      }
    }).setChatCriteria('Created function ${functionName}!')

    register('chat', (functionName, event) => {
      if (this.cachedFunctions.length > 0) {
        this.handleFunctionDeleted(functionName)
      }
    }).setChatCriteria('Deleted the function ${functionName}')

    this.lastFunctionInventorySnapshot = null
    this.isInFunctionEditGUI = false
    this.functionEditGUITimeout = null

    register('guiOpened', guiEvent => {
      const guiScreen = guiEvent.gui
      if (!guiScreen) return

      const className = guiScreen.getClass().getSimpleName()
      if (className !== 'GuiChest') return

      setTimeout(() => {
        const inventory = Player.getOpenedInventory()
        if (!inventory) return

        const title = inventory.getName()
        const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, '') : ''

        if (cleanTitle.startsWith('Edit: ') || cleanTitle === 'Are you sure?') {
          this.isInFunctionEditGUI = true
        } else {
          for (let i = 1; i <= 3; i++) {
            setTimeout(() => {
              this.checkForFunctionsGUI(i)
            }, 50 * i)
          }
        }
      }, 50)
    })

    register('guiClosed', () => {
      if (this.isInFunctionEditGUI) {
        this.isInFunctionEditGUI = false
      } else if (this.isActive) {
        this.hideOverlay()
      }
    })

    register('guiRender', () => {
      if (this.isActive && !this.isScanning && !this.isAutoScanning) {
        this.performCacheValidation()
      }
    })

    register('itemTooltip', () => {
      if (this.isActive && !this.isScanning) {
        this.detectPageChange()
      }
    })

    register('guiRender', (mouseX, mouseY) => {
      if (this.isActive && this.cachedFunctions.length > 0) {
        this.renderOverlay()
        this.renderDropdown()
      }
    })

    register('guiMouseClick', (mouseX, mouseY, button) => {
      if (this.isActive) {
        return this.handleMouseClick(mouseX, mouseY, button)
      }
    })

    register('guiMouseRelease', (mouseX, mouseY, button) => {
      if (this.isActive && this.scrollbarDragging && button === 0) {
        this.scrollbarDragging = false
        return true
      }
    })

    register('guiKey', (char, keyCode) => {
      if (this.isActive) {
        return this.handleKeyPress(keyCode, char)
      }
    })

    register('step', () => {
      if (!this.isActive) return

      let scroll = Mouse.getDWheel()
      if (scroll !== 0) {
        this.handleMouseScroll(scroll > 0 ? -1 : 1)
      }
    }).setFps(60)
  }

  handleFunctionCreated(functionName) {
    const existingFunction = this.cachedFunctions.find(f => f.name === functionName)

    if (!existingFunction) {
      const newFunction = {
        name: functionName,
        displayName: `§f${functionName}`,
        description: 'Newly created function - data not yet scanned',
        descriptions: ['Newly created function - data not yet scanned'],
        lore: [],
        slotIndex: -1,
        hasDescription: true,
        ctItem: null,
        itemId: 0,
        itemDamage: 0,
        page: this.currentPage || 1,
        isPlaceholder: true,
        createdAt: Date.now(),
      }

      this.cachedFunctions.push(newFunction)
      this.updateFilteredFunctions()

      ChatLib.chat(PREFIX + `§a+ Added function "${functionName}" to cache (${this.cachedFunctions.length} total)`)
    } else {
      ChatLib.chat(PREFIX + `§e Function "${functionName}" already exists in cache`)
    }
  }

  handleFunctionDeleted(functionName) {
    const initialCount = this.cachedFunctions.length

    this.cachedFunctions = this.cachedFunctions.filter(f => f.name !== functionName)

    if (this.cachedFunctions.length < initialCount) {
      this.updateFilteredFunctions()

      if (this.selectedIndex >= this.cachedFunctions.length) {
        this.selectedIndex = -1
      }

      ChatLib.chat(PREFIX + `§c- Removed function "${functionName}" from cache (${this.cachedFunctions.length} total)`)
    } else {
      ChatLib.chat(PREFIX + `§e Function "${functionName}" was not found in cache`)
    }
  }

  refreshPlaceholderFunctions() {
    const placeholders = this.cachedFunctions.filter(f => f.isPlaceholder)
    if (placeholders.length > 0) {
      ChatLib.chat(PREFIX + `§e${placeholders.length} placeholder function(s) detected. Consider rescanning to get full data.`)
    }
  }

  validateCacheAgainstCurrentPage() {
    const inventory = Player.getOpenedInventory()
    if (!inventory) return

    const title = inventory.getName()
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, '') : ''
    const functionsRegex = /^\(\d+\/\d+\) Functions$|^Functions$/

    if (!functionsRegex.test(cleanTitle)) return

    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Functions$/)
    const currentPageNum = pageMatch ? parseInt(pageMatch[1]) : 1

    if (currentPageNum !== this.currentPage || !this.scannedPages.has(currentPageNum)) {
      this.currentPage = currentPageNum
      this.scanCurrentPage()
    }
  }

  performCacheValidation() {
    if (!this.isActive || this.isScanning) return

    const inventory = Player.getOpenedInventory()
    if (!inventory) return

    const title = inventory.getName()
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, '') : ''
    const functionsRegex = /^\(\d+\/\d+\) Functions$|^Functions$/

    if (functionsRegex.test(cleanTitle)) {
      this.validateCacheAgainstCurrentPage()
    }
  }

  cleanStaleFunctions() {
    const beforeCount = this.cachedFunctions.length

    this.cachedFunctions = this.cachedFunctions.filter(func => {
      if (func.deleted) return false

      if (func.isPlaceholder && func.createdAt && Date.now() - func.createdAt > 300000) {
        return false
      }

      return true
    })

    const removedCount = beforeCount - this.cachedFunctions.length
    if (removedCount > 0) {
      this.updateFilteredFunctions()
    }
  }

  handleMouseScroll(direction) {
    if (this.dropdown.isVisible) {
      this.hideDropdown()
    }

    const availableHeight = this.getListAvailableHeight()
    const itemHeight = 23
    const maxVisibleItems = Math.floor(availableHeight / itemHeight)
    const maxScroll = Math.max(0, this.filteredFunctions.length - maxVisibleItems)

    this.scrollOffset += direction * 1
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll))
  }

  getListAvailableHeight() {
    const screenHeight = Renderer.screen.getHeight()
    const panelHeight = this.calculatePanelDimensions().height
    return panelHeight - 130
  }

  calculatePanelDimensions() {
    const screenWidth = Renderer.screen.getWidth()
    const screenHeight = Renderer.screen.getHeight()

    const chestGuiWidth = 176
    const chestGuiHeight = 166
    const chestGuiX = (screenWidth - chestGuiWidth) / 2
    const chestGuiY = (screenHeight - chestGuiHeight) / 2

    const rightEdgeOfChest = chestGuiX + chestGuiWidth
    const availableWidthOnRight = screenWidth - rightEdgeOfChest - 20

    const maxPanelWidth = 400
    const minPanelWidth = 300
    let panelWidth = Math.min(maxPanelWidth, Math.max(minPanelWidth, availableWidthOnRight))

    let panelX
    if (availableWidthOnRight < minPanelWidth) {
      panelWidth = Math.min(maxPanelWidth, chestGuiX - 20)
      panelX = 10
    } else {
      panelX = rightEdgeOfChest + 10
    }

    const maxPanelHeight = Math.min(screenHeight - 40, 600)
    const panelHeight = maxPanelHeight
    const panelY = Math.max(10, (screenHeight - panelHeight) / 2)

    return {
      width: panelWidth,
      height: panelHeight,
      x: panelX,
      y: panelY,
    }
  }

  clearCache() {
    this.cachedFunctions = []
    this.filteredFunctions = []
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
    this.scrollbarDragging = false
    this.filterTextField = null
    this.initializeTextField = true

    this.isAutoScanning = false
    if (this.autoScanTimeout) {
      clearTimeout(this.autoScanTimeout)
      this.autoScanTimeout = null
    }

    this.lastFunctionInventorySnapshot = null
    this.isInFunctionEditGUI = false
    if (this.functionEditGUITimeout) {
      clearTimeout(this.functionEditGUITimeout)
      this.functionEditGUITimeout = null
    }
    this.createButton = null

    this.restoreAllKeybinds()
  }

  checkForFunctionsGUI(attempt) {
    if (this.isActive || this.isScanning) return

    const inventory = Player.getOpenedInventory()
    if (!inventory) return

    const functionsRegex = /^\(\d+\/\d+\) Functions$|^Functions$/
    const title = inventory.getName()
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, '') : ''

    if (functionsRegex.test(cleanTitle)) {
      const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Functions$/)
      if (pageMatch) {
        this.currentPage = parseInt(pageMatch[1])
        this.totalPages = parseInt(pageMatch[2])
      } else if (cleanTitle === 'Functions') {
        this.currentPage = 1
        this.totalPages = this.detectTotalPages(inventory)
      }

      this.isScanning = true
      this.scanCurrentPage()
    }
  }

  detectTotalPages(inventory) {
    const nextPageItem = inventory.getStackInSlot(53)
    const previousPageItem = inventory.getStackInSlot(45)

    if ((!nextPageItem || nextPageItem.getName() === 'Air') && (!previousPageItem || previousPageItem.getName() === 'Air')) {
      return 1
    }

    let isPageOne = false

    function checkItem(item) {
      if (!item || item.getName() === 'Air') return null

      const lore = item.getLore() || []
      const itemName = item.getName() || ''
      const linesToCheck = lore.concat([itemName]).filter(line => line && line !== '')

      for (let i = 0; i < linesToCheck.length; i++) {
        try {
          const cleanLine = linesToCheck[i].replace(/§[0-9a-fk-or]/g, '')
          const match = cleanLine.match(/(\d+)\/(\d+)/)
          if (match) {
            const current = parseInt(match[1])
            const total = parseInt(match[2])
            if (current === 1) isPageOne = true
            return total
          }
        } catch (e) {}
      }
      return null
    }

    let totalPages = checkItem(nextPageItem) || checkItem(previousPageItem)

    if (isPageOne) {
      if (!nextPageItem || nextPageItem.getName() === 'Air') {
        return 1
      } else {
        return 999
      }
    }

    return totalPages || 999
  }
  detectPageChange() {
    const inventory = Player.getOpenedInventory()
    if (!inventory) return

    const title = inventory.getName()
    const cleanTitle = title ? title.replace(/§[0-9a-fk-or]/g, '') : ''
    const pageMatch = cleanTitle.match(/^\((\d+)\/(\d+)\) Functions$/)

    if (pageMatch) {
      const newPage = parseInt(pageMatch[1])
      const newTotalPages = parseInt(pageMatch[2])

      if (newPage !== this.currentPage || newTotalPages !== this.totalPages) {
        this.currentPage = newPage

        if (newTotalPages > 0 && newTotalPages !== 999) {
          this.totalPages = newTotalPages
        }

        if (!this.scannedPages.has(newPage)) {
          if (this.isAutoScanning) {
            ChatLib.chat(PREFIX + `§bAuto-scanning page ${newPage}/${this.totalPages}...`)
          } else {
            ChatLib.chat(PREFIX + `§eNew page detected: ${newPage}/${this.totalPages}, scanning...`)
          }
          this.scanCurrentPage()
        } else if (this.isAutoScanning) {
          setTimeout(() => {
            this.continueAutoScan()
          }, this.autoScanDelay / 2)
        }
      }
    } else if (cleanTitle === 'Functions') {
      if (this.currentPage !== 1) {
        this.currentPage = 1
        this.totalPages = this.detectTotalPages(inventory)

        if (!this.scannedPages.has(1)) {
          ChatLib.chat(PREFIX + `§eBack to page 1, scanning...`)
          this.scanCurrentPage()
        } else if (this.isAutoScanning) {
          setTimeout(() => {
            this.continueAutoScan()
          }, this.autoScanDelay / 2)
        }
      }
    }
  }

  stopAutoScan() {
    if (!this.isAutoScanning) return

    this.isAutoScanning = false
    if (this.autoScanTimeout) {
      clearTimeout(this.autoScanTimeout)
      this.autoScanTimeout = null
    }

    ChatLib.chat(PREFIX + `§eAuto-scan stopped. Scanned ${this.scannedPages.size}/${this.totalPages} pages.`)
  }

  scanCurrentPage() {
    const inventory = Player.getOpenedInventory()
    if (!inventory) {
      this.isScanning = false
      return
    }

    this.scannedPages.add(this.currentPage)

    // prettier-ignore
    const functionSlots = [
      10, 11, 12, 13, 14, 15, 16, // Row 1
      19, 20, 21, 22, 23, 24, 25, // Row 2
      28, 29, 30, 31, 32, 33, 34, // Row 3
    ];

    const currentPageFunctions = new Set()
    let newFunctionsFound = 0
    let updatedPlaceholders = 0
    let renamedFunctions = 0

    functionSlots.forEach(slotIndex => {
      const item = inventory.getStackInSlot(slotIndex)
      if (item && item.getName() !== 'Air') {
        const functionData = this.parseFunctionItem(item, slotIndex)
        if (functionData) {
          currentPageFunctions.add(functionData.name)

          const existingFunction = this.cachedFunctions.find(f => f.name === functionData.name)

          if (!existingFunction) {
            const possibleRename = this.cachedFunctions.find(
              f => f.page === this.currentPage && f.slotIndex === slotIndex && f.name !== functionData.name
            )

            if (possibleRename) {
              if (renamedFunctions < 2) {
                ChatLib.chat(PREFIX + `§6Detected rename: "${possibleRename.name}" → "${functionData.name}"`)
              }

              Object.assign(possibleRename, functionData)
              renamedFunctions++
            } else {
              this.cachedFunctions.push(functionData)
              newFunctionsFound++
            }
          } else if (existingFunction.isPlaceholder) {
            Object.assign(existingFunction, functionData)
            existingFunction.isPlaceholder = false
            updatedPlaceholders++
          } else {
            Object.assign(existingFunction, functionData)
          }
        }
      }
    })

    const deletedFunctions = this.cachedFunctions.filter(
      f => f.page === this.currentPage && !f.isPlaceholder && !currentPageFunctions.has(f.name)
    )

    if (deletedFunctions.length > 0) {
      deletedFunctions.forEach(func => {
        if (deletedFunctions.length <= 2) {
          ChatLib.chat(PREFIX + `§cDeleted function detected: "${func.name}"`)
        }
        const index = this.cachedFunctions.indexOf(func)
        if (index > -1) {
          this.cachedFunctions.splice(index, 1)
        }
      })
    }

    if (this.isAutoScanning) {
      let message = `§bPage ${this.currentPage}:`
      if (newFunctionsFound > 0) message += ` +${newFunctionsFound} new`
      if (updatedPlaceholders > 0) message += ` ~${updatedPlaceholders} updated`

      if (renamedFunctions > 0 && renamedFunctions <= 2) message += ` ↻${renamedFunctions} renamed`

      if (deletedFunctions.length > 0 && deletedFunctions.length <= 2) message += ` -${deletedFunctions.length} deleted`

      message += ` (Total: ${this.cachedFunctions.length})`

      if (
        newFunctionsFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedFunctions > 0 && renamedFunctions <= 2) ||
        (deletedFunctions.length > 0 && deletedFunctions.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message)
        World.playSound('random.orb', 1, 2)
      }
    } else {
      let message = `§aPage ${this.currentPage} scan complete.`
      if (newFunctionsFound > 0) message += ` Found ${newFunctionsFound} new functions.`
      if (updatedPlaceholders > 0) message += ` Updated ${updatedPlaceholders} placeholders.`

      if (renamedFunctions > 0 && renamedFunctions <= 2) message += ` Detected ${renamedFunctions} renames.`

      if (deletedFunctions.length > 0 && deletedFunctions.length <= 2) message += ` Removed ${deletedFunctions.length} deleted functions.`

      message += ` Total: ${this.cachedFunctions.length}`

      if (
        newFunctionsFound > 0 ||
        updatedPlaceholders > 0 ||
        (renamedFunctions > 0 && renamedFunctions <= 2) ||
        (deletedFunctions.length > 0 && deletedFunctions.length <= 2)
      ) {
        ChatLib.chat(PREFIX + message)
      }
    }

    this.updateFilteredFunctions()

    if (!this.isActive) {
      this.isActive = true
      this.initializeTextField = true
      this.disableAllKeybinds()
    }

    this.isScanning = false

    if (this.scannedPages.size < this.totalPages && !this.isAutoScanning) {
      const unscannedPages = []
      for (let i = 1; i <= this.totalPages; i++) {
        if (!this.scannedPages.has(i)) {
          unscannedPages.push(i)
        }
      }
    }
  }

  startAutoScan() {
    if (this.isAutoScanning || !this.isActive) return

    this.isAutoScanning = true

    const inventory = Player.getOpenedInventory()
    const previousPageItem = inventory.getStackInSlot(45)

    if (previousPageItem && previousPageItem.getName() !== 'Air') {
      inventory.click(45, false, 'RIGHT')
    }

    ChatLib.chat(PREFIX + `§bStarting auto-scan of all pages...`)
    setTimeout(() => this.continueAutoScan(), 100)
  }

  scanLastPageOnly() {
    if (this.totalPages <= 1) {
      this.scanCurrentPage()
      return
    }

    const inventory = Player.getOpenedInventory()
    if (!inventory) return

    const nextPageItem = inventory.getStackInSlot(53)
    if (nextPageItem && nextPageItem.getName() !== 'Air') {
      ChatLib.chat(PREFIX + `§bGoing to last page (${this.totalPages})...`)
      inventory.click(53, false, 'RIGHT')

      setTimeout(() => {
        this.scanCurrentPage()
      }, 500)
    } else {
      this.scanCurrentPage()
    }
  }

  continueAutoScan() {
    if (!this.isAutoScanning) return

    const inventory = Player.getOpenedInventory()
    if (!inventory) {
      this.autoScanTimeout = setTimeout(() => this.continueAutoScan(), 200)
      return
    }

    if (!this.scannedPages.has(this.currentPage)) {
      this.scanCurrentPage()
    }

    const nextPageItem = inventory.getStackInSlot(53)

    if (nextPageItem && nextPageItem.getName() !== 'Air') {
      inventory.click(53, false, 'LEFT')
      this.autoScanTimeout = setTimeout(() => this.continueAutoScan(), 500)
      return
    }

    ChatLib.chat(PREFIX + `§aAuto-scan complete! Scanned all ${this.totalPages} pages with ${this.cachedFunctions.length} total functions.`)
    this.isAutoScanning = false
    this.refreshPlaceholderFunctions()
  }

  parseFunctionItem(item, slotIndex) {
    const itemName = item.getName()
    const cleanName = itemName.replace(/§[0-9a-fk-or]/g, '')
    const lore = item.getLore()

    let descriptions = []
    let hasFunctionData = false

    lore.forEach(line => {
      const cleanLine = line.replace(/§[0-9a-fk-or]/g, '')

      if (
        cleanLine.trim() === '' ||
        cleanLine.includes('Left Click') ||
        cleanLine.includes('Right Click') ||
        cleanLine.includes('SHIFT') ||
        cleanLine.includes('more options')
      ) {
        return
      }

      if (line.includes('§7')) {
        descriptions.push(cleanLine.trim())
        hasFunctionData = true
      }
    })

    let ctItem = null
    let itemId = 0
    let itemDamage = 0

    try {
      itemId = item.getID()
      itemDamage = item.getMetadata ? item.getMetadata() : 0

      if (itemId && itemId !== 0) {
        if (itemDamage > 0) {
          ctItem = new Item(itemId, itemDamage)
        } else {
          ctItem = new Item(itemId)
        }
      }
    } catch (error) {
      ctItem = null
    }

    return {
      name: cleanName,
      displayName: itemName,
      description: descriptions.length > 0 ? descriptions.join(' ') : null,
      descriptions: descriptions,
      lore: lore,
      slotIndex: slotIndex,
      hasDescription: hasFunctionData,
      ctItem: ctItem,
      itemId: itemId,
      itemDamage: itemDamage,
      page: this.currentPage,
      isPlaceholder: false,
    }
  }

  updateFilteredFunctions() {
    const filterText = this.filterTextField ? this.filterTextField.getText() : ''

    if (!filterText) {
      this.filteredFunctions = [...this.cachedFunctions]
    } else {
      const filter = filterText.toLowerCase()
      this.filteredFunctions = this.cachedFunctions.filter(
        func =>
          func.name.toLowerCase().includes(filter) ||
          (func.description && func.description.toLowerCase().includes(filter)) ||
          (func.descriptions && func.descriptions.some(desc => desc.toLowerCase().includes(filter)))
      )
    }

    if (this.selectedIndex >= this.filteredFunctions.length) {
      this.selectedIndex = -1
    }

    const availableHeight = this.getListAvailableHeight()
    const itemHeight = 23
    const maxVisibleItems = Math.floor(availableHeight / itemHeight)
    const maxScroll = Math.max(0, this.filteredFunctions.length - maxVisibleItems)
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll))
  }

  saveFilterText() {
    if (this.filterTextField) {
      this.persistentFilterText = this.filterTextField.getText()
    }
  }

  loadFilterText() {
    return this.persistentFilterText
  }

  getScannedPagesDisplay() {
    if (this.totalPages === 999) {
      return `(${this.scannedPages.size}/?)`
    } else if (this.totalPages === 0) {
      return `(${this.scannedPages.size}/?)`
    } else {
      return `(${this.scannedPages.size}/${this.totalPages})`
    }
  }

  areAllPagesScanned() {
    if (this.scannedPages.size === 0) return false
    if (this.totalPages === 0 || this.totalPages === 999) {
      return false
    }
    return this.scannedPages.size >= this.totalPages
  }
  renderOverlay() {
    try {
      const panelDims = this.calculatePanelDimensions()
      const { width: panelWidth, height: panelHeight, x: panelX, y: panelY } = panelDims

      if (this.initializeTextField || !this.filterTextField) {
        const filterY = panelY + 30
        const filterHeight = 20
        this.filterTextField = this.createTextField(panelX + 10, filterY, panelWidth - 20, filterHeight)
        this.initializeTextField = false

        if (this.filterTextField) {
          const savedFilterText = this.loadFilterText()
          this.filterTextField.setText(savedFilterText)
          this.filterText = savedFilterText
          this.updateFilteredFunctions()
        }
      }

      // Draw panel with border
      Renderer.drawRect(0xdd000000, panelX - 1, panelY - 1, panelWidth + 4, panelHeight + 4)
      Renderer.drawRect(0xff444444, panelX - 1, panelY - 1, panelWidth + 2, panelHeight + 2)
      Renderer.drawRect(0xcc222222, panelX, panelY, panelWidth, panelHeight)

      let currentY = panelY + 10

      // Draw title
      const placeholderCount = this.cachedFunctions.filter(f => f.isPlaceholder).length
      const scannedInfo = this.getScannedPagesDisplay()
      let title = `${PREFIX}Functions (${this.cachedFunctions.length}) ${scannedInfo}`
      if (placeholderCount > 0) title += ` §e[${placeholderCount} new]`
      const titleWidth = Renderer.getStringWidth(title)
      Renderer.drawStringWithShadow(title, panelX + (panelWidth - titleWidth) / 2, currentY)
      currentY += 20

      if (this.filterTextField) {
        const filterText = this.filterTextField.getText()
        const hasText = filterText && filterText.length > 0
        const filterFieldWidth = hasText ? panelWidth - 40 : panelWidth - 20 // shrink if clear button
        this.filterTextField.setWidth(filterFieldWidth)
        this.filterTextField.render()

        // Draw clear button if text exists
        if (hasText) {
          const buttonSize = 20
          const buttonX = panelX + 10 + filterFieldWidth + 4
          const buttonY = currentY
          let mouseX = 0,
            mouseY = 0
          try {
            mouseX = Client.getMouseX()
            mouseY = Client.getMouseY()
          } catch (e) {}
          const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonSize && mouseY >= buttonY && mouseY <= buttonY + buttonSize
          const color = isHovered ? 0xffff5555 : 0xffff0000
          Renderer.drawRect(color, buttonX, buttonY, buttonSize, buttonSize)
          Renderer.drawRect(0xff000000, buttonX, buttonY, buttonSize, 1)
          Renderer.drawRect(0xff000000, buttonX, buttonY + buttonSize - 1, buttonSize, 1)
          Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonSize)
          Renderer.drawRect(0xff000000, buttonX + buttonSize - 1, buttonY, 1, buttonSize)
          const xTextWidth = Renderer.getStringWidth('X')
          Renderer.drawStringWithShadow('§fX', buttonX + (buttonSize - xTextWidth) / 2, buttonY + 4)

          this.clearFilterButton = {
            x: buttonX,
            y: buttonY,
            width: buttonSize,
            height: buttonSize,
          }
        } else {
          this.clearFilterButton = null
        }

        if (filterText !== this.filterText) {
          this.filterText = filterText
          this.persistentFilterText = filterText
          this.updateFilteredFunctions()
        }
      }

      currentY += 30

      // Draw functions list
      const listHeight = panelHeight - (currentY - panelY) - 70
      this.drawFunctionsList(panelX, currentY, panelWidth, listHeight)

      const buttonY = currentY + listHeight
      this.drawAutoScanButton(panelX, buttonY, panelWidth)

      const instructions = [
        '§7Left click to edit • Right click for more options',
        '§eCAUTION: Functions with long names might not save to Last Function!',
        '§eCAUTION: The speed of the buttons is dependant on your ping!',
      ]
      instructions.forEach((instruction, index) => {
        const instrWidth = Renderer.getStringWidth(instruction)
        const instrX = panelX + (panelWidth - instrWidth) / 2
        const instrY = panelY + panelHeight - 35 + index * 10
        Renderer.drawStringWithShadow(instruction, instrX, instrY)
      })
    } catch (error) {
      ChatLib.chat(PREFIX + `§c[ERROR] Rendering failed: ${error.message}`)
    }
  }

  drawFunctionsList(panelX, listStartY, panelWidth, availableHeight) {
    const itemHeight = 22
    const itemSpacing = 1
    const maxVisibleItems = Math.floor(availableHeight / (itemHeight + itemSpacing))
    const scrollbarWidth = 3
    const scrollbarMargin = 3
    const listWidth = panelWidth - 20
    const iconSize = 16
    const iconMargin = 4

    let mouseX, mouseY
    try {
      mouseX = Client.getMouseX()
      mouseY = Client.getMouseY()
    } catch (e) {
      mouseX = 0
      mouseY = 0
    }

    this.hoveredIndex = -1

    const filterText = this.filterTextField ? this.filterTextField.getText().trim() : ''

    // No results case
    const shouldShowCreateButton = this.filteredFunctions.length === 0 && filterText.length > 0
    if (this.filteredFunctions.length === 0) {
      const noResultsText = '§7No functions match your search'
      const noResultsWidth = Renderer.getStringWidth(noResultsText)
      const noResultsX = panelX + (panelWidth - noResultsWidth) / 2
      const noResultsY = listStartY + 20
      Renderer.drawStringWithShadow(noResultsText, noResultsX, noResultsY)

      // Draw separate create button
      if (shouldShowCreateButton) {
        const buttonY = listStartY + 50
        const buttonHeight = 25
        const buttonWidth = Math.min(250, panelWidth - 40)
        const buttonX = panelX + (panelWidth - buttonWidth) / 2

        const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight

        const buttonColor = isHovered ? this.colors.createButtonHover : this.colors.createButton
        const buttonText = `§f+ Create "${filterText}"`

        Renderer.drawRect(buttonColor, buttonX, buttonY, buttonWidth, buttonHeight)
        Renderer.drawRect(0xff000000, buttonX, buttonY, buttonWidth, 1)
        Renderer.drawRect(0xff000000, buttonX, buttonY + buttonHeight - 1, buttonWidth, 1)
        Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonHeight)
        Renderer.drawRect(0xff000000, buttonX + buttonWidth - 1, buttonY, 1, buttonHeight)

        const textWidth = Renderer.getStringWidth(buttonText)
        const textX = buttonX + (buttonWidth - textWidth) / 2
        const textY = buttonY + (buttonHeight - 8) / 2
        Renderer.drawStringWithShadow(buttonText, textX, textY)

        this.createButton = {
          x: buttonX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight,
          functionName: filterText,
          isDisabled: false,
        }
      } else {
        this.createButton = null
      }

      return
    }

    this.createButton = null

    const listItems = [...this.filteredFunctions]
    if (filterText.length > 0) {
      listItems.push({
        name: `+ Create "${filterText}"`,
        isPlaceholder: false,
        ctItem: null,
        hasDescription: false,
        description: null,
        functionName: filterText,
        isCreateItem: true,
      })
    }

    const startIndex = this.scrollOffset
    const endIndex = Math.min(startIndex + maxVisibleItems, listItems.length)
    const visibleItemCount = endIndex - startIndex
    const actualContentHeight = visibleItemCount * (itemHeight + itemSpacing)

    // Draw scrollbar
    if (listItems.length > maxVisibleItems) {
      const scrollbarX = panelX + panelWidth - scrollbarWidth - scrollbarMargin
      const maxScrollRange = listItems.length - maxVisibleItems
      const scrollbarHeight = actualContentHeight
      Renderer.drawRect(this.colors.scrollbar, scrollbarX, listStartY, scrollbarWidth, scrollbarHeight)

      const thumbHeight = Math.max(10, (maxVisibleItems / listItems.length) * scrollbarHeight)
      const thumbY = maxScrollRange > 0 ? listStartY + (this.scrollOffset / maxScrollRange) * (scrollbarHeight - thumbHeight) : listStartY
      Renderer.drawRect(this.colors.scrollbarThumb, scrollbarX, thumbY, scrollbarWidth, thumbHeight)
    }

    for (let i = startIndex; i < endIndex; i++) {
      const func = listItems[i]
      if (!func) continue

      const listIndex = i - startIndex
      const itemX = panelX + 10
      const itemY = listStartY + listIndex * (itemHeight + itemSpacing)

      const isHovered = mouseX >= itemX && mouseX <= itemX + listWidth && mouseY >= itemY && mouseY <= itemY + itemHeight

      if (isHovered) this.hoveredIndex = i

      let bgColor = 0xff333333
      if (i === this.selectedIndex) bgColor = 0xff4caf50
      else if (isHovered) bgColor = 0xff555555
      if (func.isPlaceholder) bgColor = 0xff4a4a00
      if (func.isCreateItem) {
        bgColor = isHovered ? this.colors.createButtonHover : this.colors.createButton
      }

      Renderer.drawRect(bgColor, itemX, itemY, listWidth, itemHeight)

      try {
        if (func.ctItem) {
          const iconX = itemX + iconMargin
          const iconY = itemY + (itemHeight - iconSize) / 2
          func.ctItem.draw(iconX, iconY, 1.0)
        } else if (!func.isCreateItem) {
          this.drawFallbackIcon(itemX + iconMargin, itemY + (itemHeight - iconSize) / 2, iconSize, func)
        }
      } catch (e) {
        if (!func.isCreateItem) {
          this.drawFallbackIcon(itemX + iconMargin, itemY + (itemHeight - iconSize) / 2, iconSize, func)
        }
      }

      const hasDescription = func.hasDescription && (func.description || (func.descriptions && func.descriptions.length > 0))

      let textStartX, availableTextWidth

      if (func.isCreateItem) {
        textStartX = itemX
        availableTextWidth = listWidth
      } else {
        textStartX = itemX + iconSize + iconMargin * 2
        availableTextWidth = listWidth - iconSize - iconMargin * 3
      }

      const nameColor = func.isCreateItem ? '§f' : i === this.selectedIndex ? '§a' : isHovered ? '§e' : func.isPlaceholder ? '§6' : '§f'
      const functionName = func.name || 'Unknown Function'

      if (func.isCreateItem) {
        const textWidth = Renderer.getStringWidth(functionName)
        const centerX = textStartX + (availableTextWidth - textWidth) / 2
        Renderer.drawStringWithShadow(nameColor + functionName, centerX, itemY + (itemHeight - 8) / 2)
      } else {
        const pageCounter = func.page ? `§8[P${func.page}]` : ''
        const pageCounterWidth = func.page ? Renderer.getStringWidth(`[P${func.page}]`) : 0

        const maxCharsForName = Math.floor((availableTextWidth - pageCounterWidth - 10) / 6) - 2
        const displayName = functionName.length > maxCharsForName ? functionName.substring(0, maxCharsForName - 3) + '...' : functionName

        const finalDisplayName = func.isPlaceholder ? displayName + ' §8[NEW]' : displayName

        if (hasDescription) {
          Renderer.drawStringWithShadow(nameColor + finalDisplayName, textStartX, itemY + 2)
        } else {
          Renderer.drawStringWithShadow(nameColor + finalDisplayName, textStartX, itemY + (itemHeight - 8) / 2)
        }

        if (func.page) {
          const pageX = itemX + listWidth - pageCounterWidth - 5
          const pageY = itemY + (itemHeight - 8) / 2
          Renderer.drawStringWithShadow(pageCounter, pageX, pageY)
        }

        if (hasDescription) {
          let descriptionText = func.description || (func.descriptions && func.descriptions[0])
          if (descriptionText) {
            const descText = `§7${descriptionText}`
            const maxDescLength = Math.floor(availableTextWidth / 6)
            const finalDescText = descText.length > maxDescLength ? descText.substring(0, maxDescLength - 3) + '...' : descText
            Renderer.drawStringWithShadow(finalDescText, textStartX, itemY + 12)
          }
        }
      }
    }
  }

  drawFallbackIcon(x, y, size, func) {
    let color = 0xff666666

    if (func.isPlaceholder) {
      color = 0xffffaa00 // Orange for new functions
    } else if (func.name) {
      let hash = 0
      for (let i = 0; i < func.name.length; i++) {
        hash = func.name.charCodeAt(i) + ((hash << 5) - hash)
      }

      // don't make colors too dark
      const r = (Math.abs(hash) % 128) + 127
      const g = (Math.abs(hash >> 8) % 128) + 127
      const b = (Math.abs(hash >> 16) % 128) + 127

      color = (0xff << 24) | (r << 16) | (g << 8) | b
    }

    Renderer.drawRect(color, x, y, size, size)

    // Draw a border
    Renderer.drawRect(0xff000000, x, y, size, 1) // top
    Renderer.drawRect(0xff000000, x, y + size - 1, size, 1) // bottom
    Renderer.drawRect(0xff000000, x, y, 1, size) // left
    Renderer.drawRect(0xff000000, x + size - 1, y, 1, size) // right

    if (func.name && func.name.length > 0) {
      const letter = func.name.charAt(0).toUpperCase()
      const letterWidth = Renderer.getStringWidth(letter)
      const centerX = x + (size - letterWidth) / 2
      const centerY = y + (size - 8) / 2
      Renderer.drawStringWithShadow('§f' + letter, centerX, centerY)
    }
  }

  drawCreateButton(panelX, buttonY, panelWidth, functionName) {
    const buttonHeight = 25
    const buttonWidth = Math.min(250, panelWidth - 40)
    const buttonX = panelX + (panelWidth - buttonWidth) / 2

    let mouseX, mouseY
    try {
      mouseX = Client.getMouseX()
      mouseY = Client.getMouseY()
    } catch (e) {
      mouseX = 0
      mouseY = 0
    }

    const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight

    const allPagesScanned = this.areAllPagesScanned()
    const isDisabled = !allPagesScanned

    let buttonColor
    let buttonText

    if (isDisabled) {
      buttonColor = this.colors.createButtonDisabled
      buttonText = `§7(SCAN ALL PAGES FIRST)`
    } else {
      buttonColor = isHovered ? this.colors.createButtonHover : this.colors.createButton
      buttonText = `§f+ Create "${functionName}"`
    }

    // Draw button background
    Renderer.drawRect(buttonColor, buttonX, buttonY, buttonWidth, buttonHeight)

    // Draw button border
    Renderer.drawRect(0xff000000, buttonX, buttonY, buttonWidth, 1) // top
    Renderer.drawRect(0xff000000, buttonX, buttonY + buttonHeight - 1, buttonWidth, 1) // bottom
    Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonHeight) // left
    Renderer.drawRect(0xff000000, buttonX + buttonWidth - 1, buttonY, 1, buttonHeight) // right

    const textWidth = Renderer.getStringWidth(buttonText)
    const textX = buttonX + (buttonWidth - textWidth) / 2
    const textY = buttonY + (buttonHeight - 8) / 2
    Renderer.drawStringWithShadow(buttonText, textX, textY)

    this.createButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      functionName: functionName,
      isDisabled: isDisabled,
    }
  }

  drawAutoScanButton(panelX, buttonY, panelWidth) {
    const buttonHeight = 20
    const buttonWidth = 120
    const buttonX = panelX + (panelWidth - buttonWidth) / 2

    let mouseX, mouseY
    try {
      mouseX = Client.getMouseX()
      mouseY = Client.getMouseY()
    } catch (e) {
      mouseX = 0
      mouseY = 0
    }

    const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight

    const buttonColor = this.isAutoScanning
      ? isHovered
        ? this.colors.scanButtonActive
        : this.colors.scanButtonHover
      : isHovered
      ? this.colors.scanButtonHover
      : this.colors.scanButton

    const buttonText = this.isAutoScanning ? '§fStop Scanning' : '§fScan All Pages'

    Renderer.drawRect(buttonColor, buttonX, buttonY, buttonWidth, buttonHeight)
    Renderer.drawRect(0xff000000, buttonX, buttonY, buttonWidth, 1)
    Renderer.drawRect(0xff000000, buttonX, buttonY + buttonHeight - 1, buttonWidth, 1)
    Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonHeight)
    Renderer.drawRect(0xff000000, buttonX + buttonWidth - 1, buttonY, 1, buttonHeight)

    const textWidth = Renderer.getStringWidth(buttonText)
    const textX = buttonX + (buttonWidth - textWidth) / 2
    const textY = buttonY + (buttonHeight - 8) / 2
    Renderer.drawStringWithShadow(buttonText, textX, textY)

    this.autoScanButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
    }
  }

  drawValidationButton(panelX, buttonY, panelWidth) {
    const buttonHeight = 18
    const buttonWidth = 100
    const buttonX = panelX + panelWidth - buttonWidth - 10

    let mouseX, mouseY
    try {
      mouseX = Client.getMouseX()
      mouseY = Client.getMouseY()
    } catch (e) {
      mouseX = 0
      mouseY = 0
    }

    const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight

    const buttonColor = isHovered ? 0xff666666 : 0xff444444

    Renderer.drawRect(buttonColor, buttonX, buttonY, buttonWidth, buttonHeight)
    Renderer.drawRect(0xff000000, buttonX, buttonY, buttonWidth, 1)
    Renderer.drawRect(0xff000000, buttonX, buttonY + buttonHeight - 1, buttonWidth, 1)
    Renderer.drawRect(0xff000000, buttonX, buttonY, 1, buttonHeight)
    Renderer.drawRect(0xff000000, buttonX + buttonWidth - 1, buttonY, 1, buttonHeight)

    const buttonText = '§fValidate Cache'
    const textWidth = Renderer.getStringWidth(buttonText)
    const textX = buttonX + (buttonWidth - textWidth) / 2
    const textY = buttonY + (buttonHeight - 8) / 2
    Renderer.drawStringWithShadow(buttonText, textX, textY)

    this.validateButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
    }
  }

  handleMouseClick(mouseX, mouseY, button) {
    if (!this.isActive) return false

    const panelDims = this.calculatePanelDimensions()
    const { width: panelWidth, height: panelHeight, x: panelX, y: panelY } = panelDims

    if (
      this.clearFilterButton &&
      button === 0 &&
      mouseX >= this.clearFilterButton.x &&
      mouseX <= this.clearFilterButton.x + this.clearFilterButton.width &&
      mouseY >= this.clearFilterButton.y &&
      mouseY <= this.clearFilterButton.y + this.clearFilterButton.height
    ) {
      if (this.filterTextField) {
        this.filterTextField.setText('')
        this.persistentFilterText = ''
        this.filterTextField.setIsFocused(false)
        this.updateFilteredFunctions()
      }
      return true
    }

    if (this.dropdown.isVisible) {
      return this.handleDropdownClick(mouseX, mouseY)
    }

    if (
      button === 0 &&
      this.createButton &&
      mouseX >= this.createButton.x &&
      mouseX <= this.createButton.x + this.createButton.width &&
      mouseY >= this.createButton.y &&
      mouseY <= this.createButton.y + this.createButton.height
    ) {
      if (!this.createButton.isDisabled) {
        const functionName = this.createButton.functionName
        if (functionName && functionName.trim().length > 0) {
          this.createFunction(functionName)
        }
      } else {
        ChatLib.chat(PREFIX + `§cPlease scan all pages before creating new functions!`)
      }
      return true
    }

    if (
      button === 0 &&
      this.autoScanButton &&
      mouseX >= this.autoScanButton.x &&
      mouseX <= this.autoScanButton.x + this.autoScanButton.width &&
      mouseY >= this.autoScanButton.y &&
      mouseY <= this.autoScanButton.y + this.autoScanButton.height
    ) {
      if (this.isAutoScanning) {
        this.stopAutoScan()
      } else {
        this.startAutoScan()
      }
      return true
    }

    if (this.filterTextField && button === 0) {
      this.filterTextField.mouseClicked(mouseX, mouseY, button)
    }

    let currentY = panelY + 10
    currentY += 20
    currentY += 30
    const listStartY = currentY

    const itemHeight = 22
    const itemSpacing = 1
    const listWidth = panelWidth - 20
    const availableHeight = panelHeight - 130
    const maxVisibleItems = Math.floor(availableHeight / (itemHeight + itemSpacing))
    const startIndex = this.scrollOffset

    let listItems = [...this.filteredFunctions]
    const filterText = this.filterTextField ? this.filterTextField.getText().trim() : ''

    if (filterText.length > 0) {
      listItems.push({
        name: `+ Create "${filterText}"`,
        isCreateItem: true,
        functionName: filterText,
      })
    }

    const endIndex = Math.min(startIndex + maxVisibleItems, listItems.length)

    for (let i = startIndex; i < endIndex; i++) {
      const func = listItems[i]
      if (!func) continue

      const listIndex = i - startIndex
      const itemX = panelX + 10
      const itemY = listStartY + listIndex * (itemHeight + itemSpacing)

      if (mouseX >= itemX && mouseX <= itemX + listWidth && mouseY >= itemY && mouseY <= itemY + itemHeight) {
        if (func.isCreateItem) {
          if (button === 0) {
            const currentFilterText = this.filterTextField ? this.filterTextField.getText().trim() : ''

            if (!currentFilterText || currentFilterText.length === 0) {
              ChatLib.chat(PREFIX + `§cNo function name entered!`)
              return true
            }

            const existingFunction = this.cachedFunctions.find(f => f.name === currentFilterText)
            if (existingFunction) {
              ChatLib.chat(PREFIX + `§cFunction "${currentFilterText}" already exists!`)
              return true
            }

            ChatLib.chat(PREFIX + `§aCreating function: "${currentFilterText}"`)
            ChatLib.command(`function create ${currentFilterText}`)

            setTimeout(() => {
              if (this.filterTextField) {
                this.filterTextField.setText('')
                this.filterText = ''
                this.persistentFilterText = ''
                this.updateFilteredFunctions()
              }
            }, 100)

            return true
          }
          return true
        } else {
          this.selectedIndex = i
          if (button === 0) {
            this.editFunction(func)
          } else if (button === 1) {
            this.showDropdown(func, mouseX, mouseY)
          }
          return true
        }
      }
    }

    if (mouseX >= panelX && mouseX <= panelX + panelWidth && mouseY >= panelY && mouseY <= panelY + panelHeight) {
      return true
    }

    return false
  }

  createFunction(functionName) {
    if (functionName && functionName.trim().length > 0) {
      let cleanName = functionName
      if (cleanName.startsWith('+ Create "') && cleanName.endsWith('"')) {
        cleanName = cleanName.replace(/^\+ Create "/, '').replace(/"$/, '')
      }

      if (cleanName.trim().length === 0) {
        ChatLib.chat(PREFIX + `§cFunction name cannot be empty!`)
        return
      }

      const existingFunction = this.cachedFunctions.find(f => f.name === cleanName)
      if (existingFunction) {
        ChatLib.chat(PREFIX + `§cFunction "${cleanName}" already exists!`)
        return
      }

      ChatLib.chat(PREFIX + `§aCreating new function: "${cleanName}"`)
      ChatLib.command(`function create ${cleanName}`)

      if (this.filterTextField) {
        this.filterTextField.setText('')
        this.filterText = ''
        this.persistentFilterText = ''
        this.updateFilteredFunctions()
      }
    } else {
      ChatLib.chat(PREFIX + `§cInvalid function name!`)
    }
  }

  handleKeyPress(keyCode, char) {
    // Handle dropdown key presses
    if (this.dropdown.isVisible) {
      if (keyCode === 1) {
        // ESC - close dropdown
        this.hideDropdown()
        return true
      } else if (keyCode === 200) {
        // Up arrow - navigate dropdown up
        if (this.dropdown.hoveredOption > 0) {
          this.dropdown.hoveredOption--
        } else {
          this.dropdown.hoveredOption = this.dropdown.options.length - 1
        }
        return true
      } else if (keyCode === 208) {
        // Down arrow - navigate dropdown down
        if (this.dropdown.hoveredOption < this.dropdown.options.length - 1) {
          this.dropdown.hoveredOption++
        } else {
          this.dropdown.hoveredOption = 0
        }
        return true
      } else if (keyCode === 28) {
        // Enter - execute dropdown option
        if (this.dropdown.hoveredOption >= 0) {
          const option = this.dropdown.options[this.dropdown.hoveredOption]
          const func = this.dropdown.function

          // Handle delete confirmation with Enter key
          if (option.action === 'delete') {
            if (this.dropdown.deleteConfirmationActive) {
              this.executeDropdownAction(option.action, func)
              this.hideDropdown()
            } else {
              this.dropdown.deleteConfirmationActive = true
            }
          } else {
            this.executeDropdownAction(option.action, func)
            this.hideDropdown()
          }
        }
        return true
      }
      return true
    }

    // Rest of the existing handleKeyPress logic...
    if (this.filterTextField && this.filterTextField.isFocused()) {
      if (keyCode === 1) {
        // ESC
        this.filterTextField.setIsFocused(false)
        this.hideOverlay()
        return true
      } else if (keyCode === 28) {
        // Enter
        this.filterTextField.setIsFocused(false)
        return true
      } else if (keyCode === 15) {
        // Tab
        this.filterTextField.setIsFocused(false)
        return true
      }

      this.filterTextField.keyTyped(char, keyCode)
      return true
    }

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
      if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredFunctions.length) {
        this.editFunction(this.filteredFunctions[this.selectedIndex])
        return true
      }
    } else if (keyCode === 57) {
      // Space bar - toggle auto-scan
      if (this.isAutoScanning) {
        this.stopAutoScan()
      } else {
        this.startAutoScan()
      }
      return true
    }

    return true
  }

  navigateUp() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--
      this.ensureVisible()
    } else if (this.selectedIndex === -1 && this.filteredFunctions.length > 0) {
      this.selectedIndex = 0
    }
  }

  navigateDown() {
    if (this.selectedIndex < this.filteredFunctions.length - 1) {
      this.selectedIndex++
      this.ensureVisible()
    } else if (this.selectedIndex === -1 && this.filteredFunctions.length > 0) {
      this.selectedIndex = 0
    }
  }

  ensureVisible() {
    const availableHeight = this.getListAvailableHeight()
    const itemHeight = 23
    const maxVisibleItems = Math.floor(availableHeight / itemHeight)

    if (this.selectedIndex < this.scrollOffset) {
      this.scrollOffset = this.selectedIndex
    } else if (this.selectedIndex >= this.scrollOffset + maxVisibleItems) {
      this.scrollOffset = this.selectedIndex - maxVisibleItems + 1
    }

    const maxScroll = Math.max(0, this.filteredFunctions.length - maxVisibleItems)
    this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll))
  }

  editFunction(func) {
    ChatLib.command(`function edit ${func.name}`)
  }

  hideOverlay() {
    this.isActive = false
    this.hoveredIndex = -1
    this.selectedIndex = -1
    this.scrollOffset = 0
    this.isScanning = false
    this.scrollbarDragging = false
    this.filterTextField = null
    this.initializeTextField = true

    this.hideDropdown()

    this.restoreAllKeybinds()
  }
}

export const functionsVisualCache = new FunctionsVisualCache()
