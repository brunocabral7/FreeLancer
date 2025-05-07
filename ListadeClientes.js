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

//  Seleção do elemento da tabela
const listaClientes = document.getElementById("lista-clientes");

//  Verifica se o usuário está logado antes de carregar os clientes
auth.onAuthStateChanged(user => {
    if (user) {
        console.log("Usuário logado:", user.uid);
        carregarClientes();
    } else {
        console.log("Nenhum usuário logado.");
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "index.html";
    }
});

//  Função para carregar os clientes do Firestore
function carregarClientes() {
    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "login.html";
        return;
    }

    listaClientes.innerHTML = "";  // Limpa a lista antes de carregar os clientes

    // Buscando clientes associados ao usuário logado
    db.collection("clientes").doc(user.uid).collection("clientes").get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log("Nenhum cliente encontrado.");
                listaClientes.innerHTML = "<tr><td colspan='5'>Nenhum cliente cadastrado.</td></tr>";
                return;
            }

            snapshot.forEach(doc => {
                const cliente = doc.data();
                const id = doc.id;

                const item = document.createElement("tr");

                //  Nome do cliente
                const nomeCell = document.createElement("td");
                nomeCell.textContent = cliente.nome || "Não informado";
                item.appendChild(nomeCell);

                //  Contato (e-mail ou telefone)
                const contatoCell = document.createElement("td");
                contatoCell.textContent = cliente.contato || "Não informado";
                item.appendChild(contatoCell);

                //  CPF/CNPJ
                const cpfCnpjCell = document.createElement("td");
                cpfCnpjCell.textContent = cliente.cpfCnpj || "Não informado";
                item.appendChild(cpfCnpjCell);

                //  Descrição da empresa
                const descricaoCell = document.createElement("td");
                descricaoCell.textContent = cliente.descricao || "Sem descrição";
                item.appendChild(descricaoCell);

                //  Botão de excluir cliente
                const acoesCell = document.createElement("td");
                const btnExcluir = document.createElement("button");
                btnExcluir.textContent = "Excluir";
                btnExcluir.classList.add("btn-excluir");
                btnExcluir.addEventListener("click", () => excluirCliente(id));
                acoesCell.appendChild(btnExcluir);
                item.appendChild(acoesCell);

                listaClientes.appendChild(item);
            });
        })
        .catch(error => console.error("Erro ao carregar clientes:", error));
}
//  Função para excluir cliente
function excluirCliente(clienteId) {
    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para excluir clientes.");
        window.location.href = "login.html";
        return;
    }

    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    // Excluindo o cliente da coleção associada ao UID do usuário
    db.collection("clientes").doc(user.uid).collection("clientes").doc(clienteId).delete()
        .then(() => {
            console.log("Cliente excluído com sucesso!");
            carregarClientes();
        })
        .catch(error => console.error("Erro ao excluir cliente:", error));
}
//  Função de logout
function logout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    }).catch(error => console.error("Erro ao sair:", error));
}
firebase.auth().onAuthStateChanged(user => {
    if (!user) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "login.html";
    }
});
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
//  Configuração da sidebar
function setupSidebar() {
    const toggleSidebarButton = document.getElementById('toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');

    toggleSidebarButton.addEventListener('click', () => {
        sidebar.classList.toggle('minimized');
    });
}

// 🔹 Inicialização quando o conteúdo estiver pronto
document.addEventListener("DOMContentLoaded", () => {
    setupSidebar();
});
