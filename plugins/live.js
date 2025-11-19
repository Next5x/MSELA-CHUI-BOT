const { lite } = require('../lite');
const os = require('os');
const { runtime } = require('../lib/functions');
const config = require('../settings');

lite({
    pattern: "live",
    alias: ["online", "active", "check"],
    desc: "Shows system and bot live status",
    category: "main",
    react: "💠",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const usedRam = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRam = (os.totalmem() / 1024 / 1024).toFixed(2);
        const uptime = runtime(process.uptime());
        const platform = os.platform();
        const cpu = os.cpus()[0].model;

        const caption = `
╭─❖『 *SYSTEM CORE STATUS* 』
│
│ ⚙️ *Bot Name:* ${config.BOT_NAME}
│ 👤 *Owner:* ${config.OWNER_NAME}
│ 💾 *RAM:* ${usedRam}MB / ${totalRam}MB
│ 🧠 *CPU:* ${cpu.split(" ")[0]} (${platform})
│ ⏱️ *Uptime:* ${uptime}
│ 🧩 *Mode:* ${config.MODE}
│ 💬 *Prefix:* ${config.PREFIX}
│ 🧷 *Version:* ${config.version}
│ 🌐 *Network Node:* ${os.hostname()}
│
╰───────────────────────
🩶 System Stable | Core Functional
        `.trim();

        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/hlbirp.jpg' },
            caption,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 888,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363402507750390@newsletter',
                    newsletterName: '『 sᴜʜᴏ ᴍᴅ 』',
                    serverMessageId: 200
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Live Command Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
