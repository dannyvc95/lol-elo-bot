require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const { getSummonerTierRankBySummonerName } = require('./services/riotApiService');
const { cleanupExistingMemberRoles } = require('./utils');
const roles = require('./roles.json');
const { handleInitCommand } = require('./services/lolEloBotService');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

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
    guilds[guild.id] = { name: guild.name, roles: guild.roles.cache.map((role) => role.name) };
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
          const embed = new EmbedBuilder()
            .setTitle(`Hi ${member.displayName}, this is your rank...`)
            .setDescription(`\#\#\n${summonerName}\n`)
            .setFields([
              { name: 'Ranked Solo/Duo', value: `${summonerTierRanks.soloq.tier} ${summonerTierRanks.soloq.rank}`, inline: true },
              { name: 'Ranked Flex', value: `${summonerTierRanks.flexq.tier} ${summonerTierRanks.flexq.rank}`, inline: true },
            ])
            .setColor(roles[summonerTierRanks.soloq.tier]?.color)
            .setImage(`https://opgg-static.akamaized.net/images/medals_new/${summonerTierRanks.soloq.tier?.toLowerCase()?.trim()}.png?image=q_auto:good,f_webp,w_250`);
          await messageCreateEvent.channel.send({ embeds: [embed] });

          const row = new ActionRowBuilder()
            .addComponents(new ButtonBuilder().setCustomId('approve').setLabel('Approve').setStyle('Success'))
            .addComponents(new ButtonBuilder().setCustomId('reject').setLabel('Reject').setStyle('Danger'));

          const temporalMessage = await messageCreateEvent.channel.send({ embeds: [new EmbedBuilder().setTitle('lol-elo-bot role update').setDescription(`**${member.displayName}** wants to have the **${roles[summonerTierRanks.soloq.tier]?.name}** role.\nDo you approve? (only for approvers)`)], components: [row] });
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
        } else {
          return messageCreateEvent.channel.send(`**${summonerName}** is unranked or does not exist :skull:`); 
        }
      }
    } else if (messageCreateEvent.content === '!lol-elo-bot-init') {
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

  if (temporalMember === null || temporalRole === null) {
    return interactionCreateEvent.reply({ content: '❌ The request is not longer available', flags: [MessageFlags.Ephemeral] });
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

app.get('/', (req, res) => {
  res.send('lol-elo-bot')
});

app.get('/login', async (req, res) => {
  await client.login(process.env.DISCORD_BOT_TOKEN);
  res.send('bot login done');
});

app.listen(port, () => console.log('Server is up'));

client.login(process.env.DISCORD_BOT_TOKEN);
