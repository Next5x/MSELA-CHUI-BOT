// shop.js
// Created by sung 🤴

const { lite } = require('../lite');
const fs = require('fs');

const shopFile = './data/shop.json';

lite({
    pattern: "shop",
    alias: [],
    desc: "Shows items available for purchase",
    category: "economy",
    react: "🛒",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    if (!fs.existsSync(shopFile)) return reply("Shop is empty.");

    const shop = JSON.parse(fs.readFileSync(shopFile));
    const items = shop.items || [];

    if (items.length === 0) return reply("Shop is empty.");

    let message = `╭───「 🛒 *Shop* 🛒 」\n│\n`;

    items.forEach(item => {
        message += `│ ${item.id}. ${item.name} — ${item.price} 💎\n│    ${item.description}\n│\n`;
    });

    message += `╰───────────────────────────╯`;

    reply(message);
});
