# All-in-One Discord Bot

Free, self-hosted Discord bot with an in-Discord admin panel. No web dashboard, no paid hosting required — everything is controlled with `/panel` inside Discord.

## Features

- **Welcome & Leave messages** — configurable channel + message with `{user}`, `{username}`, `{server}`, `{membercount}` placeholders
- **Ticket system** — button-based ticket creation, private channels, close confirmation, ticket logs
- **Giveaways** — `/giveaway start|end|reroll`, button entry, auto-picks winners, survives bot restarts
- **Self-role panels** — button-based "click to get a role" panels, add as many as you want
- **Auto-role** — automatically give new members a role on join
- **Moderation** — `/kick` `/ban` `/timeout` `/warn` `/warnings` `/clear`, with optional mod-log channel
- **Admin panel** — `/panel` gives staff buttons/dropdowns to configure everything, no editing code or config files

## Requirements

- Node.js 18 or newer
- A Discord bot application (free) — created at https://discord.com/developers/applications

## 1. Create your bot

1. Go to https://discord.com/developers/applications → **New Application**
2. Go to **Bot** → **Reset Token** → copy the token (this is your `DISCORD_TOKEN`)
3. Under **Bot**, enable these **Privileged Gateway Intents**:
   - Server Members Intent
   - Message Content Intent
4. Go to **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Administrator` (simplest) or at minimum: Manage Roles, Manage Channels, Kick Members, Ban Members, Moderate Members, Manage Messages, Send Messages, Embed Links, Read Message History
   - Open the generated URL and invite the bot to your server
5. Copy your **Application ID** (this is your `CLIENT_ID`) from the **General Information** tab

## 2. Install & configure

```bash
npm install
cp .env.example .env
```

Edit `.env`:
```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_test_server_id   # optional, for instant command updates while testing
```

## 3. Deploy slash commands & start

```bash
npm run deploy   # registers /panel, /giveaway, /kick, etc.
npm start
```

You only need to run `npm run deploy` again if you add/change commands. Global commands can take up to an hour to appear everywhere; setting `GUILD_ID` makes them show up instantly in one server for testing.

## 4. Using the bot

In your server, run `/panel` (needs **Manage Server** permission). It opens buttons for:

- **Welcome** — pick a channel, then type your welcome message
- **Leave** — same, for leave messages
- **Tickets** — pick the category tickets get created under, then pick where to post the "Create Ticket" button
- **Auto-Role** — pick a role to auto-assign to new members
- **Self-Role Panel** — instructions point you to `/rolepanel-add role: label: channel: emoji:` — run it once per role
- **Logs** — pick a channel for moderation & ticket logs

Everything is stored in a local SQLite file (`bot.sqlite`), created automatically on first run — no external database needed.

## Deploying for free 24/7

This works well on Render's free web-service tier or a free VPS/always-on Repl — same workflow you've used before (`npm install && npm start`). Since this bot doesn't listen on an HTTP port, if your host requires one (like Render's free tier health checks), add a tiny Express route or use a "background worker" service type instead of "web service."

## Notes

- `/clear` can only delete messages younger than 14 days (a Discord API limit).
- Timeouts max out at 28 days (a Discord limit).
- Deleting the `bot.sqlite` file wipes all saved config, tickets, giveaways, and warnings — back it up if you care about the data.
