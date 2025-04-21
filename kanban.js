const firebaseConfig = { 
  apiKey: "AIzaSyDev8I567_Rj4uvvvw_zZCgD7e2A2ci2O8",
  authDomain: "trampolivre.firebaseapp.com",
  projectId: "trampolivre",
  storageBucket: "trampolivre.firebasestorage.app",
  messagingSenderId: "1089675684715",
  appId: "1:1089675684715:web:372181ef61dc92e76e7a2e",
  measurementId: "G-MLJMWDN3K2"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Configuração da sidebar
function setupSidebar() {
  const toggleSidebarButton = document.getElementById('toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');
  toggleSidebarButton.addEventListener('click', () => {
    sidebar.classList.toggle('minimized');
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
  document.getElementById("add-list-button").addEventListener("click", addNewList);
});

// Chave de API do Trello
const apiKey = '72b34624fbf9da757cdd59282ba2c935';
const token = 'ATTA4816bd4a25d590bee28b035529093da00387766a93b9a3c455a2c4a91d17140a5D12CA61';

// Logout
function logout() {
  auth.signOut().then(() => {
    window.location.href = 'index.html';
  }).catch(console.error);
}

auth.onAuthStateChanged(user => {
  if (user) loadTrelloBoard(user.uid);
  else window.location.href = 'index.html';
});

let currentBoardId = null;

// Carrega (ou cria) board Trello
async function loadTrelloBoard(userId) {
  const doc = await db.collection("users").doc(userId).get();
  if (doc.exists && doc.data().trelloBoardId) {
    currentBoardId = doc.data().trelloBoardId;
  } else {
    const board = await createTrelloBoard(userId);
    currentBoardId = board.id;
  }
  loadTrelloLists(currentBoardId);
}

async function createTrelloBoard(userId) {
  const boardName = `Kanban de ${userId}`;
  const url = `https://api.trello.com/1/boards/?name=${encodeURIComponent(boardName)}&key=${apiKey}&token=${token}`;
  const res = await fetch(url, { method: "POST" });
  const board = await res.json();
  await db.collection("users").doc(userId).update({ trelloBoardId: board.id });
  return board;
}

// --- Arraste de Listas (Colunas) ---
const kanbanColumns = document.getElementById("kanban-columns");
kanbanColumns.addEventListener('dragover', columnDragOver);
kanbanColumns.addEventListener('drop', columnDrop);

function listDragStart(e) {
  e.dataTransfer.setData('text/plain', e.currentTarget.dataset.listId);
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.classList.add('dragging-list');
  e.stopPropagation();
}

function listDragEnd(e) {
  e.currentTarget.classList.remove('dragging-list');
}

function getDragAfterElement(container, x) {
  const cols = [...container.querySelectorAll('.kanban-column:not(.dragging-list)')];
  return cols.reduce((closest, col) => {
    const box = col.getBoundingClientRect();
    const offset = x - box.left - box.width / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: col };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function columnDragOver(e) {
  e.preventDefault();
  const dragging = document.querySelector('.dragging-list');
  const after = getDragAfterElement(kanbanColumns, e.clientX);
  if (!after) kanbanColumns.appendChild(dragging);
  else kanbanColumns.insertBefore(dragging, after);
}

function columnDrop(e) {
  e.preventDefault();
  const listId = e.dataTransfer.getData('text/plain');
  updateListPosition(listId);
}

// Persiste nova posição no Trello (nova lógica dinâmica)
async function updateListPosition(listId) {
  // Pega todas as listas do board
  const urlLists = `https://api.trello.com/1/boards/${currentBoardId}/lists?key=${apiKey}&token=${token}`;
  const lists = await (await fetch(urlLists)).json();

  // Ordena IDs conforme posição no DOM
  const order = [...kanbanColumns.querySelectorAll('.kanban-column')]
    .map(el => el.dataset.listId);

  // Mapeia objetos de lista na ordem do DOM
  const orderedLists = order
    .map(id => lists.find(l => l.id === id))
    .filter(Boolean);

  // Recalcula pos entre prev e next
  for (let i = 0; i < orderedLists.length; i++) {
    const prev = orderedLists[i - 1];
    const next = orderedLists[i + 1];
    let newPos;

    if (!prev) newPos = 'top';
    else if (!next) newPos = 'bottom';
    else newPos = (prev.pos + next.pos) / 2;

    const url = `https://api.trello.com/1/lists/${orderedLists[i].id}/pos?value=${newPos}&key=${apiKey}&token=${token}`;
    try {
      const res = await fetch(url, { method: 'PUT' });
      const result = await res.json();
      console.log(`Lista ${orderedLists[i].name} reposicionada:`, result);
    } catch (err) {
      console.error('Erro ao reordenar lista:', err);
    }
  }
}
// --- Fim arraste de Listas ---

// Carrega listas do Trello
async function loadTrelloLists(boardId) {
  const url = `https://api.trello.com/1/boards/${boardId}/lists?key=${apiKey}&token=${token}`;
  let lists = await (await fetch(url)).json();

  // Ordena pelo campo "pos"
  lists.sort((a, b) => a.pos - b.pos);

  kanbanColumns.innerHTML = "";
  lists.forEach(list => {
    const column = document.createElement("div");
    column.classList.add("kanban-column");
    column.dataset.listId = list.id;
    column.setAttribute("draggable", "true");
    column.addEventListener("dragstart", listDragStart);
    column.addEventListener("dragend", listDragEnd);

    column.innerHTML = `
      <div class="column-header">
        <h3 id="column-title-${list.id}">${list.name}</h3>
        <button class="btn-editar-nome" onclick="editColumnName('${list.id}')" style="background:white; font-size:11px;">✏️</button>
        <button class="btn-delete-list" onclick="deleteList('${list.id}')" style="background:white;font-size:11px;">🗑️</button>
      </div>
      <ul id="list-${list.id}" class="kanban-list"></ul>
      <button class="btn-add-card" onclick="addCard('${list.id}')">Adicionar Card</button>
    `;
    kanbanColumns.appendChild(column);

    const listEl = document.getElementById(`list-${list.id}`);
    listEl.addEventListener("dragover", e => e.preventDefault());
    listEl.addEventListener("drop", e => {
      e.preventDefault();
      const cardId = e.dataTransfer.getData("text/plain");
      moveCard(cardId, list.id);
    });

    loadTrelloCards(list.id);
  });
}


// Carrega cards de uma lista
async function loadTrelloCards(listId) {
  const url = `https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${token}`;
  const cards = await (await fetch(url)).json();
  const listEl = document.getElementById(`list-${listId}`);
  listEl.innerHTML = "";

  cards.forEach(card => {
    const li = document.createElement("li");
    li.draggable = true;
    li.dataset.cardId = card.id;

    li.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", card.id);
      e.dataTransfer.effectAllowed = "move";
      li.classList.add("dragging");
      e.stopPropagation(); // evita iniciar drag de lista
    });
    li.addEventListener("dragend", () => li.classList.remove("dragging"));

    const due = card.due ? new Date(card.due).toLocaleDateString() : "Sem data";
    li.innerHTML = `
      <div class="card-info">
        <span class="card-name">${card.name}</span>
        <span class="card-date">${due}</span>
      </div>
    `;

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.onclick = () => editCard(card.id, listId);
    li.appendChild(editBtn);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Excluir";
    delBtn.onclick = () => deleteCard(card.id, listId);
    li.appendChild(delBtn);

    listEl.appendChild(li);
  });
}

// Adiciona card
function addCard(listId) {
  if (document.querySelector(`#list-${listId} .card-form`)) return;
  const form = document.createElement("div");
  form.classList.add("card-form");
  form.innerHTML = `
    <label>Nome do Card:</label>
    <input type="text" id="card-name"><br>
    <label>Prazo:</label>
    <input type="date" id="due-date"><br>
    <button id="submit-card">Adicionar</button>
    <button id="cancel-card">Cancelar</button>
  `;
  const listEl = document.getElementById(`list-${listId}`);
  listEl.appendChild(form);

  form.querySelector("#submit-card").onclick = () => {
    const name = form.querySelector("#card-name").value;
    const date = form.querySelector("#due-date").value;
    if (!name || !date) return alert("Preencha tudo.");
    let d = new Date(date + "T00:00:00");
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
    const dueUTC = d.toISOString();
    const url = `https://api.trello.com/1/cards?name=${encodeURIComponent(name)}&idList=${listId}&due=${dueUTC}&key=${apiKey}&token=${token}`;
    fetch(url, { method: "POST" })
      .then(r => r.json())
      .then(() => loadTrelloCards(listId))
      .catch(console.error);
    form.remove();
  };
  form.querySelector("#cancel-card").onclick = () => form.remove();
}

// Edita card
function editCard(cardId, listId) {
  if (document.querySelector(".edit-form")) document.querySelector(".edit-form").remove();
  fetch(`https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}`)
    .then(r => r.json())
    .then(card => {
      let val = "";
      if (card.due) {
        let dt = new Date(card.due);
        dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
        val = dt.toISOString().split("T")[0];
      }
      const form = document.createElement("div");
      form.classList.add("edit-form");
      form.innerHTML = `
        <label>Nome:</label>
        <input type="text" id="new-card-name" value="${card.name}"><br>
        <label>Prazo:</label>
        <input type="date" id="new-due-date" value="${val}"><br>
        <button id="submit-edited-card">Salvar</button>
        <button id="cancel-edit-card">Cancelar</button>
      `;
      document.getElementById(`list-${listId}`).appendChild(form);
      form.querySelector("#submit-edited-card").onclick = () => {
        const newName = form.querySelector("#new-card-name").value;
        const newDate = form.querySelector("#new-due-date").value;
        if (!newName || !newDate) return alert("Preencha tudo.");
        let d2 = new Date(newDate + "T00:00:00");
        d2.setMinutes(d2.getMinutes() + d2.getTimezoneOffset());
        const newDue = d2.toISOString();
        fetch(`https://api.trello.com/1/cards/${cardId}?name=${encodeURIComponent(newName)}&due=${newDue}&key=${apiKey}&token=${token}`,
          { method: "PUT" })
          .then(() => loadTrelloCards(listId))
          .catch(console.error);
        form.remove();
      };
      form.querySelector("#cancel-edit-card").onclick = () => form.remove();
    })
    .catch(console.error);
}

// Exclui card
function deleteCard(cardId, listId) {
  if (!confirm("Excluir este card?")) return;
  fetch(`https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${token}`, { method: "DELETE" })
    .then(() => loadTrelloCards(listId))
    .catch(console.error);
}

// Edita nome de coluna
function editColumnName(listId) {
  const titleEl = document.getElementById(`column-title-${listId}`);
  const current = titleEl.textContent;
  const novo = prompt("Novo nome:", current);
  if (!novo || novo === current) return;
  fetch(`https://api.trello.com/1/lists/${listId}/name?value=${encodeURIComponent(novo)}&key=${apiKey}&token=${token}`,
    { method: "PUT" })
    .then(r => r.json())
    .then(updated => titleEl.textContent = updated.name)
    .catch(console.error);
}

// Adiciona nova lista
function addNewList() {
  if (!currentBoardId) return alert("Board não identificado.");
  const nome = prompt("Nome da lista:");
  if (!nome) return;
  fetch(`https://api.trello.com/1/lists?name=${encodeURIComponent(nome)}&idBoard=${currentBoardId}&key=${apiKey}&token=${token}`,
    { method: "POST" })
    .then(() => loadTrelloLists(currentBoardId))
    .catch(console.error);
}

// Move card (drag & drop)
function moveCard(cardId, newListId) {
  fetch(`https://api.trello.com/1/cards/${cardId}?idList=${newListId}&key=${apiKey}&token=${token}`,
    { method: "PUT" })
    .then(() => loadTrelloLists(currentBoardId))
    .catch(console.error);
}

// Função para "excluir" (arquivar) uma lista no Trello
function deleteList(listId) {
  if (!confirm("Você tem certeza que deseja excluir esta lista?")) return;
  const url = `https://api.trello.com/1/lists/${listId}/closed?value=true&key=${apiKey}&token=${token}`;
  fetch(url, { method: "PUT" })
    .then(response => {
      if (!response.ok) throw new Error("Falha ao excluir lista");
      return response.json();
    })
    .then(() => loadTrelloLists(currentBoardId))
    .catch(error => console.error("Erro ao excluir lista:", error));
}
function columnDragOver(e) {
  e.preventDefault();
  // Se não houver lista em drag, sai
  const dragging = document.querySelector('.dragging-list');
  if (!dragging) return;

  const after = getDragAfterElement(kanbanColumns, e.clientX);
  if (!after) {
    kanbanColumns.appendChild(dragging);
  } else {
    kanbanColumns.insertBefore(dragging, after);
  }
}