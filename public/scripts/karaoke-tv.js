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

// Inicialização do YouTube Player
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',
    events: {
      onReady: () => {
        iniciarMonitoramento(); // só inicia Firebase depois do player
      },
      onStateChange: onPlayerStateChange
    },
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0
    }
  });
};

function tocarProxima() {
  if (!filaAtual.length) {
    player.stopVideo();
    atualEl.textContent = 'Nenhuma música na fila';
    proximaEl.innerHTML = '';
    return;
  }

  const [atual, proxima] = filaAtual;

  tocandoAgora = atual;
  if (atual?.youtubeId) {
    player.loadVideoById(atual.youtubeId);
    setDoc(atualDoc, atual);
    atualEl.textContent = `🎤 Tocando: ${atual.nome} (Mesa ${atual.mesa})`;
  } else {
    atualEl.textContent = 'Erro: vídeo inválido';
  }

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
  filaAtual.shift();
  await updateDoc(filaDoc, { musicas: filaAtual });
  tocarProxima();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    avancarFila();
  }
}

function iniciarMonitoramento() {
  onSnapshot(filaDoc, (snap) => {
    const data = snap.data();
    filaAtual = data?.musicas || [];

    if (
      !tocandoAgora ||
      (filaAtual.length && filaAtual[0]?.id !== tocandoAgora?.id)
    ) {
      tocarProxima();
    }
  });
}
