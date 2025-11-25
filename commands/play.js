const yts = require('yt-search');
const axios = require('axios');

async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();
        
        if (!searchQuery) {
            return await sock.sendMessage(chatId, { 
                text:`╭──〔 🎧 ᴍᴜsɪᴄ ʀᴇǫᴜᴇsᴛ 〕──
│
├─ ᴡʜᴀᴛ sᴏɴɢ ᴅᴏ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ᴅᴏᴡɴʟᴏᴀᴅ?
│
╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
            });
        }

        // Search for the song
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, { 
                text:`╭──〔 ❌ ɴᴏ sᴏɴɢs ꜰᴏᴜɴᴅ 〕──
│
├─ ᴛʀʏ ᴀ ᴅɪꜰꜰᴇʀᴇɴᴛ ᴛɪᴛʟᴇ ᴏʀ ᴀʀᴛɪsᴛ.
│
╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
            });
        }

        // Send loading message
        await sock.sendMessage(chatId, {
            text: `╭──〔 ⏳ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴍᴜsɪᴄ 〕──
│
├─ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ, ʏᴏᴜʀ ʀᴇǫᴜᴇsᴛ ɪs ɪɴ ᴘʀᴏɢʀᴇss...
│
╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
        });

        // Get the first video result
        const video = videos[0];
        const urlYt = video.url;

        // Fetch audio data from API
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            return await sock.sendMessage(chatId, { 
                text: "Failed to fetch audio from the API. Please try again later."
            });
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title;

        // Send the audio
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in song2 command:', error);
        await sock.sendMessage(chatId, { 
            text: "Download failed. Please try again later."
        });
    }
}

module.exports = playCommand; 
