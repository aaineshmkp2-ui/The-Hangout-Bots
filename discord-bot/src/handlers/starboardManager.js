const { EmbedBuilder } = require('discord.js');
const { db, getGuildConfig } = require('../database');

const STAR_EMOJI = '⭐';

async function handleStarReaction(reaction) {
  if (reaction.emoji.name !== STAR_EMOJI) return;
  const message = reaction.message;
  if (!message.guild) return;

  const cfg = getGuildConfig(message.guild.id);
  if (!cfg.starboard_enabled || !cfg.starboard_channel) return;

  const starboardChannel = message.guild.channels.cache.get(cfg.starboard_channel);
  if (!starboardChannel || starboardChannel.id === message.channel.id) return;

  const count = reaction.count || 0;
  const existing = db.prepare('SELECT * FROM starboard_posts WHERE original_message_id = ?').get(message.id);

  if (count < cfg.starboard_threshold) {
    // Dropped below threshold — remove the starboard post if one exists
    if (existing) {
      const starMsg = await starboardChannel.messages.fetch(existing.starboard_message_id).catch(() => null);
      if (starMsg) await starMsg.delete().catch(() => {});
      db.prepare('DELETE FROM starboard_posts WHERE original_message_id = ?').run(message.id);
    }
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xe8a33d)
    .setAuthor({ name: message.author?.tag || 'Unknown user', iconURL: message.author?.displayAvatarURL?.() })
    .setDescription(message.content || '*(no text content)*')
    .addFields({ name: 'Source', value: `[Jump to message](${message.url})` })
    .setTimestamp(message.createdTimestamp);

  const firstImage = message.attachments.find(a => a.contentType?.startsWith('image/'));
  if (firstImage) embed.setImage(firstImage.url);

  if (existing) {
    const starMsg = await starboardChannel.messages.fetch(existing.starboard_message_id).catch(() => null);
    if (starMsg) {
      await starMsg.edit({ content: `${STAR_EMOJI} **${count}** | ${message.channel}`, embeds: [embed] }).catch(() => {});
      db.prepare('UPDATE starboard_posts SET star_count = ? WHERE original_message_id = ?').run(count, message.id);
    }
  } else {
    const posted = await starboardChannel.send({ content: `${STAR_EMOJI} **${count}** | ${message.channel}`, embeds: [embed] }).catch(() => null);
    if (posted) {
      db.prepare('INSERT INTO starboard_posts (guild_id, original_message_id, starboard_message_id, star_count) VALUES (?, ?, ?, ?)')
        .run(message.guild.id, message.id, posted.id, count);
    }
  }
}

module.exports = { handleStarReaction, STAR_EMOJI };
