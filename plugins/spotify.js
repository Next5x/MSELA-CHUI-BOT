const axios = require("axios");
const { lite } = require("../lite");
const { prepareWAMessageMedia, generateWAMessageFromContent } = require("@whiskeysockets/baileys");

lite({
  pattern: "spotify",
  alias: ["spplay", "spotifyplay", "splay"],
  react: "🎵",
  desc: "Play songs directly from Spotify",
  category: "downloader",
  filename: __filename
}, async (conn, mek, m, { args, reply }) => {
  const text =
    (args && args.length ? args.join(" ") : null) ||
    (m?.quoted?.text ? m.quoted.text : null);

  if (!text) return reply("❌ *Please enter a song name!*\n\n💡 Example: ,spotify Someone Like You");

  try {
    await reply("🔎 *Searching Spotify for your song...* 🎶");

    // Search Spotify track
    const searchUrl = `https://api.platform.web.id/spotify-search?query=${encodeURIComponent(text)}`;
    const { data: searchData } = await axios.get(searchUrl);

    if (!searchData.status || !searchData.result?.length) {
      return reply("❌ *Couldn't find that song on Spotify!* Try another name.");
    }

    const track = searchData.result[0];

    // Download audio
    const dlUrl = `https://api.platform.web.id/spotifydl?url=${encodeURIComponent(track.link)}`;
    const { data: dlData } = await axios.get(dlUrl);

    if (!dlData.status || !dlData.result?.download) {
      return reply("⚠️ *Failed to fetch download link!* Please try again later.");
    }

    const audioUrl = dlData.result.download;
    const durationMinutes = (track.duration_ms / 1000 / 60).toFixed(2);

    // Optional: Custom image card
    const canvasUrl = `https://anabot.my.id/api/maker/spotify?apikey=freeApikey&author=${encodeURIComponent(track.artists)}&album=NovaCore Playlist&title=${encodeURIComponent(track.title)}&timestamp=10,0&image=${encodeURIComponent(track.image)}&blur=5&overlayOpacity=0.7`;

    const caption = `
╭━━〔 🎧 *Spotify Player* 〕━━⬣
┃ 🎵 *Title:* ${track.title}
┃ 👤 *Artist:* ${track.artists}
┃ ⏱ *Duration:* ${durationMinutes} min
┃ 🌐 *Link:* ${track.link}
┃
┃ ⚙️ *Powered by:* Lord Sung
╰━━━━━━━━━━━━━━━━⬣
`.trim();

    // Prepare image for buttons
    const image = await prepareWAMessageMedia({ image: { url: canvasUrl } }, { upload: conn.waUploadToServer });

    const template = {
      templateMessage: {
        hydratedTemplate: {
          hydratedContentText: caption,
          hydratedFooterText: "🎵 Enjoy your music — Sung Suho MD",
          ...image,
          hydratedButtons: [
            { hydratedReplyButton: { displayText: "🎧 Play Again", id: `,spotify ${text}` } },
            { hydratedReplyButton: { displayText: "🔍 Search Another", id: ",spotify" } },
            { hydratedReplyButton: { displayText: "📜 Main Menu", id: ",menu" } }
          ]
        }
      }
    };

    const msg = generateWAMessageFromContent(m.chat, template, {});
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    // Send audio file
    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${track.title}.mp3`
      },
      { quoted: mek }
    );

  } catch (err) {
    console.error("Spotify Command Error:", err);
    reply(`❌ *Error:* ${err.message || err}`);
  }
});
