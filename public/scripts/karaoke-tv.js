import { db } from './firebase-init.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayRemove, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let player;
let apiReady = false;
let current;
const proximaEl = document.getElementById('proxima');

window.onYouTubeIframeAPIReady = () => {
  apiReady = true;
  if (current) createPlayer(current);
};

function createPlayer(song) {
  current = song;
  if (!apiReady) return;
  if (!player) {
    player = new YT.Player('player', {
      height: '390',
      width: '640',
      videoId: song.youtubeId,
      playerVars: { autoplay: 1 },
      events: {
        onStateChange: onPlayerStateChange,
        onError: skipSong
      }
    });
  } else {
    player.loadVideoById(song.youtubeId);
    player.playVideo();
  }
  document.getElementById('atual').textContent = `${song.nome} (Mesa ${song.mesa})`;
}

const filaDoc = doc(db, 'sistema', 'filaOrdenada');
const atualDoc = doc(db, 'sistema', 'musicaAtual');
const historicoDoc = doc(db, 'sistema', 'historico');

function mostrarProxima(arr) {
  const next = arr[0];
  if (next) {
    proximaEl.innerHTML = `<img src="${next.thumb}" alt=""> <div>${next.nome} (Mesa ${next.mesa})</div>`;
    proximaEl.classList.remove('hidden');
  } else {
    proximaEl.classList.add('hidden');
  }
}

async function ensureAtual() {
  const snap = await getDoc(atualDoc);
  if (!snap.exists() || !snap.data().youtubeId) {
    const filaSnap = await getDoc(filaDoc);
    const arr = filaSnap.data()?.musicas || [];
    if (arr.length) {
      await setDoc(atualDoc, arr[0]);
      mostrarProxima(arr.slice(1));
    }
  }
}

async function skipSong() {
  if (!current) return;
  const filaSnap = await getDoc(filaDoc);
  let arr = filaSnap.data()?.musicas || [];
  arr = arr.filter(s => s.id !== current.id);
  await updateDoc(filaDoc, { musicas: arr });
  const mesaDoc = doc(db, 'mesas', current.mesa);
  await updateDoc(mesaDoc, { musicas: arrayRemove(current) });
  await updateDoc(historicoDoc, { musicas: arrayUnion(current) }, { merge: true });
  const histSnap = await getDoc(historicoDoc);
  const histArr = histSnap.data()?.musicas || [];
  if (histArr.length > 10) {
    histArr.splice(0, histArr.length - 10);
    await setDoc(historicoDoc, { musicas: histArr });
  }
  const next = arr[0];
  if (next) {
    await setDoc(atualDoc, next);
    mostrarProxima(arr.slice(1));
  } else {
    await setDoc(atualDoc, {});
    if (player) player.stopVideo();
    document.getElementById('atual').textContent = '';
    proximaEl.classList.add('hidden');
  }
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    skipSong();
  }
}

onSnapshot(atualDoc, (snap) => {
  const song = snap.data();
  if (song && song.youtubeId) {
    createPlayer(song);
  }
});

onSnapshot(filaDoc, (snap) => {
  const arr = snap.data()?.musicas || [];
  mostrarProxima(arr.slice(1));
});

ensureAtual();
