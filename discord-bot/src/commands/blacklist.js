const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Manage automatically-blocked words')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Block a word')
        .addStringOption(o => o.setName('word').setDescription('Word or phrase to block').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Unblock a word')
        .addStringOption(o => o.setName('word').setDescription('Word or phrase to unblock').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List blocked words')),

  async execute(interaction) {
    const { db, updateGuildConfig } = require('../database');
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const word = interaction.options.getString('word').toLowerCase().trim();
      db.prepare('INSERT OR IGNORE INTO blacklist_words (guild_id, word) VALUES (?, ?)').run(guildId, word);
      updateGuildConfig(guildId, { blacklist_enabled: 1 });
      return interaction.reply({ content: `✅ Added **${word}** to the blacklist. Filtering is now on.`, ephemeral: true });
    }

    if (sub === 'remove') {
      const word = interaction.options.getString('word').toLowerCase().trim();
      db.prepare('DELETE FROM blacklist_words WHERE guild_id = ? AND word = ?').run(guildId, word);
      return interaction.reply({ content: `✅ Removed **${word}** from the blacklist.`, ephemeral: true });
    }

    if (sub === 'list') {
      const words = db.prepare('SELECT word FROM blacklist_words WHERE guild_id = ?').all(guildId).map(r => r.word);
      if (words.length === 0) return interaction.reply({ content: 'No blocked words configured.', ephemeral: true });
      return interaction.reply({ content: `Blocked words: ${words.map(w => `\`${w}\``).join(', ')}`, ephemeral: true });
    }
  },
};
