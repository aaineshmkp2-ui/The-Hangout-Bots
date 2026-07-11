const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

function parseDuration(str) {
  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(str.trim());
  if (!match) return null;
  const n = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return n * multipliers[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption(o => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addStringOption(o => o.setName('duration').setDescription('e.g. 30s, 10m, 2h, 1d').setRequired(true))
        .addIntegerOption(o => o.setName('winners').setDescription('Number of winners').setMinValue(1).setMaxValue(50))
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('End a giveaway early')
        .addStringOption(o => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reroll')
        .setDescription('Reroll winners for an ended giveaway')
        .addStringOption(o => o.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    ),

  async execute(interaction) {
    const { db } = require('../database');
    const giveawayManager = require('../handlers/giveawayManager');
    const sub = interaction.options.getSubcommand();

    if (sub === 'start') {
      const prize = interaction.options.getString('prize');
      const durationStr = interaction.options.getString('duration');
      const winners = interaction.options.getInteger('winners') || 1;
      const ms = parseDuration(durationStr);
      if (!ms || ms < 5000) {
        return interaction.reply({ content: '⚠️ Invalid duration. Use formats like `30s`, `10m`, `2h`, `1d`.', ephemeral: true });
      }
      await interaction.reply({ content: '🎉 Giveaway started!', ephemeral: true });
      await giveawayManager.startGiveaway(interaction, prize, ms, winners);
      return;
    }

    if (sub === 'end') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
      if (!giveaway) return interaction.reply({ content: '⚠️ No giveaway found with that message ID.', ephemeral: true });
      await giveawayManager.endGiveaway(interaction.client, giveaway.id);
      return interaction.reply({ content: '✅ Giveaway ended.', ephemeral: true });
    }

    if (sub === 'reroll') {
      const messageId = interaction.options.getString('message_id');
      const giveaway = db.prepare('SELECT * FROM giveaways WHERE message_id = ?').get(messageId);
      if (!giveaway) return interaction.reply({ content: '⚠️ No giveaway found with that message ID.', ephemeral: true });
      const entries = JSON.parse(giveaway.entries);
      if (entries.length === 0) return interaction.reply({ content: '⚠️ No entries to reroll from.', ephemeral: true });
      const winner = entries[Math.floor(Math.random() * entries.length)];
      await interaction.reply(`🎉 New winner for **${giveaway.prize}**: <@${winner}>!`);
      return;
    }
  },
};
