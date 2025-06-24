import { db } from './firebase-init.js';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { searchVideo } from './youtube.js';

let mesa = localStorage.getItem('mesa');
if (!mesa) {
  mesa = prompt('Número da mesa:');
  localStorage.setItem('mesa', mesa);
}

const mesaDoc = doc(db, 'mesas', mesa);
const filaDoc = doc(db, 'sistema', 'filaOrdenada');

const form = document.getElementById('form-busca');
const input = document.getElementById('busca');
const lista = document.getElementById('suas-musicas');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;
  try {
    const video = await searchVideo(query);
 nkvhl0-codex/criar-sistema-de-karaokê-online
    const base = {

    const song = {
 master
      id: Date.now().toString(),
      nome: video.title,
      youtubeId: video.youtubeId,
      mesa,
 nkvhl0-codex/criar-sistema-de-karaokê-online
      horario: Date.now()
    };
    const song = { ...base, channel: video.channel, thumb: video.thumb };

      horario: Date.now(),
      channel: video.channel,
      thumb: video.thumb
    };
 master
    await setDoc(mesaDoc, { musicas: [] }, { merge: true });
    await updateDoc(mesaDoc, { musicas: arrayUnion(song) });
    const filaSnap = await getDoc(filaDoc);
    if (!filaSnap.exists()) {
 nkvhl0-codex/criar-sistema-de-karaokê-online
      await setDoc(filaDoc, { musicas: [base] });

      await setDoc(filaDoc, { musicas: [song] });
 master
    } else {
      const arr = filaSnap.data().musicas || [];
      const count = arr.filter(m => m.mesa === mesa).length;
      if (count >= 2) {
        alert('Aguarde suas músicas tocarem antes de adicionar mais.');
        return;
      }
 nkvhl0-codex/criar-sistema-de-karaokê-online
      await updateDoc(filaDoc, { musicas: arrayUnion(base) });

      await updateDoc(filaDoc, { musicas: arrayUnion(song) });
 master
    }
    input.value = '';
  } catch (err) {
    alert(err.message);
  }
});

onSnapshot(mesaDoc, (snap) => {
  const data = snap.data();
  lista.innerHTML = '';
  (data?.musicas || []).forEach(m => {
    const li = document.createElement('li');
    const preview = document.createElement('div');
    preview.className = 'video-preview';
    const img = document.createElement('img');
    img.src = m.thumb;
    const info = document.createElement('div');
    info.innerHTML = `<strong>${m.nome}</strong><br>${m.channel}`;
    preview.appendChild(img);
    preview.appendChild(info);
    li.appendChild(preview);
    const btn = document.createElement('button');
    btn.textContent = 'Remover';
    btn.onclick = async () => {
      await updateDoc(mesaDoc, { musicas: arrayRemove(m) });
      const filaSnap = await getDoc(filaDoc);
      if (filaSnap.exists()) {
        const arr = (filaSnap.data().musicas || []).filter(s => s.id !== m.id);
        await updateDoc(filaDoc, { musicas: arr });
      }
    };
    li.appendChild(btn);
    lista.appendChild(li);
  });
});
