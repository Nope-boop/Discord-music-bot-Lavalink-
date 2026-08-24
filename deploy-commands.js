require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from a YouTube URL, Spotify URL, or search term")
    .addStringOption((opt) =>
      opt
        .setName("query")
        .setDescription("YouTube/Spotify URL or search term")
        .setRequired(true)
    ),
  new SlashCommandBuilder().setName("skip").setDescription("Skip the current song"),
  new SlashCommandBuilder().setName("pause").setDescription("Pause the current song"),
  new SlashCommandBuilder().setName("resume").setDescription("Resume playback"),
  new SlashCommandBuilder().setName("queue").setDescription("Show the current queue"),
  new SlashCommandBuilder().setName("nowplaying").setDescription("Show the currently playing song"),
  new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set playback volume")
    .addIntegerOption((opt) =>
      opt.setName("level").setDescription("0-100").setRequired(true).setMinValue(0).setMaxValue(100)
    ),
  new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the queue"),
  new SlashCommandBuilder().setName("loop").setDescription("Toggle looping the current track"),
  new SlashCommandBuilder().setName("stop").setDescription("Disconnect the bot from voice"),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    const route = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    console.log(`Deploying ${commands.length} slash commands...`);
    await rest.put(route, { body: commands });
    console.log("Slash commands deployed successfully.");
  } catch (err) {
    console.error(err);
  }
})();
