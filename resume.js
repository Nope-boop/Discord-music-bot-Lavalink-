const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume playback"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: "❌ Nothing to resume.", ephemeral: true });
    }
    if (!player.paused) {
      return interaction.reply({ content: "▶️ Already playing.", ephemeral: true });
    }

    await player.resume();
    return interaction.reply("▶️ Resumed.");
  },
};
