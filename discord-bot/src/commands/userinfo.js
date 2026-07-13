const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show info about a member')
    .addUserOption(o => o.setName('user').setDescription('User to check')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getAccentColor } = require('../handlers/brandingManager');
    const cfg = getGuildConfig(interaction.guild.id);

    const user = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setColor(getAccentColor(cfg))
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Account created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
      );

    if (member) {
      embed.addFields(
        { name: 'Joined server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Roles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r.toString()).join(', ') || 'None' },
      );
    }

    return interaction.reply({ embeds: [embed] });
  },
};
