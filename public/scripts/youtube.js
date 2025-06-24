const API_KEY = 'AIzaSyDsdUMRJMx6NIaylLQPMZKkye3-m8DQwH8';

export async function searchVideo(query) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoSyndicated=true&maxResults=1&order=viewCount&eventType=completed&q=${encodeURIComponent(query)}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const item = data.items && data.items[0];
  if (!item) throw new Error('Nenhum vídeo encontrado');
  if (item.snippet.liveBroadcastContent !== 'none') throw new Error('Vídeo ao vivo não permitido');

  const vid = item.id.videoId;
  const checkUrl = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${vid}&key=${API_KEY}`;
  const cRes = await fetch(checkUrl);
  const cData = await cRes.json();
  const details = cData.items && cData.items[0];
  if (!details || details.status.privacyStatus !== 'public' || !details.status.embeddable) {
    throw new Error('Vídeo não incorporável');
  }

  return {
    youtubeId: vid,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumb: item.snippet.thumbnails.default.url
  };
}
