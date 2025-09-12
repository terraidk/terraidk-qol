/// <reference types="../CTAutocomplete" />

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

  return commands
}

register('command', (command, ...args) => {
  if (!Array.isArray(args)) args = []

  // Config command
  if (command === 'config') {
    config.handleConfigCommand(args)
    return
  }

  // If the command is NOT "help", treat it as a passthrough command
  if (command && command !== 'help') {
    ChatLib.command(command + ' ' + args.join(' '))
    return
  }

  const COMMAND_LIST = getEnabledCommands()
  let filter = args.join(' ').toLowerCase()
  const filtered = filter ? COMMAND_LIST.filter(cmd => cmd.toLowerCase().includes(filter)) : COMMAND_LIST

  ChatLib.chat('&8&m----------------&r ' + "&9[&aterraidk's QoL&r&9]&r " + '&8&m----------------')
  filtered.forEach(cmd => ChatLib.chat(cmd))

  ChatLib.chat('\n&b/tqol help [filter] &7- View more or filter')
  ChatLib.chat('&b/tqol config &7- Enable/disable commands')
  ChatLib.chat('&8&m-----------------------------------------------')
})
  .setName('tqol')
  .setAliases(['tqolhelp', 'tqolcmds'])
