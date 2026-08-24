const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("queue").setDescription("Show the current queue"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player || (!player.queue.current && player.queue.tracks.length === 0)) {
      return interaction.reply({ content: "❌ The queue is empty.", ephemeral: true });
    }

    const upcoming = player.queue.tracks
      .slice(0, 10)
      .map((t, i) => `${i + 1}. **${t.info.title}** — \`${t.info.author}\``)
      .join("\n") || "*Nothing queued up.*";

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle("🎵 Queue")
      .addFields(
        {
          name: "Now Playing",
          value: player.queue.current
            ? `**${player.queue.current.info.title}** — \`${player.queue.current.info.author}\``
            : "Nothing",
        },
        { name: `Up Next${player.queue.tracks.length > 10 ? ` (+${player.queue.tracks.length - 10} more)` : ""}`, value: upcoming }
      );

    return interaction.reply({ embeds: [embed] });
  },
};
