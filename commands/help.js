/// <reference types="../CTAutocomplete" />

import config from '../utils/command_config.js'

// Dynamic command list based on config
function getEnabledCommands() {
  const commands = []

  if (config.enablePartyTransfer) {
    commands.push({
      category: 'Party',
      syntax: '/pt <player>',
      description: 'Short for /party transfer',
    })
  }

  if (config.enablePartyDisband) {
    commands.push({
      category: 'Party',
      syntax: '/pd',
      description: 'Short for /party disband',
    })
  }

  if (config.enablePartyWarp) {
    commands.push({
      category: 'Party',
      syntax: '/pw',
      description: 'Short for /party warp',
    })
  }

  if (config.enableLobbyHousing) {
    commands.push({
      category: 'Navigation',
      syntax: '/lh',
      description: 'Short for /lobby housing',
    })
  }

  if (config.enableParkourCheckpoint) {
    commands.push({
      category: 'Navigation',
      syntax: '/pcp',
      description: 'Short for /parkour checkpoint',
    })
  }

  if (config.enableVariables) {
    commands.push({
      category: 'Variables',
      syntax: '/var <global|playername> <list|inc|dec|set|unset> <var> [value]',
      description: 'Manage variables with a more intuitive syntax',
    })
  }

  if (config.enableSelfVariables) {
    commands.push({
      category: 'Variables',
      syntax: '/selfvar <list|inc|dec|set|unset> <var> [value]',
      description: 'Manage your own variables',
    })
  }

  if (config.enableReminders) {
    commands.push({
      category: 'Reminders',
      syntax: '/remind <1h 20m | HH:MM[am/pm]> <message>',
      description: 'Set a reminder',
    })
  }

  if (config.enableReminderList) {
    commands.push({
      category: 'Reminders',
      syntax: '/reminders',
      description: 'View, edit, or delete reminders',
    })
  }

  // add more commands here...

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
  const filtered = filter ? COMMAND_LIST.filter(cmd => cmd.syntax.toLowerCase().includes(filter)) : COMMAND_LIST

  ChatLib.chat('&8&m----------------&r ' + "&9[&aterraidk's QoL&r&9]&r " + '&8&m----------------')
  filtered.forEach(cmd => ChatLib.chat('&a' + cmd.syntax + ' &7 ' + cmd.description))

  // todo: sort on category and print by category

  ChatLib.chat('\n&b/tqol help [filter] &7 View more or filter')
  ChatLib.chat('&b/tqol config &7 Enable/disable commands')
  ChatLib.chat('&8&m-----------------------------------------------')
})
  .setName('tqol')
  .setAliases(['tqolhelp', 'tqolcmds'])
