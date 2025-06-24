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
let pronto = false;

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: '',
    events: {
      onReady: () => {
        pronto = true;
        tocarProxima();
      },
      onStateChange: onPlayerStateChange
    }
  });
};

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    encerrarAtual();
    tocarProxima();
  }
}

async function encerrarAtual() {
  if (!musicaAtual) return;

  const historicoRef = doc(db, 'sistema', 'historico');
  await updateDoc(historicoRef, {
    musicas: arrayUnion(musicaAtual)
  });

  const mesaRef = doc(db, 'mesas', musicaAtual.mesa);
  const mesaSnap = await getDoc(mesaRef);
  const lista = mesaSnap.data()?.musicas || [];
  const novaLista = lista.filter(m => m.id !== musicaAtual.id);
  await updateDoc(mesaRef, { musicas: novaLista });

  const filaRef = doc(db, 'sistema', 'filaOrdenada');
  fila = fila.filter(m => m.id !== musicaAtual.id);
  await setDoc(filaRef, { musicas: fila });

  musicaAtual = null;
  document.getElementById('atual').textContent = 'Carregando música...';
}

function tocarProxima() {
  if (!pronto) {
    setTimeout(tocarProxima, 500);
    return;
  }

  if (!fila.length) {
    document.getElementById('atual').textContent = 'Fila vazia';
    return;
  }

  const prox = fila[0];
  if (!prox.youtubeId || typeof prox.youtubeId !== 'string') {
    console.error('youtubeId inválido:', prox);
    encerrarAtual();
    setTimeout(tocarProxima, 500);
    return;
  }

  try {
    player.loadVideoById(prox.youtubeId);
    musicaAtual = prox;
    document.getElementById('atual').textContent = `Tocando: ${prox.nome} (Mesa ${prox.mesa})`;
  } catch (err) {
    console.error('Erro ao carregar vídeo:', err);
    encerrarAtual();
    setTimeout(tocarProxima, 500);
  }
}

const filaRef = doc(db, 'sistema', 'filaOrdenada');
onSnapshot(filaRef, (snap) => {
  const novaFila = snap.data()?.musicas || [];

  if (!musicaAtual || (novaFila[0]?.id !== musicaAtual.id)) {
    fila = novaFila;
    tocarProxima();
  } else {
    fila = novaFila;
  }
});
