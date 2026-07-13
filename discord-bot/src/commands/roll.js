const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll dice')
    .addStringOption(o => o.setName('dice').setDescription('e.g. d20, 2d6, d100 (defaults to d6)')),

  async execute(interaction) {
    const input = (interaction.options.getString('dice') || 'd6').toLowerCase().trim();
    const match = /^(\d*)d(\d+)$/.exec(input);

    if (!match) {
      return interaction.reply({ content: '⚠️ Use a format like `d20`, `2d6`, or `d100`.', ephemeral: true });
    }

    const count = Math.min(parseInt(match[1] || '1', 10), 20);
    const sides = Math.min(parseInt(match[2], 10), 1000);
    if (count < 1 || sides < 2) {
      return interaction.reply({ content: '⚠️ Need at least 1 die with 2+ sides.', ephemeral: true });
    }

    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);

    return interaction.reply(`🎲 Rolling ${count}d${sides}: [${rolls.join(', ')}]${count > 1 ? ` = **${total}**` : ''}`);
  },
};
