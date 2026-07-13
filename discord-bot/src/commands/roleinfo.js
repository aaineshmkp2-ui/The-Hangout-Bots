const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roleinfo')
    .setDescription('Show info about a role')
    .addRoleOption(o => o.setName('role').setDescription('Role to check').setRequired(true)),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const embed = new EmbedBuilder()
      .setColor(role.color || 0x99aab5)
      .setTitle(role.name)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Members', value: role.members.size.toString(), inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Hoisted (shown separately)', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: true },
      );
    return interaction.reply({ embeds: [embed] });
  },
};
