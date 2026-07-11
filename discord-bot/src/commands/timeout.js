const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

function parseDuration(str) {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(str.trim());
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to timeout').setRequired(true))
    .addStringOption(o => o.setName('duration').setDescription('e.g. 10m, 1h, 1d (max 28d)').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const user = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const ms = parseDuration(durationStr);
    const maxMs = 28 * 86400000;

    if (!ms || ms < 5000 || ms > maxMs) {
      return interaction.reply({ content: '⚠️ Invalid duration. Use formats like `10m`, `1h`, `1d` (max 28d).', ephemeral: true });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member || !member.moderatable) {
      return interaction.reply({ content: '⚠️ I can\'t timeout this user (role hierarchy or missing permission).', ephemeral: true });
    }

    await member.timeout(ms, reason);
    await interaction.reply(`⏱️ Timed out **${user.tag}** for ${durationStr}. Reason: ${reason}`);

    const cfg = getGuildConfig(interaction.guild.id);
    if (cfg.mod_log_channel) {
      const log = interaction.guild.channels.cache.get(cfg.mod_log_channel);
      log?.send({ embeds: [new EmbedBuilder().setColor(0xfaa61a).setTitle('Member Timed Out')
        .setDescription(`**User:** ${user.tag} (${user.id})\n**Duration:** ${durationStr}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`)
        .setTimestamp()] }).catch(() => {});
    }
  },
};
