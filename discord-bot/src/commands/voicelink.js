const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voicelink')
    .setDescription('Open a text channel automatically when someone joins a voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Link a voice channel to a text channel')
        .addChannelOption(o => o.setName('voice').setDescription('Voice channel').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
        .addChannelOption(o => o.setName('text').setDescription('Text channel to open').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List voice-text links'))
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Remove a link')
        .addChannelOption(o => o.setName('voice').setDescription('Voice channel').addChannelTypes(ChannelType.GuildVoice).setRequired(true))
    ),

  async execute(interaction) {
    const { db } = require('../database');
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const voice = interaction.options.getChannel('voice');
      const text = interaction.options.getChannel('text');
      db.prepare('INSERT OR REPLACE INTO voice_text_links (guild_id, voice_channel_id, text_channel_id) VALUES (?, ?, ?)')
        .run(guildId, voice.id, text.id);
      return interaction.reply({ content: `✅ Joining 🔊 **${voice.name}** now opens ${text} for that member.`, ephemeral: true });
    }

    if (sub === 'list') {
      const rows = db.prepare('SELECT * FROM voice_text_links WHERE guild_id = ?').all(guildId);
      if (rows.length === 0) return interaction.reply({ content: 'No voice-text links yet.', ephemeral: true });
      const lines = rows.map(r => `🔊 <#${r.voice_channel_id}> → 💬 <#${r.text_channel_id}>`);
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }

    if (sub === 'remove') {
      const voice = interaction.options.getChannel('voice');
      const result = db.prepare('DELETE FROM voice_text_links WHERE guild_id = ? AND voice_channel_id = ?').run(guildId, voice.id);
      if (result.changes === 0) return interaction.reply({ content: '⚠️ No link exists for that voice channel.', ephemeral: true });
      return interaction.reply({ content: `✅ Removed the link for 🔊 **${voice.name}**.`, ephemeral: true });
    }
  },
};
