const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Save and reuse custom text snippets')
    .addSubcommand(sub =>
      sub.setName('create').setDescription('Create a new tag')
        .addStringOption(o => o.setName('name').setDescription('Short name, no spaces').setRequired(true))
        .addStringOption(o => o.setName('content').setDescription('What it should say').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('edit').setDescription('Edit an existing tag')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true))
        .addStringOption(o => o.setName('content').setDescription('New content').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('delete').setDescription('Delete a tag')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List all tags'))
    .addSubcommand(sub =>
      sub.setName('send').setDescription('Post a tag\'s content')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true))
    ),

  async execute(interaction) {
    const { db } = require('../database');
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'create') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const content = interaction.options.getString('content');
      const existing = db.prepare('SELECT * FROM tags WHERE guild_id = ? AND name = ?').get(guildId, name);
      if (existing) return interaction.reply({ content: `⚠️ A tag called **${name}** already exists. Use \`/tag edit\` instead.`, ephemeral: true });
      db.prepare('INSERT INTO tags (guild_id, name, content, created_by) VALUES (?, ?, ?, ?)').run(guildId, name, content, interaction.user.id);
      return interaction.reply({ content: `✅ Tag **${name}** created. Use \`/tag send name:${name}\` to post it.`, ephemeral: true });
    }

    if (sub === 'edit') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const content = interaction.options.getString('content');
      const existing = db.prepare('SELECT * FROM tags WHERE guild_id = ? AND name = ?').get(guildId, name);
      if (!existing) return interaction.reply({ content: `⚠️ No tag called **${name}** exists.`, ephemeral: true });
      db.prepare('UPDATE tags SET content = ? WHERE guild_id = ? AND name = ?').run(content, guildId, name);
      return interaction.reply({ content: `✅ Tag **${name}** updated.`, ephemeral: true });
    }

    if (sub === 'delete') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const result = db.prepare('DELETE FROM tags WHERE guild_id = ? AND name = ?').run(guildId, name);
      if (result.changes === 0) return interaction.reply({ content: `⚠️ No tag called **${name}** exists.`, ephemeral: true });
      return interaction.reply({ content: `✅ Tag **${name}** deleted.`, ephemeral: true });
    }

    if (sub === 'list') {
      const tags = db.prepare('SELECT name FROM tags WHERE guild_id = ?').all(guildId);
      if (tags.length === 0) return interaction.reply({ content: 'No tags yet. Create one with `/tag create`.', ephemeral: true });
      return interaction.reply({ content: `Tags: ${tags.map(t => `\`${t.name}\``).join(', ')}`, ephemeral: true });
    }

    if (sub === 'send') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const tag = db.prepare('SELECT * FROM tags WHERE guild_id = ? AND name = ?').get(guildId, name);
      if (!tag) return interaction.reply({ content: `⚠️ No tag called **${name}** exists.`, ephemeral: true });
      return interaction.reply(tag.content);
    }
  },
};
