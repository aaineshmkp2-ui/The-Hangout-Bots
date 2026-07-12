const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List everything this bot can do'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🤖 Bot Commands')
      .addFields(
        { name: '⚙️ Setup', value: '`/panel` — admin control panel\n`/rolepanel-add` — self-role button panel\n`/reactionrole-add` — react-to-existing-message role\n`/jail-setup` — configure jail role/channel\n`/blacklist add|remove|list` — blocked words' },
        { name: '📝 Content', value: '`/embed-send` — post a custom embed with image/color\n`/tag create|edit|delete|list|send` — reusable text snippets\n`/automessage add|list|remove` — recurring scheduled messages\n`/customcommand add|list|remove` — message-triggered custom replies' },
        { name: '🔊 Voice', value: '`/voicelink add|list|remove` — auto-open a text channel when someone joins voice' },
        { name: '🧹 Auto-Purge', value: '`/autopurge add|list|remove` — recurring channel cleanup' },
        { name: '⭐ Leveling & Invites', value: '`/rank` `/leaderboard` `/invites`' },
        { name: '🎉 Giveaways', value: '`/giveaway start` `/giveaway end` `/giveaway reroll`' },
        { name: '🛡️ Moderation', value: '`/kick` `/ban` `/timeout` `/warn` `/warnings` `/clear` `/lock` `/unlock` `/jail` `/unjail` `/snipe` `/slowmode`' },
        { name: '🧰 Utility', value: '`/afk` `/remind`' },
        { name: '🎫 Tickets', value: 'Click **Create Ticket** on the panel posted via `/panel` → Tickets.' },
        { name: '🌐 Web Dashboard', value: 'Welcome/Leave/Tickets/Leveling/Invites/Blacklist/Jail/Starboard/Anti-Nuke all configurable at your dashboard URL — sign in with Discord.' }
      )
      .setFooter({ text: 'Most setup commands require Manage Server permission.' });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
