const express = require('express');
const router = express.Router();
const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { requireLogin, requireGuildAccess } = require('../middleware');

const MANAGE_GUILD = 0x20n;

router.get('/', requireLogin, (req, res) => {
  const userGuilds = req.session.guilds || [];
  const managed = userGuilds.filter(g => g.owner || (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD);

  const servers = managed.map(g => {
    const botGuild = req.client.guilds.cache.get(g.id);
    return {
      id: g.id,
      name: g.name,
      icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      botPresent: !!botGuild,
    };
  }).sort((a, b) => (b.botPresent - a.botPresent));

  res.render('guilds', { title: 'Your Servers', servers });
});

router.get('/:guildId', requireGuildAccess, (req, res) => {
  const { getGuildConfig, db } = require('../../database');
  const cfg = getGuildConfig(req.params.guildId);
  const guild = req.botGuild;

  const textChannels = [...guild.channels.cache.filter(c => c.type === ChannelType.GuildText).values()]
    .map(c => ({ id: c.id, name: c.name }));
  const categories = [...guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).values()]
    .map(c => ({ id: c.id, name: c.name }));
  const roles = [...guild.roles.cache.filter(r => !r.managed && r.id !== guild.id).values()]
    .sort((a, b) => b.position - a.position)
    .map(r => ({ id: r.id, name: r.name, color: r.hexColor }));

  const openTickets = db.prepare("SELECT COUNT(*) c FROM tickets WHERE guild_id = ? AND status = 'open'").get(guild.id).c;
  const activeGiveaways = db.prepare('SELECT COUNT(*) c FROM giveaways WHERE guild_id = ? AND ended = 0').get(guild.id).c;
  const warningCount = db.prepare('SELECT COUNT(*) c FROM warnings WHERE guild_id = ?').get(guild.id).c;

  res.render('dashboard', {
    title: guild.name,
    guild: { id: guild.id, name: guild.name, memberCount: guild.memberCount, icon: guild.iconURL() },
    cfg, textChannels, categories, roles,
    stats: { openTickets, activeGiveaways, warningCount },
    flash: req.session.flash || null,
  });
  req.session.flash = null;
});

function setFlash(req, message, type = 'success') {
  req.session.flash = { message, type };
}

router.post('/:guildId/welcome', requireGuildAccess, (req, res) => {
  const { updateGuildConfig } = require('../../database');
  const { channel, message, enabled } = req.body;
  updateGuildConfig(req.params.guildId, {
    welcome_channel: channel || null,
    welcome_message: message || null,
    welcome_enabled: enabled ? 1 : 0,
  });
  setFlash(req, 'Welcome settings saved.');
  res.redirect(`/dashboard/${req.params.guildId}`);
});

router.post('/:guildId/leave', requireGuildAccess, (req, res) => {
  const { updateGuildConfig } = require('../../database');
  const { channel, message, enabled } = req.body;
  updateGuildConfig(req.params.guildId, {
    leave_channel: channel || null,
    leave_message: message || null,
    leave_enabled: enabled ? 1 : 0,
  });
  setFlash(req, 'Leave settings saved.');
  res.redirect(`/dashboard/${req.params.guildId}`);
});

router.post('/:guildId/tickets', requireGuildAccess, async (req, res) => {
  const { updateGuildConfig } = require('../../database');
  const { category, panelChannel, postPanel } = req.body;
  updateGuildConfig(req.params.guildId, { ticket_category: category || null });

  if (postPanel && panelChannel) {
    const channel = req.botGuild.channels.cache.get(panelChannel);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🎫 Need Help?')
        .setDescription('Click the button below to open a private support ticket.');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('create_ticket').setLabel('Create Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
      );
      await channel.send({ embeds: [embed], components: [row] }).catch(() => {});
      setFlash(req, `Ticket settings saved and panel posted in #${channel.name}.`);
      return res.redirect(`/dashboard/${req.params.guildId}`);
    }
  }
  setFlash(req, 'Ticket category saved.');
  res.redirect(`/dashboard/${req.params.guildId}`);
});

router.post('/:guildId/autorole', requireGuildAccess, (req, res) => {
  const { updateGuildConfig } = require('../../database');
  const { role } = req.body;
  updateGuildConfig(req.params.guildId, { autorole_id: role || null });
  setFlash(req, 'Auto-role saved.');
  res.redirect(`/dashboard/${req.params.guildId}`);
});

router.post('/:guildId/logs', requireGuildAccess, (req, res) => {
  const { updateGuildConfig } = require('../../database');
  const { channel } = req.body;
  updateGuildConfig(req.params.guildId, { mod_log_channel: channel || null, ticket_log_channel: channel || null });
  setFlash(req, 'Log channel saved.');
  res.redirect(`/dashboard/${req.params.guildId}`);
});

router.get('/:guildId/warnings', requireGuildAccess, (req, res) => {
  const { db } = require('../../database');
  const search = req.query.user || '';
  let warnings = [];
  if (search) {
    warnings = db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC')
      .all(req.params.guildId, search.trim());
  } else {
    warnings = db.prepare('SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT 50')
      .all(req.params.guildId);
  }
  res.render('warnings', { title: `Warnings — ${req.botGuild.name}`, guild: { id: req.botGuild.id, name: req.botGuild.name }, warnings, search });
});

router.get('/:guildId/giveaways', requireGuildAccess, (req, res) => {
  const { db } = require('../../database');
  const giveaways = db.prepare('SELECT * FROM giveaways WHERE guild_id = ? ORDER BY id DESC LIMIT 30').all(req.params.guildId)
    .map(g => ({ ...g, entryCount: JSON.parse(g.entries).length }));
  res.render('giveaways', { title: `Giveaways — ${req.botGuild.name}`, guild: { id: req.botGuild.id, name: req.botGuild.name }, giveaways });
});

module.exports = router;
