// inventory.js
// Created by sung 🤴

const { lite } = require('../lite');
const fs = require('fs');

const dataFile = './data/economy.json';

lite({
    pattern: "inventory",
    alias: ["inv", "bag"],
    desc: "Shows your purchased items",
    category: "economy",
    react: "🎒",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    if (!fs.existsSync(dataFile)) return reply("You have no items yet.");

    const db = JSON.parse(fs.readFileSync(dataFile));

    if (!db.users[from] || !db.users[from].inventory || db.users[from].inventory.length === 0) {
        return reply("🎒 Your inventory is empty!");
    }

    const items = db.users[from].inventory;

    let message = `╭───「 🎒 *Your Inventory* 🎒 」\n│\n`;

    items.forEach((item, index) => {
        message += `│ ${index + 1}. ${item.name} — ${item.price} 💎\n│    ${item.description}\n│\n`;
    });

    message += `╰───────────────────────────╯`;

    reply(message);
});
