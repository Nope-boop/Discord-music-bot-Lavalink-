require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require("discord.js");
const { LavalinkManager } = require("lavalink-client");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // required to read "!command" text in chat
  ],
});

const PREFIX = process.env.PREFIX || "!";

// ---- Load slash commands ----
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// ---- Lavalink manager ----
const [host, port] = process.env.LAVALINK_HOST.split(":");

client.lavalink = new LavalinkManager({
  nodes: [
    {
      id: "main",
      host,
      port: Number(port),
      authorization: process.env.LAVALINK_PASSWORD,
      secure: process.env.LAVALINK_SECURE === "true",
    },
  ],
  // Sends voice packets through the discord.js shard connection
  sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
  client: {
    id: process.env.CLIENT_ID,
    username: "MusicBot",
  },
  autoSkip: true,
  playerOptions: {
    defaultSearchPlatform: "ytsearch", // used only for plain-text search, not for URLs
    onDisconnect: { autoReconnect: true, destroyPlayer: false },
    onEmptyQueue: { destroyAfterMs: 30_000 }, // leave VC after 30s of inactivity
  },
});

// Lavalink needs raw voice state/server update payloads
client.on("raw", (d) => client.lavalink.sendRawData(d));

// ---- Lavalink player events ----
client.lavalink.on("trackStart", (player, track) => {
  const channel = client.channels.cache.get(player.textChannelId);
  if (!channel) return;
  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setDescription(`🎶 Now playing **[${track.info.title}](${track.info.uri})** by \`${track.info.author}\``)
    .setThumbnail(track.info.artworkUrl || null);
  channel.send({ embeds: [embed] }).catch(() => {});
});

client.lavalink.on("queueEnd", (player) => {
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel) channel.send("✅ Queue finished. Leaving in 30s if nothing new plays.").catch(() => {});
});

client.lavalink.on("playerError", (player, payload) => {
  console.error("Player error:", payload);
  const channel = client.channels.cache.get(player.textChannelId);
  if (channel) channel.send("⚠️ Playback error, skipping track.").catch(() => {});
});

client.lavalink.nodeManager.on("connect", (node) => {
  console.log(`Lavalink node "${node.id}" connected.`);
});
client.lavalink.nodeManager.on("error", (node, error) => {
  console.error(`Lavalink node "${node.id}" error:`, error);
});

// ---- Discord client events ----
client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await client.lavalink.init({ id: client.user.id, username: client.user.username });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    const payload = { content: "❌ Something went wrong running that command.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

// ---- "!command" chat-based commands ----
// Every command file's execute(interaction, client) only ever touches
// interaction.guild/member/user/channel, interaction.options.getString/getInteger,
// and interaction.reply/deferReply/editReply/followUp. This adapter fakes just
// those, so the same command files work for both slash commands and plain
// chat messages without being duplicated or rewritten.
function buildMessageAdapter(message, args, commandName) {
  let sentMessage = null;

  function normalize(payload) {
    if (typeof payload === "string") return { content: payload };
    const { ephemeral, ...rest } = payload; // ephemeral has no chat equivalent
    return rest;
  }

  const optionValues = {};
  if (commandName === "play") {
    optionValues.query = args.join(" ").trim() || null;
  } else if (commandName === "volume") {
    const n = parseInt(args[0], 10);
    optionValues.level = Number.isInteger(n) ? n : null;
  }

  return {
    guild: message.guild,
    member: message.member,
    user: message.author,
    channel: message.channel,
    options: {
      getString: (name) => (name in optionValues ? optionValues[name] : null),
      getInteger: (name) => (name in optionValues ? optionValues[name] : null),
    },
    async reply(payload) {
      sentMessage = await message.channel.send(normalize(payload));
      return sentMessage;
    },
    async deferReply() {
      sentMessage = await message.channel.send("⏳ Working on it...");
      return sentMessage;
    },
    async editReply(payload) {
      if (sentMessage) return sentMessage.edit(normalize(payload));
      sentMessage = await message.channel.send(normalize(payload));
      return sentMessage;
    },
    async followUp(payload) {
      return message.channel.send(normalize(payload));
    },
  };
}

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const withoutPrefix = message.content.slice(PREFIX.length).trim();
  if (!withoutPrefix) return;

  const [rawName, ...args] = withoutPrefix.split(/\s+/);
  const commandName = rawName.toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  // Slash commands get this validation for free from Discord; chat commands
  // need it done manually before execute() runs.
  if (commandName === "play" && args.length === 0) {
    return message.channel.send(`❌ Usage: \`${PREFIX}play <song name or YouTube/Spotify URL>\``);
  }
  if (commandName === "volume") {
    const n = parseInt(args[0], 10);
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      return message.channel.send(`❌ Usage: \`${PREFIX}volume <0-100>\``);
    }
  }

  const adapter = buildMessageAdapter(message, args, commandName);

  try {
    await command.execute(adapter, client);
  } catch (err) {
    console.error(err);
    message.channel.send("❌ Something went wrong running that command.").catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
