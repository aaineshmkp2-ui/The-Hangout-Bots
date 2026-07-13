const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Post a reaction poll')
    .addStringOption(o => o.setName('question').setDescription('The poll question').setRequired(true))
    .addStringOption(o => o.setName('options').setDescription('Comma-separated options (2-8). Leave blank for a yes/no poll.')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getAccentColor } = require('../handlers/brandingManager');
    const cfg = getGuildConfig(interaction.guild.id);
    const color = getAccentColor(cfg);

    const question = interaction.options.getString('question');
    const optionsStr = interaction.options.getString('options');

    if (!optionsStr) {
      const embed = new EmbedBuilder().setColor(color).setTitle('📊 Poll').setDescription(question);
      const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
      await msg.react('👍');
      await msg.react('👎');
      return;
    }

    const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean).slice(0, 8);
    if (options.length < 2) {
      return interaction.reply({ content: '⚠️ Provide at least 2 comma-separated options, or leave blank for yes/no.', ephemeral: true });
    }

    const description = options.map((opt, i) => `${NUMBER_EMOJIS[i]} ${opt}`).join('\n');
    const embed = new EmbedBuilder().setColor(color).setTitle(`📊 ${question}`).setDescription(description);
    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < options.length; i++) await msg.react(NUMBER_EMOJIS[i]);
  },
};
