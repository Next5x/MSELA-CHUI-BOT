const axios = require("axios");
const { lite } = require("../lite");
const { prepareWAMessageMedia, generateWAMessageFromContent } = require("@whiskeysockets/baileys");

lite({
  pattern: "play",
  alias: ["ytplay", "song1"],
  react: "🎧",
  desc: "Play a song from YouTube in mp3 format",
  category: "downloader",
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  const text =
    (args && args.length ? args.join(" ") : null) ||
    (m?.quoted?.text ? m.quoted.text : null);

  if (!text) return reply("❌ *Please provide a song name!*\n\n💡 Example: ,play Alone");

  try {
    await reply("🔎 *Searching for your song... Please wait* 🎶");

    const apiUrl = `https://api.privatezia.biz.id/api/downloader/ytplaymp3?query=${encodeURIComponent(text)}`;
    const res = await axios.get(apiUrl, { timeout: 60000 });

    const data = res.data;
    if (!data || data.status === false || !data.result) {
      return reply("❌ *Couldn't find that song.* Try another title.");
    }

    const result = data.result;
    const title = result.title || text;
    const duration = result.duration || "Unknown";
    const videoUrl = result.videoUrl || "N/A";
    const audioUrl = result.downloadUrl;
    const thumbnail =
      result.thumbnail ||
      (result.videoId
        ? `https://img.youtube.com/vi/${result.videoId}/hqdefault.jpg`
        : "https://i.ibb.co/4pDNDk1/music.jpg");

    if (!audioUrl) return reply("❌ *Audio link not available from the API.*");

    const caption = `
╭━━〔 🎧 *Now Playing* 〕━━⬣
┃ 🎵 *Title:* ${title}
┃ ⏱️ *Duration:* ${duration}
┃ 🔗 *YouTube:* ${videoUrl}
┃
┃ ⚙️ *Powered By:* Lord Sung
╰━━━━━━━━━━━━━━━━⬣
`.trim();

    // Prepare media
    const image = await prepareWAMessageMedia({ image: { url: thumbnail } }, { upload: conn.waUploadToServer });

    // Create interactive template message
    const template = {
      templateMessage: {
        hydratedTemplate: {
          hydratedContentText: caption,
          hydratedFooterText: "🎶 Enjoy your music — Sung Suho MD",
          ...image,
          hydratedButtons: [
            { hydratedReplyButton: { displayText: "🎧 Play Again", id: `.play ${text}` } },
            { hydratedReplyButton: { displayText: "🔍 Search Another Song", id: ".play" } },
            { hydratedReplyButton: { displayText: "📜 Main Menu", id: ".menu" } }
          ]
        }
      }
    };

    const msg = generateWAMessageFromContent(m.chat, template, {});
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    // Send the actual audio
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        ptt: false
      },
      { quoted: mek }
    );

  } catch (err) {
    console.error("Play Command Error:", err);
    reply(`⚠️ *Error fetching song:* ${err.message}`);
  }
});
