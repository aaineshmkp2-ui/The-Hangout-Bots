const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List everything this bot can do'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤖 Bot Commands')
      .addFields(
        { name: '⚙️ Setup', value: '`/panel` — open the admin control panel (welcome, leave, tickets, auto-role, logs)\n`/rolepanel-add` — add a self-role button to a panel' },
        { name: '🎉 Giveaways', value: '`/giveaway start` `/giveaway end` `/giveaway reroll`' },
        { name: '🛡️ Moderation', value: '`/kick` `/ban` `/timeout` `/warn` `/warnings` `/clear`' },
        { name: '🎫 Tickets', value: 'Click **Create Ticket** on the panel posted via `/panel` → Tickets.' }
      )
      .setFooter({ text: 'Most setup commands require Manage Server permission.' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
