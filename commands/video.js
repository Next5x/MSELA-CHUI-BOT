
const axios = require('axios');
const yts = require('yt-search');

// 🌸 Izumi API Configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

// 🌸 Axios Defaults
const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
}
};

// 🌸 Retry Wrapper
async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try {
            return await getter();
} catch (err) {
            lastError = err;
            if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i));
}
}
    throw lastError;
}

// 🌸 Izumi Downloader
async function getIzumiVideoByUrl(youtubeUrl) {
    const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(youtubeUrl)}&format=720`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.download) return res.data.result;
    throw new Error('Izumi video API returned no download link');
}

// 🌸 Okatsu Fallback
async function getOkatsuVideoByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.result?.mp4) {
        return {
            download: res.data.result.mp4,
            title: res.data.result.title
};
}
    throw new Error('Okatsu API returned no mp4 link');
}

// 🌸 Main Command Handler
async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            await sock.sendMessage(chatId, {
                text: `╭──〔 ❓ ᴍɪssɪɴɢ ǫᴜᴇʀʏ 〕──\n│\n├─ ᴘʟᴇᴀsᴇ ᴛʏᴘᴇ ᴀ ᴠɪᴅᴇᴏ ɴᴀᴍᴇ ᴏʀ ʏᴏᴜᴛᴜʙᴇ ʟɪɴᴋ.\n╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
}, { quoted: message});
            return;
}

        // 🌸 Determine YouTube URL or Search
        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';

        if (searchQuery.startsWith('http://') || searchQuery.startsWith('https://')) {
            videoUrl = searchQuery;
} else {
            const { videos} = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `╭──〔 🔍 ɴᴏ ʀᴇsᴜʟᴛs 〕──\n│\n├─ ɴᴏ ᴠɪᴅᴇᴏs ғᴏᴜɴᴅ ғᴏʀ: *${searchQuery}*\n╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
}, { quoted: message});
                return;
}
            const topVideo = videos[0];
            videoUrl = topVideo.url;
            videoTitle = topVideo.title;
            videoThumbnail = topVideo.thumbnail;
}

        // 🌸 Send Thumbnail Preview
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumbnail || (ytId? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`: undefined);
            const caption = `*${videoTitle || searchQuery}*\nDownloading...`;
            if (thumb) {
                await sock.sendMessage(chatId, {
                    image: { url: thumb},
                    caption
}, { quoted: message});
}
} catch (err) {
            console.error('[VIDEO] Thumbnail error:', err?.message || err);
}

        // 🌸 Validate YouTube URL
const validUrl = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!validUrl) {
            await sock.sendMessage(chatId, {
                text: `╭──〔 ⚠️ ɪɴᴠᴀʟɪᴅ ʟɪɴᴋ 〕──\n│\n├─ ᴛʜɪs ɪs ɴᴏᴛ ᴀ ᴠᴀʟɪᴅ ʏᴏᴜᴛᴜʙᴇ ᴜʀʟ.\n╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
}, { quoted: message});
            return;
}

        // 🌸 Try Izumi, fallback to Okatsu
        let videoData;
        try {
            videoData = await getIzumiVideoByUrl(videoUrl);
} catch (err) {
            console.warn('[VIDEO] Izumi failed, trying Okatsu...');
            videoData = await getOkatsuVideoByUrl(videoUrl);
}

        // 🌸 Send Video
        await sock.sendMessage(chatId, {
            video: { url: videoData.download},
            mimetype: 'video/mp4',
            fileName: `${videoData.title || videoTitle || 'video'}.mp4`,
            caption: `╭──〔 🎬 ᴅᴏᴡɴʟᴏᴀᴅ ᴄᴏᴍᴘʟᴇᴛᴇ 〕──\n│\n├─ *${videoData.title || videoTitle || 'Video'}*\n╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
}, { quoted: message});

} catch (error) {
        console.error('[VIDEO] Command Error:', error?.message || error);
        await sock.sendMessage(chatId, {
            text: `╭──〔 ⚠️ ᴇʀʀᴏʀ ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ 〕──\n│\n├─ ${error?.message || 'ᴜɴᴋɴᴏᴡɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ'}\n╰──〔 ⚙️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴊɪɴᴜ-ɪɪ 〕──`
}, { quoted: message});
}
}

module.exports = videoCommand;
