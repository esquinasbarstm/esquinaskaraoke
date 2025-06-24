import { db } from './firebase-init.js';
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const filaDoc = doc(db, 'sistema', 'filaOrdenada');
const atualDoc = doc(db, 'sistema', 'musicaAtual');
const atualEl = document.getElementById('atual');
const proximaEl = document.getElementById('proxima');

let player;
let filaAtual = [];
let tocandoAgora = null;

function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',
    events: {
      onReady: () => tocarProxima(),
      onStateChange: onPlayerStateChange
    },
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

function tocarProxima() {
  if (!filaAtual.length) {
    player.stopVideo();
    atualEl.textContent = 'Nenhuma música na fila';
    proximaEl.innerHTML = '';
    return;
  }

  const [atual, proxima] = filaAtual;

  tocandoAgora = atual;
  player.loadVideoById(atual.youtubeId);

  atualEl.textContent = `🎤 Tocando: ${atual.nome} (Mesa ${atual.mesa})`;
  setDoc(atualDoc, atual);

  if (proxima) {
    proximaEl.innerHTML = `
      <p>🎶 Próxima: ${proxima.nome} (Mesa ${proxima.mesa})</p>
      <img src="${proxima.thumb}" alt="thumbnail" width="200">
    `;
    proximaEl.classList.remove('hidden');
  } else {
    proximaEl.innerHTML = '';
    proximaEl.classList.add('hidden');
  }
}

async function avancarFila() {
  filaAtual.shift(); // Remove a atual
  await updateDoc(filaDoc, { musicas: filaAtual });
  tocarProxima();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    avancarFila();
  }
}

// Monitoramento em tempo real da fila
onSnapshot(filaDoc, (snap) => {
  const data = snap.data();
  filaAtual = data?.musicas || [];
  if (!tocandoAgora || filaAtual.length && filaAtual[0].id !== tocandoAgora.id) {
    tocarProxima();
  }
});
