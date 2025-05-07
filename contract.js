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
const db = firebase.firestore();
const auth = firebase.auth();

// Inicializa o EmailJS com a chave pública
emailjs.init("QxU-QJL3Q0-8zoh7b");

document.getElementById('contract-form').addEventListener('submit', async function (e) {
    e.preventDefault(); // Impede o envio do formulário tradicional

    const clientName = document.getElementById('client-name').value; // Nome do Cliente
    const clientEmail = document.getElementById('client-email').value; // E-mail do Cliente
    const contractDetails = document.getElementById('contract-details').value; // Detalhes do Contrato
    const contractValue = document.getElementById('contract-value').value; // Valor do Contrato
    const contractStart = document.getElementById('contract-start').value; // Data de Início
    const contractEnd = document.getElementById('contract-end').value; // Data de Término
    const acceptContract = document.getElementById('accept-contract').checked; // Aceitação dos Termos

    // Verifica se o contrato foi aceito
    if (!acceptContract) {
        alert('Você precisa aceitar os termos do contrato.');
        return;
    }
    
    // Verifica se a data de início é anterior à data de término
    if (new Date(contractStart) > new Date(contractEnd)) {
        alert('A data de início deve ser anterior à data de término.');
        return;
    }

    // Obtém os dados do usuário logado
    const user = auth.currentUser;
    if (!user) {
        alert('Erro: Nenhum usuário autenticado.');
        return;
    }

    // Puxa os dados do freelancer (nome, telefone, CPF) do Firestore
    let freelancerName = "Nome não encontrado";
    let freelancerPhone = "Telefone não encontrado";
    let freelancerCpf = "CPF não encontrado";
    let freelancerEmail = user.email;
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            freelancerName = userDoc.data().name || "Nome não encontrado";  // Nome
            freelancerPhone = userDoc.data().phone || "Telefone não encontrado";  // Telefone
            freelancerCpf = userDoc.data().cpf || "CPF não encontrado";  // CPF
        }
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
    }

    // Cria o documento PDF com jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Adiciona texto ao PDF
    doc.text('Contrato de Prestação de Serviço', 10, 10);
    doc.text(`Freelancer: ${freelancerName}`, 10, 20);
    doc.text(`Telefone: ${freelancerPhone}`, 10, 30);
    doc.text(`CPF: ${freelancerCpf}`, 10, 40);
    doc.text(`E-mail: ${user.email}`, 10, 50);
    doc.text(`Cliente: ${clientName}`, 10, 60);
    doc.text(`E-mail do Cliente: ${clientEmail}`, 10, 70);
    doc.text(`Valor do Contrato: R$ ${contractValue}`, 10, 80);
    doc.text(`Data de Início: ${contractStart}`, 10, 90);
    doc.text(`Data de Término: ${contractEnd}`, 10, 100);
    doc.text('Detalhes do Contrato:', 10, 110);
    doc.text(contractDetails, 10, 120);

    // Converte o PDF em Base64
    const pdfBase64 = doc.output('datauristring');

    // Armazenar contrato no Firestore
    try {
        const contractRef = await db.collection('contracts').add({
            client_name: clientName,
            client_email: clientEmail,
            freelancer_name: freelancerName,
            freelancer_email: freelancerEmail,
            freelancer_phone: freelancerPhone,
            freelancer_cpf: freelancerCpf,
            contract_value: contractValue,
            contract_start: contractStart,
            contract_end: contractEnd,
            contract_details: contractDetails,
            contract_pdf: pdfBase64,
            status: 'created',  // Status inicial do contrato
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log("Contrato criado com sucesso! ID:", contractRef.id);  // Log do ID do contrato

        // Enviar e-mail para o cliente com o ID do contrato
        emailjs.send("service_6xqi74x", "template_xapjvpg", {
            ...{
                client_name: clientName,
                freelancer_name: freelancerName,
                freelancer_phone: freelancerPhone,
                freelancer_cpf: freelancerCpf,
                freelancer_email: user.email,
                client_email: clientEmail,
                contract_value: contractValue,
                contract_start: contractStart,
                contract_end: contractEnd,
                contract_details: contractDetails,
                contract_pdf: pdfBase64,
                contract_id: contractRef.id  // Enviar o ID do contrato
            },
            to_email: clientEmail,
        })
        .then((response) => {
            console.log('E-mail enviado com sucesso para o cliente:', response);
            alert('Contrato enviado com sucesso para o cliente!');
        })
        .catch((error) => {
            console.error('Erro ao enviar e-mail para o cliente:', error);
            alert('Erro ao enviar o contrato. Verifique os dados e tente novamente.');
        });

        // Enviar e-mail para o freelancer com o ID do contrato
        emailjs.send("service_6xqi74x", "template_xapjvpg", {
            ...{
                client_name: clientName,
                freelancer_name: freelancerName,
                freelancer_phone: freelancerPhone,
                freelancer_cpf: freelancerCpf,
                freelancer_email: user.email,
                client_email: clientEmail,
                contract_value: contractValue,
                contract_start: contractStart,
                contract_end: contractEnd,
                contract_details: contractDetails,
                contract_pdf: pdfBase64,
                contract_id: contractRef.id 
            },
            to_email: user.email,
        })
        .then((response) => {
            console.log('E-mail enviado com sucesso para o freelancer:', response);
        })
        .catch((error) => {
            console.error('Erro ao enviar e-mail para o freelancer:', error);
        });

    } catch (error) {
        console.error("Erro ao salvar contrato no Firestore:", error);
        alert('Erro ao criar o contrato. Tente novamente.');
    }
    doc.save(`Contrato_${clientName}.pdf`);
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