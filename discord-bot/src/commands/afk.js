const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set yourself as AFK — anyone who @mentions you will be told')
    .addStringOption(o => o.setName('reason').setDescription('Why you\'re away')),

  async execute(interaction) {
    const { db } = require('../database');
    const reason = interaction.options.getString('reason') || 'AFK';

    db.prepare('INSERT OR REPLACE INTO afk_status (guild_id, user_id, reason, set_at) VALUES (?, ?, ?, ?)')
      .run(interaction.guild.id, interaction.user.id, reason, Date.now());

    return interaction.reply(`💤 You're now AFK: ${reason}`);
  },
};
