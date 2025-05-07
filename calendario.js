// Config Firebase
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

let calendar;

auth.onAuthStateChanged(user => {
  if (user) {
    inicializarCalendario(user.uid);
  } else {
    window.location.href = "login.html";
  }
});

function inicializarCalendario(uid) {
  let calendarEl = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 'auto',
    locale: 'pt-br',
    editable: true,
    selectable: true,
    displayEventTime: false,
    select: function (info) {
      Swal.fire({
        title: 'Nova Tarefa',
        input: 'text',
        inputLabel: 'Título da tarefa',
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
      }).then(result => {
        if (result.isConfirmed && result.value) {
          const novaTarefa = {
            title: result.value,
            start: info.startStr,
            end: info.endStr,
            uid: uid
          };
          db.collection("calendarios").add(novaTarefa)
            .then(docRef => {
              novaTarefa.id = docRef.id;
              calendar.addEvent(novaTarefa);
            });
        }
      });
    },
    eventClick: function (info) {
      Swal.fire({
        title: 'Remover Tarefa?',
        text: info.event.title,
        showCancelButton: true,
        confirmButtonText: 'Remover',
        cancelButtonText: 'Cancelar'
      }).then(result => {
        if (result.isConfirmed) {
          db.collection("calendarios").doc(info.event.id).delete()
            .then(() => {
              info.event.remove();
            });
        }
      });
    },
    eventDrop: function (info) {
      const event = info.event;
      const updatedData = {
        start: event.start.toISOString(),
        end: event.end ? event.end.toISOString() : null
      };

      db.collection("calendarios").doc(event.id).update(updatedData)
        .then(() => {
          console.log("Evento atualizado com sucesso.");
        })
        .catch(error => {
          console.error("Erro ao atualizar o evento:", error);
        });
    }
  });

  calendar.render();

  // Carregar eventos do Firestore
  db.collection("calendarios")
    .where("uid", "==", uid)
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        let data = doc.data();
        data.id = doc.id;
        calendar.addEvent(data);
      });
    });
}
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

function logout() {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
}