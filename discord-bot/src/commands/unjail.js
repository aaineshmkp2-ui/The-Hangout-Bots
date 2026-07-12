const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unjail')
    .setDescription('Release a member from jail')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to release').setRequired(true)),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const cfg = getGuildConfig(interaction.guild.id);

    if (!cfg.jail_role_id) {
      return interaction.reply({ content: '⚠️ Jail isn\'t set up yet. Run `/jail-setup` first.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '⚠️ User not found in this server.', ephemeral: true });

    await member.roles.remove(cfg.jail_role_id).catch(() => {});
    return interaction.reply(`✅ **${user.tag}** has been released from jail.`);
  },
};
