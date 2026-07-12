const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autopurge')
    .setDescription('Automatically clear a channel on a recurring schedule')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Start auto-purging a channel')
        .addChannelOption(o => o.setName('channel').setDescription('Channel to purge').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption(o => o.setName('interval').setDescription('How often, e.g. 30m, 2h, 1d').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List active auto-purge schedules'))
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Stop an auto-purge schedule')
        .addIntegerOption(o => o.setName('id').setDescription('ID from /autopurge list').setRequired(true))
    ),

  async execute(interaction) {
    const { db } = require('../database');
    const { createAutoPurge, stopAutoPurge } = require('../handlers/autoPurgeManager');
    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const channel = interaction.options.getChannel('channel');
      const interval = interaction.options.getString('interval');
      const id = createAutoPurge(interaction.client, { guildId: interaction.guild.id, channelId: channel.id, intervalStr: interval });
      if (!id) return interaction.reply({ content: '⚠️ Invalid interval. Use formats like `30m`, `2h`, `1d` (minimum 1 minute).', ephemeral: true });
      return interaction.reply({ content: `✅ ${channel} will auto-clear every ${interval}. ID: \`${id}\`. Note: only deletes messages younger than 14 days (a Discord limit).`, ephemeral: true });
    }

    if (sub === 'list') {
      const rows = db.prepare('SELECT * FROM auto_purge WHERE guild_id = ? AND enabled = 1').all(interaction.guild.id);
      if (rows.length === 0) return interaction.reply({ content: 'No active auto-purge schedules.', ephemeral: true });
      const lines = rows.map(r => `\`${r.id}\` → <#${r.channel_id}> every ${Math.round(r.interval_ms / 60000)}m`);
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id');
      const row = db.prepare('SELECT * FROM auto_purge WHERE id = ? AND guild_id = ?').get(id, interaction.guild.id);
      if (!row) return interaction.reply({ content: '⚠️ No auto-purge schedule with that ID in this server.', ephemeral: true });
      stopAutoPurge(id);
      return interaction.reply({ content: `✅ Stopped auto-purge \`${id}\`.`, ephemeral: true });
    }
  },
};
