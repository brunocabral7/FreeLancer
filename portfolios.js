const firebaseConfig = {
  apiKey: "AIzaSyDev8I567_Rj4uvvvw_zZCgD7e2A2ci2O8",
  authDomain: "trampolivre.firebaseapp.com",
  projectId: "trampolivre",
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const portfolioList = document.getElementById('portfolioList');
const searchInput = document.getElementById('searchInput');
const portfolioFormSection = document.getElementById('portfolioFormSection');
const portfolioForm = document.getElementById('portfolioForm');

let allPortfolios = [];
let currentUser = null;
let editingPortfolioId = null;

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

auth.onAuthStateChanged(user => {
  currentUser = user;

  if (user) {
    portfolioFormSection.style.display = 'block';

    portfolioForm.addEventListener('submit', async e => {
      e.preventDefault();

      const title = document.getElementById('portfolioTitle').value;
      const description = document.getElementById('portfolioDescription').value;
      const file = document.getElementById('portfolioImage').files[0];

      const userDoc = await db.collection('users').doc(user.uid).get();
      const data = userDoc.data();

      let base64Image = '';
      if (file) {
        base64Image = await toBase64(file);
      }

      const portfolioData = {
        uid: user.uid,
        userName: data.name || 'Usuário',
        userPhoto: data.profilePicBase64 || 'default-profile.png',
        title,
        description,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (base64Image) {
        portfolioData.imageBase64 = base64Image;
      }

      if (editingPortfolioId) {
        await db.collection('portfolios').doc(editingPortfolioId).update(portfolioData);
        editingPortfolioId = null;
      } else {
        portfolioData.imageBase64 = base64Image;
        await db.collection('portfolios').add(portfolioData);
      }

      portfolioForm.reset();
      cancelEditBtn.style.display = 'none';
      editingPortfolioId = null;
      loadPortfolios();;
    });
  }

  loadPortfolios();
});

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

searchInput.addEventListener('input', () => {
  const rawTerm = searchInput.value.toLowerCase();
  const term = removeAccents(rawTerm);

  const filtered = allPortfolios.filter(p => {
    const t = removeAccents(p.title.toLowerCase());
    const d = removeAccents(p.description.toLowerCase());
    const u = removeAccents(p.userName.toLowerCase());

    return t.includes(term) || d.includes(term) || u.includes(term);
  });

  renderPortfolios(filtered);
});

function loadPortfolios() {
  db.collection('portfolios')
    .orderBy('createdAt', 'desc')
    .get()
    .then(snapshot => {
      allPortfolios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderPortfolios(allPortfolios);
    });
}

async function renderPortfolios(portfolios) {
  portfolioList.innerHTML = '';

  if (portfolios.length === 0) {
    portfolioList.innerHTML = '<p>Nenhum portfólio encontrado.</p>';
    return;
  }

  for (let p of portfolios) {
    // pega a foto mais recente do usuário
    const userDoc = await db.collection('users').doc(p.uid).get();
    const userData = userDoc.data();
    const userPhoto = userData.profilePicBase64 || 'default-profile.png';
    const userName  = userData.name             || p.userName;

    const card = document.createElement('div');
    card.className = 'portfolio-card';
    card.innerHTML = `
      <div class="user-info">
        <img src="${userPhoto}" class="user-photo" alt="Foto de ${userName}" />
        <a href="perfil-publico.html?uid=${p.uid}" class="user-name">${userName}</a>
      </div>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      ${p.imageBase64 ? `<img src="${p.imageBase64}" class="portfolio-image" alt="Imagem do portfólio">` : ''}
      ${currentUser && currentUser.uid === p.uid ? `
        <div class="actions">
          <button onclick="editPortfolio('${p.id}')">Editar</button>
          <button onclick="deletePortfolio('${p.id}')">Excluir</button>
        </div>
      ` : ''}
    `;
    portfolioList.appendChild(card);
  }
}
const cancelEditBtn = document.getElementById('cancelEditBtn');
// Mostrar formulário preenchido ao editar
function editPortfolio(id) {
  const portfolio = allPortfolios.find(p => p.id === id);
  if (!portfolio) return;

  document.getElementById('portfolioTitle').value = portfolio.title;
  document.getElementById('portfolioDescription').value = portfolio.description;
  editingPortfolioId = id;

  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cancelar edição
cancelEditBtn.addEventListener('click', () => {
  editingPortfolioId = null;
  portfolioForm.reset();
  cancelEditBtn.style.display = 'none';
});
function deletePortfolio(id) {
  if (confirm('Tem certeza que deseja excluir este portfólio?')) {
    db.collection('portfolios').doc(id).delete().then(() => {
      loadPortfolios();
    });
  }
}

function logout() {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = "login.html";
    })
    .catch(error => {
      console.error("Erro ao sair:", error);
      alert("Erro ao sair. Tente novamente.");
    });
}

function setupSidebar() {
  const toggleSidebarButton = document.getElementById('toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');

  toggleSidebarButton.addEventListener('click', () => {
    sidebar.classList.toggle('minimized');
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
});