require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

// Tiny web server so free hosts like Render see this as a "web service"
// and have something to health-check / ping to keep it awake.
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running.');
}).listen(PORT, () => console.log(`Keep-alive server listening on port ${PORT}`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
});

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

// Resume any giveaways that were still running before a restart
const { resumeGiveaways } = require('./src/handlers/giveawayManager');
client.once('ready', () => resumeGiveaways(client));

client.login(process.env.DISCORD_TOKEN);
