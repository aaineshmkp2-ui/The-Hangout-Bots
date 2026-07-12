require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

// Web dashboard + keep-alive server. Needs the client so it can read
// live channel/role lists and post messages (e.g. the ticket panel).
const createApp = require('./src/web/app');
const PORT = process.env.PORT || 3000;
createApp(client).listen(PORT, () => console.log(`Dashboard listening on port ${PORT}`));

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'src', 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) client.commands.set(command.data.name, command);
}

// Load events
const eventsPath = path.join(__dirname, 'src', 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

// Resume any giveaways or reminders that were still pending before a restart
const { resumeGiveaways } = require('./src/handlers/giveawayManager');
const { resumeReminders } = require('./src/handlers/reminderManager');
client.once('ready', () => {
  resumeGiveaways(client);
  resumeReminders(client);
});

client.login(process.env.DISCORD_TOKEN);
