const { lite } = require('../lite');
const config = require('../settings');

lite({
    pattern: "owner",
    alias: ["developer", "dev", "creator"],
    desc: "Displays developer information with a vCard",
    category: "owner",
    react: "👨‍💻",
    filename: __filename
}, async (conn, mek, m, { from, reply, pushname }) => {
    try {
        const name = pushname || "User";

        // Owner info text
        const caption = `
╭───『 🧠 *SUHO-MD DEVELOPER INFO* 🧠 』
│
│ 👋 Hello *${name}*!
│ I'm *Mr. Sung*, creator of *${config.BOT_NAME}*.
│
│ 💼 *Owner Details:*
│ ─────────────────────
│ 🧠 Name      : Mr. Sung
│ 🧧 Alias     : Lord Sung
│ 🌐 Role      : Developer / Designer
│ ☎️ Contact   : wa.me/27649342626
│ 🧰 GitHub    : github.com/NaCkS-ai
│ ▶️ YouTube   : youtube.com/@malvintech2
│ 💬 Message   : “Innovation isn’t magic — it’s precision.”
│
╰───────────────────────────────╯
⚡ Powered by *${config.BOT_NAME}* • ${config.version}
        `.trim();

        // Fake Meta AI vCard (realistic but not personal)
        const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:Mr. Sung
ORG:Suho-MD Development;
TITLE:Lead Developer & System Architect;
TEL;type=CELL;type=VOICE;waid=12363621958:+1 236 362 1958
EMAIL:support@suho-md.dev
URL:https://github.com/NaCkS-ai
ADR;type=WORK:;;Meta HQ Building;Digital City;Cyberspace;;Earth
NOTE:Creator of Suho-MD - AI-powered WhatsApp Bot
END:VCARD
        `.trim();

        // Send vCard (looks like a contact card)
        await conn.sendMessage(from, {
            contacts: {
                displayName: "Mr. Sung",
                contacts: [{ vcard }]
            }
        }, { quoted: mek });

        // Send info message with image
        await conn.sendMessage(from, {
            image: { url: config.MENU_IMAGE_URL || 'https://telegra.ph/file/3b66b4f8bd5c0556d4fb9.jpg' },
            caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 777,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363402507750390@newsletter',
                    newsletterName: '『 sᴜʜᴏ ᴍᴅ 』',
                    serverMessageId: 143
                }
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("Owner Command Error:", e);
        reply(`❌ Error: ${e.message}`);
    }
});
