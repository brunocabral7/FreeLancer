const firebaseConfig = {
  apiKey: "AIzaSyDev8I567_Rj4uvvvw_zZCgD7e2A2ci2O8",
  authDomain: "trampolivre.firebaseapp.com",
  projectId: "trampolivre",
  storageBucket: "trampolivre.appspot.com",
  messagingSenderId: "1089675684715",
  appId: "1:1089675684715:web:372181ef61dc92e76e7a2e",
  measurementId: "G-MLJMWDN3K2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
const profileUid = getUidFromUrl();

// RTL: pega UID da URL
function getUidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('uid');
}

// Carrega perfil público e portfólios
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (profileUid) loadPublicProfile(profileUid);
});

function loadPublicProfile(uid) {
  db.collection('users').doc(uid).get()
    .then(doc => {
      if (!doc.exists) return alert("Perfil não encontrado.");
      const data = doc.data();
      document.getElementById('profileName').textContent = data.name || '—';
      document.getElementById('phone').textContent = data.phone || '—';
      document.getElementById('email').textContent = data.email || '—';
      document.getElementById('linkedin').textContent = data.linkedin || '';
      document.getElementById('linkedin').href = data.linkedin || '#';
      document.getElementById('facebook').textContent = data.facebook || '';
      document.getElementById('facebook').href = data.facebook || '#';
      document.getElementById('instagram').textContent = data.instagram || '';
      document.getElementById('instagram').href = data.instagram || '#';
      if (data.profilePicBase64) document.getElementById('profilePic').src = data.profilePicBase64;

      loadUserPortfolios(uid);
      loadRatings(uid);
    })
    .catch(err => console.error("Erro ao carregar perfil:", err));
}

function loadUserPortfolios(uid) {
  db.collection('portfolios').where('uid', '==', uid).get()
    .then(snapshot => {
      const container = document.getElementById('userPortfolios');
      if (snapshot.empty) return container.innerHTML += '<p>Este usuário ainda não publicou portfólios.</p>';
      snapshot.forEach(doc => {
        const p = doc.data();
        const card = document.createElement('div');
        card.className = 'portfolio-card';
        card.innerHTML = `
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          ${p.imageBase64 ? `<img src="${p.imageBase64}" class="portfolio-image">` : ''}
        `;
        container.appendChild(card);
      });
    })
    .catch(err => console.error("Erro ao carregar portfólios:", err));
}

// Carrega avaliações e comentários
function loadRatings(uid) {
  db.collection('ratings').where('profileUid', '==', uid).get()
    .then(snapshot => {
      let total = 0, count = 0;
      const commentsList = document.getElementById('commentsList');
      commentsList.innerHTML = '';
      snapshot.forEach(doc => {
        const r = doc.data();
        total += r.stars;
        count++;
        const div = document.createElement('div');
        div.className = 'comment';
        div.innerHTML = `<strong>${r.reviewerName}</strong>: ${'★'.repeat(r.stars)}<br>${r.comment}`;
        commentsList.appendChild(div);
      });
      const avg = count ? (total / count).toFixed(1) : '—';
      document.getElementById('averageRating').textContent = `${avg} estrelas`;

      // Exibe formulário se usuário logado e não dono do perfil
      if (currentUser && currentUser.uid !== uid) {
        document.getElementById('ratingForm').style.display = 'block';
        document.getElementById('ratingForm').addEventListener('submit', submitRating);
      }
    })
    .catch(err => console.error("Erro ao carregar avaliações:", err));
}

// Envia avaliação
// Antes: usava auth.currentUser.displayName ou 'Usuário'
// Agora: busca o nome real do usuário logado na coleção "users"
async function submitRating(e) {
  e.preventDefault();
  if (!currentUser || currentUser.uid === profileUid) return;

  const stars = Number(document.querySelector('input[name="stars"]:checked').value);
  const comment = document.getElementById('commentText').value;
  const reviewId = `${profileUid}_${currentUser.uid}`;

  try {
    // → Novo: busca o documento do usuário para obter o nome salvo em Firestore
    const userDoc = await db.collection('users').doc(currentUser.uid).get();
    const reviewerName = userDoc.exists 
      ? userDoc.data().name 
      : (auth.currentUser.displayName || '—');

    const data = {
      profileUid,
      reviewerUid: currentUser.uid,
      reviewerName,              // ← usa o nome do Firestore
      stars,
      comment,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('ratings').doc(reviewId).set(data);
    loadRatings(profileUid);
  } catch (err) {
    console.error("Erro ao enviar avaliação:", err);
  }
}

function logout() {
  firebase.auth().signOut()
    .then(() => window.location.href = 'login.html')
    .catch(err => console.error("Erro ao sair:", err));
}

function setupSidebar() {
  const toggleSidebarButton = document.getElementById('toggle-sidebar');
  const sidebar = document.querySelector('.sidebar');
  toggleSidebarButton.addEventListener('click', () => sidebar.classList.toggle('minimized'));
}

document.addEventListener('DOMContentLoaded', () => setupSidebar());