// buy.js
// Created by sung 🤴

const { lite } = require('../lite');
const fs = require('fs');

const dataFile = './data/economy.json';
const shopFile = './data/shop.json';

lite({
    pattern: "buy",
    alias: [],
    desc: "Buy an item from the shop. Usage: .buy <item_id>",
    category: "economy",
    react: "💳",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please enter the item ID to buy. Example: .buy 1");

    const itemId = text.trim();

    // Load shop
    const shop = JSON.parse(fs.readFileSync(shopFile));
    const item = shop.items.find(i => i.id === itemId);
    if (!item) return reply("❌ Item not found in the shop.");

    // Load economy database
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ users: {} }));
    const db = JSON.parse(fs.readFileSync(dataFile));

    // Initialize user
    if (!db.users[from]) db.users[from] = { coins: 1000, lastDaily: 0, inventory: [] };

    const user = db.users[from];

    if (user.coins < item.price) return reply("❌ You don't have enough coins to buy this item.");

    // Deduct coins and add to inventory
    user.coins -= item.price;
    if (!user.inventory) user.inventory = [];
    user.inventory.push(item);

    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));

    // Styled message
    const message = `
╭───「 🛒 *Purchase Successful* 🛒 」
│
│ ✅ You bought: ${item.name}
│ 💰 Price: ${item.price} coins
│ 🏦 New Balance: ${user.coins} coins
│
╰───────────────────────────╯
`;

    reply(message);
});
