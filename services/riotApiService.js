require('dotenv').config();

const axios = require('axios');

const {
  RIOT_GAMES_API_AMERICAS_ACCOUNTS_BY_RIOT_ID,
  RIOT_GAMES_API_LA1_SUMMONERS_BY_PUUID,
  RIOT_GAMES_API_LA1_ENTRIES_BY_SUMMONER,
  RIOT_GAMES_API_KEY,
} = process.env;

const getPuuidBySummonerName = async (summonerName) => {
  try {
    if (summonerName && typeof summonerName === 'string' && summonerName.includes('#')) {
      const tagLine = summonerName.split('#')[1];
      const gameName = summonerName.split('#')[0];

      const { data, status } = await axios.get(`${RIOT_GAMES_API_AMERICAS_ACCOUNTS_BY_RIOT_ID}/${gameName}/${tagLine}?api_key=${RIOT_GAMES_API_KEY}`);

      if (status === 200) {
        return data.puuid;
      } else {
        throw new Error('Cannot get puuid for the given summoner name');
      }
    } else {
      throw new Error('Invalid summoner name');
    }
  } catch (error) {
    console.error(error);
  }

  return null;
};

const getSummonerIdByPuuid = async (puuid) => {
  try {
    if (puuid) {
      const { data, status } = await axios.get(`${RIOT_GAMES_API_LA1_SUMMONERS_BY_PUUID}/${puuid}?api_key=${RIOT_GAMES_API_KEY}`);

      if (status === 200) {
        return data.id;
      } else {
        throw new Error('Cannot get summoner ID for the given puuid');
      }
    } else {
      throw new Error('Invalid puuid');
    }
  } catch (error) {
    console.error(error);
  }

  return null;
};

const getSummonerTierRankBySummonerName = async (summonerName) => {
  try {
    console.log('Getting data from Riot API');

    const puuid = await getPuuidBySummonerName(summonerName);

    if (puuid) {
      const summonerId = await getSummonerIdByPuuid(puuid);

      if (summonerId) {
        const { data, status } = await axios.get(`${RIOT_GAMES_API_LA1_ENTRIES_BY_SUMMONER}/${summonerId}?api_key=${RIOT_GAMES_API_KEY}`);

        if (status === 200) {
          const summonerTierRanks = { soloq: { tier: '', rank: '' }, flexq: { tier: '', rank: '' } };

          if (Array.isArray(data) && data.length > 0) {

            data.forEach(({ queueType, tier, rank }) => {
              if (queueType === 'RANKED_SOLO_5x5') {
                summonerTierRanks.soloq.tier = tier;
                summonerTierRanks.soloq.rank = rank;
              } else if (queueType === 'RANKED_FLEX_SR') {
                summonerTierRanks.flexq.tier = tier;
                summonerTierRanks.flexq.rank = rank;
              }
            });

            console.log(`Summoner name: ${summonerName}`);
            console.log(`SoloQ: ${summonerTierRanks.soloq.tier} ${summonerTierRanks.soloq.rank}`);
            console.log(`FlexQ: ${summonerTierRanks.flexq.tier} ${summonerTierRanks.flexq.rank}`);

            return summonerTierRanks;
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  return null;
}

module.exports = {
  getSummonerTierRankBySummonerName,
};