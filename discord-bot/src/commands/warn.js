const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { db, getGuildConfig } = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason').setRequired(true)),

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    db.prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(interaction.guild.id, user.id, interaction.user.id, reason, Date.now());

    const count = db.prepare('SELECT COUNT(*) as c FROM warnings WHERE guild_id = ? AND user_id = ?')
      .get(interaction.guild.id, user.id).c;

    await interaction.reply(`⚠️ Warned **${user.tag}**. Reason: ${reason}\nThey now have **${count}** warning(s).`);

    user.send(`You were warned in **${interaction.guild.name}**. Reason: ${reason}`).catch(() => {});

    const cfg = getGuildConfig(interaction.guild.id);
    if (cfg.mod_log_channel) {
      const log = interaction.guild.channels.cache.get(cfg.mod_log_channel);
      log?.send({ embeds: [new EmbedBuilder().setColor(0xfaa61a).setTitle('Member Warned')
        .setDescription(`**User:** ${user.tag} (${user.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Total warnings:** ${count}`)
        .setTimestamp()] }).catch(() => {});
    }
  },
};
