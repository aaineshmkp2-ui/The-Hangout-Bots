# All-in-One Discord Bot

Free, self-hosted Discord bot with **both** an in-Discord admin panel (`/panel`) **and** a full web dashboard. No paid hosting required.

## Features

- **Welcome & Leave messages** — configurable channel + message with placeholders
- **Ticket system** — button-based ticket creation, private channels, close confirmation, ticket logs
- **Giveaways** — `/giveaway start|end|reroll`, button entry, auto-picks winners, survives bot restarts
- **Self-role panels** — button-based "click to get a role" panels
- **Reaction roles** — react to any existing message to get a role
- **Auto-role** — automatically give new members a role on join
- **Auto-Moderation** — deletes messages with mass mentions, invite links, or excessive caps (toggle in dashboard)
- **Warning auto-punish** — set a warning threshold that auto-times-out/kicks/bans, configurable in the dashboard
- **Web Embed Generator** — build and send a fully custom embed (title, description, color, image, thumbnail, footer) straight from the dashboard, no slash command needed
- **Ticket panel customization** — custom title, description, color, and banner image for your ticket panel, editable in the dashboard
- **Auto-purge** — `/autopurge add|list|remove` clears a channel on a recurring schedule
- **Custom commands** — `/customcommand add|list|remove`, type the trigger in chat and the bot replies (different from `/tag`, which needs the slash command)
- **Voice-Text Linking** — `/voicelink add|list|remove` auto-opens a text channel for anyone who joins a linked voice channel, and revokes it when they leave
- **Utility & info** — `/userinfo`, `/serverinfo`, `/avatar`, `/roleinfo`, `/ping`
- **Fun & community** — `/poll`, `/roll`, `/coinflip`, `/suggest`, `/report`
- **Custom embeds** — `/embed-send` posts a fully custom message with your own title, color, image, and thumbnail
- **Custom tags** — `/tag create|edit|delete|list|send` for reusable text snippets
- **Auto-messages** — `/automessage add|list|remove` posts something on a recurring schedule
- **Welcome/Leave images** — add a custom banner image and embed color, configurable in the dashboard
- **Leveling** — XP from chatting, level-up announcements, `/rank`, `/leaderboard`, web leaderboard page
- **Invite tracker** — see who invited who, `/invites`, web leaderboard page
- **Word blacklist** — auto-delete messages containing blocked words, managed via `/blacklist` or the dashboard
- **Jail system** — `/jail-setup`, `/jail`, `/unjail` to restrict a member to one channel
- **Starboard** — messages with enough ⭐ reactions get reposted to a highlights channel
- **Anti-Nuke** — auto-quarantines (strips roles from) anyone who deletes 3+ channels/roles or bans 3+ members within 10 seconds; logs it, never auto-bans
- **AFK status** — `/afk`, auto-clears when you post again, notifies anyone who @mentions you
- **Reminders** — `/remind`, survives bot restarts
- **Slowmode** — `/slowmode` on any channel
- **Moderation** — `/kick` `/ban` `/timeout` `/warn` `/warnings` `/clear` `/lock` `/unlock` `/snipe`, with optional mod-log channel
- **In-Discord admin panel** — `/panel` gives staff buttons/dropdowns to configure everything
- **Web dashboard** — sign in with Discord, pick a server, configure every module from a browser with live channel/role dropdowns

Not included yet: music/voice playback and text minigames (Wordle, 2048, etc.) — separate audio/game subsystem. Social media notifications (Reddit/Twitch/YouTube/TikTok) need API keys from those platforms that only you can obtain — ask if you want these wired in once you have credentials.

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
   `https://your-app.onrender.com/auth/callback` — this **must** exactly match `DASHBOARD_URL` in your `.env` plus `/auth/callback`, and the field must not be left empty

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

**In Discord:** run `/panel` (needs **Manage Server** permission), or `/help` to see every command.

**On the web:** open your `DASHBOARD_URL`, click **Continue with Discord**, pick a server you manage, and configure every module — channel/role pickers are populated live from your server, plus a leaderboard, invite leaderboard, warnings log, giveaway history, and reaction-role list.

Everything is stored in a local SQLite file (`bot.sqlite`), created automatically on first run.

## Setting up Jail

Jail needs one manual step in Discord that the bot can't do for you: after running `/jail-setup` (or setting it in the dashboard), go to each of your other channels and deny "View Channel" for the jail role, and make sure the jail role *can* view the jail channel. The bot only assigns/removes the role — the permission wiring is a one-time setup.

## Deploying for free 24/7

The bot opens an HTTP server (the dashboard), so Render's free-tier health checks are satisfied automatically. Free services sleep after ~15 minutes without incoming traffic; use a free pinger like UptimeRobot pointed at `DASHBOARD_URL/health` every 5 minutes to keep it awake.

## Notes

- `/clear` and `/snipe` are limited by Discord API rules (14-day deletion limit; snipe only remembers the single most recent deletion per channel, and resets on restart).
- Timeouts max out at 28 days (a Discord limit).
- Deleting `bot.sqlite` wipes all saved config, tickets, giveaways, levels, invites, and warnings.
- Dashboard sessions use in-memory storage, so logins reset if the app restarts.
- If `npm install` fails on `better-sqlite3` locally (common on Windows without Python/build tools), run `npm install --ignore-scripts` instead — you only need the compiled native module on your actual hosting server, not on your local machine for tasks like `npm run deploy`.
