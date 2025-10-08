# terraidk's QoL

## Installation

1. **Requirements**
   - Minecraft 1.8.9
   - ChatTriggers 2.2.0

2. **Install ChatTriggers**
   - Download [ChatTriggers 2.2.0](https://github.com/ChatTriggers/ChatTriggers/releases/tag/2.2.0)
   - Place `ChatTriggers-2.2.0.jar` in your `.minecraft/mods/` folder
   - Launch Minecraft once

3. **Install terraidk-qol**
   ```bash
   1. Download latest release from GitHub
   2. Extract the zip file
   3. Move 'terraidk-qol' folder to:
      .minecraft/config/ChatTriggers/modules/
   4. Run /ct reload in-game
   ```

4. **Initial Setup**
   - Open Minecraft Controls menu
   - Find "terraidk's QoL" section
   - Set up recommended keybinds:
     - `Shortcut Menu` - Main grid interface
     - `Go To Last` - Quick return to recent items

## Features

### Interactive Menu System
- Grid-style interface for Housing features
- Quick return to recent items
- Keyboard/mouse navigation
- Customizable hotkeys

### Command Shortcuts
- **Functions**
  - `/func <create|run|edit|delete> <name>`
  - Short: `/fc`, `/fr`, `/fe`, `/fd`
- **Regions**
  - `/region <create|edit|delete> <name>`
  - Short: `/rc`, `/re`, `/rd`
- **Commands**
  - `/command <create|edit|actions|delete> <name>`
  - Short: `/cc`, `/ce`, `/ca`, `/cd`
- **Menus**
  - `/menu <create|edit|display|delete> <name>`
  - Short: `/mc`, `/me`, `/md`, `/mdel`

### Utility Commands
- **Party Management**
  - `/pt <player>` - Transfer party
  - `/pd` - Disband party
  - `/pw` - Party warp
- **Navigation**
  - `/lh` - Lobby housing
  - `/pcp` - Parkour checkpoint
- **Variables**
  - `/var <global|playername> <list|inc|dec|set|unset> <var> [value]`
  - `/selfvar <list|inc|dec|set|unset> <var> [value]`
- **Reminders**
  - `/remind <1h 20m | HH:MM[am/pm]> <message>`
  - `/reminders` - Manage reminders

### Enhanced Features
- Quick search filters
- Visual feedback
- Toggleable Discord Rich Presence

### Configuration
- `/tqol config` - Toggle features
- `/tqol help [filter]` - Command help
- Saved preferences

## Usage Tips
- Use TAB completion
- ESC/right-click closes menus
- Hover for tooltips
- Type to filter lists
- Arrow keys for navigation
- `/tqol <vanilla command>` - Run default command

---

Suggestions, feature requests, and bug reports are always welcome!  
If you’d like to contribute, feel free to open an **issue**.

📬 Contact me on Discord: **@terraidk**