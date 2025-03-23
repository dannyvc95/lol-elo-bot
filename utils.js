const roles = require('./roles.json');

const cleanupExistingMemberRoles = async (member) => {
  console.log('Cleaning up existing roles');

  const rolesToRemove = member.roles.cache.filter((role) => role.name in roles).filter((role) => role.name !== 'lol-elo-bot-approver');
  console.log(`Roles to remove: ${rolesToRemove.map((role) => role.name).join(', ')}`);

  for (const role of rolesToRemove) {
    await member.roles.remove(role);
  }
};

module.exports = {
  cleanupExistingMemberRoles,
};
