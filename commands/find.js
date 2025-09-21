/// <reference types="../CTAutocomplete" />

import { PREFIX, playFailSound } from "../utils/constants";
import { registerToggledCommand } from "../utils/command_config.js";

let housingCommands = new Set();
let isCapturing = false;

// Clear housing commands when switching worlds/houses
register("worldLoad", () => {
    housingCommands.clear();
    isCapturing = false;
});

// Capture housing-specific commands
registerToggledCommand(
    "enableHousingCommandScan",
    () => {
        if (!World.isLoaded()) {
            ChatLib.chat(
                PREFIX +
                    "&cYou must be in a world to scan for housing commands! &7| &7&oNeed help? -> &b/tqol help"
            );
            playFailSound();
            return;
        }

        ChatLib.chat(PREFIX + "&aScanning for housing commands...");
        housingCommands.clear();
        isCapturing = true;

        // Send tab completion packet directly
        setTimeout(() => {
            try {
                Client.sendPacket(
                    new net.minecraft.network.play.client.C14PacketTabComplete(
                        "/"
                    )
                );
            } catch (e) {
                ChatLib.chat(
                    PREFIX +
                        "&cFailed to send tab completion packet. Try manually typing &b/ &cand pressing TAB."
                );
                isCapturing = false;
            }
        }, 100);
    },
    "hcs",
    [
        "hscan",
        "housingcommands",
        "hcommands",
        "housingcommandscan",
        "scancommands",
    ]
);

registerToggledCommand(
    "enableShowHousingCommands",
    () => {
        if (housingCommands.size === 0) {
            ChatLib.chat(
                PREFIX +
                    "&cNo housing commands found! Use &b/hcs &cto scan first. &7| &7&oNeed help? -> &b/tqol help"
            );
            playFailSound();
            return;
        }

        ChatLib.chat(PREFIX + "&aHousing Commands Found:");
        housingCommands.forEach((command) => {
            ChatLib.chat("&7- &b" + command);
        });
        ChatLib.chat(
            PREFIX +
                `&aTotal: &b${housingCommands.size} &acustom housing commands`
        );
    },
    "shc",
    [
        "showhousingcommands",
        "listhousingcommands",
        "hclist",
        "customcommandslist",
    ]
);

// Listen for tab completion packets to filter housing commands
register("packetReceived", (packet) => {
    if (!isCapturing) return;
    if (packet.class.getSimpleName() !== "S3APacketTabComplete") return;

    const completions = packet.func_149630_c();

    // Parse the comprehensive list of standard Hypixel commands
    const commandString = `//, //clearselection, //copy, //cut, //desel, //fill, //paste, //pos1, //pos2, //posa, //posb, //replace, //set, //undo, //walls, //wand, //wireframe, /about, /ac, /achat, /achrewards, /adat, /addstaffbookmark, /addstaffbookmarkforplayer, /advent, /adventmenu, /aihe, /Altın, /arany, /atlas, /aur, /autostartstop_disable, /autostartstop_enable_counting, /autostartstop_enable_recording, /back, /block, /booster, /boosteradmin, /border, /bug, /bugreport, /buildMode, /buildreport, /chatinput, /chatkeywords, /chatreport, /chatspy, /citizens, /citizens2, /clear, /clearfurniture, /clearglobalstats, /clearplayerstats, /clearselection, /clearspawn, /clearstats, /clearteamstats, /click, /clima, /combatinfo, /command, /commands, /companion, /configvisualizer, /copy, /cr, /creport, /csoport, /cuaca, /customcommands, /custommenu, /custommenus, /customSkull, /customstatus, /cut, /dane, /dati, /debug, /desel, /dfreset, /die, /dimension, /disablepunch, /données, /dontpersistrecording, /dumpSigns, /edit, /editglobalstat, /editglobalstats, /edititem, /editplayerstat, /editplayerstats, /editstat, /editstats, /editteamstat, /editteamstats, /emas, /emoji, /emojihelp, /emojis, /emotes, /empty, /enchant, /esine, /eventaction, /eventactions, /eşya, /Fest, /Festa, /fill, /fly, /function, /functions, /fw, /föremål, /gamehistory, /gamemode, /gamerule, /gamerules, /games, /genstand, /getoffmyface, /gjenstand, /glow, /gm, /gma, /gmc, /gms, /gmsp, /goud, /group, /groupe, /grup, /grupa, /grupo, /grupp, /gruppe, /gruppo, /guld, /gull, /h, /hava durumu, /headstatus, /hello, /help, /hi, /hmenu, /home, /house, /housefix, /houselang, /housereport, /houses, /housesetting, /housetag, /housing, /housinglimits, /housingmenu, /housingplaceholders, /icanhasbukkit, /időjárás, /ignore, /Impreza, /información, /infoskull, /internalrankgift, /internalrankgiftcheck, /invspy, /item, /itemreport, /join, /joinadvertisedgame, /Juhlat, /kultaa, /kumpulan, /lang, /language, /layout, /layouts, /limits, /listlimits, /listplaceholders, /loadresourcepack, /loadresourcepackimmediately, /map, /mapfeedback, /maxVisitors, /me, /menu, /menus, /meteo, /mmreport, /motiv, /motyw, /mp, /msgreport, /multiLobbyDump, /myfilter, /mygames, /myhouses, /mypos, /myposition, /météo, /namereport, /networkbooster, /newqueue, /nick, /nickTest, /npc, /npc2, /npcdump, /objet, /objeto, /oggetto, /openachievementmenu, /openduelpickpage, /openpunchmessagemenu, /openresourcepackbook, /opme, /or, /oro, /ouro, /p, /park, /parkour, /Parti, /particlequality, /Party, /paste, /pastgames, /permissions, /persistrecording, /Pesta, /pet, /pl, /placeholders, /plotborder, /plugins, /pogoda, /pos1, /pos2, /posa, /posb, /počasí, /pps, /pq, /profile, /pvpinfo, /předmět, /quality, /questMenu, /rank, /rankcolor, /rankcolour, /recentgames, /region, /regions, /regiontool, /rej, /rejoin, /reloadSigns, /rename, /renameitem, /replace, /replay, /replays, /report, /reportbug, /reportbuild, /reportcontext, /reporthome, /reporthouse, /reportmenu, /reportname, /reporttext, /reportworld, /requeue, /resethouse, /resetlocation, /resetparkour, /resetplot, /resetspawn, /resource, /resourcebook, /resourcehelp, /resourcepackbook, /resourcepackhelp, /restart, /return, /rewards, /rg, /rmnpcs, /ryhmä, /rzecz, /safemode, /save, /savehouse, /saveworld, /sc, /scoreboard, /script, /secretinstance, /set, /setbiome, /setcarpenterlocation, /setlang, /setlanguage, /setsky, /setspawn, /settheme, /setting, /settings, /setvisibility, /setweather, /share, /shout, /sisyphus, /skullpacks, /skulls, /skupina, /smp, /social, /socialinternal, /socialMode, /socialoptions, /spawn, /startagain, /startlive, /startrecording, /startrecordingcounting, /stopallrecordings, /stoprecording, /surveyinternal, /sää, /team, /teamchatspy, /teams, /teleport, /tema, /template, /temă, /testplaceholder, /textreport, /thema, /theme, /thiscommandliterallydoesnothing, /thème, /time, /toggle, /toggleBorder, /togglechat, /toggleflight, /togglefly, /toggleJukebox, /toggleMessages, /toggleMode, /toggleMusic, /togglesetting, /toggleTips, /tp, /tpa, /tpl, /tr, /trackcombat, /trackpvp, /trait, /traitc, /trc, /tárgy, /téma, /unblock, /undo, /unnick, /vanish, /var, /variable, /variables, /vars, /vejr, /ver, /veri, /version, /versions, /viewallteamchat, /viewglobalstats, /viewlimits, /viewplaceholders, /viewplayerstats, /viewprofile, /viewstats, /viewteamstats, /visibility, /visit, /visitingrule, /votemap, /vreme, /väder, /vær, /walls, /wand, /watchdogreport, /watchlive, /waypoint, /waypoints, /wdr, /wdreport, /weather, /webprofile, /weer, /who, /wireframe, /worldreport, /wp, /wreport, /wtfmap, /zlatá, /złoto, /αντικείμενο, /δεδομένα, /θέμα, /καιρός, /ομάδα, /Πάρτυ, /χρυσό, /Вечеринка, /Вечірка, /група, /группа, /данные, /дані, /золото, /Парти, /погода, /предмет, /тема, /ปาร์ตี้, /アイテム, /グループ, /ゴールド, /テーマ, /データ, /主題, /主题, /举报, /喊话, /天气, /天気, /天氣, /数据, /物品, /組隊, /组, /组队, /群組, /資料, /金, /随从, /골드, /그룹, /날씨, /데이터, /아이템, /주제, /파티`;

    const standardHypixelCommands = new Set(
        commandString.split(", ").map((cmd) => cmd.trim().toLowerCase())
    );

    completions.forEach((completion) => {
        let cmd = completion;

        // Add leading slash if not present for comparison
        if (!cmd.startsWith("/")) {
            cmd = "/" + cmd;
        }

        // Skip if it's a standard Hypixel command
        if (standardHypixelCommands.has(cmd.toLowerCase())) return;

        // This is a housing command!
        housingCommands.add(completion);
    });

    isCapturing = false;

    // Check if there are too many commands (likely in lobby)
    if (housingCommands.size > 50) {
        ChatLib.chat(
            PREFIX +
                "&cAre you sure you are in a housing? It looks like you are in a lobby. If this error persists please report it."
        );
        playFailSound();
        return;
    }

    if (housingCommands.size > 0) {
        ChatLib.chat(PREFIX + "&aHousing Commands Found:");
        housingCommands.forEach((command) => {
            ChatLib.chat("&7- &b" + command);
        });
        ChatLib.chat(
            PREFIX +
                `&aTotal: &b${housingCommands.size} &acustom housing commands`
        );
        ChatLib.chat(PREFIX + "&3/shc &ato show the list again.");
        ChatLib.chat(
            PREFIX +
                "&eNote: Only commands that have LISTED toggled on by the house will be shown."
        );
    } else {
        ChatLib.chat(
            PREFIX +
                "&cNo unique housing commands detected. &7| &7&oTry scanning in a different housing."
        );
    }
}).setFilteredClass(net.minecraft.network.play.server.S3APacketTabComplete);
