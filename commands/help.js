/// <reference types="../CTAutocomplete" />

import { PREFIX } from '../utils/constants'
import config from '../utils/command_config.js'

// Dynamic command list based on config
function getEnabledCommands() {
  const commands = []

  if (config.enablePartyTransfer) commands.push('&a/pt <player> &7- Transfer party to player')
  if (config.enablePartyDisband) commands.push('&a/pd &7- Disband party')
  if (config.enableLobbyHousing) commands.push('&a/lh &7- Go to housing lobby')
  if (config.enableParkourCheckpoint) commands.push('&a/pcp &7- Go to parkour checkpoint')
  if (config.enablePartyWarp) commands.push('&a/pw &7- Party warp')
  if (config.enableVariables) commands.push('&a/var <global|playername> <list|inc|dec|set|unset> <var> [value]')
  if (config.enableSelfVariables) commands.push('&a/selfvar <list|inc|dec|set|unset> <var> [value] &7- Manage your own variables')
  if (config.enableReminders) commands.push('&a/remind <1h 20m | HH:MM[am/pm]> <message> &7- Set a reminder')
  if (config.enableReminderList) commands.push('&a/reminders &7- View/edit/delete reminders')

  commands.push('&a/tqol help &7- Show this command list')
  commands.push('&a/tqol config &7- Manage command settings')

  return commands
}

const COMMANDS_PER_PAGE = 5

register('command', (...args) => {
  if (!Array.isArray(args)) args = []

  // If no arguments, show usage
  if (args.length === 0) {
    ChatLib.chat(PREFIX + '&cUsage: /tqol help [filter] [page] &7or &b/tqol <minecraft command>')
    ChatLib.chat(PREFIX + '&7Examples: &b/tqol help party 1 &7or &b/tqol pcp')
    ChatLib.chat(PREFIX + '&7Config: &b/tqol config &7to toggle commands on/off')
    return
  }

  // Config command
  if (args[0] === 'config') {
    config.handleConfigCommand(args.slice(1))
    return
  }

  // If first argument is NOT "help", treat it as a passthrough command
  if (args[0] !== 'help') {
    const command = args.join(' ')
    ChatLib.command(command)
    return
  }

  // Remove "help" from args
  args = args.slice(1)

  let pageNum = 1
  let filter = ''

  if (args.length > 0) {
    const last = args[args.length - 1]
    if (!isNaN(parseInt(last))) {
      pageNum = parseInt(last)
      filter = args.slice(0, -1).join(' ').toLowerCase()
    } else if (!isNaN(parseInt(args[0]))) {
      pageNum = parseInt(args[0])
      filter = args.slice(1).join(' ').toLowerCase()
    } else {
      filter = args.join(' ').toLowerCase()
    }
  }

  const COMMAND_LIST = getEnabledCommands()
  const filtered = filter ? COMMAND_LIST.filter(cmd => cmd.toLowerCase().includes(filter)) : COMMAND_LIST

  const maxPage = Math.max(1, Math.ceil(filtered.length / COMMANDS_PER_PAGE))

  if (pageNum < 1 || pageNum > maxPage || filtered.length === 0) {
    ChatLib.chat('&cInvalid page number! &7| &7&oNeed help? -> &b/tqol help')
    return
  }

  ChatLib.chat('&8&m----------------&r ' + "&9[&aterraidk's QoL&r&9]&r " + '&8&m----------------')
  ChatLib.chat(`&r                 &3Commands &7(Page &e${pageNum}&7 of &6${maxPage}&7)`)

  filtered.slice((pageNum - 1) * COMMANDS_PER_PAGE, pageNum * COMMANDS_PER_PAGE).forEach(cmd => ChatLib.chat(cmd))

  ChatLib.chat('&5Use /tqol help [filter] [page] to view more or filter.')
  ChatLib.chat('&6Use /tqol config to manage command settings.')
  ChatLib.chat('&8&m-----------------------------------------------')
})
  .setName('tqol')
  .setAliases(['tqolhelp', 'tqolcmds'])
