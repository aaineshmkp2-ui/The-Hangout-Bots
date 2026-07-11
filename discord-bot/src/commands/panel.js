const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Open the admin control panel to configure the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('⚙️ Server Control Panel')
      .setDescription(
        'Click a button below to configure each module.\n\n' +
        '👋 **Welcome** — greet new members\n' +
        '🚪 **Leave** — announce departures\n' +
        '🎫 **Tickets** — set category + post the ticket panel\n' +
        '🎭 **Auto-Role** — auto-give a role on join\n' +
        '🏷️ **Self-Role Panel** — reaction-style role buttons\n' +
        '📝 **Logs** — mod-action & ticket logs\n\n' +
        'Other features: `/giveaway start`, `/kick`, `/ban`, `/timeout`, `/warn`, `/warnings`, `/clear`.'
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_welcome').setLabel('Welcome').setEmoji('👋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_leave').setLabel('Leave').setEmoji('🚪').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_ticket').setLabel('Tickets').setEmoji('🎫').setStyle(ButtonStyle.Primary)
    );
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_autorole').setLabel('Auto-Role').setEmoji('🎭').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_rolepanel').setLabel('Self-Role Panel').setEmoji('🏷️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_modlog').setLabel('Logs').setEmoji('📝').setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row1, row2], ephemeral: true });
  },
};
