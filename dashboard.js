// Inicialização do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDev8I567_Rj4uvvvw_zZCgD7e2A2ci2O8",
  authDomain: "trampolivre.firebaseapp.com",
  projectId: "trampolivre",
  storageBucket: "trampolivre.firebasestorage.app",
  messagingSenderId: "1089675684715",
  appId: "1:1089675684715:web:372181ef61dc92e76e7a2e",
  measurementId: "G-MLJMWDN3K2"
};
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Função para cadastrar portfólio
function cadastrarPortfolio(event) {
  event.preventDefault();

  const portfolioText = document.getElementById('portfolio').value.trim();
  const user = auth.currentUser;

  if (!portfolioText) {
      alert("Por favor, insira uma descrição para o seu portfólio.");
      return;
  }

  // Salva o portfólio no Firestore
  db.collection("users").doc(user.uid).update({
      portfolio: portfolioText
  })
  .then(() => {
      alert("Portfólio cadastrado com sucesso!");
      exibirPortfolios();
  })
  .catch(error => {
      console.error("Erro ao cadastrar portfólio: ", error);
      alert("Erro ao cadastrar portfólio. Tente novamente.");
  });
}

// Função para exibir portfólios de todos os usuários
function exibirPortfolios() {
  db.collection("users").get()
      .then(snapshot => {
          const portfoliosList = document.getElementById('portfolios-list');
          portfoliosList.innerHTML = '';  // Limpar lista atual

          snapshot.forEach(doc => {
              const userData = doc.data();
              if (userData.portfolio) {
                  const portfolioItem = document.createElement('div');
                  portfolioItem.classList.add('portfolio-item');
                  portfolioItem.innerHTML = `
                      <h3>${userData.name}</h3>
                      <p>${userData.portfolio}</p>
                  `;

                  // Adicionar evento de clique para exibir os detalhes do usuário
                  portfolioItem.onclick = () => exibirDetalhesUsuario(doc.id);

                  portfoliosList.appendChild(portfolioItem);
              }
          });
      })
      .catch(error => {
          console.error("Erro ao carregar portfólios: ", error);
      });
}

// Função para exibir os detalhes do usuário no modal
function exibirDetalhesUsuario(userId) {
  db.collection("users").doc(userId).get()
      .then(doc => {
          const userData = doc.data();
          document.getElementById('user-name').textContent = userData.name;
          document.getElementById('user-email').textContent = userData.email;
          document.getElementById('user-phone').textContent = userData.phone;
          document.getElementById('user-portfolio').textContent = userData.portfolio;

          // Exibir o modal
          document.getElementById('user-details-modal').style.display = "block";
      })
      .catch(error => {
          console.error("Erro ao carregar os detalhes do usuário: ", error);
      });
}

// Função para fechar o modal
function fecharModal() {
  document.getElementById('user-details-modal').style.display = "none";
}

// Carrega os portfólios ao iniciar a página
document.addEventListener("DOMContentLoaded", () => {
  exibirPortfolios();
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
