/// <reference types="../CTAutocomplete" />

const CLIENT_ID = '1413900772852236399'
let isRPCInitialized = false
let currentServer = 'Unknown'
let startTime = Date.now()
let isInGame = false

const File = Java.type('java.io.File')
const URLClassLoader = Java.type('java.net.URLClassLoader')
const URL = Java.type('java.net.URL')
const System = Java.type('java.lang.System')
if (typeof Thread === 'undefined') {
  var Thread = Java.type('java.lang.Thread')
}

let rpcLibrary = null
let updateTimeout = null

function getModuleFolder() {
  const modulesDir = new File('config/ChatTriggers/modules/')
  const folders = modulesDir.listFiles()
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i]
    if (!FileLib.isDirectory(folder)) {
      continue
    }
    const file = `${folder}/metadata.json`
    if (!FileLib.exists(file)) {
      continue
    }
    let metadata
    try {
      metadata = JSON.parse(FileLib.read(file))
    } catch (e) {
      continue
    }
    if (metadata.name !== "terraidk's QoL") {
      continue
    }
    return folder
  }
  return null
}

function getLocalVersion() {
  try {
    const moduleFolder = getModuleFolder()
    if (!moduleFolder) {
      return 'unknown'
    }
    const localMeta = FileLib.read(`${moduleFolder}/metadata.json`)
    if (localMeta) {
      return JSON.parse(localMeta).version || 'unknown'
    }
  } catch (e) {
    return 'unknown'
  }
  return 'unknown'
}

function loadDiscordRPCLibrary() {
  if (rpcLibrary) {
    return true
  }

  try {
    const modulePath = 'config/ChatTriggers/modules/terraidk-qol/discordRPC'
    const jarFile = new File(modulePath + '/discord-rpc.jar')

    if (!jarFile.exists()) {
      return false
    }

    const dll32 = new File(modulePath, 'discord-rpc-x86.dll')
    const dll64 = new File(modulePath, 'discord-rpc-x64.dll')

    if (!dll32.exists() && !dll64.exists()) {
      return false
    }

    const is64Bit = System.getProperty('sun.arch.data.model').equals('64')
    const sourceDll = is64Bit ? dll64 : dll32
    const targetDll = new File(modulePath, 'discord-rpc.dll')

    if (!targetDll.exists()) {
      try {
        java.nio.file.Files.copy(sourceDll.toPath(), targetDll.toPath(), java.nio.file.StandardCopyOption.REPLACE_EXISTING)
      } catch (e) {
        return false
      }
    }

    const jarURL = jarFile.toURI().toURL()
    const urls = [jarURL]

    const classLoader = new URLClassLoader(urls, Thread.currentThread().getContextClassLoader())

    try {
      const DiscordEventHandlers = Java.type('net.arikia.dev.drpc.DiscordEventHandlers')
      const DiscordRichPresence = Java.type('net.arikia.dev.drpc.DiscordRichPresence')
      const DiscordRPC = Java.type('net.arikia.dev.drpc.DiscordRPC')

      const libraryPath = new File(jarFile.getParent(), 'discord-rpc.dll')
      if (!libraryPath.exists()) {
        throw new Error('discord-rpc.dll not found in module folder!')
      }

      rpcLibrary = {
        DiscordRPC,
        DiscordRichPresence,
        DiscordEventHandlers,
        classLoader,
      }

      return true
    } catch (e) {
      return false
    }
  } catch (e) {
    return false
  }
}

function initializeRPC() {
  if (isRPCInitialized) return

  try {
    if (!loadDiscordRPCLibrary()) return

    if (rpcLibrary) {
      try {
        rpcLibrary.DiscordRPC.discordShutdown()
      } catch (e) {}
    }

    const handlers = new rpcLibrary.DiscordEventHandlers.Builder()
      .setReadyEventHandler(user => {
        const presence = setupRichPresence()
        if (presence) {
          rpcLibrary.DiscordRPC.discordUpdatePresence(presence)
        }
      })
      .build()

    rpcLibrary.DiscordRPC.discordInitialize(CLIENT_ID, handlers, true)
    isRPCInitialized = true
    startTime = Date.now()

    setTimeout(() => {
      const presence = setupRichPresence()
      if (presence) {
        rpcLibrary.DiscordRPC.discordUpdatePresence(presence)
      }
    }, 1000)
  } catch (e) {
    setTimeout(() => {
      isRPCInitialized = false
      initializeRPC()
    }, 5000)
  }
}

function capitalizeWords(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

function getHypixelLocation() {
  if (!isInGame || !Server.getIP()?.includes('hypixel.net')) return null

  const title = Scoreboard.getTitle()
  if (title) {
    const cleanTitle = ChatLib.removeFormatting(title).trim()
    if (cleanTitle && cleanTitle !== 'www.hypixel.net') {
      const properTitle = capitalizeWords(cleanTitle)
      return 'Hypixel - ' + properTitle
    }
  }

  return 'Hypixel'
}

function setupRichPresence() {
  if (!isRPCInitialized || !rpcLibrary) return null

  const presence = new rpcLibrary.DiscordRichPresence()
  const playerName = Player.getName()

  const hypixelLocation = getHypixelLocation()

  presence.details = `Playing as ${playerName}`

  if (hypixelLocation) {
    presence.state = `${hypixelLocation}`
  } else if (!isInGame) {
    presence.state = `In Main Menu`
  } else if (currentServer === 'Singleplayer') {
    presence.state = `In Singleplayer`
  } else if (currentServer !== 'Unknown') {
    presence.state = `On ${currentServer}`
  }

  presence.startTimestamp = Math.floor(startTime / 1000)
  presence.largeImageKey = 'minecraft'
  presence.largeImageText = "terraidk's QoL"
  presence.smallImageKey = 'tqol'
  presence.smallImageText = `v${getLocalVersion()}`

  return presence
}

function debouncedUpdatePresence() {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }

  updateTimeout = setTimeout(() => {
    updatePresence()
  }, 1000)
}

function updatePresence() {
  if (!isRPCInitialized || !rpcLibrary) return

  try {
    const presence = setupRichPresence()
    if (presence) {
      rpcLibrary.DiscordRPC.discordUpdatePresence(presence)
    }
  } catch (e) {
    isRPCInitialized = false
    setTimeout(() => initializeRPC(), 2000)
  }
}

function shutdownRPC() {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
    updateTimeout = null
  }

  if (isRPCInitialized && rpcLibrary) {
    try {
      rpcLibrary.DiscordRPC.discordShutdown()
      isRPCInitialized = false
    } catch (e) {}
  }
}

register('worldLoad', () => {
  isInGame = true
  const serverIP = Server.getIP()
  currentServer = serverIP ? serverIP.replace(/:\d+$/, '') : 'Singleplayer'
  debouncedUpdatePresence()
})

register('worldUnload', () => {
  isInGame = false
  currentServer = 'Unknown'
  debouncedUpdatePresence()
})

register('gameUnload', () => shutdownRPC())

register('step', () => {
  if (isRPCInitialized && rpcLibrary) {
    debouncedUpdatePresence()
  }
}).setFps(0.1)

;(() => {
  initializeRPC()
})()
