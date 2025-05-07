// Configuração do Firebase
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
  const db   = firebase.firestore();
  const auth = firebase.auth();
  
  let currentTransactions = [];
  let editingId = null;
  
  document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
  
    // Exportar para Excel
    document.getElementById("export-excel").addEventListener("click", exportarParaExcel);
  
    // Datepicker
    const dateInput = document.getElementById("data");
    dateInput.addEventListener("focus", () => {
      if (typeof dateInput.showPicker === 'function') dateInput.showPicker();
    });
  
    // Filtros e busca
    document.getElementById("filtro-mes").addEventListener("change", aplicarFiltros);
    document.getElementById("filtro-ano").addEventListener("change", aplicarFiltros);
    document.getElementById("busca-descricao").addEventListener("input", aplicarFiltros);
  });
  
  function setupSidebar() {
    const btn = document.getElementById('toggle-sidebar');
    const sb  = document.querySelector('.sidebar');
    btn.addEventListener('click', () => sb.classList.toggle('minimized'));
  }
  
  // Autenticação
  auth.onAuthStateChanged(user => {
    if (!user) return window.location.href = 'index.html';
    const userId = user.uid;
    observarTransacoes(userId);
    document.getElementById("form-transacao").addEventListener("submit", e => {
      e.preventDefault();
      editingId ? atualizarTransacao(userId) : adicionarTransacao(userId);
    });
  });
  
  function observarTransacoes(userId) {
    db.collection("usuarios").doc(userId).onSnapshot(doc => {
      currentTransactions = doc.exists ? (doc.data().transacoes || []) : [];
      popularFiltroAno();
      exibirTransacoes(currentTransactions, userId);
    });
  }
  
  function popularFiltroAno() {
    const sel = document.getElementById("filtro-ano");
    sel.innerHTML = '<option value="todos">Todos</option>';
    new Set(currentTransactions.map(t => new Date(t.data).getFullYear()))
      .forEach(ano => {
        const o = document.createElement("option");
        o.value = ano;
        o.textContent = ano;
        sel.appendChild(o);
      });
  }
  
  function aplicarFiltros() {
    const user = auth.currentUser;
    if (user) exibirTransacoes(currentTransactions, user.uid);
  }
  
  function exibirTransacoes(transacoes, userId) {
    const lista = document.getElementById("lista-transacoes");
    const saldoSpan = document.getElementById("saldo");
    lista.innerHTML = "";
  
    const mSel  = document.getElementById("filtro-mes").value;
    const aSel  = document.getElementById("filtro-ano").value;
    const termo = document.getElementById("busca-descricao").value.trim().toLowerCase();
  
    const filtradas = transacoes.filter(t => {
      const dt  = new Date(t.data);
      const mes = dt.getMonth() + 1;
      const ano = dt.getFullYear();
      const okMes   = mSel === "todos" || parseInt(mSel) === mes;
      const okAno   = aSel === "todos" || parseInt(aSel) === ano;
      const okBusca = termo === "" || t.descricao.toLowerCase().includes(termo);
      return okMes && okAno && okBusca;
    });
  
    let saldo = 0;
    filtradas.forEach(t => {
      const tr = document.createElement("tr");
      tr.dataset.id = t.id;
  
      [ t.descricao,
        t.valor.toFixed(2),
        new Date(t.data).toLocaleDateString("pt-BR"),
        t.tipo === "ganho" ? "Ganho" : "Despesa"
      ].forEach(txt => {
        const td = document.createElement("td");
        td.textContent = txt;
        tr.appendChild(td);
      });
  
      const tdA = document.createElement("td");

const btnEdit = document.createElement("button");
btnEdit.textContent = "Editar";
btnEdit.classList.add("btn-editar");
btnEdit.style.cssText = `
  padding: 4px 8px;
  font-size: 1rem;
  margin-right: 4px;
  width: auto;
  min-width: unset;
`;
btnEdit.addEventListener("click", () => iniciarEdicao(t));

const btnDel = document.createElement("button");
btnDel.textContent = "Excluir";
btnDel.classList.add("btn-excluir");
btnDel.style.cssText = `
  padding: 4px 8px;
  font-size: 1rem;
  width: auto;
  min-width: unset;
`;
btnDel.addEventListener("click", () => excluirTransacao(userId, t.id));
      tdA.appendChild(btnEdit);
      tdA.appendChild(btnDel);
      tr.appendChild(tdA);
      lista.appendChild(tr);
  
      saldo += (t.tipo === "ganho" ? t.valor : -t.valor);
    });
  
    saldoSpan.textContent = saldo.toFixed(2);
  }
  
  function iniciarEdicao(t) {
    document.getElementById("descricao").value = t.descricao;
    document.getElementById("valor").value     = t.valor;
    document.getElementById("data").value      = new Date(t.data).toISOString().slice(0,10);
    document.getElementById("tipo").value      = t.tipo;
    document.querySelector("#form-transacao button[type=submit]").textContent = "Salvar";
    editingId = t.id;
  }
  
  function coletarFormulario() {
    const dateValue = document.getElementById("data").value;
    return {
      descricao: document.getElementById("descricao").value.trim(),
      valor:     parseFloat(document.getElementById("valor").value),
      data:      new Date(`${dateValue}T12:00:00Z`).toISOString(),
      tipo:      document.getElementById("tipo").value
    };
  }
  
  function adicionarTransacao(userId) {
    const t = coletarFormulario(); t.id = Date.now().toString();
    salvarFirestore(userId, arr => [...arr, t]);
  }
  
  function atualizarTransacao(userId) {
    if (!editingId) { alert("Nenhuma transação selecionada."); return; }
    const t = coletarFormulario(); t.id = editingId;
    salvarFirestore(userId, arr => arr.map(x => x.id===editingId? t : x))
      .then(() => {
        editingId = null;
        document.querySelector("#form-transacao button[type=submit]").textContent = "Adicionar";
      });
  }
  
  function salvarFirestore(userId, updater) {
    const ref = db.collection("usuarios").doc(userId);
    return ref.get().then(doc => {
      const arr = doc.exists ? (doc.data().transacoes||[]) : [];
      return ref.set({ transacoes: updater(arr) });
    }).then(() => document.getElementById("form-transacao").reset());
  }
  
  function excluirTransacao(userId, id) {
    if (!confirm("Deseja realmente excluir?")) return;
    salvarFirestore(userId, arr => arr.filter(t => t.id !== id));
  }
  
  function exportarParaExcel() {
    const rows = document.querySelectorAll("#lista-transacoes tr");
    if (!rows.length) return alert("Sem transações para exportar.");
  
    const dados = [];
    rows.forEach(tr => {
      const [dDesc, dVal, dData, dTipo] = tr.querySelectorAll("td");
      const desc  = dDesc.textContent;
      const valor = parseFloat(dVal.textContent.replace(",", "."));
      const data  = dData.textContent;
      const tipo  = dTipo.textContent;
      dados.push({ Descrição: desc, Valor: valor, Data: data, Tipo: tipo });
    });
  
    const saldo = dados.reduce((s, t) =>
      s + (t.Tipo === "Ganho" ? t.Valor : -t.Valor), 0);
    dados.push({ Descrição: "Saldo", Valor: saldo.toFixed(2), Data: "", Tipo: "" });
  
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dados, { header: ["Descrição","Valor","Data","Tipo"] });
    XLSX.utils.book_append_sheet(wb, ws, "Filtradas");
    XLSX.writeFile(wb, "ganhos_e_despesas_filtradas.xlsx");
  }
  function logout() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = "login.html"; // redireciona para a página de login
        })
        .catch((error) => {
            console.error("Erro ao sair:", error);
            alert("Erro ao sair. Tente novamente.");
        });
}
  firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "login.html";
    }
});

// Configuração da sidebar
function setupSidebar() {
  const toggleSidebarButton = document.getElementById('toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');

  toggleSidebarButton.addEventListener('click', () => {
      sidebar.classList.toggle('minimized');
  });
}

// Inicialização quando o conteúdo estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
});