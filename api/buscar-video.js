export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('musica');

    if (!query) {
      return new Response(JSON.stringify({ error: 'Consulta vazia' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_KEY = 'AIzaSyDsdUMRJMx6NIaylLQPMZKkye3-m8DQwH8';
    const buscaUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=6&q=${encodeURIComponent(query + ' karaoke')}&key=${API_KEY}`;

    const buscaResp = await fetch(buscaUrl);
    const buscaJson = await buscaResp.json();

    const videoIds = buscaJson.items.map(item => item.id.videoId).filter(Boolean);
    if (!videoIds.length) {
      return new Response(JSON.stringify({ error: 'Nenhum vídeo encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const detalhesUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${videoIds.join(',')}&key=${API_KEY}`;
    const detalhesResp = await fetch(detalhesUrl);
    const detalhesJson = await detalhesResp.json();

    const candidatos = detalhesJson.items
      .filter(item =>
        item.status.embeddable &&
        item.status.privacyStatus === 'public' &&
        !item.snippet.liveBroadcastContent
      )
      .map(item => ({
        youtubeId: item.id,
        titulo: item.snippet.title,
        viewCount: parseInt(item.statistics.viewCount || 0),
        likeCount: parseInt(item.statistics.likeCount || 0)
      }));

    if (!candidatos.length) {
      return new Response(JSON.stringify({ error: 'Nenhum vídeo válido' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const melhor = candidatos.sort((a, b) =>
      (b.viewCount + b.likeCount) - (a.viewCount + a.likeCount)
    )[0];

    return new Response(JSON.stringify(melhor), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Erro na busca:', err);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
