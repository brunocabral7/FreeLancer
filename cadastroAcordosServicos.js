//  Configuração do Firebase
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

//  Seleção dos elementos do formulário
const formAcordoServico = document.getElementById("form-acordo-servico");
const selectCliente = document.getElementById("cliente-selecionado");

//  Função para carregar os clientes do usuário logado
function carregarClientes(user) {
    db.collection("clientes").doc(user.uid).collection("clientes").get()
        .then((snapshot) => {
            snapshot.forEach((doc) => {
                const cliente = doc.data();
                const option = document.createElement("option");
                option.value = doc.id;
                option.textContent = cliente.nome;
                selectCliente.appendChild(option);
            });
        })
        .catch((error) => console.error("Erro ao carregar clientes:", error));
}

//  Função para cadastrar Acordo de Serviço
formAcordoServico.addEventListener("submit", (e) => {
    e.preventDefault();

    const clienteId = selectCliente.value;
    const servico = document.getElementById("servico").value.trim();
    const valor = parseFloat(document.getElementById("valor").value);
    const descricao = document.getElementById("descricao").value.trim();

    if (!clienteId || !servico || !valor || !descricao) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const acordoServico = {
        servico,
        valor,
        descricao,
        data: new Date().toISOString(),
    };

    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para cadastrar o serviço.");
        return;
    }

    // Salvar o acordo dentro do cliente, associando ao UID do usuário logado
    db.collection("clientes").doc(user.uid).collection("clientes").doc(clienteId).update({
        acordos: firebase.firestore.FieldValue.arrayUnion(acordoServico)
    })
    .then(() => {
        alert("Acordo de serviço cadastrado com sucesso!");
        formAcordoServico.reset();
    })
    .catch((error) => {
        console.error("Erro ao cadastrar acordo:", error);
        alert("Houve um erro ao cadastrar o serviço. Tente novamente.");
    });
});

//  Verificar se o usuário está logado e carregar os clientes
auth.onAuthStateChanged(user => {
    if (user) {
        carregarClientes(user); // Carregar os clientes do usuário logado
    } else {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "login.html"; // Redireciona para o login se não estiver logado
    }
});
//  Configuração da sidebar
function setupSidebar() {
    const toggleSidebarButton = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    toggleSidebarButton.addEventListener('click', () => {
        sidebar.classList.toggle('minimized');
    });
}

//  Inicialização quando o conteúdo estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
});
