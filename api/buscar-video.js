export default async function handler(req, res) {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Consulta vazia' });
  }

  const API_KEY = 'AIzaSyDsdUMRJMx6NIaylLQPMZKkye3-m8DQwH8'; // chave do YouTube
  const searchTerm = `${query} karaoke`;

  // Busca inicial no YouTube priorizando vídeos mais assistidos
  const searchURL =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
    `&videoEmbeddable=true&maxResults=10&order=viewCount&q=${encodeURIComponent(searchTerm)}` +
    `&key=${API_KEY}`;

  try {
    const searchRes = await fetch(searchURL);
    const searchData = await searchRes.json();

    // Filtra apenas IDs de vídeos não listados como lives
    const ids = searchData.items
      .filter(item => item.id.videoId && item.snippet.liveBroadcastContent === 'none')
      .map(item => item.id.videoId)
      .join(',');

    if (!ids) {
      return res.status(404).json({ error: 'Nenhum vídeo válido encontrado' });
    }

    // Recupera detalhes para checar privacidade e incorporabilidade
    const detailsURL = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${ids}&key=${API_KEY}`;
    const detailsRes = await fetch(detailsURL);
    const detailsData = await detailsRes.json();

    const candidatos = detailsData.items.filter(
      v => v.status.embeddable && v.status.privacyStatus === 'public'
    );

    if (!candidatos.length) {
      return res.status(404).json({ error: 'Nenhum vídeo válido encontrado' });
    }

    // Ordena por número de visualizações (maior para menor)
    const melhor = candidatos.sort(
      (a, b) => parseInt(b.statistics.viewCount || '0') - parseInt(a.statistics.viewCount || '0')
    )[0];

    res.json({
      videoId: melhor.id,
      titulo: melhor.snippet.title,
      canal: melhor.snippet.channelTitle,
      thumbnail: melhor.snippet.thumbnails.high?.url || melhor.snippet.thumbnails.default.url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
}
