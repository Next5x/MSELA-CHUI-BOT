"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (const k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const logger_1 = __importDefault(require("@whiskeysockets/baileys/lib/Utils/logger"));
const logger = logger_1.default.child({});
logger.level = 'silent';
const pino = require("pino");
const boom_1 = require("@hapi/boom");
const conf = require("./set");
const axios = require("axios");
let fs = require("fs-extra");
let path = require("path");
const FileType = require('file-type');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const { verifierEtatJid , recupererActionJid } = require("./bdd/antilien");
const { atbverifierEtatJid , atbrecupererActionJid } = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const {isUserBanned , addUserToBanList , removeUserFromBanList} = require("./bdd/banUser");
const  {addGroupToBanList,isGroupBanned,removeGroupFromBanList} = require("./bdd/banGroup");
const {isGroupOnlyAdmin,addGroupToOnlyAdminList,removeGroupFromOnlyAdminList} = require("./bdd/onlyAdmin");
let { reagir } = require(__dirname + "/framework/app");

// Regex kwa ajili ya Prefix za Session
var session = conf.session.replace(/(Zokou-MD-WHATSAPP-BOT|TIMNASA-MD);;;=>/g,"");

const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

async function authentification() {
    try {
        if (!fs.existsSync(__dirname + "/auth/creds.json")) {
            console.log("Connecting...");
            await fs.writeFileSync(__dirname + "/auth/creds.json", Buffer.from(session, 'base64').toString('utf-8'), "utf8");
        } else if (session != "zokk") {
            await fs.writeFileSync(__dirname + "/auth/creds.json", Buffer.from(session, 'base64').toString('utf-8'), "utf8");
        }
    } catch (e) {
        console.log("Session Invalid: " + e);
        return;
    }
}

authentification();

const store = (0, baileys_1.makeInMemoryStore)({
    logger: pino().child({ level: "silent", stream: "store" }),
});

setTimeout(() => {
    async function main() {
        const { version, isLatest } = await (0, baileys_1.fetchLatestBaileysVersion)();
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(__dirname + "/auth");
        
        const decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = (0, baileys_1.jidDecode)(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            } else return jid;
        };

        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['Mac OS', "Safari", "10.15.7"],
            printQRInTerminal: true,
            fireInitQueries: false,
            shouldSyncHistoryMessage: true,
            downloadHistory: true,
            syncFullHistory: true,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: false,
            keepAliveIntervalMs: 30000,
            auth: {
                creds: state.creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
                    return msg?.message || undefined;
                }
                return { conversation: 'An Error Occurred, Repeat Command!' };
            }
        };

        const zk = (0, baileys_1.default)(sockOptions);
        store.bind(zk.ev);

        // --- Auto Status Reaction ---
        if (conf.AUTOREACT_STATUS === "yes") {
            zk.ev.on("messages.upsert", async (m) => {
                const { messages } = m;
                for (const message of messages) {
                    if (message.key && message.key.remoteJid === "status@broadcast") {
                        try {
                            const reactionEmojis = ["❤️", "🔥", "👍", "😂", "😮", "🙌", "✨"];
                            const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
                            await zk.readMessages([message.key]);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await zk.sendMessage(message.key.remoteJid, {
                                react: { text: randomEmoji, key: message.key }
                            }, { statusJidList: [message.key.participant] });
                        } catch (e) { console.log("Status React Error: " + e); }
                    }
                }
            });
        }

        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];
            if (!ms.message) return;
            
            const mtype = (0, baileys_1.getContentType)(ms.message);
            const texte = mtype == "conversation" ? ms.message.conversation : mtype == "imageMessage" ? ms.message.imageMessage?.caption : mtype == "videoMessage" ? ms.message.videoMessage?.caption : mtype == "extendedTextMessage" ? ms.message?.extendedTextMessage?.text : "";
            
            const origineMessage = ms.key.remoteJid;
            const idBot = decodeJid(zk.user.id);
            const servBot = idBot.split('@')[0];
            const verifGroupe = origineMessage?.endsWith("@g.us");
            const infosGroupe = verifGroupe ? await zk.groupMetadata(origineMessage) : "";
            const nomGroupe = verifGroupe ? infosGroupe.subject : "";
            const auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
            
            const { getAllSudoNumbers } = require("./bdd/sudo");
            const sudo = await getAllSudoNumbers();
            const superUserNumbers = [servBot, '255784766591', conf.NUMERO_OWNER].map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net");
            const superUser = superUserNumbers.concat(sudo).includes(auteurMessage);

            const repondre = (mes) => zk.sendMessage(origineMessage, { text: mes }, { quoted: ms });

            // Presence Update
            var etat = conf.ETAT || 1;
            const statusTypes = ["available", "composing", "recording", "unavailable"];
            await zk.sendPresenceUpdate(statusTypes[etat-1] || "available", origineMessage);

            const verifCom = texte ? texte.startsWith(prefixe) : false;
            const com = verifCom ? texte.slice(1).trim().split(/ +/).shift().toLowerCase() : false;
            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;

            // Anti-Link Logic
            try {
                const antiLienAtif = await verifierEtatJid(origineMessage);
                if (texte.includes('https://') && verifGroupe && antiLienAtif && !superUser) {
                    const key = { remoteJid: origineMessage, fromMe: false, id: ms.key.id, participant: auteurMessage };
                    const gifLink = "https://raw.githubusercontent.com/timnasax/TIMNASA_TMD2/main/media/warn.gif";
                    
                    var sticker = new Sticker(gifLink, {
                        pack: 'TIMNASA-TMD',
                        author: conf.OWNER_NAME,
                        type: StickerTypes.FULL,
                        quality: 50
                    });

                    const stickerBuffer = await sticker.toBuffer();
                    const action = await recupererActionJid(origineMessage);

                    if (action === 'remove' || action === 'delete' || action === 'warn') {
                        await zk.sendMessage(origineMessage, { sticker: stickerBuffer });
                        await zk.sendMessage(origineMessage, { text: `@${auteurMessage.split("@")[0]}, links are not allowed!`, mentions: [auteurMessage] }, { quoted: ms });
                        await zk.sendMessage(origineMessage, { delete: key });
                        if (action === 'remove') {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                        }
                    }
                }
            } catch (e) { console.log("Anti-link Error: " + e); }

            // Command Execution
            if (verifCom) {
                const cd = evt.cm.find((zokou) => zokou.nomCom === (com));
                if (cd) {
                    if (conf.MODE.toLowerCase() !== 'yes' && !superUser) return;
                    reagir(origineMessage, zk, ms, cd.reaction);
                    cd.fonction(origineMessage, zk, { superUser, verifGroupe, repondre, arg, ms });
                }
            }
        });

        // Connection Events
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            if (connection === 'open') {
                console.log("✅ TIMNASA TMD2 Connected!");
                // Load commands...
                fs.readdirSync(__dirname + "/commandes").forEach((file) => {
                    if (path.extname(file).toLowerCase() == ".js") require(__dirname + "/commandes/" + file);
                });
            } else if (connection === 'close') {
                let reason = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;
                if (reason !== baileys_1.DisconnectReason.loggedOut) main();
            }
        });

        zk.ev.on("creds.update", saveCreds);
        return zk;
    }
    main();
}, 5000);
