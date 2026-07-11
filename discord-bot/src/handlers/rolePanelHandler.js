const { db } = require('../database');

async function toggleRole(interaction, roleId) {
  const role = interaction.guild.roles.cache.get(roleId);
  if (!role) {
    return interaction.reply({ content: '⚠️ That role no longer exists.', ephemeral: true });
  }

  const member = interaction.member;
  if (member.roles.cache.has(roleId)) {
    await member.roles.remove(roleId).catch(() => {});
    return interaction.reply({ content: `➖ Removed **${role.name}**.`, ephemeral: true });
  } else {
    await member.roles.add(roleId).catch(() => {});
    return interaction.reply({ content: `➕ Gave you **${role.name}**.`, ephemeral: true });
  }
}

module.exports = { toggleRole };
