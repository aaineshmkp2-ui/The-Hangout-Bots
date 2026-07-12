const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automessage')
    .setDescription('Manage recurring scheduled messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Add a recurring message')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to post in').setRequired(true))
        .addStringOption(o => o.setName('interval').setDescription('How often, e.g. 30m, 2h, 1d').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('What to post').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List active recurring messages'))
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Stop a recurring message')
        .addIntegerOption(o => o.setName('id').setDescription('ID from /automessage list').setRequired(true))
    ),

  async execute(interaction) {
    const { db } = require('../database');
    const { createAutoMessage, stopAutoMessage } = require('../handlers/autoMessageManager');
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const channel = interaction.options.getChannel('channel');
      const interval = interaction.options.getString('interval');
      const message = interaction.options.getString('message');

      const id = createAutoMessage(interaction.client, {
        guildId: interaction.guild.id, channelId: channel.id, message, intervalStr: interval,
      });
      if (!id) return interaction.reply({ content: '⚠️ Invalid interval. Use formats like `30m`, `2h`, `1d` (minimum 1 minute).', ephemeral: true });
      return interaction.reply({ content: `✅ Will post in ${channel} every ${interval}. ID: \`${id}\``, ephemeral: true });
    }

    if (sub === 'list') {
      const rows = db.prepare('SELECT * FROM auto_messages WHERE guild_id = ? AND enabled = 1').all(interaction.guild.id);
      if (rows.length === 0) return interaction.reply({ content: 'No active recurring messages.', ephemeral: true });
      const lines = rows.map(r => `\`${r.id}\` → <#${r.channel_id}> every ${Math.round(r.interval_ms / 60000)}m: "${r.message.slice(0, 40)}${r.message.length > 40 ? '…' : ''}"`);
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id');
      const row = db.prepare('SELECT * FROM auto_messages WHERE id = ? AND guild_id = ?').get(id, interaction.guild.id);
      if (!row) return interaction.reply({ content: '⚠️ No recurring message with that ID in this server.', ephemeral: true });
      stopAutoMessage(id);
      return interaction.reply({ content: `✅ Stopped recurring message \`${id}\`.`, ephemeral: true });
    }
  },
};
