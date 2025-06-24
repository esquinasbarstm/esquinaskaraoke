import { db } from './firebase-init.js';
import { doc, setDoc, updateDoc, getDoc, onSnapshot, arrayUnion } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { searchVideo } from './youtube.js';

// Função de rodízio por mesa (2 músicas por rodada)
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

// Proteção com senha
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

// Elementos da interface
const form = document.getElementById('form-garcom');
const inputMesa = document.getElementById('mesa');
const inputBusca = document.getElementById('busca');
const lista = document.getElementById('historico');
const rankingEl = document.getElementById('ranking');
const historicoDoc = doc(db, 'sistema', 'historico');

// Submissão do formulário para adicionar música
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
    let arr = filaSnap.exists() ? filaSnap.data().musicas || [] : [];
    const count = arr.filter(m => m.mesa === mesa).length;
    if (count >= 2) {
      alert('Mesa já possui 2 músicas na fila');
      return;
    }
    arr.push(song);
    arr = rodizio(arr);

    if (!filaSnap.exists()) {
      await setDoc(filaDoc, { musicas: arr });
    } else {
      await updateDoc(filaDoc, { musicas: arr });
    }

    inputBusca.value = '';
  } catch (err) {
    alert(err.message);
  }
});

// Atualiza o histórico da mesa ao trocar de número
inputMesa.addEventListener('change', () => listenMesa(inputMesa.value));

// Mostra o histórico da mesa em tempo real
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

// Ranking de músicas mais pedidas
function updateRanking() {
  onSnapshot(historicoDoc, (snap) => {
    const arr = snap.data()?.musicas || [];
    const contagem = {};
    arr.forEach(m => {
      contagem[m.nome] = (contagem[m.nome] || 0) + 1;
    });
    const itens = Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    rankingEl.innerHTML = '';
    itens.forEach(([nome, qtd]) => {
      const li = document.createElement('li');
      li.textContent = `${nome} - ${qtd}`;
      rankingEl.appendChild(li);
    });
  });
}

updateRanking();
