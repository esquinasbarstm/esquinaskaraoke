import { db } from './firebase-init.js';
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

const filaDoc = doc(db, 'sistema', 'filaOrdenada');
const atualDoc = doc(db, 'sistema', 'musicaAtual');

async function loadFirst() {
  const snap = await getDoc(atualDoc);
  if (snap.exists() && snap.data().youtubeId) {
    loadVideo(snap.data());
  } else {
    const filaSnap = await getDoc(filaDoc);
    const arr = filaSnap.data()?.musicas || [];
    if (arr.length) {
      await setDoc(atualDoc, arr[0]);
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
  const next = arr[0];
  if (next) {
    await setDoc(atualDoc, next);
  } else {
    await setDoc(atualDoc, {});
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
    loadVideo(song);
  }
});

loadFirst();
