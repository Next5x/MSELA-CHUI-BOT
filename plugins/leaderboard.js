// leaderboard.js
// Created by sung 🤴

const { lite } = require('../lite');
const fs = require('fs');
const config = require('../settings');

const dataFile = './data/economy.json'; // File to store user balances

// Ensure database exists
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({ users: {} }));

lite({
    pattern: "leaderboard",
    alias: ["lb", "topcoins"],
    desc: "Shows the top users with the most coins",
    category: "economy",
    react: "🏆",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    let db = JSON.parse(fs.readFileSync(dataFile));

    const users = db.users || {};
    const leaderboard = Object.entries(users)
        .sort((a, b) => b[1].coins - a[1].coins) // sort descending by coins
        .slice(0, 10); // top 10 users

    if (leaderboard.length === 0) return reply("No users found yet.");

    let message = `╭───「 🏆 *Top 10 Users* 🏆 」\n│\n`;

    leaderboard.forEach(([jid, data], index) => {
        const name = jid.split("@")[0]; // Show number as fallback
        message += `│ ${index + 1}. ${name} — ${data.coins} 💎\n`;
    });

    message += `╰───────────────────────────╯`;

    reply(message);
});
