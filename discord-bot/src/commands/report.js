const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Privately report a user or issue to the moderators')
    .addStringOption(o => o.setName('details').setDescription('What\'s going on').setRequired(true))
    .addUserOption(o => o.setName('user').setDescription('User this is about, if any')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const cfg = getGuildConfig(interaction.guild.id);

    if (!cfg.mod_log_channel) {
      return interaction.reply({ content: '⚠️ This server hasn\'t set up a mod-log channel yet, so reports have nowhere to go. Ask an admin to set one in `/panel`.', ephemeral: true });
    }

    const details = interaction.options.getString('details');
    const targetUser = interaction.options.getUser('user');
    const logChannel = interaction.guild.channels.cache.get(cfg.mod_log_channel);

    const embed = new EmbedBuilder()
      .setColor(0xfaa61a)
      .setTitle('🚩 New Report')
      .setDescription(details)
      .addFields({ name: 'Reported by', value: `${interaction.user} (${interaction.user.id})` })
      .setTimestamp();
    if (targetUser) embed.addFields({ name: 'About', value: `${targetUser} (${targetUser.id})` });

    await logChannel?.send({ embeds: [embed] }).catch(() => {});
    return interaction.reply({ content: '✅ Your report was sent to the moderators privately.', ephemeral: true });
  },
};
