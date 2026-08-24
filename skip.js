const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current song"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player || !player.playing) {
      return interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
    }

    const current = player.queue.current;
    await player.skip();
    return interaction.reply(`⏭️ Skipped **${current?.info?.title ?? "the current track"}**.`);
  },
};
