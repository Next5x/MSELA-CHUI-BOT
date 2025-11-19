const { lite, commands } = require('../lite');
const config = require('../settings');
const axios = require('axios');

lite({
    pattern: 'allmenu',
    react: '📜',
    desc: 'Displays all available bot commands',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        if (!commands || commands.length === 0) return reply('No commands found.');

        // Group commands by category
        const categories = {};
        for (let cmd of commands) {
            if (!cmd.pattern) continue;
            const cat = cmd.category ? cmd.category.toUpperCase() : 'OTHER';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd);
        }

        // Fetch GitHub forks (used as "Daily Users")
        let forks = 0;
        try {
            const res = await axios.get('https://api.github.com/repos/NaCkS-ai/Sung-Suho-MD');
            forks = res.data.forks_count || 0;
        } catch {
            forks = 'N/A';
        }

        // Build the text
        let text = `
╭───⌈ *${config.BOT_NAME} — FULL COMMAND MENU* ⌋
│
│ 🧠 *Developer:* ${config.OWNER_NAME}
│ ⚙️ *Mode:* ${config.MODE}
│ 🔢 *Prefix:* ${config.PREFIX}
│ 🍀 *Version:* ${config.version}
│ 🌍 *Daily Users:* ${forks}
│
╰───────────────⬣
        `.trim() + '\n\n';

        for (let [cat, cmds] of Object.entries(categories)) {
            text += `╭─⧫ *${cat}*\n`;
            cmds.forEach(c => {
                text += `│ • ${config.PREFIX}${c.pattern} ${c.alias ? `(${c.alias.join(', ')})` : ''}\n`;
            });
            text += `╰───────────────\n\n`;
        }

        text += `╭─❖ *INFO*\n`;
        text += `│ Use *${config.PREFIX}help <command>* for detailed usage.\n`;
        text += `│ Example: *${config.PREFIX}help ai*\n`;
        text += `╰───────────────⬣`;

        // Send with image
        await conn.sendMessage(m.chat, {
            image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/hlbirp.jpg' },
            caption: text,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363402507750390@newsletter',
                    newsletterName: '『 sᴜʜᴏ ᴍᴅ 』',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (err) {
        console.error('Allmenu Error:', err);
        reply(`❌ Error: ${err.message}`);
    }
});
