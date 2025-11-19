// removecoins.js
// Owner Only Command
// Created by Dev sung 🤴

const { lite } = require('../lite');
const fs = require('fs');
const config = require('../settings');

const dataFile = './data/economy.json';

lite({
    pattern: "removecoins",
    alias: ["takecoins", "removemoney"],
    desc: "Owner only: Remove coins from a user",
    category: "economy",
    react: "➖",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, sender }) => {

    // ✅ Owner check
    if (!config.OWNER_NUMBER.includes(sender.split("@")[0])) {
        return reply("❌ This command is only for the bot owner.");
    }

    if (!text) return reply("❌ Usage: .removecoins <number> <amount>\nExample: .removecoins 27831234567 2000");

    const args = text.split(" ");
    if (args.length < 2) return reply("❌ Please provide a number and an amount.");

    const number = args[0].replace(/[^0-9]/g, "");
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount <= 0) return reply("❌ Invalid amount.");

    const jid = number + "@s.whatsapp.net";

    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ users: {} }));
    const db = JSON.parse(fs.readFileSync(dataFile));

    if (!db.users[jid]) db.users[jid] = { coins: 1000, lastDaily: 0, inventory: [] };

    if (db.users[jid].coins < amount) db.users[jid].coins = 0;
    else db.users[jid].coins -= amount;

    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));

    const message = `
╭───「 ➖ *Coins Removed* ➖ 」
│
│ 👤 User: ${number}
│ ➖ Removed: ${amount} coins
│ 🏦 New Balance: ${db.users[jid].coins} coins
│
╰───────────────────────────╯
`;

    reply(message);
});
