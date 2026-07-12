const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole-add')
    .setDescription('Make a message give a role when reacted to')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(o => o.setName('message_id').setDescription('ID of the message to attach this to').setRequired(true))
    .addStringOption(o => o.setName('emoji').setDescription('Emoji to react with (unicode or custom)').setRequired(true))
    .addRoleOption(o => o.setName('role').setDescription('Role to give').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Channel the message is in (defaults to this channel)')),

  async execute(interaction) {
    const { db } = require('../database');

    const messageId = interaction.options.getString('message_id');
    const emojiInput = interaction.options.getString('emoji');
    const role = interaction.options.getRole('role');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    if (role.managed || role.id === interaction.guild.id) {
      return interaction.reply({ content: '⚠️ That role can\'t be used (it\'s managed by an integration or is @everyone).', ephemeral: true });
    }

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) {
      return interaction.reply({ content: '⚠️ Couldn\'t find that message in that channel. Double check the message ID and channel.', ephemeral: true });
    }

    // Custom emoji format: <:name:id> or <a:name:id> — extract the ID. Otherwise treat as unicode.
    const customMatch = emojiInput.match(/^<a?:\w+:(\d+)>$/);
    const emojiKey = customMatch ? customMatch[1] : emojiInput;

    let reacted = true;
    await message.react(emojiInput).catch(() => { reacted = false; });
    if (!reacted) {
      return interaction.reply({ content: '⚠️ I couldn\'t react with that emoji — make sure it\'s valid and I have access to it.', ephemeral: true });
    }

    db.prepare('INSERT OR REPLACE INTO reaction_roles (guild_id, message_id, emoji, role_id) VALUES (?, ?, ?, ?)')
      .run(interaction.guild.id, messageId, emojiKey, role.id);

    return interaction.reply({ content: `✅ Reacting with ${emojiInput} on that message now gives **${role.name}**.`, ephemeral: true });
  },
};
