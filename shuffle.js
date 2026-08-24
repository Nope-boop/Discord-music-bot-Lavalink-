const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the queue"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player || player.queue.tracks.length < 2) {
      return interaction.reply({ content: "❌ Not enough tracks in the queue to shuffle.", ephemeral: true });
    }

    await player.queue.shuffle();
    return interaction.reply("🔀 Queue shuffled.");
  },
};
