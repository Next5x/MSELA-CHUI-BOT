/**
 * ✧ iqc - maker ✧
 * • Type   : Lite Command Plugin
 * • Converted for : (Lite handler)
 * • API    : https://api.zenzxz.my.id
 * • Credits: SXZnightmare
 */

const fetch = require('node-fetch');
const { lite } = require('../lite');

lite({
  pattern: 'iqc',
  alias: ['fakeiphonechat', 'fakechat'],
  desc: 'Generate a fake iPhone chat screenshot',
  category: 'maker',
  react: '📱',
  filename: __filename
}, async (malvin, mek, m, { args, usedPrefix, command, reply }) => {
  try {
    await malvin.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

    const text = args.join(' ');
    if (!text) return reply(`🧩 Please provide text!\nExample: ${usedPrefix + command} Hello there|06:00|Nova`);

    const parts = text.split('|');
    if (parts.length < 3) return reply(`❗ Wrong format!\nExample: ${usedPrefix + command} Message|ChatTime|StatusBarTime`);

    const [message, chatTime, statusBarTime] = parts;

    if (message.length > 80) return reply('🍂 Message too long! Max 80 characters.');

    const url = `https://api.zenzxz.my.id/maker/fakechatiphone?text=${encodeURIComponent(message)}&chatime=${encodeURIComponent(chatTime)}&statusbartime=${encodeURIComponent(statusBarTime)}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch image from API.');

    const buffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    await malvin.sendMessage(
      m.chat,
      {
        image: imageBuffer,
        caption:
          `✨ *Fake iPhone Chat Created!*\n\n` +
          `💬 *Message:* ${message}\n` +
          `⏰ *Chat Time:* ${chatTime}\n` +
          `📱 *Status Bar:* ${statusBarTime}`,
      },
      { quoted: mek }
    );

    await malvin.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

  } catch (err) {
    console.error(err);
    reply('🍂 Failed to generate image. Please try again later.');
  } finally {
    await malvin.sendMessage(m.chat, { react: { text: '', key: m.key } });
  }
});
