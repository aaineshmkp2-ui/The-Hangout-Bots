const INVITE_REGEX = /(discord\.gg|discordapp\.com\/invite|discord\.com\/invite)\/\S+/i;
const MAX_MENTIONS = 5;
const CAPS_MIN_LENGTH = 10;
const CAPS_THRESHOLD = 0.7; // 70% uppercase trips it

// Returns a short reason string if the message should be deleted, otherwise null.
function checkMessage(message) {
  if (message.mentions.users.size + message.mentions.roles.size > MAX_MENTIONS) {
    return 'mass mentions';
  }

  if (INVITE_REGEX.test(message.content)) {
    return 'posting an invite link';
  }

  const letters = message.content.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= CAPS_MIN_LENGTH) {
    const upper = letters.replace(/[^A-Z]/g, '').length;
    if (upper / letters.length >= CAPS_THRESHOLD) return 'excessive caps';
  }

  return null;
}

module.exports = { checkMessage };
