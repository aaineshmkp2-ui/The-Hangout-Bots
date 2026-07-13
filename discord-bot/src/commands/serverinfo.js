const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show info about this server'),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getAccentColor } = require('../handlers/brandingManager');
    const cfg = getGuildConfig(interaction.guild.id);

    const guild = interaction.guild;
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;

    const embed = new EmbedBuilder()
      .setColor(getAccentColor(cfg))
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: 'Members', value: guild.memberCount.toString(), inline: true },
        { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Text channels', value: textChannels.toString(), inline: true },
        { name: 'Voice channels', value: voiceChannels.toString(), inline: true },
        { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
        { name: 'Boost level', value: `Level ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
      );

    return interaction.reply({ embeds: [embed] });
  },
};
