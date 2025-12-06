const NEWS_LETTER_JID = "120363423408733726@newslatter"; // Replace with your real one
const BOT_NAME = "𝙈𝙎𝙀𝙇𝘼-𝘾𝙃𝙐𝙄-T𝙑";
const DEFAULT_THUMBNAIL = "https://files.catbox.moe/pkqe7x.jpeg";

const createContext = (userJid, options = {}) => ({
    contextInfo: {
        mentionedJid: [userJid], // Tag user if needed
        forwardingScore: 999,
        isForwarded: true,
        businessMessageForwardInfo: {
            businessOwnerJid: NEWS_LETTER_JID, // Helps add verified feel
        },
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWS_LETTER_JID,
            newsletterName: options.newsletterName || BOT_NAME,
            serverMessageId: Math.floor(100000 + Math.random() * 900000)
        },
        externalAdReply: {
            title: options.title || BOT_NAME,
            body: options.body || "Premium WhatsApp Bot Solution",
            thumbnailUrl: options.thumbnail || DEFAULT_THUMBNAIL,
            mediaType: 1,
            mediaUrl: options.mediaUrl || undefined,
            sourceUrl: options.sourceUrl || "https://wa.me/260774358600", // link to bot or business
            showAdAttribution: true,
            renderLargerThumbnail: false 
        }
    }
});

module.exports = {
    createContext
};
