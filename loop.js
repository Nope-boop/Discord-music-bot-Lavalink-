const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("loop").setDescription("Toggle looping the current track"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player || !player.queue.current) {
      return interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
    }

    const newMode = player.repeatMode === "track" ? "off" : "track";
    await player.setRepeatMode(newMode);
    return interaction.reply(newMode === "track" ? "🔁 Looping current track." : "➡️ Loop disabled.");
  },
};
