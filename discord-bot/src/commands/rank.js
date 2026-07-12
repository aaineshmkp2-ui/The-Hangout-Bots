const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Show your (or someone else\'s) level and XP')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getRank, xpForLevel } = require('../handlers/levelingManager');

    const cfg = getGuildConfig(interaction.guild.id);
    if (!cfg.leveling_enabled) {
      return interaction.reply({ content: '⚠️ Leveling isn\'t enabled on this server yet. An admin can turn it on in `/panel` or the web dashboard.', ephemeral: true });
    }

    const target = interaction.options.getUser('user') || interaction.user;
    const { xp, level, rank } = getRank(interaction.guild.id, target.id);
    const nextLevelXp = xpForLevel(level);
    const thisLevelXp = level > 0 ? xpForLevel(level - 1) : 0;
    const progress = xp - thisLevelXp;
    const needed = nextLevelXp - thisLevelXp;

    const embed = new EmbedBuilder()
      .setColor(0xe8a33d)
      .setTitle(`${target.username}'s Rank`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Level', value: level.toString(), inline: true },
        { name: 'Rank', value: rank ? `#${rank}` : 'Unranked', inline: true },
        { name: 'XP', value: `${progress} / ${needed} to next level`, inline: true },
      );

    return interaction.reply({ embeds: [embed] });
  },
};
