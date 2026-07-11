const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../database');

function fillPlaceholders(text, member) {
  return text
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{membercount}', member.guild.memberCount.toString());
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const cfg = getGuildConfig(member.guild.id);

    if (cfg.autorole_id) {
      const role = member.guild.roles.cache.get(cfg.autorole_id);
      if (role) member.roles.add(role).catch(() => {});
    }

    if (cfg.welcome_enabled && cfg.welcome_channel) {
      const channel = member.guild.channels.cache.get(cfg.welcome_channel);
      if (!channel) return;
      const text = cfg.welcome_message || 'Welcome {user} to **{server}**! We now have {membercount} members.';
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('👋 New Member!')
        .setDescription(fillPlaceholders(text, member))
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();
      channel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
