require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { getSummonerTierRankBySummonerName } = require('./services/riotApiService');
const { cleanupExistingMemberRoles } = require('./utils');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => console.log('Bot ready'));

// Handle message create event and identify if the ELO command is called
client.on('messageCreate', async (message) => {
  try {
    console.log(`Message created by ${message.author.displayName}`);
    console.log(`Message content: ${message.content.replace(/`/g, '').replace(/\n/g, ' ')}`);

    // Get member from server
    const member = await message.guild.members.fetch(message.author.id);

    if (!member) {
      return message.channel.send('You are not a member of the server');
    }

    // Check if the message starts with the command !elo
    if (message.content.startsWith('!elo ')) {
      // Get the summoner name from the message content
      const summonerName = message.content.substring(5);

      // Make sure summoner name is present and it includes the hash
      if (summonerName && summonerName.includes('#')) {
        console.log(`Summoner name: ${summonerName}`);

        // Get the rank/tier information associated to the summoner name from the Riot API
        const summonerTierRanks = await getSummonerTierRankBySummonerName(summonerName);

        if (summonerTierRanks) {
          message.channel.send(`Summoner name: ${summonerName}`);
          message.channel.send(`SoloQ: ${summonerTierRanks.soloq.tier} ${summonerTierRanks.soloq.rank}`);
          message.channel.send(`FlexQ: ${summonerTierRanks.flexq.tier} ${summonerTierRanks.flexq.rank}`);

          // This will remove first the current tier/rank role associated to the member to avoid overlaps
          await cleanupExistingMemberRoles(member);

          // Get the role from the server based on the tier/rank information
          const role = message.guild.roles.cache.find((role) => role.name === summonerTierRanks.soloq.tier);

          if (!role) {
            return message.channel.send('Role does not exist');
          }

          await member.roles.add(role);

          return message.channel.send(`You have been assigned to ${summonerTierRanks.soloq.tier}`);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
