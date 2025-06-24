import { db } from './firebase-init.js';
 nkvhl0-codex/criar-sistema-de-karaokê-online
import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let player;
let apiReady = false;
let current;

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

import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

let player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    events: {
      onReady: (e) => e.target.playVideo(),
      onStateChange: onPlayerStateChange,
      onError: skipSong
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
 master

const filaDoc = doc(db, 'sistema', 'filaOrdenada');
const atualDoc = doc(db, 'sistema', 'musicaAtual');

 nkvhl0-codex/criar-sistema-de-karaokê-online
async function ensureAtual() {
  const snap = await getDoc(atualDoc);
  if (!snap.exists() || !snap.data().youtubeId) {

async function loadFirst() {
  const snap = await getDoc(atualDoc);
  if (snap.exists() && snap.data().youtubeId) {
    loadVideo(snap.data());
  } else {
 master
    const filaSnap = await getDoc(filaDoc);
    const arr = filaSnap.data()?.musicas || [];
    if (arr.length) {
      await setDoc(atualDoc, arr[0]);
 nkvhl0-codex/criar-sistema-de-karaokê-online
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

      loadVideo(arr[0]);
    }
  }
}

function loadVideo(song) {
  if (player && song.youtubeId) {
    player.loadVideoById(song.youtubeId);
    document.getElementById('atual').textContent = song.nome + ' (Mesa ' + song.mesa + ')';
  }
}

async function skipSong() {
  const filaSnap = await getDoc(filaDoc);
  let arr = filaSnap.data()?.musicas || [];
  if (arr.length) arr = arr.slice(1);
  await updateDoc(filaDoc, { musicas: arr });
 master
  const next = arr[0];
  if (next) {
    await setDoc(atualDoc, next);
  } else {
    await setDoc(atualDoc, {});
 nkvhl0-codex/criar-sistema-de-karaokê-online
    if (player) player.stopVideo();
    document.getElementById('atual').textContent = '';

    master
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
 nkvhl0-codex/criar-sistema-de-karaokê-online
    createPlayer(song);
  }
});

ensureAtual();

    loadVideo(song);
  }
});

loadFirst();
 master
