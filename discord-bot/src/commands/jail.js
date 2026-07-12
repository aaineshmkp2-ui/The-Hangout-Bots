const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jail')
    .setDescription('Restrict a member to the jail channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to jail').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const { getGuildConfig } = require('../database');
    const cfg = getGuildConfig(interaction.guild.id);

    if (!cfg.jail_role_id || !cfg.jail_channel_id) {
      return interaction.reply({ content: '⚠️ Jail isn\'t set up yet. Run `/jail-setup` first.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '⚠️ User not found in this server.', ephemeral: true });

    await member.roles.add(cfg.jail_role_id).catch(() => {});
    await interaction.reply(`⛓️ Jailed **${user.tag}**. Reason: ${reason}`);

    const jailChannel = interaction.guild.channels.cache.get(cfg.jail_channel_id);
    if (jailChannel) {
      jailChannel.send({
        embeds: [new EmbedBuilder().setColor(0xed4245).setDescription(`${user} was jailed. Reason: ${reason}`)],
      }).catch(() => {});
    }
  },
};
