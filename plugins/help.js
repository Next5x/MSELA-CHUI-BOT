const { lite, commands } = require('../lite');
const { prepareWAMessageMedia, generateWAMessageFromContent } = require('@whiskeysockets/baileys');

lite({
  pattern: "help",
  alias: ["h", "info"],
  react: "📖",
  desc: "Display bot help, command list, usage instructions and disclaimer",
  category: "main",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    // Group commands by category
    const grouped = {};
    for (const cmd of commands) {
      const cat = cmd.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(cmd);
    }

    // Build command list text
    let cmdList = '';
    for (const [category, cmds] of Object.entries(grouped)) {
      cmdList += `*${category.toUpperCase()}*\n`;
      cmdList += cmds.map(c => `• ${c.pattern}${c.alias && c.alias.length ? ` (${c.alias.join('/')})` : ''} — ${c.desc || ''}`).join('\n');
      cmdList += '\n\n';
    }

    // Usage instructions + disclaimer
    const instructions = `
🧠 *How to use the bot:*
• Send a command starting with your prefix (e.g., ,menu ,alive ,repo)
• Tap buttons to execute commands faster
• Some commands may require admin privileges
• Keep your prefix consistent

⚠️ *Disclaimer:*
We are not responsible for any bans, account suspensions, or other consequences resulting from using this bot.
Use at your own risk.

💡 Tip: Tap the buttons below for quick actions!
`;

    const imgUrl = 'https://files.catbox.moe/lvomei.jpg'; // optional banner
    const image = await prepareWAMessageMedia({ image: { url: imgUrl } }, { upload: conn.waUploadToServer });

    const template = {
      templateMessage: {
        hydratedTemplate: {
          hydratedContentText: instructions + '\n\n' + cmdList.slice(0, 1200), // slice to avoid overlong text
          hydratedFooterText: '🦄 Sung Suho MD Bot Help',
          ...image,
          hydratedButtons: [
            { hydratedReplyButton: { displayText: '📜 Menu', id: '.menu' } },
            { hydratedReplyButton: { displayText: '👑 Owner', id: '.owner' } },
            { hydratedURLButton: { displayText: '🌐 GitHub', url: 'https://github.com/NaCkS-ai/Sung-Suho-MD' } }
          ]
        }
      }
    };

    const msg = generateWAMessageFromContent(from, template, {});
    await conn.relayMessage(from, msg.message, { messageId: msg.key.id });

  } catch (err) {
    console.error("Help Command Error:", err);
    reply(`❌ Error loading help: ${err.message || err}`);
  }
});
