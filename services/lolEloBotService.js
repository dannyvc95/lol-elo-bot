
require('dotenv').config();
const roles = require('../roles');

/**
 * Handles the initialization command by ensuring all required roles are present in the guild.
 * If a role is missing, it creates the role with the specified color.
 * 
 * @param {Object} messageCreateEvent - The event object for the message creation.
 * @param {Object} guilds - The collection of guilds.
 * @returns {Promise<void>} - A promise that resolves when the initialization is complete.
 */
const handleInitCommand = async (messageCreateEvent, guilds) => {
  messageCreateEvent.channel.send('Creating missing roles if required...');

  for (const role of Object.keys(roles)) {
    // Check if the role is not present in the guild
    if (!guilds[messageCreateEvent.guild.id].roles.includes(role)) {
      console.log(`Creating ${role} role`);
      await messageCreateEvent.guild.roles.create({name: role, color: roles[role].color});
    }
  }

  messageCreateEvent.channel.send('✅ Initialization finished');
};

module.exports = {
  handleInitCommand,
};
