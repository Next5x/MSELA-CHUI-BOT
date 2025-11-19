const { lite } = require('../lite');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

lite({
    pattern: "rroulette",
    alias: ["roulette", "rr", "shoot"],
    desc: "Play a risky game of Russian Roulette 🎲",
    react: "🔫",
    category: "games",
    filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
    try {
        const chamber = Math.floor(Math.random() * 6) + 1; // 1 to 6
        const bullet = Math.floor(Math.random() * 6) + 1; // 1 to 6
        const player = m.pushName || sender.split('@')[0];
        const time = moment.tz('Africa/Johannesburg').format('HH:mm:ss');

        // suspense effect
        const suspenseMsg = await reply(`🎲 *${player} spins the revolver...*\n🔫 *Pulling the trigger...* 💥`);

        await new Promise(resolve => setTimeout(resolve, 2500));

        if (chamber === bullet) {
            const deathMessages = [
                "☠️ *BANG!* The bullet finds its mark. Rest in peace, warrior.",
                "💀 *You’ve been eliminated.* Fate wasn’t on your side today.",
                "🩸 *BOOM!* Your luck just ran out.",
                "⚰️ *Dead.* The chamber wasn’t empty..."
            ];
            const audioPath = path.join(__dirname, '../all/death.m4a');

            await conn.sendMessage(from, {
                text: deathMessages[Math.floor(Math.random() * deathMessages.length)]
            }, { quoted: mek });

            if (fs.existsSync(audioPath)) {
                await conn.sendMessage(from, {
                    audio: fs.readFileSync(audioPath),
                    mimetype: 'audio/mp4',
                    ptt: true
                }, { quoted: mek });
            }

        } else {
            const surviveMessages = [
                "😮‍💨 *Click!* You survived... this time.",
                "😏 *Empty chamber.* You live to spin another round.",
                "🔥 *No bullet!* Luck’s on your side.",
                "😈 *Click!* You stare death in the eyes and laugh."
            ];
            const audioPath = path.join(__dirname, '../all/survive.m4a');

            await conn.sendMessage(from, {
                text: surviveMessages[Math.floor(Math.random() * surviveMessages.length)]
            }, { quoted: mek });

            if (fs.existsSync(audioPath)) {
                await conn.sendMessage(from, {
                    audio: fs.readFileSync(audioPath),
                    mimetype: 'audio/mp4',
                    ptt: true
                }, { quoted: mek });
            }
        }

    } catch (err) {
        console.error("Russian Roulette Error:", err);
        reply("❌ Something went wrong while playing Russian Roulette.");
    }
});
