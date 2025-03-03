const roles = require('./roles.json');

const cleanupExistingMemberRoles = async (member) => {
  console.log('Cleaning up existing roles');

  const rolesToRemove = member.roles.cache.filter((role) => role.name in roles);

  for (const role of rolesToRemove) {
    await member.roles.remove(role);
  }
};

module.exports = {
  cleanupExistingMemberRoles,
};
