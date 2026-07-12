const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../database');

function fillPlaceholders(text, member) {
  return text
    .replaceAll('{user}', member.user.username)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{membercount}', member.guild.memberCount.toString());
}

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    const cfg = getGuildConfig(member.guild.id);
    if (!cfg.leave_enabled || !cfg.leave_channel) return;
    const channel = member.guild.channels.cache.get(cfg.leave_channel);
    if (!channel) return;
    const text = cfg.leave_message || '**{username}** has left {server}. We now have {membercount} members.';
    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle('👋 Member Left')
      .setDescription(fillPlaceholders(text, member))
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();
    if (cfg.leave_image) embed.setImage(cfg.leave_image);
    channel.send({ embeds: [embed] }).catch(() => {});
  },
};
