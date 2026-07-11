# All-in-One Discord Bot

Free, self-hosted Discord bot with **both** an in-Discord admin panel (`/panel`) **and** a full web dashboard. No paid hosting required.

## Features

- **Welcome & Leave messages** — configurable channel + message with `{user}`, `{username}`, `{server}`, `{membercount}` placeholders
- **Ticket system** — button-based ticket creation, private channels, close confirmation, ticket logs
- **Giveaways** — `/giveaway start|end|reroll`, button entry, auto-picks winners, survives bot restarts
- **Self-role panels** — button-based "click to get a role" panels, add as many as you want
- **Auto-role** — automatically give new members a role on join
- **Moderation** — `/kick` `/ban` `/timeout` `/warn` `/warnings` `/clear`, with optional mod-log channel
- **In-Discord admin panel** — `/panel` gives staff buttons/dropdowns to configure everything
- **Web dashboard** — sign in with Discord, pick a server, configure every module from a browser with live channel/role dropdowns, view warnings and giveaway history

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
6. Go to **OAuth2** tab → copy your **Client Secret** (this is your `DISCORD_CLIENT_SECRET`) — needed for the web dashboard login
7. Still on **OAuth2**, under **Redirects**, click **Add Redirect** and enter your dashboard's callback URL, e.g.:
   `https://your-app.onrender.com/auth/callback` (or `http://localhost:3000/auth/callback` for local testing) — this **must** exactly match `DASHBOARD_URL` in your `.env` plus `/auth/callback`

## 2. Install & configure

```bash
npm install
cp .env.example .env
```

Edit `.env`:
```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
DISCORD_CLIENT_SECRET=your_client_secret
SESSION_SECRET=any_long_random_string
DASHBOARD_URL=https://your-app.onrender.com
GUILD_ID=your_test_server_id   # optional, for instant command updates while testing
```

## 3. Deploy slash commands & start

```bash
npm run deploy   # registers /panel, /giveaway, /kick, etc.
npm start
```

You only need to run `npm run deploy` again if you add/change commands. Global commands can take up to an hour to appear everywhere; setting `GUILD_ID` makes them show up instantly in one server for testing.

## 4. Using the bot

**In Discord:** run `/panel` (needs **Manage Server** permission) for quick buttons/dropdowns to configure welcome, leave, tickets, auto-role, and logs.

**On the web:** open your `DASHBOARD_URL` in a browser, click **Continue with Discord**, pick a server you manage, and configure every module from there — channel and role pickers are populated live from your server, and there's a searchable warnings log and a giveaway history table.

Everything is stored in a local SQLite file (`bot.sqlite`), created automatically on first run — no external database needed.

## Deploying for free 24/7

This works well on Render's free web-service tier — the bot already opens an HTTP server (the dashboard itself), so Render's health checks are satisfied automatically. Free services sleep after ~15 minutes without incoming traffic; use a free pinger like UptimeRobot pointed at `DASHBOARD_URL/health` every 5 minutes to keep it awake.

## Notes

- `/clear` can only delete messages younger than 14 days (a Discord API limit).
- Timeouts max out at 28 days (a Discord limit).
- Deleting the `bot.sqlite` file wipes all saved config, tickets, giveaways, and warnings — back it up if you care about the data.
- Dashboard sessions use in-memory storage, so logins reset if the app restarts (fine for a small server's admin team).
- If `npm install` fails on `better-sqlite3` locally (common on Windows without Python/build tools installed), run `npm install --ignore-scripts` instead — you only need the compiled native module on your actual hosting server, not on your local machine for tasks like `npm run deploy`.
