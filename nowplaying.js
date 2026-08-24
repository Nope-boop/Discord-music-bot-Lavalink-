const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = String(totalSec % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

module.exports = {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Show the currently playing song"),

  async execute(interaction, client) {
    const player = client.lavalink.getPlayer(interaction.guild.id);
    const track = player?.queue?.current;
    if (!player || !track) {
      return interaction.reply({ content: "❌ Nothing is playing.", ephemeral: true });
    }

    const position = player.position ?? 0;
    const duration = track.info.duration ?? 0;

    const embed = new EmbedBuilder()
      .setColor(0x1db954)
      .setTitle("🎶 Now Playing")
      .setDescription(`**[${track.info.title}](${track.info.uri})**\nby \`${track.info.author}\``)
      .setThumbnail(track.info.artworkUrl || null)
      .addFields({
        name: "Progress",
        value: track.info.isStream ? "🔴 Live" : `${formatMs(position)} / ${formatMs(duration)}`,
      });

    return interaction.reply({ embeds: [embed] });
  },
};
