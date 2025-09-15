/// <reference types="./CTAutocomplete" />

import './commands/reminder'
import './commands/party'
import './commands/var'
import './commands/help'
import './commands/hotkeys'
import './commands/crud'
import './menus/shortcuts'
import './menus/regions'
import './menus/functions'
import './menus/custommenus'
import './menus/commands'

import './discordRPC/discordRPC'

import { PREFIX } from './utils/constants'

const File = Java.type('java.io.File')

export function getModuleFolder() {
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

let LOCAL_VERSION = 'unknown'
try {
  const moduleFolder = getModuleFolder()
  if (!moduleFolder) {
    throw new Error('This should not happen')
  }
  const localMeta = FileLib.read(`${moduleFolder}/metadata.json`)
  if (localMeta) {
    LOCAL_VERSION = JSON.parse(localMeta).version || 'unknown'
  }
} catch (e) {}

export function getLocalVersion() {
  return LOCAL_VERSION
}

const LATEST_VERSION_URL = 'https://raw.githubusercontent.com/terraidk/terraidk-qol/main/metadata.json'

let hasShownLoadMessage = false
let hasCheckedForUpdate = false

register('worldLoad', () => {
  if (!hasShownLoadMessage) {
    hasShownLoadMessage = true

    setTimeout(() => {
      ChatLib.chat(
        new TextComponent(PREFIX + '&f' + LOCAL_VERSION + ' Loaded successfully. | ' + '&b&nChangelog')
          .setClick('open_url', 'https://github.com/terraidk/terraidk-qol/releases/v' + LOCAL_VERSION)
          .setHover('show_text', '&fClick to view &aTQoL&f on &9&lGitHub')
      )

      if (!hasCheckedForUpdate) {
        hasCheckedForUpdate = true;
        checkForUpdate();
      }
    }, 500)
  }
})

register('gameLoad', () => {
  hasShownLoadMessage = false
  hasCheckedForUpdate = false
})

function checkForUpdate() {
  new Thread(() => {
    try {
      const content = FileLib.getUrlContent(LATEST_VERSION_URL)
      let latestVersion = null

      if (content) {
        latestVersion = JSON.parse(content).version
      }

      if (latestVersion && latestVersion !== LOCAL_VERSION) {
        Client.scheduleTask(() => {
          ChatLib.chat('&f')
          ChatLib.chat(
            new TextComponent(PREFIX + '&cA new version of &aTQoL&c is available! &7[&eClick to update&7]')
              .setClick('open_url', 'https://github.com/terraidk/terraidk-qol/releases/latest')
              .setHover(
                'show_text',
                '&aClick to download the latest version\n&7Current: &c' + getLocalVersion() + '\n&7Latest: &a' + latestVersion
              )
          )
          ChatLib.chat('&f')
        })
      }
    } catch (e) {}
  }).start()
}
