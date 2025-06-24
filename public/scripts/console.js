import { db } from './firebase-init.js';
import { doc, getDoc, updateDoc, setDoc, onSnapshot, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const PASSWORD = 'console123';
if (localStorage.getItem('console') !== 'ok') {
  const pw = prompt('Senha do console:');
  if (pw !== PASSWORD) {
    alert('Senha incorreta');
    document.body.innerHTML = 'Acesso negado';
    throw new Error('Senha incorreta');
  }
  localStorage.setItem('console', 'ok');
}

const filaDoc = doc(db, 'sistema', 'filaOrdenada');
const atualDoc = doc(db, 'sistema', 'musicaAtual');
const lista = document.getElementById('fila');
const atualEl = document.getElementById('musica-atual');
const proximaEl = document.getElementById('proxima');

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

async function salvarFila(arr) {
  arr = rodizio(arr);
  await updateDoc(filaDoc, { musicas: arr });
}

async function render() {
  const filaSnap = await getDoc(filaDoc);
  const arr = filaSnap.data()?.musicas || [];
  atualEl.textContent = arr[0] ? `Tocando: ${arr[0].nome} (Mesa ${arr[0].mesa})` : '';
  proximaEl.textContent = arr[1] ? `Próxima: ${arr[1].nome} (Mesa ${arr[1].mesa})` : '';
  lista.innerHTML = '';
  arr.forEach((m, idx) => {
    const li = document.createElement('li');
    if (idx === 0) li.style.fontWeight = 'bold';
    const preview = document.createElement('div');
    preview.className = 'video-preview';
    const img = document.createElement('img');
    img.src = m.thumb;
    const info = document.createElement('div');
    info.innerHTML = `<strong>${m.nome}</strong><br>Mesa ${m.mesa}`;
    preview.appendChild(img);
    preview.appendChild(info);
    li.appendChild(preview);
    const btnPlay = document.createElement('button');
    btnPlay.textContent = 'Tocar agora';
    btnPlay.onclick = () => tocarAgora(m.id);
    const btnRem = document.createElement('button');
    btnRem.textContent = 'Remover';
    btnRem.onclick = () => remover(m.id);
    li.appendChild(btnPlay);
    li.appendChild(btnRem);
    lista.appendChild(li);
  });
}

async function tocarAgora(id) {
  const filaSnap = await getDoc(filaDoc);
  let arr = filaSnap.data()?.musicas || [];
  const idx = arr.findIndex(s => s.id === id);
  if (idx > -1) {
    const [song] = arr.splice(idx, 1);
    arr.unshift(song);
    await salvarFila(arr);
    await setDoc(atualDoc, song);
  }
}

async function remover(id) {
  const filaSnap = await getDoc(filaDoc);
  let arr = filaSnap.data()?.musicas || [];
  const idx = arr.findIndex(s => s.id === id);
  if (idx > -1) {
    const [song] = arr.splice(idx, 1);
    await salvarFila(arr);
    const mesaDoc = doc(db, 'mesas', song.mesa);
    await updateDoc(mesaDoc, { musicas: arrayRemove(song) });
  }
}

async function pular() {
  const filaSnap = await getDoc(filaDoc);
  let arr = filaSnap.data()?.musicas || [];
  const song = arr.shift();
  await salvarFila(arr);
  if (song) {
    const mesaDoc = doc(db, 'mesas', song.mesa);
    await updateDoc(mesaDoc, { musicas: arrayRemove(song) });
  }
  await setDoc(atualDoc, arr[0] || {});
}

document.getElementById('pular').onclick = pular;

onSnapshot(filaDoc, render);
render();
