// bet.js
// Created by dev sung 🤴

const { lite } = require('../lite');
const fs = require('fs');
const config = require('../settings');

const dataFile = './data/economy.json'; // File to store user balances

// Ensure database exists
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}));

lite({
    pattern: "bet",
    alias: ["gamble"],
    desc: "Bet your coins and try your luck! Usage: .bet <amount>",
    category: "economy",
    react: "🎲",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please enter an amount to bet. Example: .bet 100");

    let amount = parseInt(text.trim());
    if (isNaN(amount) || amount <= 0) return reply("❌ Invalid amount.");
    if (amount > 500000) return reply("❌ Max bet limit is 500,000 coins.");

    // Load database
    let db = JSON.parse(fs.readFileSync(dataFile));

    // Initialize user if not exists
    if (!db[from]) db[from] = { coins: 1000 }; // Starting coins

    if (db[from].coins < amount) return reply("❌ You don't have enough coins to bet that amount.");

    // 50/50 win or lose
    const win = Math.random() < 0.5;

    // Styled message
    let message = `╭───「 🎲 *Bet Result* 🎲 」\n`;

    if (win) {
        db[from].coins += amount;
        message += `│ 🎉 You won ${amount} coins!\n│ 💰 New balance: ${db[from].coins} coins\n`;
    } else {
        db[from].coins -= amount;
        message += `│ 😢 You lost ${amount} coins!\n│ 💰 New balance: ${db[from].coins} coins\n`;
    }

    message += `╰───────────────────────────╯`;

    reply(message);

    // Save database
    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
});
