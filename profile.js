const firebaseConfig = {
  apiKey: "AIzaSyDev8I567_Rj4uvvvw_zZCgD7e2A2ci2O8",
  authDomain: "trampolivre.firebaseapp.com",
  projectId: "trampolivre",
  storageBucket: "trampolivre.appspot.com",
  messagingSenderId: "1089675684715",
  appId: "1:1089675684715:web:372181ef61dc92e76e7a2e",
  measurementId: "G-MLJMWDN3K2"
};
// Inicializa Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

const profilePicImg = document.getElementById('profilePic');
const profilePicInput = document.getElementById('profilePicInput');
const profileForm = document.getElementById('profileForm');
const statusMessage = document.getElementById('statusMessage');

// Quando o auth state mudar, carrega perfil se logado
auth.onAuthStateChanged(user => {
if (user) {
  loadUserProfile(user.uid);
} else {
  // Redireciona para login se não estiver autenticado
  window.location.href = 'login.html';
}
});

// Carrega dados do Firestore e exibe
function loadUserProfile(uid) {
  // Referências aos elementos de foto e nome
  const profilePicImg   = document.getElementById('profilePic');
  const profileNameEl   = document.getElementById('profileName');

  db.collection('users').doc(uid).get()
    .then(doc => {
      if (doc.exists) {
        const data = doc.data();

        // Exibe o nome do usuário
        profileNameEl.textContent = data.name || '—';

        // Preenche campos de contato
        document.getElementById('phone').value = data.phone || '';

        // Redes sociais
        document.getElementById('linkedin').value  = data.linkedin  || '';
        document.getElementById('facebook').value  = data.facebook  || '';
        document.getElementById('instagram').value = data.instagram || '';

        // Foto de perfil (base64 ou default)
        if (data.profilePicBase64) {
          profilePicImg.src = data.profilePicBase64;
        } else {
          profilePicImg.src = 'default-profile.png';
        }
      }
    })
    .catch(err => console.error('Erro ao carregar perfil:', err));
}

// Função para comprimir imagem
function compressImage(file, maxWidth, maxHeight, callback) {
const img = new Image();
const reader = new FileReader();

reader.onload = (e) => {
  img.src = e.target.result;
};

img.onload = () => {
  let width = img.width;
  let height = img.height;

  // Calcula a nova dimensão
  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
  }

  // Cria um canvas para desenhar a imagem comprimida
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  // Converte para Base64 e chama o callback
  const compressedBase64 = canvas.toDataURL(file.type);
  callback(compressedBase64);
};

reader.readAsDataURL(file); // Lê a imagem
}

// Enviar novo perfil
profileForm.addEventListener('submit', e => {
e.preventDefault();
const user = auth.currentUser;
if (!user) return;

// Coleta valores
const phone = document.getElementById('phone').value;
const linkedin = document.getElementById('linkedin').value;
const facebook = document.getElementById('facebook').value;
const instagram = document.getElementById('instagram').value;

  // Verifica se o telefone tem 11 dígitos
  const phoneRegex = /^\d{11}$/; // Apenas números, 11 dígitos
  if (!phoneRegex.test(phone)) {
    statusMessage.textContent = 'O telefone deve ter 11 dígitos.';
    statusMessage.style.color = 'red';
    return; // Impede o envio do formulário
  }
// Atualiza Firestore
db.collection('users').doc(user.uid).update({
  phone,
  linkedin,
  facebook,
  instagram
})
.then(() => {
  statusMessage.textContent = 'Perfil atualizado com sucesso!';
  statusMessage.style.color = 'green';
})
.catch(err => {
  console.error('Erro ao atualizar perfil:', err);
  statusMessage.textContent = 'Erro ao atualizar perfil.';
  statusMessage.style.color = 'red';
});
});

// Upload e compressão de foto de perfil
profilePicInput.addEventListener('change', e => {
const file = e.target.files[0];
const user = auth.currentUser;
if (!file || !user) return;

// Comprime a imagem antes de armazenar
compressImage(file, 300, 300, (compressedBase64) => {
  db.collection('users').doc(user.uid).update({
    profilePicBase64: compressedBase64
  })
  .then(() => {
    profilePicImg.src = compressedBase64; // Exibe a imagem comprimida
    statusMessage.textContent = 'Foto de perfil atualizada!';
    statusMessage.style.color = 'green';
  })
  .catch(err => {
    console.error('Erro ao salvar imagem:', err);
    statusMessage.textContent = 'Erro ao salvar imagem.';
    statusMessage.style.color = 'red';
  });
});
});
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

//  Inicialização quando o conteúdo estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
});
