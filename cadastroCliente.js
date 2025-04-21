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

//  Seleção do formulário e elementos
const formCadastro = document.getElementById("form-cadastro");

//  Verifica se o usuário está logado
auth.onAuthStateChanged(user => {
    if (!user) {
        alert("Você precisa estar logado para cadastrar clientes.");
        window.location.href = "login.html";
    }
});

//  Função para cadastrar o cliente no Firestore
formCadastro.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const contato = document.getElementById("contato").value.trim();
    const cpfCnpj = document.getElementById("cpf-cnpj").value.trim();
    const descricao = document.getElementById("descricao").value.trim();

    if (!nome || !contato || !cpfCnpj) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    const cliente = {
        nome,
        contato,
        cpfCnpj,
        descricao,
        dataCadastro: new Date().toISOString()
    };

    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para cadastrar clientes.");
        return;
    }

    // Adicionando o cliente ao Firestore associado ao UID do usuário
    db.collection("clientes").doc(user.uid).collection("clientes").add(cliente)
        .then(() => {
            alert("Cliente cadastrado com sucesso!");
            formCadastro.reset();
        })
        .catch((error) => {
            console.error("Erro ao cadastrar cliente:", error);
            alert("Houve um erro ao cadastrar o cliente. Tente novamente.");
        });
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
