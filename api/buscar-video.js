export default async function handler(req, res) {
  const query = req.query.q;

  if (!query) return res.status(400).json({ error: 'Consulta vazia' });

  const API_KEY = 'AIzaSyDsdUMRJMx6NIaylLQPMZKkye3-m8DQwH8'; // sua nova chave
  const searchTerm = `${query} karaoke`;

  const searchURL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=5&q=${encodeURIComponent(searchTerm)}&key=${API_KEY}`;

  try {
    const response = await fetch(searchURL);
    const data = await response.json();

    const videos = data.items.filter(item => item.id.videoId);

    if (!videos.length) return res.status(404).json({ error: 'Nenhum vídeo válido encontrado' });

    const ids = videos.map(v => v.id.videoId).join(',');

    const statsURL = `https://www.googleapis.com/youtube/v3/videos?part=statistics,status&id=${ids}&key=${API_KEY}`;
    const statsRes = await fetch(statsURL);
    const statsData = await statsRes.json();

    const videoStats = statsData.items
      .filter(v => v.status.embeddable && v.status.privacyStatus === "public")
      .map(v => ({
        videoId: v.id,
        likes: parseInt(v.statistics.likeCount || "0"),
      }));

    const bestVideo = videoStats.sort((a, b) => b.likes - a.likes)[0];
    const info = videos.find(v => v.id.videoId === bestVideo.videoId);

    res.json({
      youtubeId: bestVideo.videoId,
      titulo: info.snippet.title
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
}
