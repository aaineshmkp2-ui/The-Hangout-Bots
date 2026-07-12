const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('customcommand')
    .setDescription('Manage custom commands that trigger when someone types them in chat')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Add a custom command')
        .addStringOption(o => o.setName('trigger').setDescription('What to type, e.g. !rules (no spaces)').setRequired(true))
        .addStringOption(o => o.setName('response').setDescription('What the bot replies with').setRequired(true))
    )
    .addSubcommand(sub => sub.setName('list').setDescription('List custom commands'))
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Remove a custom command')
        .addStringOption(o => o.setName('trigger').setDescription('Trigger to remove').setRequired(true))
    ),

  async execute(interaction) {
    const { db } = require('../database');
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    if (sub === 'add') {
      const trigger = interaction.options.getString('trigger').toLowerCase().trim();
      const response = interaction.options.getString('response');

      if (trigger.length > 32) {
        return interaction.reply({ content: '⚠️ Keep the trigger under 32 characters.', ephemeral: true });
      }

      db.prepare('INSERT OR REPLACE INTO custom_commands (guild_id, trigger, response, created_by) VALUES (?, ?, ?, ?)')
        .run(guildId, trigger, response, interaction.user.id);

      return interaction.reply({ content: `✅ Typing **${trigger}** in chat will now trigger a reply.`, ephemeral: true });
    }

    if (sub === 'list') {
      const rows = db.prepare('SELECT trigger FROM custom_commands WHERE guild_id = ?').all(guildId);
      if (rows.length === 0) return interaction.reply({ content: 'No custom commands yet.', ephemeral: true });
      return interaction.reply({ content: `Custom commands: ${rows.map(r => `\`${r.trigger}\``).join(', ')}`, ephemeral: true });
    }

    if (sub === 'remove') {
      const trigger = interaction.options.getString('trigger').toLowerCase().trim();
      const result = db.prepare('DELETE FROM custom_commands WHERE guild_id = ? AND trigger = ?').run(guildId, trigger);
      if (result.changes === 0) return interaction.reply({ content: `⚠️ No custom command called **${trigger}**.`, ephemeral: true });
      return interaction.reply({ content: `✅ Removed **${trigger}**.`, ephemeral: true });
    }
  },
};
