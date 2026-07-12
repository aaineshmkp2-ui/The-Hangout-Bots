const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder')
    .addStringOption(o => o.setName('duration').setDescription('e.g. 10m, 2h, 1d').setRequired(true))
    .addStringOption(o => o.setName('message').setDescription('What to remind you about').setRequired(true)),

  async execute(interaction) {
    const { createReminder } = require('../handlers/reminderManager');
    const durationStr = interaction.options.getString('duration');
    const message = interaction.options.getString('message');

    const remindAt = createReminder(interaction.client, {
      guildId: interaction.guild.id,
      channelId: interaction.channel.id,
      userId: interaction.user.id,
      message,
      durationStr,
    });

    if (!remindAt) {
      return interaction.reply({ content: '⚠️ Invalid duration. Use formats like `10m`, `2h`, `1d`.', ephemeral: true });
    }

    return interaction.reply(`⏰ Got it — I'll remind you <t:${Math.floor(remindAt / 1000)}:R>.`);
  },
};
