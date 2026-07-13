const DEFAULT_COLOR = 0x5865f2;

function getAccentColor(cfg) {
  return cfg.embed_accent_color || DEFAULT_COLOR;
}

function fillTemplate(text, { user, guild, reason }) {
  return text
    .replaceAll('{user}', user?.username || 'there')
    .replaceAll('{server}', guild?.name || 'the server')
    .replaceAll('{reason}', reason || 'No reason provided');
}

// Sends a DM to a moderated user if the server has DMs enabled, using a custom
// template if one is configured, falling back to a sensible default.
async function sendModDM(cfg, user, guild, action, reason, templateField, defaultTemplate) {
  if (!cfg.mod_dm_enabled) return;
  const template = cfg[templateField] || defaultTemplate;
  const text = fillTemplate(template, { user, guild, reason });
  await user.send(text).catch(() => {}); // users with DMs closed just won't get it
}

module.exports = { getAccentColor, fillTemplate, sendModDM, DEFAULT_COLOR };
