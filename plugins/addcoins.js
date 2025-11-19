// addcoins.js
// Owner Only Command
// Created by sung 🤴

const { lite } = require('../lite');
const fs = require('fs');
const config = require('../settings'); // Make sure your owner number is set here

const dataFile = './data/economy.json';

lite({
    pattern: "addcoins",
    alias: ["givecoins", "addmoney"],
    desc: "Owner only: Add coins to a user",
    category: "economy",
    react: "💸",
    filename: __filename
}, async (conn, mek, m, { from, text, reply, sender }) => {

    // ✅ Owner check
    if (!config.OWNER_NUMBER.includes(sender.split("@")[0])) {
        return reply("❌ This command is only for the bot owner.");
    }

    if (!text) return reply("❌ Usage: .addcoins <number> <amount>\nExample: .addcoins 27831234567 5000");

    const args = text.split(" ");
    if (args.length < 2) return reply("❌ Please provide a number and an amount.");

    const number = args[0].replace(/[^0-9]/g, ""); // Clean number
    const amount = parseInt(args[1]);

    if (isNaN(amount) || amount <= 0) return reply("❌ Invalid amount.");

    const jid = number + "@s.whatsapp.net";

    // Load economy database
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ users: {} }));
    const db = JSON.parse(fs.readFileSync(dataFile));

    // Initialize user if not exists
    if (!db.users[jid]) db.users[jid] = { coins: 1000, lastDaily: 0, inventory: [] };

    db.users[jid].coins += amount;

    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));

    // Confirmation message
    const message = `
╭───「 💸 *Coins Added* 💸 」
│
│ 👤 User: ${number}
│ ➕ Added: ${amount} coins
│ 🏦 New Balance: ${db.users[jid].coins} coins
│
╰───────────────────────────╯
`;

    reply(message);
});
