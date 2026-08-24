const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set playback volume")
    .addIntegerOption((opt) =>
      opt.setName("level").setDescription("0-100").setRequired(true).setMinValue(0).setMaxValue(100)
    ),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player) {
      return interaction.reply({ content: "❌ I'm not connected to a voice channel.", ephemeral: true });
    }

    const level = interaction.options.getInteger("level", true);
    await player.setVolume(level);
    return interaction.reply(`🔊 Volume set to **${level}%**.`);
  },
};
