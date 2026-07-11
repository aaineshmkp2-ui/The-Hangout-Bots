const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { db } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View a member\'s warnings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const rows = db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC')
      .all(interaction.guild.id, user.id);

    if (rows.length === 0) {
      return interaction.reply({ content: `✅ **${user.tag}** has no warnings.`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xfaa61a)
      .setTitle(`Warnings for ${user.tag}`)
      .setDescription(
        rows.slice(0, 15).map((w, i) =>
          `**${i + 1}.** ${w.reason}\n> by <@${w.moderator_id}> • <t:${Math.floor(w.created_at / 1000)}:R>`
        ).join('\n\n')
      )
      .setFooter({ text: `${rows.length} total warning(s)` });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
