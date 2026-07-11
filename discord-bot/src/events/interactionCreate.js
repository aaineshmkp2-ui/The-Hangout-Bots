const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ChannelSelectMenuBuilder, RoleSelectMenuBuilder, ChannelType,
  ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits,
} = require('discord.js');
const { updateGuildConfig } = require('../database');
const ticketHandler = require('../handlers/ticketHandler');
const giveawayManager = require('../handlers/giveawayManager');
const rolePanelHandler = require('../handlers/rolePanelHandler');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return command.execute(interaction);
      }

      if (interaction.isButton()) return handleButton(interaction);
      if (interaction.isChannelSelectMenu()) return handleChannelSelect(interaction);
      if (interaction.isRoleSelectMenu()) return handleRoleSelect(interaction);
      if (interaction.isModalSubmit()) return handleModal(interaction);
    } catch (err) {
      console.error(err);
      const payload = { content: '❌ Something went wrong handling that.', ephemeral: true };
      if (interaction.deferred || interaction.replied) interaction.followUp(payload).catch(() => {});
      else interaction.reply(payload).catch(() => {});
    }
  },
};

async function handleButton(interaction) {
  const id = interaction.customId;

  // Ticket buttons
  if (id === 'create_ticket') return ticketHandler.createTicket(interaction);
  if (id === 'close_ticket') return ticketHandler.requestClose(interaction);
  if (id === 'confirm_close_ticket') return ticketHandler.confirmClose(interaction);
  if (id === 'cancel_close_ticket') return ticketHandler.cancelClose(interaction);

  // Giveaway button
  if (id.startsWith('giveaway_enter_')) {
    const giveawayId = id.replace('giveaway_enter_', '');
    return giveawayManager.enterGiveaway(interaction, giveawayId);
  }

  // Self-role button
  if (id.startsWith('role_toggle_')) {
    const roleId = id.replace('role_toggle_', '');
    return rolePanelHandler.toggleRole(interaction, roleId);
  }

  // --- Admin panel navigation ---
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    if (id.startsWith('panel_')) {
      return interaction.reply({ content: '🚫 You need the **Manage Server** permission to use this.', ephemeral: true });
    }
  }

  if (id === 'panel_welcome') {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('cs_welcome_channel')
        .setPlaceholder('Choose the welcome channel')
        .addChannelTypes(ChannelType.GuildText)
    );
    return interaction.reply({ content: 'Pick a channel for welcome messages:', components: [row], ephemeral: true });
  }

  if (id === 'panel_leave') {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('cs_leave_channel')
        .setPlaceholder('Choose the leave-message channel')
        .addChannelTypes(ChannelType.GuildText)
    );
    return interaction.reply({ content: 'Pick a channel for leave messages:', components: [row], ephemeral: true });
  }

  if (id === 'panel_ticket') {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('cs_ticket_category')
        .setPlaceholder('Choose the category tickets go under')
        .addChannelTypes(ChannelType.GuildCategory)
    );
    return interaction.reply({ content: 'Pick the category where new ticket channels should be created:', components: [row], ephemeral: true });
  }

  if (id === 'panel_modlog') {
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('cs_modlog_channel')
        .setPlaceholder('Choose the mod-log / ticket-log channel')
        .addChannelTypes(ChannelType.GuildText)
    );
    return interaction.reply({ content: 'Pick a channel for moderation & ticket logs:', components: [row], ephemeral: true });
  }

  if (id === 'panel_autorole') {
    const row = new ActionRowBuilder().addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId('rs_autorole')
        .setPlaceholder('Choose the auto-role for new members')
    );
    return interaction.reply({ content: 'Pick a role to automatically give new members (or ignore if you don\'t want one):', components: [row], ephemeral: true });
  }

  if (id === 'panel_rolepanel') {
    return interaction.reply({
      content:
        '**Self-role panels** are managed with a slash command so you can add multiple roles:\n' +
        '`/rolepanel-add role:<role> label:<button text> emoji:<optional emoji> channel:<channel>`\n\n' +
        'Run it once per role you want to offer — it will create or add to a panel message in that channel.',
      ephemeral: true,
    });
  }
}

async function handleChannelSelect(interaction) {
  const id = interaction.customId;
  const channel = interaction.channels.first();

  if (id === 'cs_welcome_channel') {
    updateGuildConfig(interaction.guild.id, { welcome_channel: channel.id, welcome_enabled: 1 });
    return interaction.showModal(buildTextModal('modal_welcome_msg', 'Welcome Message', 'welcome_msg_input',
      'Welcome {user} to {server}! ({membercount} members)'));
  }

  if (id === 'cs_leave_channel') {
    updateGuildConfig(interaction.guild.id, { leave_channel: channel.id, leave_enabled: 1 });
    return interaction.showModal(buildTextModal('modal_leave_msg', 'Leave Message', 'leave_msg_input',
      '{username} has left {server}.'));
  }

  if (id === 'cs_ticket_category') {
    updateGuildConfig(interaction.guild.id, { ticket_category: channel.id });
    const row = new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('cs_ticket_panel_channel')
        .setPlaceholder('Choose the channel to post the "Create Ticket" panel')
        .addChannelTypes(ChannelType.GuildText)
    );
    return interaction.reply({ content: '✅ Ticket category saved. Now pick a channel to post the ticket panel in:', components: [row], ephemeral: true });
  }

  if (id === 'cs_ticket_panel_channel') {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🎫 Need Help?')
      .setDescription('Click the button below to open a private support ticket.');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('create_ticket').setLabel('Create Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
    );
    await channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: `✅ Ticket panel posted in ${channel}.`, ephemeral: true });
  }

  if (id === 'cs_modlog_channel') {
    updateGuildConfig(interaction.guild.id, { mod_log_channel: channel.id, ticket_log_channel: channel.id });
    return interaction.reply({ content: `✅ Logs will be sent to ${channel}.`, ephemeral: true });
  }
}

async function handleRoleSelect(interaction) {
  if (interaction.customId === 'rs_autorole') {
    const role = interaction.roles.first();
    updateGuildConfig(interaction.guild.id, { autorole_id: role.id });
    return interaction.reply({ content: `✅ New members will automatically get **${role.name}**.`, ephemeral: true });
  }
}

function buildTextModal(customId, title, fieldId, placeholder) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
  const input = new TextInputBuilder()
    .setCustomId(fieldId)
    .setLabel('Message (use {user} {username} {server} {membercount})')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(placeholder)
    .setRequired(true)
    .setMaxLength(1000);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

async function handleModal(interaction) {
  if (interaction.customId === 'modal_welcome_msg') {
    const text = interaction.fields.getTextInputValue('welcome_msg_input');
    updateGuildConfig(interaction.guild.id, { welcome_message: text });
    return interaction.reply({ content: '✅ Welcome message saved and enabled!', ephemeral: true });
  }

  if (interaction.customId === 'modal_leave_msg') {
    const text = interaction.fields.getTextInputValue('leave_msg_input');
    updateGuildConfig(interaction.guild.id, { leave_message: text });
    return interaction.reply({ content: '✅ Leave message saved and enabled!', ephemeral: true });
  }
}
