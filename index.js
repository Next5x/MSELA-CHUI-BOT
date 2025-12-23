"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
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
    if (mod && mod.__esModule) return mod;
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
//import chalk from 'chalk'
const { verifierEtatJid , recupererActionJid } = require("./bdd/antilien");
const { atbverifierEtatJid , atbrecupererActionJid } = require("./bdd/antibot");
let evt = require(__dirname + "/framework/zokou");
const {isUserBanned , addUserToBanList , removeUserFromBanList} = require("./bdd/banUser");
const  {addGroupToBanList,isGroupBanned,removeGroupFromBanList} = require("./bdd/banGroup");
const {isGroupOnlyAdmin,addGroupToOnlyAdminList,removeGroupFromOnlyAdminList} = require("./bdd/onlyAdmin");
//const //{loadCmd}=require("/framework/mesfonctions")
let { reagir } = require(__dirname + "/framework/app");

// FIX: Tumia regex sahihi kwa session
var session = conf.session;

const prefixe = conf.PREFIXE;
const more = String.fromCharCode(8206);
const readmore = more.repeat(4001);

async function authentification() {
    try {
        if (!fs.existsSync(__dirname + "/auth/creds.json")) {
            console.log("Connexion en cours...");
            // FIX: Haki sahihi ya kuandika session
            if (session && session !== "zokk") {
                try {
                    // Jaribu ku-decode base64
                    const decodedSession = Buffer.from(session, 'base64').toString('utf8');
                    await fs.writeFileSync(__dirname + "/auth/creds.json", decodedSession, "utf8");
                } catch (e) {
                    // Ikiwa si base64, andika kama ilivyo
                    await fs.writeFileSync(__dirname + "/auth/creds.json", session, "utf8");
                }
            } else {
                // Ikiwa hakuna session, basi tuache kuandika
                console.log("En attente du QR code...");
            }
        }
    }
    catch (e) {
        console.log("Erreur d'authentification: " + e);
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
        const sockOptions = {
            version,
            logger: pino({ level: "silent" }),
            browser: ['TIMNASA-TMD2', "Chrome", "120.0.0.0"],
            printQRInTerminal: true,
            fireInitQueries: true,
            shouldSyncHistoryMessage: false,
            downloadHistory: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            markOnlineOnConnect: true,
            keepAliveIntervalMs: 30_000,
            auth: {
                creds: state.creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
            },
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id, undefined);
                    return msg.message || undefined;
                }
                return {
                    conversation: 'Une erreur est survenue!'
                };
            }
        };
        const zk = (0, baileys_1.default)(sockOptions);
        store.bind(zk.ev);

        const decodeJid = (jid) => {
            if (!jid) return jid;
            if (/:\d+@/gi.test(jid)) {
                let decode = (0, baileys_1.jidDecode)(jid) || {};
                return decode.user && decode.server && decode.user + '@' + decode.server || jid;
            }
            else return jid;
        };
        
        // FIX: Auto-reaction ya status
        if (conf.AUTOREACT_STATUS === "yes") {
            zk.ev.on("messages.upsert", async (m) => {
                const { messages } = m;
                
                for (const message of messages) {
                    if (message.key && message.key.remoteJid === "status@broadcast") {
                        try {
                            // Mark as read first
                            await zk.readMessages([message.key]);
                            
                            // Wait a moment
                            await new Promise(resolve => setTimeout(resolve, 500));
                            
                            // React with random emoji
                            const reactionEmojis = ["❤️", "🔥", "👍", "😂", "😮", "😢", "🤔", "👏", "🎉", "🤩"];
                            const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
                            
                            await zk.sendMessage(message.key.remoteJid, {
                                react: {
                                    text: randomEmoji,
                                    key: message.key
                                }
                            });
                            
                            console.log(`Reacted to status from ${message.key.participant || 'unknown'} with ${randomEmoji}`);
                            
                            // Delay
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        } catch (error) {
                            console.error("Status reaction error:", error);
                        }
                    }
                }
            });
        }
        
        zk.ev.on("messages.upsert", async (m) => {
            const { messages } = m;
            const ms = messages[0];
            if (!ms.message) return;
            
            var mtype = (0, baileys_1.getContentType)(ms.message);
            var texte = mtype == "conversation" ? ms.message.conversation : 
                       mtype == "imageMessage" ? ms.message.imageMessage?.caption : 
                       mtype == "videoMessage" ? ms.message.videoMessage?.caption : 
                       mtype == "extendedTextMessage" ? ms.message?.extendedTextMessage?.text : 
                       mtype == "buttonsResponseMessage" ? ms?.message?.buttonsResponseMessage?.selectedButtonId : 
                       mtype == "listResponseMessage" ? ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId : 
                       mtype == "messageContextInfo" ? (ms?.message?.buttonsResponseMessage?.selectedButtonId || 
                          ms.message?.listResponseMessage?.singleSelectReply?.selectedRowId || ms.text) : "";
            
            var origineMessage = ms.key.remoteJid;
            var idBot = decodeJid(zk.user.id);
            var servBot = idBot.split('@')[0];
            
            const verifGroupe = origineMessage?.endsWith("@g.us");
            var infosGroupe = verifGroupe ? await zk.groupMetadata(origineMessage).catch(() => null) : "";
            var nomGroupe = verifGroupe && infosGroupe ? infosGroupe.subject : "";
            var msgRepondu = ms.message.extendedTextMessage?.contextInfo?.quotedMessage;
            var auteurMsgRepondu = decodeJid(ms.message?.extendedTextMessage?.contextInfo?.participant);
            var auteurMessage = verifGroupe ? (ms.key.participant ? ms.key.participant : ms.participant) : origineMessage;
            
            if (ms.key.fromMe) {
                auteurMessage = idBot;
            }
            
            var membreGroupe = verifGroupe ? ms.key.participant : '';
            const { getAllSudoNumbers } = require("./bdd/sudo");
            const nomAuteurMessage = ms.pushName || "Inconnu";
            
            // FIX: Namba za sudo
            const dj = '255784766591';
            const dj2 = '255783766591';
            const dj3 = '255784766591';
            const luffy = '255784766591';
            const sudo = await getAllSudoNumbers().catch(() => []);
            const superUserNumbers = [servBot, dj, dj2, dj3, luffy, conf.NUMERO_OWNER || '']
                .filter(num => num)
                .map((s) => s.replace(/[^0-9]/g, "") + "@s.whatsapp.net");
            const allAllowedNumbers = [...new Set([...superUserNumbers, ...sudo])];
            const superUser = allAllowedNumbers.includes(auteurMessage);
            
            var dev = [dj, dj2, dj3, luffy].map((t) => t.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(auteurMessage);
            
            function repondre(mes) { 
                zk.sendMessage(origineMessage, { text: mes }, { quoted: ms }).catch(console.error); 
            }
            
            console.log("\n[TIMNASA-TMD2] Message reçu");
            console.log("==============================");
            if (verifGroupe) {
                console.log("Groupe: " + nomGroupe);
            }
            console.log("De: [" + nomAuteurMessage + " : " + auteurMessage.split("@s.whatsapp.net")[0] + "]");
            console.log("Type: " + mtype);
            console.log("Contenu: " + (texte || "(média sans texte)").substring(0, 100));
            
            // Gestion de presence
            var etat = conf.ETAT || 0;
            if (etat == 1) {
                await zk.sendPresenceUpdate("available", origineMessage);
            } else if (etat == 2) {
                await zk.sendPresenceUpdate("composing", origineMessage);
            } else if (etat == 3) {
                await zk.sendPresenceUpdate("recording", origineMessage);
            } else {
                await zk.sendPresenceUpdate("unavailable", origineMessage);
            }

            const mbre = verifGroupe && infosGroupe ? infosGroupe.participants : [];
            
            function groupeAdmin(membreGroupe) {
                let admin = [];
                for (const m of membreGroupe) { 
                    if (m.admin == null) continue;
                    admin.push(m.id);
                }
                return admin;
            }

            let admins = verifGroupe ? groupeAdmin(mbre) : [];
            const verifAdmin = verifGroupe ? admins.includes(auteurMessage) : false;
            var verifZokouAdmin = verifGroupe ? admins.includes(idBot) : false;
            
            const arg = texte ? texte.trim().split(/ +/).slice(1) : null;
            const verifCom = texte ? texte.startsWith(prefixe) : false;
            const com = verifCom ? texte.slice(1).trim().split(/ +/).shift().toLowerCase() : false;
           
            const lien = conf.URL ? conf.URL.split(',') : [];
            
            function mybotpic() {
                if (lien.length === 0) return "https://example.com/default.jpg";
                const indiceAleatoire = Math.floor(Math.random() * lien.length);
                return lien[indiceAleatoire];
            }
            
            var commandeOptions = {
                superUser, 
                dev,
                verifGroupe,
                mbre,
                membreGroupe,
                verifAdmin,
                infosGroupe,
                nomGroupe,
                auteurMessage,
                nomAuteurMessage,
                idBot,
                verifZokouAdmin,
                prefixe,
                arg,
                repondre,
                mtype,
                groupeAdmin,
                msgRepondu,
                auteurMsgRepondu,
                ms,
                mybotpic
            };

            // Anti-delete message
            if (ms.message.protocolMessage && ms.message.protocolMessage.type === 0 && (conf.ADM || '').toLowerCase() === 'yes') {
                if (ms.key.fromMe || ms.message.protocolMessage.key.fromMe) { 
                    console.log('Message supprimé me concernant'); 
                    return; 
                }
                
                let key = ms.message.protocolMessage.key;
                try {
                    let st = './store.json';
                    if (fs.existsSync(st)) {
                        const data = fs.readFileSync(st, 'utf8');
                        const jsonData = JSON.parse(data);
                        let message = jsonData.messages[key.remoteJid];
                        let msg;
                        
                        if (message) {
                            for (let i = 0; i < message.length; i++) {
                                if (message[i].key.id === key.id) {
                                    msg = message[i];
                                    break;
                                }
                            }
                        }
                        
                        if (msg) {
                            await zk.sendMessage(idBot, {
                                image: { url: './media/deleted-message.jpg' },
                                caption: `😎 Anti-delete-message 🥵\nMessage from @${msg.key.participant?.split('@')[0] || 'unknown'}`,
                                mentions: msg.key.participant ? [msg.key.participant] : []
                            }).catch(console.error);
                            
                            await zk.sendMessage(idBot, { forward: msg }, { quoted: msg }).catch(console.error);
                        }
                    }
                } catch (e) {
                    console.log("Anti-delete error:", e);
                }
            }

            // Auto-read status
            if (ms.key && ms.key.remoteJid === "status@broadcast" && (conf.AUTO_READ_STATUS || '').toLowerCase() === "yes") {
                await zk.readMessages([ms.key]).catch(console.error);
            }

            // Auto-download status
            if (ms.key && ms.key.remoteJid === 'status@broadcast' && (conf.AUTO_DOWNLOAD_STATUS || '').toLowerCase() === "yes") {
                try {
                    if (ms.message.extendedTextMessage) {
                        var stTxt = ms.message.extendedTextMessage.text;
                        await zk.sendMessage(idBot, { text: stTxt }, { quoted: ms });
                    } else if (ms.message.imageMessage) {
                        var stMsg = ms.message.imageMessage.caption || '';
                        var stImg = await zk.downloadAndSaveMediaMessage(ms.message.imageMessage);
                        await zk.sendMessage(idBot, { image: { url: stImg }, caption: stMsg }, { quoted: ms });
                        fs.unlink(stImg).catch(() => {});
                    } else if (ms.message.videoMessage) {
                        var stMsg = ms.message.videoMessage.caption || '';
                        var stVideo = await zk.downloadAndSaveMediaMessage(ms.message.videoMessage);
                        await zk.sendMessage(idBot, { video: { url: stVideo }, caption: stMsg }, { quoted: ms });
                        fs.unlink(stVideo).catch(() => {});
                    }
                } catch (error) {
                    console.error("Status download error:", error);
                }
            }

            // Rang count
            if (texte && auteurMessage.endsWith("s.whatsapp.net")) {
                try {
                    const { ajouterOuMettreAJourUserData } = require("./bdd/level"); 
                    await ajouterOuMettreAJourUserData(auteurMessage);
                } catch (e) {
                    console.error("Level error:", e);
                }
            }

            // Mentions
            try {
                if (ms.message[mtype]?.contextInfo?.mentionedJid && 
                    (ms.message[mtype].contextInfo.mentionedJid.includes(idBot) || 
                     ms.message[mtype].contextInfo.mentionedJid.includes((conf.NUMERO_OWNER || '') + '@s.whatsapp.net'))) {
                    
                    if (superUser) { console.log('Mention de superUser'); return; }
                    
                    let mbd = require('./bdd/mention');
                    let alldata = await mbd.recupererToutesLesValeurs();
                    let data = alldata[0];
                    
                    if (!data || data.status === 'non') { console.log('Mention pas activé'); return; }
                    
                    let msg;
                    if (data.type.toLowerCase() === 'image') {
                        msg = { image: { url: data.url }, caption: data.message || '' };
                    } else if (data.type.toLowerCase() === 'video') {
                        msg = { video: { url: data.url }, caption: data.message || '' };
                    } else if (data.type.toLowerCase() === 'sticker') {
                        let stickerMess = new Sticker(data.url, {
                            pack: conf.NOM_OWNER || 'TIMNASA',
                            type: StickerTypes.FULL,
                            categories: ["🤩", "🎉"],
                            id: "12345",
                            quality: 70,
                            background: "transparent",
                        });
                        const stickerBuffer2 = await stickerMess.toBuffer();
                        msg = { sticker: stickerBuffer2 };
                    } else if (data.type.toLowerCase() === 'audio') {
                        msg = { audio: { url: data.url }, mimetype: 'audio/mp4' };
                    } else {
                        msg = { text: data.message || 'Mentionné!' };
                    }
                    
                    zk.sendMessage(origineMessage, msg, { quoted: ms }).catch(console.error);
                }
            } catch (error) {
                console.error("Mention error:", error);
            }

            // Anti-lien
            try {
                const yes = await verifierEtatJid(origineMessage);
                if (texte && (texte.includes('https://') || texte.includes('http://')) && verifGroupe && yes) {
                    console.log("Lien détecté");
                    
                    if (superUser || verifAdmin || !verifZokouAdmin) { 
                        console.log('Admin ou superUser - pas d\'action'); 
                        return;
                    }
                    
                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };
                    
                    var action = await recupererActionJid(origineMessage);
                    var txt = "Lien détecté!\n";
                    const gifLink = "https://raw.githubusercontent.com/timnasax/TIMNASA_TMD2/main/media/warn.gif";
                    
                    if (action === 'remove') {
                        txt += `Message supprimé\n@${auteurMessage.split("@")[0]} retiré du groupe.`;
                        try {
                            var sticker = new Sticker(gifLink, {
                                pack: 'TIMNASA-TMD2',
                                author: conf.OWNER_NAME || 'TIMNASA',
                                type: StickerTypes.FULL,
                                categories: ['🤩', '🎉'],
                                id: '12345',
                                quality: 50,
                                background: '#000000'
                            });
                            await sticker.toFile("st1.webp");
                            await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                            await (0, baileys_1.delay)(800);
                            await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { delete: key });
                            if (fs.existsSync("st1.webp")) fs.unlinkSync("st1.webp");
                        } catch (e) {
                            console.log("Anti-lien remove error:", e);
                        }
                    } else if (action === 'delete') {
                        txt += `Message supprimé\n@${auteurMessage.split("@")[0]} évitez d'envoyer des liens.`;
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        await zk.sendMessage(origineMessage, { delete: key });
                    } else if (action === 'warn') {
                        const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('./bdd/warn');
                        let warn = await getWarnCountByJID(auteurMessage) || 0;
                        let warnlimit = conf.WARN_COUNT || 3;
                        
                        if (warn >= warnlimit) {
                            var kikmsg = `Lien détecté, vous serez retiré pour avoir atteint la limite d'avertissements.`;
                            await zk.sendMessage(origineMessage, { text: kikmsg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { delete: key });
                        } else {
                            var rest = warnlimit - warn;
                            var msg = `Lien détecté, votre warn_count a été augmenté;\nReste: ${rest}`;
                            
                            try {
                                var sticker = new Sticker(gifLink, {
                                    pack: 'TIMNASA-TMD2',
                                    author: conf.OWNER_NAME || 'TIMNASA',
                                    type: StickerTypes.FULL,
                                    categories: ['🤩', '🎉'],
                                    id: '12345',
                                    quality: 50,
                                    background: '#000000'
                                });
                                await sticker.toFile("st1.webp");
                                await zk.sendMessage(origineMessage, { sticker: fs.readFileSync("st1.webp") });
                                await (0, baileys_1.delay)(800);
                                if (fs.existsSync("st1.webp")) fs.unlinkSync("st1.webp");
                            } catch (e) {}
                            
                            await ajouterUtilisateurAvecWarnCount(auteurMessage);
                            await zk.sendMessage(origineMessage, { text: msg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                }
            } catch (e) {
                console.log("Anti-lien error:", e);
            }

            // Anti-bot
            try {
                const botMsg = ms.key?.id?.startsWith('BAES') && ms.key?.id?.length === 16;
                const baileysMsg = ms.key?.id?.startsWith('BAE5') && ms.key?.id?.length === 16;
                
                if ((botMsg || baileysMsg) && mtype !== 'reactionMessage') {
                    const antibotactiver = await atbverifierEtatJid(origineMessage);
                    if (!antibotactiver) return;
                    
                    if (verifAdmin || auteurMessage === idBot || superUser) { 
                        console.log('Admin ou bot - pas d\'action'); 
                        return;
                    }
                    
                    const key = {
                        remoteJid: origineMessage,
                        fromMe: false,
                        id: ms.key.id,
                        participant: auteurMessage
                    };
                    
                    var action = await atbrecupererActionJid(origineMessage);
                    var txt = "Bot détecté!\n";
                    
                    if (action === 'remove') {
                        txt += `Message supprimé\n@${auteurMessage.split("@")[0]} retiré du groupe.`;
                        try {
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.sendMessage(origineMessage, { delete: key });
                        } catch (e) {
                            console.log("Anti-bot remove error:", e);
                        }
                    } else if (action === 'delete') {
                        txt += `Message supprimé\n@${auteurMessage.split("@")[0]} évitez les bots.`;
                        await zk.sendMessage(origineMessage, { text: txt, mentions: [auteurMessage] }, { quoted: ms });
                        await zk.sendMessage(origineMessage, { delete: key });
                    } else if (action === 'warn') {
                        const { getWarnCountByJID, ajouterUtilisateurAvecWarnCount } = require('./bdd/warn');
                        let warn = await getWarnCountByJID(auteurMessage) || 0;
                        let warnlimit = conf.WARN_COUNT || 3;
                        
                        if (warn >= warnlimit) {
                            var kikmsg = `Bot détecté; vous serez retiré pour avoir atteint la limite d'avertissements.`;
                            await zk.sendMessage(origineMessage, { text: kikmsg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.groupParticipantsUpdate(origineMessage, [auteurMessage], "remove");
                            await zk.sendMessage(origineMessage, { delete: key });
                        } else {
                            var rest = warnlimit - warn;
                            var msg = `Bot détecté, votre warn_count a été augmenté;\nReste: ${rest}`;
                            await ajouterUtilisateurAvecWarnCount(auteurMessage);
                            await zk.sendMessage(origineMessage, { text: msg, mentions: [auteurMessage] }, { quoted: ms });
                            await zk.sendMessage(origineMessage, { delete: key });
                        }
                    }
                }
            } catch (er) {
                console.log('Anti-bot error:', er);
            }

            // Exécution des commandes
            if (verifCom && com) {
                const cd = evt.cm.find((zokou) => zokou.nomCom === com);
                if (cd) {
                    try {
                        // Vérifications
                        if ((conf.MODE || '').toLowerCase() !== 'yes' && !superUser) {
                            return;
                        }

                        if (!superUser && origineMessage === auteurMessage && (conf.PM_PERMIT || '').toLowerCase() === "yes") {
                            repondre("Vous n'avez pas accès aux commandes ici");
                            return;
                        }

                        if (!superUser && verifGroupe) {
                            let req = await isGroupBanned(origineMessage);
                            if (req) return;
                        }

                        if (!verifAdmin && verifGroupe) {
                            let req = await isGroupOnlyAdmin(origineMessage);
                            if (req) return;
                        }

                        if (!superUser) {
                            let req = await isUserBanned(auteurMessage);
                            if (req) {
                                repondre("Vous êtes banni des commandes du bot");
                                return;
                            }
                        }

                        // Exécuter la commande
                        await reagir(origineMessage, zk, ms, cd.reaction || "👍");
                        await cd.fonction(origineMessage, zk, commandeOptions);
                    } catch (e) {
                        console.log("Erreur commande:", e);
                        repondre("❌ Erreur: " + e.message);
                    }
                }
            }
        });

        // Événement groupe update
        const { recupevents } = require('./bdd/welcome'); 
        
        zk.ev.on('group-participants.update', async (group) => {
            console.log("Mise à jour groupe:", group);
            
            try {
                if (!group.id) return;
                
                const metadata = await zk.groupMetadata(group.id).catch(() => null);
                if (!metadata) return;
                
                let ppgroup;
                try {
                    ppgroup = await zk.profilePictureUrl(group.id, 'image');
                } catch {
                    ppgroup = '';
                }
                
                // Welcome message
                if (group.action == 'add') {
                    const welcomeStatus = await recupevents(group.id, "welcome").catch(() => 'off');
                    if (welcomeStatus === 'on') {
                        let msg = `*TIMNASA 𝐓𝐌𝐃2. 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 𝐈𝐍 𝐓𝐇𝐄 𝐆𝐑𝐎𝐔𝐏*\n\n`;
                        let membres = group.participants || [];
                        for (let membre of membres) {
                            msg += `👋 Bienvenue @${membre.split("@")[0]} dans le groupe!\n`;
                        }
                        msg += `\n📌 Lisez la description du groupe pour éviter d'être retiré.`;
                        
                        if (ppgroup) {
                            await zk.sendMessage(group.id, { 
                                image: { url: ppgroup }, 
                                caption: msg, 
                                mentions: membres 
                            }).catch(console.error);
                        } else {
                            await zk.sendMessage(group.id, { 
                                text: msg, 
                                mentions: membres 
                            }).catch(console.error);
                        }
                    }
                } 
                // Goodbye message
                else if (group.action == 'remove') {
                    const goodbyeStatus = await recupevents(group.id, "goodbye").catch(() => 'off');
                    if (goodbyeStatus === 'on') {
                        let msg = `Au revoir! 👋\n`;
                        let membres = group.participants || [];
                        for (let membre of membres) {
                            msg += `@${membre.split("@")[0]}\n`;
                        }
                        await zk.sendMessage(group.id, { 
                            text: msg, 
                            mentions: membres 
                        }).catch(console.error);
                    }
                }
            } catch (e) {
                console.error("Groupe update error:", e);
            }
        });

        // Cron jobs
        async function activateCrons() {
            try {
                const cron = require('node-cron');
                const { getCron } = require('./bdd/cron');
                
                let crons = await getCron().catch(() => []);
                console.log(`Crons chargés: ${crons.length}`);
                
                for (let cronData of crons) {
                    if (cronData.mute_at) {
                        let [hour, minute] = cronData.mute_at.split(':');
                        console.log(`Auto-mute à ${hour}:${minute} pour ${cronData.group_id}`);
                        
                        cron.schedule(`${minute} ${hour} * * *`, async () => {
                            await zk.groupSettingUpdate(cronData.group_id, 'announcement').catch(console.error);
                            zk.sendMessage(cronData.group_id, { 
                                text: "Le groupe est maintenant fermé. Bonne nuit! 🌙" 
                            }).catch(console.error);
                        }, { timezone: "Africa/Dar_es_Salaam" });
                    }
                    
                    if (cronData.unmute_at) {
                        let [hour, minute] = cronData.unmute_at.split(':');
                        console.log(`Auto-unmute à ${hour}:${minute} pour ${cronData.group_id}`);
                        
                        cron.schedule(`${minute} ${hour} * * *`, async () => {
                            await zk.groupSettingUpdate(cronData.group_id, 'not_announcement').catch(console.error);
                            zk.sendMessage(cronData.group_id, { 
                                text: "Le groupe est maintenant ouvert! Bonjour! ☀️" 
                            }).catch(console.error);
                        }, { timezone: "Africa/Dar_es_Salaam" });
                    }
                }
            } catch (e) {
                console.error("Cron error:", e);
            }
        }
        
        // Contacts update
        zk.ev.on("contacts.upsert", (contacts) => {
            for (const contact of contacts) {
                if (store.contacts[contact.id]) {
                    Object.assign(store.contacts[contact.id], contact);
                } else {
                    store.contacts[contact.id] = contact;
                }
            }
        });
        
        // Connection update
        zk.ev.on("connection.update", async (con) => {
            const { lastDisconnect, connection } = con;
            
            if (connection === "connecting") {
                console.log("🔄 TIMNASA TMD2 se connecte...");
            } else if (connection === 'open') {
                console.log("✅ TIMNASA TMD2 connecté avec succès!");
                console.log("=====================================");
                
                // Charger les commandes
                console.log("Chargement des commandes...");
                const commandesDir = __dirname + "/commandes";
                if (fs.existsSync(commandesDir)) {
                    const fichiers = fs.readdirSync(commandesDir);
                    for (const fichier of fichiers) {
                        if (path.extname(fichier).toLowerCase() === ".js") {
                            try {
                                require(path.join(commandesDir, fichier));
                                console.log(`✓ ${fichier}`);
                            } catch (e) {
                                console.log(`✗ ${fichier} - ${e.message}`);
                            }
                        }
                    }
                }
                console.log("=====================================");
                
                // Activer les crons
                await activateCrons();
                
                // Message de démarrage
                if ((conf.DP || '').toLowerCase() === 'yes') {
                    let cmsg = `*TIMNASA TMD2*\n` +
                              `╭─────────────━┈⊷\n` +
                              `│🌏 *STATUS:* ACTIF\n` +
                              `│💫 *PREFIX:* [ ${prefixe} ]\n` +
                              `│⭕ *MODE:* ${(conf.MODE || '').toLowerCase() === 'yes' ? 'PUBLIC' : 'PRIVATE'}\n` +
                              `╰─────────────━┈⊷`;
                    await zk.sendMessage(zk.user.id, { text: cmsg }).catch(console.error);
                }
                
                console.log("🤖 TIMNASA TMD2 PRÊT À L'EMPLOI!");
            } else if (connection == "close") {
                let raison = new boom_1.Boom(lastDisconnect?.error)?.output.statusCode;
                console.log(`Déconnexion: ${raison}`);
                
                if (raison === baileys_1.DisconnectReason.badSession) {
                    console.log('Mauvaise session, re-scanner...');
                } else if ([baileys_1.DisconnectReason.connectionClosed, baileys_1.DisconnectReason.connectionLost].includes(raison)) {
                    console.log('Reconnexion...');
                    setTimeout(main, 5000);
                } else if (raison === baileys_1.DisconnectReason.restartRequired) {
                    console.log('Redémarrage requis...');
                    setTimeout(main, 3000);
                } else {
                    console.log('Redémarrage...');
                    setTimeout(main, 10000);
                }
            }
        });
        
        // Creds update
        zk.ev.on("creds.update", saveCreds);
        
        // Download utility
        zk.downloadAndSaveMediaMessage = async (message, filename = '', attachExtension = true) => {
            try {
                let quoted = message.msg ? message.msg : message;
                let mime = (message.msg || message).mimetype || '';
                let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
                
                const stream = await (0, baileys_1.downloadContentFromMessage)(quoted, messageType);
                let buffer = Buffer.from([]);
                
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                
                let type = await FileType.fromBuffer(buffer);
                let ext = type ? type.ext : mime.split('/')[1] || 'bin';
                let trueFileName = './temp_' + Date.now() + '.' + ext;
                
                await fs.writeFileSync(trueFileName, buffer);
                return trueFileName;
            } catch (e) {
                console.error("Download error:", e);
                return null;
            }
        };
        
        // Await for message utility
        zk.awaitForMessage = async (options = {}) => {
            return new Promise((resolve, reject) => {
                if (typeof options !== 'object') reject(new Error('Options must be an object'));
                if (typeof options.sender !== 'string') reject(new Error('Sender must be a string'));
                if (typeof options.chatJid !== 'string') reject(new Error('ChatJid must be a string'));
                if (options.timeout && typeof options.timeout !== 'number') reject(new Error('Timeout must be a number'));
                if (options.filter && typeof options.filter !== 'function') reject(new Error('Filter must be a function'));
                
                const timeout = options.timeout || 30000;
                const filter = options.filter || (() => true);
                
                let timeoutId;
                
                const listener = (data) => {
                    let { type, messages } = data;
                    if (type === "notify") {
                        for (let message of messages) {
                            const fromMe = message.key.fromMe;
                            const chatId = message.key.remoteJid;
                            const sender = fromMe ? zk.user.id : 
                                         chatId.endsWith('@g.us') ? message.key.participant : chatId;
                            
                            if (sender === options.sender && chatId === options.chatJid && filter(message)) {
                                zk.ev.off('messages.upsert', listener);
                                clearTimeout(timeoutId);
                                resolve(message);
                                return;
                            }
                        }
                    }
                };
                
                zk.ev.on('messages.upsert', listener);
                
                timeoutId = setTimeout(() => {
                    zk.ev.off('messages.upsert', listener);
                    reject(new Error('Timeout waiting for message'));
                }, timeout);
            });
        };
        
        return zk;
    }
    
    // Watch for file changes
    let fichier = require.resolve(__filename);
    fs.watchFile(fichier, () => {
        fs.unwatchFile(fichier);
        console.log(`🔄 Mise à jour de ${__filename}`);
        delete require.cache[fichier];
        setTimeout(() => require(fichier), 1000);
    });
    
    main();
}, 3000);
