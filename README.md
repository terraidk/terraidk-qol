# terraidk-qol

**terraidk-qol** is a Quality of Life (QoL) ChatTriggers module for Housing.
It adds streamlined menus, shortcuts, and other small improvements to make gameplay and coding smoother & faster.

---

## 📥 Installation

### 1. Install ChatTriggers  
This module **requires ChatTriggers**. If you don’t already have it, download and install it first:  
[ChatTriggers on Modrinth](https://modrinth.com/mod/chattriggers/version/2.2.0)

Place the `ChatTriggers-x.x.x.jar` into your Minecraft `mods/` folder and launch the game once.

### 2. Install terraidk-qol
1. Download the latest release [here](https://github.com/terraidk/terraidk-qol/releases).  
2. After extracting, move the `terraidk-qol` folder into your ChatTriggers modules folder. (`.minecraft/config/ChatTriggers/modules/`) 
3. Run the following in-game command: `/ct reload`

---

## 🕹️ In-Game Usage & Commands

### Opening the Shortcut Menu

- **Assign a keybind** for `Shortcut Menu` in Minecraft Controls (under "terraidk's QoL").
- Press your keybind in-game to open a grid-style menu with all major Housing commands.
- **Navigate** with your mouse or arrow keys, and press Enter or click to select.
- **Tooltips**: Hover over any button for a description of its function.
- **"Go To Last"**: Use the "Go To Last" button in the menu, or assign a keybind for `Go To Last Shortcut Menu` to instantly access your most recently used Function, Command, Region, or Menu.

---

### Command Reference

#### Function Commands
- `/func <create|run|edit|delete> <name>`  
  - Example: `/func create myFunction`
- Shortcuts:
  - `/fc <name>` - Create function
  - `/fr <name>` - Run function
  - `/fe <name>` - Edit function
  - `/fd <name>` - Delete function

#### Region Commands
- `/region <create|edit|delete> <name>`
- Shortcuts:
  - `/rc <name>` - Create region
  - `/re <name>` - Edit region
  - `/rd <name>` - Delete region

#### Command Commands
- `/command <create|edit|actions|delete> <name>`
- Shortcuts:
  - `/cc <name>` - Create command
  - `/ce <name>` - Edit command
  - `/ca <name>` - View command actions
  - `/cd <name>` - Delete command

#### Menu Commands
- `/menu <create|edit|display|delete> <name>`
- Shortcuts:
  - `/mc <name>` - Create menu
  - `/me <name>` - Edit menu
  - `/md <name>` - Display menu
  - `/mdel <name>` - Delete menu

#### Party & Utility Commands
- `/pt <player>` - Transfer party to player
- `/pd` - Disband party
- `/lh` - Go to housing lobby
- `/pcp` - Go to parkour checkpoint
- `/pw` - Party warp

#### Variable Commands
- `/var <global|playername> <list|inc|dec|set|unset> <var> [value]`
- `/selfvar <list|inc|dec|set|unset> <var> [value]`

#### Reminders
- `/remind <1h 20m | HH:MM[am/pm]> <message>` - Set a reminder (very flexible with input)
- `/reminders` - View, edit, or delete reminders

#### Help
- `/tqol` - Show command list and help (with paging/filtering)

---

### Tips

- **Failsafe Handling:**  
  If you forget required arguments, the mod will show usage instructions in chat.
- **Quick Navigation:**  
  Use your configured keybinds for instant access to menus and your last used items.
- **Update Notifications:**  
  The mod checks for updates on startup and notifies you if a new version is available.

---

Suggestions, feature requests, and bug reports are always welcome!  
If you’d like to contribute, feel free to open an **issue**.

📬 Contact me on Discord: **@terraidk**
