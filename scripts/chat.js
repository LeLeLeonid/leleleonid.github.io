const chatBox = document.getElementById('chat-box');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const colorInput = document.getElementById('color');
const messageInput = document.getElementById('message');

let lastMessageTime = 0;
let lastClearTime = 0;

function loadMessages() {
    const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
    chatBox.innerHTML = '';
    messages.forEach(chatMessage => {
        chatBox.innerHTML += `<p><strong style="color:${chatMessage.color}">${chatMessage.username}:</strong> ${chatMessage.message}</p>`;
    });
}

function sendMessage() {
    const username = usernameInput.value;
    const password = passwordInput.value;
    const color = colorInput.value;
    const message = messageInput.value;
    const currentTime = new Date().getTime();

    if (currentTime - lastMessageTime < 30000) { // 30 секунд
        alert('Пожалуйста, подождите 30 секунд перед отправкой следующего сообщения.');
        return;
    }

    if (username && password && message) {
        const users = JSON.parse(localStorage.getItem('chatUsers')) || {};
        const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

        if (users[username] && users[username] === hashedPassword) {
            const chatMessage = { username, message, color };
            const messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
            messages.push(chatMessage);
            localStorage.setItem('chatMessages', JSON.stringify(messages));
            loadMessages();
            messageInput.value = '';
            lastMessageTime = currentTime;
        } else {
            alert('Вы неправильно ввели Ник/Пароль или Аккаунт не существует.');
        }
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
}

function clearChat() {
    const currentTime = new Date().getTime();

    if (currentTime - lastClearTime < 300000) { // 5 минут
        alert('Пожалуйста, подождите 5 минут перед следующей очисткой чата.');
        return;
    }

    localStorage.removeItem('chatMessages');
    loadMessages();
    lastClearTime = currentTime;
}

window.onload = loadMessages;
