const MANAGE_GUILD = 0x20n;

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  next();
}

// Confirms: user is logged in, has Manage Server in this guild (or owns it),
// and the bot is actually present in this guild.
function requireGuildAccess(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');

  const guildId = req.params.guildId;
  const botGuild = req.client.guilds.cache.get(guildId);
  if (!botGuild) {
    return res.status(404).render('error', {
      title: 'Server Not Found',
      message: "The bot isn't in this server, or it doesn't exist.",
      backHref: '/dashboard',
    });
  }

  const userGuild = (req.session.guilds || []).find(g => g.id === guildId);
  const hasAccess = userGuild && (userGuild.owner || (BigInt(userGuild.permissions) & MANAGE_GUILD) === MANAGE_GUILD);

  if (!hasAccess) {
    return res.status(403).render('error', {
      title: 'No Access',
      message: "You need the Manage Server permission in this server to configure the bot.",
      backHref: '/dashboard',
    });
  }

  req.botGuild = botGuild;
  next();
}

module.exports = { requireLogin, requireGuildAccess };
