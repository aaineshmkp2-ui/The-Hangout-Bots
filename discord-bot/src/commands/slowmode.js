const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set (or clear) slowmode for a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName('seconds').setDescription('Seconds between messages, 0 to disable').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption(o => o.setName('channel').setDescription('Channel (defaults to this one)')),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    await channel.setRateLimitPerUser(seconds);
    return interaction.reply(seconds === 0
      ? `✅ Slowmode disabled in ${channel}.`
      : `🐌 Slowmode set to ${seconds}s in ${channel}.`);
  },
};
