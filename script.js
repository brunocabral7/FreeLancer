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

// Mostrar os campos desejados
function mostrarCampos() {
    let tipoCadastro = document.getElementById('tipo-cadastro').value;
    if (tipoCadastro === "pf") {
        document.getElementById('cpf').style.display = 'block';
        document.getElementById('cnpj').style.display = 'none';
        document.getElementById('nome-fantasia').style.display = 'none';
        document.getElementById('empresa').style.display = 'none'; 
        document.getElementById('descricao-empresa').style.display = 'none'; 
    } else if (tipoCadastro === "pj") {
        document.getElementById('cpf').style.display = 'none';
        document.getElementById('cnpj').style.display = 'block';
        document.getElementById('nome-fantasia').style.display = 'block';
        document.getElementById('empresa').style.display = 'none'; 
        document.getElementById('descricao-empresa').style.display = 'none'; 
    } else if (tipoCadastro === "cliente") {
        document.getElementById('cpf').style.display = 'none';
        document.getElementById('cnpj').style.display = 'none';
        document.getElementById('nome-fantasia').style.display = 'none';
        document.getElementById('empresa').style.display = 'block'; 
        document.getElementById('descricao-empresa').style.display = 'block'; 
    }
}

    document.addEventListener('DOMContentLoaded', function() {
    mostrarCampos(); 
});

// Validar números ter apenas numeros nos campos
function validarNumeros(event) {
    let campo = event.target;
    campo.value = campo.value.replace(/\D/g, '');
}

// Validação de texto ter apenas letras no campo
function validarTexto(event) {
    let campo = event.target;
    campo.value = campo.value.replace(/[^a-zA-Z\s]/g, '');
}

    function exibirMensagemErro(elemento, mensagem) {
    let errorElement = document.getElementById(`${elemento}-error`);
    if (errorElement) {
    errorElement.textContent = mensagem;
    errorElement.style.color = 'red';
    }
}

// Limpa as mensagens de erro
function limparMensagensErro() {
    const campos = ['name', 'email', 'password', 'phone', 'cep', 'rua', 'bairro', 'cidade', 'estado', 'numero', 'cpf', 'cnpj'];
    campos.forEach(campo => limparMensagemErro(campo));
}

// Limpa a mensagem de erro de um campo específico
function limparMensagemErro(elemento) {
    let errorElement = document.getElementById(`${elemento}-error`);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Função para traduzir erros do Firebase Authentication
function traduzirErro(errorCode) {
    const mensagens = {
        "auth/email-already-in-use": "Este email já está em uso. Tente outro.",
        "auth/invalid-email": "Email inválido. Verifique e tente novamente.",
        "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
        "auth/wrong-password": "Senha incorreta. Tente novamente.",
        "auth/user-not-found": "Usuário não encontrado. Verifique o email digitado.",
        "auth/too-many-requests": "Muitas tentativas falhas. Tente novamente mais tarde.",
        "auth/network-request-failed": "Erro de conexão. Verifique sua internet.",
        "auth/missing-password": "Digite uma senha.",
        "auth/invalid-credential": "As informações de Login fornecidas são inválidas.",
    };
    return mensagens[errorCode] || "Ocorreu um erro desconhecido.";
}

// Validação de CPF
function validarCPF(cpf) {
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) {
        soma += parseInt(cpf.charAt(i - 1)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
        soma += parseInt(cpf.charAt(i - 1)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    return true;
}

// Validação de CNPJ
function validarCNPJ(cnpj) {
    
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    let soma = 0, peso = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
        soma += parseInt(cnpj.charAt(i)) * peso[i + 1];
    }
    let resto = soma % 11;
    if (resto < 2) resto = 0; else resto = 11 - resto;
    if (resto !== parseInt(cnpj.charAt(12))) return false;

    soma = 0;
    for (let i = 0; i < 13; i++) {
        soma += parseInt(cnpj.charAt(i)) * peso[i];
    }
    resto = soma % 11;
    if (resto < 2) resto = 0; else resto = 11 - resto;
    if (resto !== parseInt(cnpj.charAt(13))) return false;
    return true;
}

// Validação de telefone
function validarTelefone(telefone) {
    
    return telefone.length === 11;
}

// Função para registrar usuário
function register() {
    let tipoCadastro = document.getElementById('tipo-cadastro').value;
    let name = document.getElementById('name').value;
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let phone = document.getElementById('phone').value;
    let cep = document.getElementById('cep').value;
    let rua = document.getElementById('rua').value;
    let bairro = document.getElementById('bairro').value;
    let cidade = document.getElementById('cidade').value;
    let estado = document.getElementById('estado').value;
    let numero = document.getElementById('numero').value;
    let cpf = document.getElementById('cpf').value;
    let cnpj = document.getElementById('cnpj').value;
    let nomeFantasia = document.getElementById('nome-fantasia').value;
    let empresa = document.getElementById('empresa').value;
    let descricaoEmpresa = document.getElementById('descricao-empresa').value;
    let statusElement = document.getElementById('status');

    let isValid = true;

    limparMensagensErro();


    if (!isValid) return;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            let user = userCredential.user;
            console.log("Usuário criado com sucesso:", user.uid);
            
            let userData = {
                name: name,
                email: email,
                phone: phone,
                address: {
                    cep: cep,
                    rua: rua,
                    bairro: bairro,
                    cidade: cidade,
                    estado: estado,
                    numero: numero
                },
                
            };

            if (tipoCadastro === "pf") {
                userData.cpf = cpf;
            } else if (tipoCadastro === "pj") {
                userData.cnpj = cnpj;
                userData.nomeFantasia = nomeFantasia;
            } else if (tipoCadastro === "cliente") {
                userData.empresa = document.getElementById('empresa').value;
                userData.descricaoEmpresa = descricaoEmpresa;
            }

            return db.collection("users").doc(user.uid).set(userData);
        })
        .then(() => {
            console.log("Dados do usuário salvos no Firestore!");
            alert("Cadastro realizado com sucesso!");
            window.location.href = "portfolios.html";
        })
        .catch(error => {
            console.log("Erro ao registrar:", error.code, error.message);
            alert(`Erro: ${error.message}`);
        });
}

// função para buscar o endereço pelo CEP usando a API ViaCEP
function buscarCEP() {
    let cep = document.getElementById('cep').value;
    let statusElement = document.getElementById('cep-error');

    document.getElementById('rua').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('estado').value = '';

    if (!cep || cep.length !== 8) {
        if (statusElement) statusElement.innerText = "CEP inválido!";
        return;
    }

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                if (statusElement) 
                    statusElement.innerText = "CEP não encontrado!";
                    
                return;
            }

            document.getElementById('rua').value = data.logradouro;
            document.getElementById('bairro').value = data.bairro;
            document.getElementById('cidade').value = data.localidade;
            document.getElementById('estado').value = data.uf;
            if (statusElement) {
                statusElement.innerText = "";
            }
        })
        .catch(() => {
            if (statusElement) statusElement.innerText = "Erro ao buscar o CEP.";
        });
}
// função de login
function login() {
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    let statusElement = document.getElementById('status'); 

    statusElement.textContent = '';

    // Validação para garantir que os campos não estejam vazios
    if (!email || !password) {
        statusElement.textContent = "Por favor, preencha todos os campos.";
        
        return;
    }

    // Realiza a autenticação do usuário com Firebase
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            
            console.log("Usuário logado com sucesso:", userCredential.user.uid);
            window.location.href = "portfolios.html";
        })
        .catch((error) => {
            // Trata o erro e exibe a mensagem
            console.log("Erro ao fazer login:", error.code, error.message);
            statusElement.textContent = traduzirErro(error.code);  
              
            
        });
        
}
//esqueci a senha
function resetPassword() {
    let email = document.getElementById('email').value;
    let statusElement = document.getElementById('reset-status');

    if (!email) {
        statusElement.textContent = "Digite seu email para redefinir a senha.";
        return;
    }
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            statusElement.textContent = "E-mail de redefinição enviado! Verifique sua caixa de entrada.";
            statusElement.style.color = 'green';
        })
        .catch((error) => {
            statusElement.textContent = traduzirErro(error.code);
            
        });
}
