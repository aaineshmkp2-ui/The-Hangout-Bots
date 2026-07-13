const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { sendModDM } = require('../handlers/brandingManager');
    const cfg = getGuildConfig(interaction.guild.id);

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ content: '⚠️ User not found in this server.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: '⚠️ I can\'t kick this user (role hierarchy or missing permission).', ephemeral: true });

    // Send the DM before kicking — afterward we may lose the ability to reach them
    await sendModDM(cfg, user, interaction.guild, 'kick', reason, 'dm_kick_message', 'You were kicked from {server}. Reason: {reason}');

    await member.kick(reason);
    await interaction.reply(`👢 Kicked **${user.tag}**. Reason: ${reason}`);

    if (cfg.mod_log_channel) {
      const log = interaction.guild.channels.cache.get(cfg.mod_log_channel);
      log?.send({ embeds: [new EmbedBuilder().setColor(0xed4245).setTitle('Member Kicked')
        .setDescription(`**User:** ${user.tag} (${user.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`)
        .setTimestamp()] }).catch(() => {});
    }
  },
};
