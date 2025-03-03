# lol-elo-bot

Discord bot to assign a role in the server based on your League of Legends tier and rank.

## Features

- Fetches summoner tier and rank from the Riot Games API.
- Assigns Discord roles based on the summoner's tier and rank.
- Cleans up existing roles before assigning new ones.

## Environment Variables

The following environment variables need to be set in a `.env` file:

- `RIOT_GAMES_API_AMERICAS_ACCOUNTS_BY_RIOT_ID`: URL to fetch PUUID by summoner name.
- `RIOT_GAMES_API_LA1_SUMMONERS_BY_PUUID`: URL to fetch summoner ID by PUUID.
- `RIOT_GAMES_API_LA1_ENTRIES_BY_SUMMONER`: URL to fetch summoner tier and rank by summoner ID.
- `RIOT_GAMES_API_KEY`: Your Riot Games API key.
- `DISCORD_BOT_TOKEN`: Your Discord bot token.

## Usage

Start the bot:
```sh
npm start