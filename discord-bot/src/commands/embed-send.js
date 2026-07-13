const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed-send')
    .setDescription('Post a custom embed message with your own text, color, and image')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName('description').setDescription('Main text of the embed').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to post in (defaults to this one)'))
    .addStringOption(o => o.setName('title').setDescription('Title text'))
    .addStringOption(o => o.setName('color').setDescription('Hex color, e.g. #E8A33D'))
    .addStringOption(o => o.setName('image').setDescription('Large image URL (shown at the bottom)'))
    .addStringOption(o => o.setName('thumbnail').setDescription('Small image URL (shown top-right)'))
    .addStringOption(o => o.setName('footer').setDescription('Small text at the bottom')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const { getAccentColor } = require('../handlers/brandingManager');
    const cfg = getGuildConfig(interaction.guild.id);

    const description = interaction.options.getString('description').replaceAll('\\n', '\n');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const title = interaction.options.getString('title');
    const color = interaction.options.getString('color');
    const image = interaction.options.getString('image');
    const thumbnail = interaction.options.getString('thumbnail');
    const footer = interaction.options.getString('footer');

    const embed = new EmbedBuilder().setDescription(description).setColor(color || getAccentColor(cfg));
    if (title) embed.setTitle(title);
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({ text: footer });

    const sent = await channel.send({ embeds: [embed] }).catch(() => null);
    if (!sent) {
      return interaction.reply({ content: '⚠️ Couldn\'t send that — check the color format (e.g. `#E8A33D`) and image URLs.', ephemeral: true });
    }

    return interaction.reply({ content: `✅ Sent to ${channel}. Message ID: \`${sent.id}\` (useful if you want to attach reaction roles to it).`, ephemeral: true });
  },
};
