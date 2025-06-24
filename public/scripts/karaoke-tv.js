import { db } from './firebase-init.js';
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let player;
let musicaAtual = null;
let fila = [];

// Inicia o player após API do YouTube carregar
window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',
    events: {
      onReady: () => console.log('Player pronto'),
      onStateChange: onPlayerStateChange
    }
  });
};

// Quando música termina, toca a próxima
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    encerrarAtual();
    tocarProxima();
  }
}

// Encerra música atual: remove da fila e salva no histórico
async function encerrarAtual() {
  if (!musicaAtual) return;

  const historicoRef = doc(db, 'sistema', 'historico');
  await updateDoc(historicoRef, {
    musicas: arrayUnion(musicaAtual)
  });

  // Remove da mesa
  const mesaRef = doc(db, 'mesas', musicaAtual.mesa);
  const mesaSnap = await getDoc(mesaRef);
  const lista = mesaSnap.data()?.musicas || [];
  const novaLista = lista.filter(m => m.id !== musicaAtual.id);
  await updateDoc(mesaRef, { musicas: novaLista });

  // Remove da fila
  const filaRef = doc(db, 'sistema', 'filaOrdenada');
  fila = fila.filter(m => m.id !== musicaAtual.id);
  await setDoc(filaRef, { musicas: fila });

  musicaAtual = null;
  document.getElementById('atual').textContent = '';
}

// Carrega vídeo no player e atualiza visual
function tocarProxima() {
  if (!fila.length) {
    document.getElementById('atual').textContent = 'Fila vazia';
    return;
  }

  const prox = fila[0];
  musicaAtual = prox;

  try {
    player.loadVideoById(prox.youtubeId);
    document.getElementById('atual').textContent = `Tocando: ${prox.nome} (Mesa ${prox.mesa})`;
  } catch (err) {
    console.error('Erro ao carregar vídeo:', err);
    encerrarAtual();
    tocarProxima(); // tenta o próximo
  }
}

// Atualiza a fila em tempo real
const filaRef = doc(db, 'sistema', 'filaOrdenada');
onSnapshot(filaRef, (snap) => {
  const novaFila = snap.data()?.musicas || [];

  // Se mudou a primeira música da fila e player não está tocando, atualiza
  if (!musicaAtual || (novaFila[0]?.id !== musicaAtual.id)) {
    fila = novaFila;
    tocarProxima();
  } else {
    fila = novaFila; // apenas atualiza
  }
});
