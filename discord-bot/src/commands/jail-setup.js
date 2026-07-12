const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jail-setup')
    .setDescription('Configure the role and channel used by /jail')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(o => o.setName('role').setDescription('Role given to jailed members (should be blocked from other channels)').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel jailed members can see and talk in').setRequired(true)),

  async execute(interaction) {
    const { updateGuildConfig } = require('../database');
    const role = interaction.options.getRole('role');
    const channel = interaction.options.getChannel('channel');

    updateGuildConfig(interaction.guild.id, { jail_role_id: role.id, jail_channel_id: channel.id });

    return interaction.reply({
      content: `✅ Jail configured. Make sure **${role.name}** is denied "View Channel" on your other channels, and allowed on ${channel}.`,
      ephemeral: true,
    });
  },
};
