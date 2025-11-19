// allusers.js
// Owner Only Command
// Created by dev sung🤴

const { lite } = require('../lite');
const fs = require('fs');
const config = require('../settings');

const dataFile = './data/economy.json';

lite({
    pattern: "allusers",
    alias: ["userslist", "economyusers"],
    desc: "Owner only: Show all users and their balances",
    category: "economy",
    react: "📜",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {

    // ✅ Owner check
    if (!config.OWNER_NUMBER.includes(sender.split("@")[0])) {
        return reply("❌ This command is only for the bot owner.");
    }

    if (!fs.existsSync(dataFile)) return reply("⚠️ No economy data found yet.");
    const db = JSON.parse(fs.readFileSync(dataFile));

    const users = db.users || {};
    const keys = Object.keys(users);

    if (keys.length === 0) return reply("⚠️ No users in the economy yet.");

    let message = `╭───「 📜 *All Economy Users* 📜 」\n│\n`;

    keys.forEach((jid, index) => {
        const number = jid.split("@")[0];
        const coins = users[jid].coins || 0;
        message += `│ ${index + 1}. ${number} — ${coins} 💎\n`;
    });

    message += `│\n╰───────────────────────────╯`;

    // Send in parts if message is too long
    if (message.length > 4000) {
        const chunks = message.match(/[\s\S]{1,3500}/g) || [];
        for (let chunk of chunks) {
            await reply(chunk);
        }
    } else {
        reply(message);
    }
});
