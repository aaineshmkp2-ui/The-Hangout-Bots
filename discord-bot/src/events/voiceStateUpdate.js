const { db } = require('../database');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    const member = newState.member || oldState.member;
    if (!member) return;

    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;
    if (oldChannelId === newChannelId) return; // mute/deafen toggle, not a channel change

    // Left a linked voice channel — remove their text access
    if (oldChannelId) {
      const link = db.prepare('SELECT * FROM voice_text_links WHERE guild_id = ? AND voice_channel_id = ?')
        .get(guild.id, oldChannelId);
      if (link) {
        const textChannel = guild.channels.cache.get(link.text_channel_id);
        if (textChannel) {
          textChannel.permissionOverwrites.delete(member.id).catch(() => {});
        }
      }
    }

    // Joined a linked voice channel — give them text access
    if (newChannelId) {
      const link = db.prepare('SELECT * FROM voice_text_links WHERE guild_id = ? AND voice_channel_id = ?')
        .get(guild.id, newChannelId);
      if (link) {
        const textChannel = guild.channels.cache.get(link.text_channel_id);
        if (textChannel) {
          textChannel.permissionOverwrites.edit(member.id, { ViewChannel: true, SendMessages: true }).catch(() => {});
        }
      }
    }
  },
};
