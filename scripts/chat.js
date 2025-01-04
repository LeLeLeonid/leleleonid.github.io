const chatBox = document.getElementById('chat-box');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const regUsernameInput = document.getElementById('reg-username');
const regPasswordInput = document.getElementById('reg-password');
const currentUserDisplay = document.getElementById('current-user');
const authSection = document.getElementById('auth-section');
const userPanel = document.getElementById('user-panel');
const chatSection = document.getElementById('chat-section');
const colorInput = document.getElementById('color');
const banButton = document.getElementById('banButton');

let lastMessageTime = 0;
let currentUser = null;
const bannedUsers = [];

const superUsers = [
    {
        username: 'leleleonid',
        passwordHash: '3b11a134e2e65596f755f62c009da6295349bfb324ac9cffc0c2a8d9e7fdbe32'
    },
    {
        username: 'admin',
        passwordHash: 'da17f0b4c643f2357225a0bea05cb2681124ce1d0d533defd5d6ad1530b9c081'
    }
];

function isSuperUser(username, password) {
    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    const superUser = superUsers.find(user => user.username === username);
    if (superUser) {
        return superUser.passwordHash === hashedPassword;
    }
    return false;
}

function loadMessages() {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const linksState = JSON.parse(localStorage.getItem('linksEnabled'));
    chatBox.innerHTML = '';
    messages.forEach((chatMessage, index) => {
        const isSuperUserLogged = isSuperUser(currentUser, passwordInput.value);
        const deleteButton = isSuperUserLogged
            ? `<button class="superuser-button" onclick="deleteMessage(${index})">Удалить</button>`
            : '';
        const editButton = isSuperUserLogged
            ? `<button class="superuser-button" onclick="editMessage(${index})">Редактировать</button>`
            : '';
        const messageContent = linksState === false && chatMessage.isLink
            ? 'Ссылки отключены'
            : chatMessage.message;

        chatBox.innerHTML += `
            <p>
                <strong style="color:${chatMessage.color || '#000'}">${chatMessage.username}:</strong> 
                ${messageContent} 
                ${deleteButton} 
                ${editButton}
            </p>`;
    });
}

function register() {
    const regUsername = regUsernameInput.value.trim();
    const regPassword = regPasswordInput.value;
    const usernameRegex = /^[a-zA-Z0-9_.]+$/;

    if (!regUsername || !regPassword) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    if (!usernameRegex.test(regUsername)) {
        alert('Имя пользователя может содержать только латинские буквы, цифры, точки и подчеркивания.');
        return;
    }

    const users = JSON.parse(localStorage.getItem('chatUsers')) || {};

    if (users[regUsername]) {
        alert('Пользователь с таким именем уже существует. Выберите другой ник.');
        return;
    }
	
	if (regPassword.length < 6) {
		alert('Пароль должен содержать минимум 6 символов.');
        return;
    }

    const hashedPassword = CryptoJS.SHA256(regPassword).toString(CryptoJS.enc.Hex);
    users[regUsername] = { password: hashedPassword };
    localStorage.setItem('chatUsers', JSON.stringify(users));

    alert('Регистрация прошла успешно! Теперь вы можете войти.');
    regUsernameInput.value = '';
    regPasswordInput.value = '';
}

function login() {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username && password) {
        const users = JSON.parse(localStorage.getItem('chatUsers')) || {};
        const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

        if (bannedUsers.includes(username)) {
            alert('Вы заблокированы и не можете войти в чат.');
            return;
        }

        if (isSuperUser(username, password)) {
            alert('Добро пожаловать, вождь!');
            currentUser = username;
            currentUserDisplay.textContent = username;
            authSection.style.display = 'none';
            userPanel.style.display = 'block';
            chatSection.style.display = 'block';
            loadMessages();
            if (banButton) banButton.style.display = 'inline';
        } else if (users[username] && users[username].password === hashedPassword) {
            // alert('Добро пожаловать в чат!');
            currentUser = username;
            currentUserDisplay.textContent = username;
            authSection.style.display = 'none';
            userPanel.style.display = 'block';
            chatSection.style.display = 'block';
            loadMessages();
            if (banButton) banButton.style.display = 'none';
        } else {
            alert('Неправильный ник или пароль.');
        }
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
}

function logout() {
    currentUser = null;
    authSection.style.display = 'block';
    userPanel.style.display = 'none';
    chatSection.style.display = 'none';
    if (banButton) banButton.style.display = 'none';
}

function sendMessage() {
    const message = document.getElementById('message').value.trim();
    const currentTime = new Date().getTime();

    if (currentUser && message) {
        if (currentTime - lastMessageTime < 10000) {
            alert('Пожалуйста, подождите 10 секунд перед отправкой следующего сообщения.');
            return;
        }

        const isLink = message.startsWith('http://') || message.startsWith('https://');
        const chatMessage = {
            username: currentUser,
            message: isLink ? `<a href="${message}" target="_blank">${message}</a>` : message,
            color: colorInput.value,
            isLink: isLink
        };

        const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        messages.push(chatMessage);
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        loadMessages();
        document.getElementById('message').value = '';
        lastMessageTime = currentTime;
    } else {
        alert('Введите сообщение.');
    }
}
function sendImage() {
    const fileInput = document.getElementById('imageUpload');
    const _currentTime = new Date().getTime();
    const file = fileInput.files[0];
    if (currentUser && fileInput) {
        if (_currentTime - lastMessageTime < 10000) {
            alert('Пожалуйста, подождите 10 секунд перед отправкой следующего сообщения.');
            return;
        }

        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const imageSrc = event.target.result;
                const chatMessage = {
                    username: currentUser,
                    message: `<img src="${imageSrc}" style="max-width: 200px; max-height: 200px;">`,
                    color: colorInput.value
                };
                const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
                messages.push(chatMessage);
                localStorage.setItem('chatMessages', JSON.stringify(messages));
                loadMessages();
                lastMessageTime = _currentTime;
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        } else {
            alert("Выберите изображение для отправки.");
        }
    }
}
function editMessage(index) {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const currentMessage = messages[index];
    const newMessage = prompt('Введите новое сообщение:', currentMessage.message.replace(/<a.*?>(.*?)<\/a>/, '$1'));
    if (newMessage) {
        if (newMessage.startsWith('http://') || newMessage.startsWith('https://')) {
            currentMessage.message = `<a href="${newMessage}" target="_blank">${newMessage}</a>`;
            currentMessage.isLink = true;
        } else {
            currentMessage.message = newMessage;
            currentMessage.isLink = false;
        }
        messages[index] = currentMessage;
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        loadMessages();
    } else {
        alert('Сообщение не может быть пустым.');
    }
}

function editLink(index) {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const newLink = prompt('Введите новую ссылку:', messages[index].message.replace(/<a.*?>(.*?)<\/a>/, '$1'));
    if (newLink && (newLink.startsWith('http://') || newLink.startsWith('https://'))) {
        messages[index].message = `<a href="${newLink}" target="_blank">${newLink}</a>`;
        localStorage.setItem('chatMessages', JSON.stringify(messages));
        loadMessages();
    } else {
        alert('Недопустимая ссылка.');
    }
}
function deleteMessage(index) {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    messages.splice(index, 1);
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    loadMessages();
}
function clearChat() {
    if (!isSuperUser(currentUser, passwordInput.value)) {
        alert('У вас нет прав для очистки чата.');
        return;
    }

    localStorage.removeItem('chatMessages');
    loadMessages();
    alert('Чат был очищен!');
}

function banUserPrompt() {
    const usernameToBan = prompt('Введите имя пользователя для бана:');
    if (usernameToBan) {
        banUser(usernameToBan);
    }
}

function banUser(username) {
    if (!isSuperUser(currentUser, passwordInput.value)) {
        alert('У вас нет прав для бана пользователей.');
        return;
    }

    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    const updatedMessages = messages.filter(message => message.username !== username);
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));

    if (!bannedUsers.includes(username)) {
        bannedUsers.push(username);
        alert(`Пользователь ${username} был заблокирован и его сообщения удалены.`);
    } else {
        alert(`Пользователь ${username} уже заблокирован.`);
    }

    loadMessages();
}

window.onload = loadMessages;