const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelType, PermissionFlagsBits,
} = require('discord.js');
const { db, getGuildConfig } = require('../database');

async function createTicket(interaction) {
  const cfg = getGuildConfig(interaction.guild.id);
  if (!cfg.ticket_category) {
    return interaction.reply({ content: '⚠️ Tickets are not fully set up yet. An admin needs to run `/panel` and configure the ticket category.', ephemeral: true });
  }

  const existing = db.prepare(
    "SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'"
  ).get(interaction.guild.id, interaction.user.id);
  if (existing) {
    return interaction.reply({ content: `⚠️ You already have an open ticket: <#${existing.channel_id}>`, ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().slice(0, 90),
    type: ChannelType.GuildText,
    parent: cfg.ticket_category,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
    ],
  });

  db.prepare('INSERT INTO tickets (guild_id, channel_id, user_id, status, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(interaction.guild.id, channel.id, interaction.user.id, 'open', Date.now());

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🎫 Support Ticket')
    .setDescription(`Hi ${interaction.user}, thanks for reaching out! Describe your issue and a staff member will be with you shortly.`)
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('close_ticket').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
  );

  await channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });
  await interaction.editReply({ content: `✅ Ticket created: ${channel}` });
}

async function requestClose(interaction) {
  const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'").get(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ content: 'This is not an active ticket channel.', ephemeral: true });
  }
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('confirm_close_ticket').setLabel('Confirm Close').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('cancel_close_ticket').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );
  await interaction.reply({ content: 'Are you sure you want to close this ticket?', components: [row] });
}

async function confirmClose(interaction) {
  const ticket = db.prepare("SELECT * FROM tickets WHERE channel_id = ? AND status = 'open'").get(interaction.channel.id);
  if (!ticket) return interaction.update({ content: 'Ticket already closed.', components: [] });

  db.prepare("UPDATE tickets SET status = 'closed' WHERE channel_id = ?").run(interaction.channel.id);
  await interaction.update({ content: '🔒 Closing ticket in 5 seconds...', components: [] });

  const cfg = getGuildConfig(interaction.guild.id);
  if (cfg.ticket_log_channel) {
    const logChannel = interaction.guild.channels.cache.get(cfg.ticket_log_channel);
    if (logChannel) {
      logChannel.send({
        embeds: [new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle('Ticket Closed')
          .setDescription(`Channel: #${interaction.channel.name}\nOpened by: <@${ticket.user_id}>\nClosed by: ${interaction.user}`)
          .setTimestamp()],
      }).catch(() => {});
    }
  }

  setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

async function cancelClose(interaction) {
  await interaction.update({ content: '✅ Close cancelled.', components: [] });
}

module.exports = { createTicket, requestClose, confirmClose, cancelClose };
