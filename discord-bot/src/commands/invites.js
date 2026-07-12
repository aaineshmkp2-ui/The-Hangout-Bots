const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('Show how many members someone has invited')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getInviteCount } = require('../handlers/inviteTracker');

    const cfg = getGuildConfig(interaction.guild.id);
    if (!cfg.invite_tracker_enabled) {
      return interaction.reply({ content: '⚠️ Invite tracking isn\'t enabled on this server yet.', ephemeral: true });
    }

    const target = interaction.options.getUser('user') || interaction.user;
    const count = getInviteCount(interaction.guild.id, target.id);

    const embed = new EmbedBuilder()
      .setColor(0x45d6c0)
      .setDescription(`${target} has invited **${count}** member${count === 1 ? '' : 's'} to this server.`);

    return interaction.reply({ embeds: [embed] });
  },
};
