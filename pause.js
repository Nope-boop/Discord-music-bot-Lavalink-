const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause the current song"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player || !player.playing) {
      return interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
    }
    if (player.paused) {
      return interaction.reply({ content: "⏸️ Already paused.", ephemeral: true });
    }

    await player.pause();
    return interaction.reply("⏸️ Paused.");
  },
};
