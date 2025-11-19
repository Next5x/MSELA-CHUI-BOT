// plugins/aisong.js
// Feature: AI Song Generator 🎶
// Credits: https://whatsapp.com/channel/0029Vb4fjWE1yT25R7epR110
// API Source: https://api.chatgptweb.online

const axios = require('axios');
const crypto = require('crypto');
const { lite } = require('../lite');

const aiSong = {
  api: {
    base: 'https://api.chatgptweb.online/api',
    endpoints: {
      generate: '/music/generate',
      query: '/music/task/'
    }
  },
  headers: {
    'content-type': 'application/json',
    'user-agent': 'NB Android/1.0.0',
    connection: 'Keep-Alive',
    'accept-encoding': 'gzip'
  },
  appInfo: {
    packageName: 'com.kmatrix.ai.music.suno.generator.v2',
    versionCode: '7',
    versionName: '1.0.4'
  },
  md5: (str) => crypto.createHash('md5').update(str).digest('hex'),
  createSign: (str) => aiSong.md5(str).toLowerCase(),
  deviceId: () => {
    try {
      return crypto.createHash('sha1')
        .update([process.platform, process.arch, process.version, process.pid, Date.now()].join('|'))
        .digest('hex')
        .toUpperCase();
    } catch {
      return crypto.randomUUID().replace(/-/g, '').toUpperCase();
    }
  },
  _ct: (txt) =>
    String(txt ?? '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  _error: (code, msg) =>
    code === 401 ? 'Unauthorized.' :
    code === 403 ? 'Forbidden.' :
    code === 404 ? 'Task not found.' :
    code === 408 ? 'Request Timeout.' :
    code === 429 ? 'Too Many Requests.' :
    (code >= 500 && code < 600) ? 'Server error.' :
    (msg || 'Unknown error occurred'),
  
  generate: async ({ prompt }) => {
    try {
      const ts = Math.floor(Date.now() / 1e3);
      const ua = aiSong.headers['user-agent'];
      const sign = aiSong.createSign(`musicapp${ts}${ua}`);
      const deviceId = aiSong.deviceId();
      const headers = {
        ...aiSong.headers, ts: `${ts}`, appVersion: aiSong.appInfo.versionCode,
        pkgName: aiSong.appInfo.packageName, 'user-agent': ua, app: 'music', sign,
        paid: 'true', deviceid: deviceId, accept: 'application/json'
      };

      const payload = { action: 'generate', prompt: aiSong._ct(prompt), custom: false };
      const { data } = await axios.post(`${aiSong.api.base}${aiSong.api.endpoints.generate}`, payload, { headers, timeout: 30000 });
      return data;
    } catch (err) {
      return { code: 500, message: err.message };
    }
  },

  checkTask: async (taskId) => {
    try {
      const ts = Math.floor(Date.now() / 1e3);
      const ua = aiSong.headers['user-agent'];
      const sign = aiSong.createSign(`musicapp${ts}${ua}`);
      const deviceId = aiSong.deviceId();
      const headers = {
        ...aiSong.headers, ts: `${ts}`, appVersion: aiSong.appInfo.versionCode,
        pkgName: aiSong.appInfo.packageName, 'user-agent': ua, app: 'music', sign,
        paid: 'true', deviceid: deviceId, accept: 'application/json'
      };

      const { data } = await axios.get(`${aiSong.api.base}${aiSong.api.endpoints.query}${taskId}`, { headers, timeout: 30000 });
      return data;
    } catch (err) {
      return { code: 500, message: err.message };
    }
  }
};

// REGISTER COMMAND
lite({
  pattern: 'aisong',
  alias: ['suno', 'musicai'],
  react: '🎵',
  desc: 'Generate a full AI-made song from a prompt',
  category: 'ai',
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  const text = args.join(' ');
  if (!text) return reply('🎶 Please enter a song idea!\n\nExample: .aisong pop song about a lonely cat');

  reply('⏳ Request received! Generating your AI song, please wait 1–2 minutes...');

  try {
    const gen = await aiSong.generate({ prompt: text });
    if (gen.code !== 200 || !gen.data?.taskId)
      return reply(`❌ Failed to start generation: ${gen.message || 'Unknown error'}`);

    const taskId = gen.data.taskId;
    await new Promise(r => setTimeout(r, (gen.data.interval || 5) * 1000));

    let result;
    for (let i = 0; i < 30; i++) {
      const task = await aiSong.checkTask(taskId);
      if (task.code === 200 && task.data?.length) {
        result = task.data;
        break;
      }
      await new Promise(r => setTimeout(r, 5000));
    }

    if (!result) return reply('⚠️ Song generation timed out. Try again later.');

    for (const song of result) {
      const caption =
        `🎧 *AI Generated Song*\n\n` +
        `🎵 *Title:* ${song.title || 'Untitled'}\n` +
        `🎼 *Genre:* ${song.style_of_music || 'Unknown'}\n\n` +
        `📝 *Lyrics:*\n${song.lyric || 'No lyrics provided.'}`;

      await conn.sendMessage(m.chat, {
        audio: { url: song.audio_url },
        mimetype: 'audio/mpeg',
        fileName: `${song.title || 'aisong'}.mp3`,
      }, { quoted: mek });

      await conn.sendMessage(m.chat, { text: caption }, { quoted: mek });
    }

  } catch (err) {
    console.error('AI Song Error:', err);
    reply(`🚨 Error: ${err.message}`);
  }
});
