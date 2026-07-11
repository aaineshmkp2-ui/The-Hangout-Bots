const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database');

const timers = new Map();

function buildEmbed(prize, winnersCount, endTime, hostId, entryCount) {
  return new EmbedBuilder()
    .setColor(0xf1c40f)
    .setTitle(`🎉 Giveaway: ${prize}`)
    .setDescription(
      `Click the button below to enter!\n\n` +
      `**Winners:** ${winnersCount}\n` +
      `**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n` +
      `**Hosted by:** <@${hostId}>\n` +
      `**Entries:** ${entryCount}`
    )
    .setTimestamp(endTime);
}

function buildRow(giveawayId, ended = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`giveaway_enter_${giveawayId}`)
      .setLabel(ended ? 'Giveaway Ended' : 'Enter Giveaway 🎉')
      .setStyle(ButtonStyle.Success)
      .setDisabled(ended)
  );
}

async function startGiveaway(interaction, prize, durationMs, winnersCount) {
  const endTime = Date.now() + durationMs;
  const channel = interaction.channel;

  const msg = await channel.send({
    embeds: [buildEmbed(prize, winnersCount, endTime, interaction.user.id, 0)],
    components: [],
  });

  const info = db.prepare(
    'INSERT INTO giveaways (guild_id, channel_id, message_id, prize, winners_count, host_id, end_time, entries) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(interaction.guild.id, channel.id, msg.id, prize, winnersCount, interaction.user.id, endTime, '[]');

  await msg.edit({ components: [buildRow(info.lastInsertRowid)] });

  scheduleEnd(interaction.client, info.lastInsertRowid, durationMs);
  return msg;
}

async function enterGiveaway(interaction, giveawayId) {
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
  if (!giveaway || giveaway.ended) {
    return interaction.reply({ content: '⚠️ This giveaway has ended.', ephemeral: true });
  }
  const entries = JSON.parse(giveaway.entries);
  if (entries.includes(interaction.user.id)) {
    return interaction.reply({ content: '✅ You are already entered!', ephemeral: true });
  }
  entries.push(interaction.user.id);
  db.prepare('UPDATE giveaways SET entries = ? WHERE id = ?').run(JSON.stringify(entries), giveawayId);

  const embed = buildEmbed(giveaway.prize, giveaway.winners_count, giveaway.end_time, giveaway.host_id, entries.length);
  await interaction.update({ embeds: [embed] }).catch(async () => {
    await interaction.reply({ content: '🎉 You are entered!', ephemeral: true });
  });
}

function scheduleEnd(client, giveawayId, delay) {
  const safeDelay = Math.min(delay, 2147000000); // setTimeout max ~24.8 days
  const timer = setTimeout(() => endGiveaway(client, giveawayId), safeDelay);
  timers.set(giveawayId, timer);
}

async function endGiveaway(client, giveawayId) {
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
  if (!giveaway || giveaway.ended) return;

  db.prepare('UPDATE giveaways SET ended = 1 WHERE id = ?').run(giveawayId);

  const entries = JSON.parse(giveaway.entries);
  const channel = await client.channels.fetch(giveaway.channel_id).catch(() => null);
  if (!channel) return;
  const msg = await channel.messages.fetch(giveaway.message_id).catch(() => null);

  let winners = [];
  if (entries.length > 0) {
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    winners = shuffled.slice(0, giveaway.winners_count);
  }

  const embed = buildEmbed(giveaway.prize, giveaway.winners_count, giveaway.end_time, giveaway.host_id, entries.length)
    .setColor(0x99aab5)
    .setTitle(`🎉 Giveaway Ended: ${giveaway.prize}`);

  if (msg) await msg.edit({ embeds: [embed], components: [buildRow(giveawayId, true)] }).catch(() => {});

  if (winners.length === 0) {
    channel.send(`No one entered the **${giveaway.prize}** giveaway. No winner could be selected.`).catch(() => {});
  } else {
    channel.send(`🎉 Congratulations ${winners.map(id => `<@${id}>`).join(', ')}! You won **${giveaway.prize}**!`).catch(() => {});
  }

  timers.delete(giveawayId);
}

function resumeGiveaways(client) {
  const active = db.prepare('SELECT * FROM giveaways WHERE ended = 0').all();
  for (const g of active) {
    const remaining = g.end_time - Date.now();
    if (remaining <= 0) endGiveaway(client, g.id);
    else scheduleEnd(client, g.id, remaining);
  }
}

module.exports = { startGiveaway, enterGiveaway, endGiveaway, resumeGiveaways };
