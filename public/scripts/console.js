import { db } from './firebase-init.js';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const filaDoc = doc(db, 'sistema', 'filaOrdenada');
const atualDoc = doc(db, 'sistema', 'musicaAtual');
const lista = document.getElementById('fila');

async function render() {
  const filaSnap = await getDoc(filaDoc);
  const arr = filaSnap.data()?.musicas || [];
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
    await updateDoc(filaDoc, { musicas: arr });
    await setDoc(atualDoc, song);
  }
}

async function remover(id) {
  const filaSnap = await getDoc(filaDoc);
  let arr = filaSnap.data()?.musicas || [];
  arr = arr.filter(s => s.id !== id);
  await updateDoc(filaDoc, { musicas: arr });
}

async function pular() {
  const filaSnap = await getDoc(filaDoc);
  let arr = filaSnap.data()?.musicas || [];
  arr.shift();
  await updateDoc(filaDoc, { musicas: arr });
  await setDoc(atualDoc, arr[0] || {});
}

document.getElementById('pular').onclick = pular;

onSnapshot(filaDoc, render);
render();
