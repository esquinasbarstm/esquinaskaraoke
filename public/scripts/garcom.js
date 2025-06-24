import { db } from './firebase-init.js';
import { doc, setDoc, updateDoc, getDoc, onSnapshot, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { searchVideo } from './youtube.js';

const PASSWORD = 'garcom123';
if (localStorage.getItem('garcom') !== 'ok') {
  const pw = prompt('Senha do garçom:');
  if (pw !== PASSWORD) {
    alert('Senha incorreta');
    document.body.innerHTML = 'Acesso negado';
    throw new Error('Senha incorreta');
  }
  localStorage.setItem('garcom', 'ok');
}

const form = document.getElementById('form-garcom');
const inputMesa = document.getElementById('mesa');
const inputBusca = document.getElementById('busca');
const lista = document.getElementById('historico');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mesa = inputMesa.value.trim();
  const query = inputBusca.value.trim();
  if (!mesa || !query) return;
  try {
    const video = await searchVideo(query);
    const song = {
      id: Date.now().toString(),
      nome: video.title,
      youtubeId: video.youtubeId,
      mesa,
      horario: Date.now(),
      channel: video.channel,
      thumb: video.thumb
    };
    const mesaDoc = doc(db, 'mesas', mesa);
    const filaDoc = doc(db, 'sistema', 'filaOrdenada');
    await setDoc(mesaDoc, { musicas: [] }, { merge: true });
    await updateDoc(mesaDoc, { musicas: arrayUnion(song) });
    const filaSnap = await getDoc(filaDoc);
    if (!filaSnap.exists()) {
      await setDoc(filaDoc, { musicas: [song] });
    } else {
      const arr = filaSnap.data().musicas || [];
      const count = arr.filter(m => m.mesa === mesa).length;
      if (count >= 2) {
        alert('Mesa já possui 2 músicas na fila');
        return;
      }
      await updateDoc(filaDoc, { musicas: arrayUnion(song) });
    }
    inputBusca.value = '';
  } catch (err) {
    alert(err.message);
  }
});

inputMesa.addEventListener('change', () => listenMesa(inputMesa.value));

function listenMesa(mesa) {
  if (!mesa) return;
  const mesaDoc = doc(db, 'mesas', mesa);
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
      lista.appendChild(li);
    });
  });
}
