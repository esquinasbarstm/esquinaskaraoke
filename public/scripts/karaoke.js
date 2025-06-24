import { db } from './firebase-init.js';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { searchVideo } from './youtube.js';

// Proteção por senha (mesa)
const PASSWORD = 'mesa123';
let mesa = localStorage.getItem('mesa');
if (!mesa) {
  mesa = prompt('Número da mesa:');
  localStorage.setItem('mesa', mesa);
}
if (localStorage.getItem('mesa_pw') !== 'ok') {
  const pw = prompt('Senha da mesa:');
  if (pw !== PASSWORD) {
    alert('Senha incorreta');
    document.body.innerHTML = 'Acesso negado';
    throw new Error('Senha incorreta');
  }
  localStorage.setItem('mesa_pw', 'ok');
}

const mesaDoc = doc(db, 'mesas', mesa);
const filaDoc = doc(db, 'sistema', 'filaOrdenada');

// Função de rodízio
function rodizio(arr) {
  const grupos = {};
  const ordem = [];
  arr.forEach(s => {
    if (!grupos[s.mesa]) {
      grupos[s.mesa] = [];
      ordem.push(s.mesa);
    }
    grupos[s.mesa].push(s);
  });
  const resultado = [];
  let resto = true;
  while (resto) {
    resto = false;
    ordem.forEach(m => {
      const g = grupos[m];
      if (g.length) {
        resultado.push(g.shift());
        resto = resto || g.length > 0;
        if (g.length) {
          resultado.push(g.shift());
          resto = resto || g.length > 0;
        }
      }
    });
  }
  return resultado;
}

const form = document.getElementById('form-busca');
const input = document.getElementById('busca');
const lista = document.getElementById('suas-musicas');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) return;

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

    await setDoc(mesaDoc, { musicas: [] }, { merge: true });
    await updateDoc(mesaDoc, { musicas: arrayUnion(song) });

    const filaSnap = await getDoc(filaDoc);
    let arr = filaSnap.exists() ? filaSnap.data().musicas || [] : [];

    const count = arr.filter(m => m.mesa === mesa).length;
    if (count >= 2) {
      alert('Aguarde suas músicas tocarem antes de adicionar mais.');
      return;
    }

    arr.push(song);
    arr = rodizio(arr);

    if (!filaSnap.exists()) {
      await setDoc(filaDoc, { musicas: arr });
    } else {
      await updateDoc(filaDoc, { musicas: arr });
    }

    input.value = '';
  } catch (err) {
    alert(err.message);
  }
});

// Interface dinâmica em tempo real
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
        let arr = filaSnap.data().musicas || [];
        arr = arr.filter(s => s.id !== m.id);
        arr = rodizio(arr);
        await updateDoc(filaDoc, { musicas: arr });
      }
    };

    li.appendChild(btn);
    lista.appendChild(li);
  });
});
