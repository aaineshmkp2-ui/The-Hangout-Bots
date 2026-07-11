const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const { db } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rolepanel-add')
    .setDescription('Add a role button to a self-role panel (creates the panel if it doesn\'t exist)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption(o => o.setName('role').setDescription('Role to grant/remove').setRequired(true))
    .addStringOption(o => o.setName('label').setDescription('Button text').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel to post/update the panel in').addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(o => o.setName('emoji').setDescription('Optional emoji for the button')),

  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const label = interaction.options.getString('label');
    const channel = interaction.options.getChannel('channel');
    const emoji = interaction.options.getString('emoji');

    if (role.managed || role.id === interaction.guild.id) {
      return interaction.reply({ content: '⚠️ That role can\'t be self-assigned (it\'s managed by an integration or is @everyone).', ephemeral: true });
    }

    // Find an existing panel message in that channel to append to, else create one
    let panelRow = db.prepare('SELECT * FROM role_panels WHERE guild_id = ? AND channel_id = ? ORDER BY rowid DESC LIMIT 1')
      .get(interaction.guild.id, channel.id);

    let message;
    let existingRoles = [];

    if (panelRow) {
      message = await channel.messages.fetch(panelRow.message_id).catch(() => null);
    }

    if (message) {
      existingRoles = db.prepare('SELECT * FROM role_panels WHERE message_id = ?').all(message.id);
    }

    if (existingRoles.length >= 25) {
      return interaction.reply({ content: '⚠️ That panel already has the maximum of 25 roles. Create a new panel in a different channel.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🏷️ Self-Roles')
      .setDescription('Click a button to give or remove yourself a role.');

    if (!message) {
      message = await channel.send({ embeds: [embed], components: [] });
    }

    const allRoles = [...existingRoles, { role_id: role.id, label, emoji }];
    const rows = [];
    for (let i = 0; i < allRoles.length; i += 5) {
      const row = new ActionRowBuilder();
      for (const r of allRoles.slice(i, i + 5)) {
        const btn = new ButtonBuilder()
          .setCustomId(`role_toggle_${r.role_id}`)
          .setLabel(r.label)
          .setStyle(ButtonStyle.Secondary);
        if (r.emoji) btn.setEmoji(r.emoji);
        row.addComponents(btn);
      }
      rows.push(row);
    }

    await message.edit({ embeds: [embed], components: rows });

    db.prepare('INSERT OR REPLACE INTO role_panels (guild_id, message_id, channel_id, role_id, emoji, label) VALUES (?, ?, ?, ?, ?, ?)')
      .run(interaction.guild.id, message.id, channel.id, role.id, emoji || null, label);

    await interaction.reply({ content: `✅ Added **${role.name}** to the self-role panel in ${channel}.`, ephemeral: true });
  },
};
