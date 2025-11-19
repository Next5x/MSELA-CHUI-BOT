const { lite } = require('../lite');
const os = require('os');
const { runtime } = require('../lib/functions');
const config = require('../settings');

lite({
    pattern: "arise",
    alias: ["status", "alive", "online"],
    desc: "Check the bot’s system status",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2);
        const uptime = runtime(process.uptime());

        const caption = `
╭───『 ⚡ *SYSTEM STATUS* ⚡ 』
│
│ 🤖 *Bot:* ${config.BOT_NAME}
│ 🧠 *Owner:* ${config.OWNER_NAME}
│ 🪄 *Version:* ${config.version}
│ 💬 *Prefix:* ${config.PREFIX}
│ 🌍 *Mode:* ${config.MODE}
│ 🧩 *RAM:* ${usedMem}MB / ${totalMem}MB
│ 🕐 *Uptime:* ${uptime}
│ 💻 *Host:* ${os.hostname()}
│
╰───────────────❖
"${config.DESCRIPTION || 'Online and ready to serve.'}"
        `.trim();

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL },
            caption,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 1000,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363398430045533@newsletter',
                    newsletterName: config.BOT_NAME.toUpperCase(),
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Alive Command Error:", e);
        reply(`❌ *Error:* ${e.message}`);
    }
});
