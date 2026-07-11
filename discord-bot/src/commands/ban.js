const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason'))
    .addIntegerOption(o => o.setName('delete_days').setDescription('Days of messages to delete (0-7)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && !member.bannable) {
      return interaction.reply({ content: '⚠️ I can\'t ban this user (role hierarchy or missing permission).', ephemeral: true });
    }

    await interaction.guild.members.ban(user.id, { reason, deleteMessageSeconds: deleteDays * 86400 });
    await interaction.reply(`🔨 Banned **${user.tag}**. Reason: ${reason}`);

    const cfg = getGuildConfig(interaction.guild.id);
    if (cfg.mod_log_channel) {
      const log = interaction.guild.channels.cache.get(cfg.mod_log_channel);
      log?.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Member Banned')
        .setDescription(`**User:** ${user.tag} (${user.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`)
        .setTimestamp()] }).catch(() => {});
    }
  },
};
