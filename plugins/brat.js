// plugins/brat.js
// Feature: Brat Fast Sticker Generator
// API: https://api.yupra.my.id/

const fetch = require('node-fetch');
const { Sticker } = require('wa-sticker-formatter');
const { lite } = require('../lite');

lite({
  pattern: 'brat',
  alias: ['bratsticker'],
  react: '💅',
  desc: 'Create a brat-style sticker from text',
  category: 'sticker',
  filename: __filename,
},
async (malvin, mek, m, { args, reply }) => {
  const text = (args.length ? args.join(' ') : m?.quoted?.text) || null;

  if (!text) return reply('❌ Please enter text!\n\nExample: .brat Hello');

  await malvin.sendMessage(m.chat, { react: { text: '⏳', key: mek.key } });

  try {
    const apiUrl = `https://api.yupra.my.id/api/image/brat?text=${encodeURIComponent(text)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const buffer = await res.buffer();

    const sticker = new Sticker(buffer, {
      pack: 'NovaCore AI',
      author: 'Brat Generator',
      type: 'full',
      quality: 80
    });

    await malvin.sendMessage(m.chat, { sticker: await sticker.build() }, { quoted: mek });
    await malvin.sendMessage(m.chat, { react: { text: '✅', key: mek.key } });

  } catch (e) {
    console.error(e);
    await malvin.sendMessage(m.chat, { react: { text: '❌', key: mek.key } });
    reply(`⚠️ Failed to create sticker: ${e.message}`);
  }
});
