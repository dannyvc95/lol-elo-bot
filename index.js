require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, MessageFlags } = require('discord.js');
const { getSummonerTierRankBySummonerName } = require('./services/riotApiService');
const { cleanupExistingMemberRoles } = require('./utils');
const roles = require('./roles');
const { handleInitCommand } = require('./services/lolEloBotService');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const guilds = {};
let temporalMember = null;
let temporalRole = null;

client.once('ready', () => {
  console.log('Creating local guilds database...');

  // Create local guilds database
  client.guilds.cache.forEach((guild) => {
    guilds[guild.id] = {name: guild.name, roles: guild.roles.cache.map((role) => role.name)};
  });

  console.log('lol-elo-bot is ready!');
});

// Handle message create event
client.on('messageCreate', async (messageCreateEvent) => {
  try {
    console.log(`Message created by: ${messageCreateEvent.author.displayName}`);
    console.log(`Message content: ${messageCreateEvent.content.replace(/`/g, '').replace(/\n/g, ' ')}`);

    // Get member from server
    const member = await messageCreateEvent.guild.members.fetch(messageCreateEvent.author.id);

    if (!member) {
      return messageCreateEvent.channel.send('You are not a member of the server');
    }

    // Handle commands from the message create event
    if (messageCreateEvent.content.startsWith('!elo ')) {
      // Get the summoner name from the message content
      const summonerName = messageCreateEvent.content.substring(5);

      // Make sure summoner name is present and it includes the hash
      if (summonerName && summonerName.includes('#')) {
        console.log(`Summoner name: ${summonerName}`);

        // Get the rank/tier information associated to the summoner name from the Riot API
        const summonerTierRanks = await getSummonerTierRankBySummonerName(summonerName);

        if (summonerTierRanks) {
          messageCreateEvent.channel.send(`Summoner name: ${summonerName}`);
          messageCreateEvent.channel.send(`SoloQ: ${summonerTierRanks.soloq.tier} ${summonerTierRanks.soloq.rank}`);
          messageCreateEvent.channel.send(`FlexQ: ${summonerTierRanks.flexq.tier} ${summonerTierRanks.flexq.rank}`);

          const row = new ActionRowBuilder()
        .addComponents(new ButtonBuilder().setCustomId('approve').setLabel('Approve').setStyle('Success'))
        .addComponents(new ButtonBuilder().setCustomId('reject').setLabel('Reject').setStyle('Danger'));
        const temporalMessage = await messageCreateEvent.channel.send({ content: 'Please approve or reject the ELO request', components: [row] });
        messageCreateEvent.client.temporalMessage = temporalMessage;


          // Get the role from the server based on the tier/rank information
          const role = messageCreateEvent.guild.roles.cache.find((role) => role.name === summonerTierRanks.soloq.tier);

          

          if (!role) {
            return messageCreateEvent.channel.send('Role does not exist');
          }

          temporalMember = member;
          temporalRole = role;

          
          return;

          //return messageCreateEvent.channel.send(`You have been assigned to ${summonerTierRanks.soloq.tier}`);
        }
      }
    } else if (messageCreateEvent.content === '!init') {
      await handleInitCommand(messageCreateEvent, guilds);
    }
  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async (interactionCreateEvent) => {
  if (!interactionCreateEvent.isButton()) return;


  if (!interactionCreateEvent.member.roles.cache.some((role) => role.name === 'lol-elo-bot-approver')) {
    return interactionCreateEvent.reply({ content: '❌ Only members with the role lol-elo-bot-approver are allowed to approve or reject this request', flags: [MessageFlags.Ephemeral] });
  }

  if (interactionCreateEvent.customId === 'approve') {
    // This will remove first the current tier/rank role associated to the member to avoid overlaps
    await cleanupExistingMemberRoles(temporalMember);
    await temporalMember.roles.add(temporalRole);
    await interactionCreateEvent.reply({ content: 'Approved!', flags: [MessageFlags.Ephemeral] });
  } else if (interactionCreateEvent.customId === 'reject') {
    await interactionCreateEvent.reply({ content: 'Rejected!', flags: [MessageFlags.Ephemeral] });
  }

  if (interactionCreateEvent.client.temporalMessage) {
    await interactionCreateEvent.client.temporalMessage.delete();
    delete interactionCreateEvent.client.temporalMessage;
  }

  temporalMember = null;
  temporalRole = null;
});

client.login(process.env.DISCORD_BOT_TOKEN);
