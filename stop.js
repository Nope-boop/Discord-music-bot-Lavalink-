const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Disconnect the bot from voice"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: "❌ I'm not connected to a voice channel.", ephemeral: true });
    }

    await player.destroy();
    return interaction.reply("👋 Disconnected.");
  },
};
