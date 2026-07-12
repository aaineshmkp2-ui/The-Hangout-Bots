// In-memory cache, intentionally not persisted — snipe is meant to be short-lived.
const snipeCache = new Map(); // channelId -> { content, authorTag, authorAvatar, deletedAt }

module.exports = {
  name: 'messageDelete',
  snipeCache,
  execute(message) {
    if (!message.guild || message.author?.bot) return;
    if (!message.content) return; // skip embed-only/attachment-only deletes for simplicity

    snipeCache.set(message.channel.id, {
      content: message.content,
      authorTag: message.author?.tag || 'Unknown user',
      authorAvatar: message.author?.displayAvatarURL?.() || null,
      deletedAt: Date.now(),
    });
  },
};
