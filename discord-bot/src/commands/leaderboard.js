const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the server\'s top members by XP'),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getLeaderboard } = require('../handlers/levelingManager');

    const cfg = getGuildConfig(interaction.guild.id);
    if (!cfg.leveling_enabled) {
      return interaction.reply({ content: '⚠️ Leveling isn\'t enabled on this server yet.', ephemeral: true });
    }

    const top = getLeaderboard(interaction.guild.id, 10);
    if (top.length === 0) {
      return interaction.reply({ content: 'No one has earned XP yet — send some messages!', ephemeral: true });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const lines = top.map((row, i) => `${medals[i] || `**${i + 1}.**`} <@${row.user_id}> — Level ${row.level} (${row.xp} XP)`);

    const embed = new EmbedBuilder()
      .setColor(0xe8a33d)
      .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
      .setDescription(lines.join('\n'));

    return interaction.reply({ embeds: [embed] });
  },
};
