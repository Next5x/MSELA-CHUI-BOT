// slots.js
// Created by sung🤴

const { lite } = require('../lite');
const fs = require('fs');

const dataFile = './data/economy.json';

lite({
    pattern: "slots",
    alias: ["slotmachine"],
    desc: "Play the slot machine and try your luck! Usage: .slots <amount>",
    category: "economy",
    react: "🎰",
    filename: __filename
}, async (conn, mek, m, { from, text, reply }) => {

    if (!text) return reply("❌ Please enter an amount to bet. Example: .slots 500");

    let bet = parseInt(text.trim());
    if (isNaN(bet) || bet <= 0) return reply("❌ Invalid amount.");
    if (bet > 500000) return reply("❌ Max bet is 500,000 coins.");

    // Load economy database
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ users: {} }));
    const db = JSON.parse(fs.readFileSync(dataFile));

    // Initialize user
    if (!db.users[from]) db.users[from] = { coins: 1000, lastDaily: 0, inventory: [] };

    const user = db.users[from];

    if (user.coins < bet) return reply("❌ You don't have enough coins to play this amount.");

    // Slot symbols
    const symbols = ["🍒", "🍋", "🍉", "🍇", "⭐", "💎"];
    const spin = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
    ];

    // Check win condition
    let message = `╭───「 🎰 *Slot Machine* 🎰 」\n│\n`;
    message += `│ ${spin[0]} | ${spin[1]} | ${spin[2]}\n│\n`;

    if (spin[0] === spin[1] && spin[1] === spin[2]) {
        // Win: 3 symbols match
        const winnings = bet * 3; // 3x bet
        user.coins += winnings;
        message += `│ 🎉 Jackpot! You won ${winnings} coins!\n│ 💰 New balance: ${user.coins} coins\n`;
    } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
        // Partial win: 2 symbols match
        const winnings = bet * 2; // 2x bet
        user.coins += winnings;
        message += `│ 😎 Nice! You won ${winnings} coins!\n│ 💰 New balance: ${user.coins} coins\n`;
    } else {
        // Lose
        user.coins -= bet;
        message += `│ 😢 You lost ${bet} coins!\n│ 💰 New balance: ${user.coins} coins\n`;
    }

    message += `╰───────────────────────────╯`;

    reply(message);

    // Save database
    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
});
