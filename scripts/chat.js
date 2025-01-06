import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ffwexpayporxtkmuqbic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmd2V4cGF5cG9yeHRrbXVxYmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMTc5NDMsImV4cCI6MjA1MTU5Mzk0M30.hfL3fDuwagm1-8GKof5LoUd6d6CoVA1oVEnByT-wWOI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Получаем элементы DOM
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
const imageUploadInput = document.getElementById('imageUpload');

let lastMessageTime = 0;
let currentUser = null;

// Регистрация пользователя
async function register() {
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

    if (regPassword.length < 6) {
        alert('Пароль должен содержать минимум 6 символов.');
        return;
    }

    const hashedPassword = CryptoJS.SHA256(regPassword).toString(CryptoJS.enc.Hex);

    const { data, error } = await supabase
        .from('users')
        .insert([{ username: regUsername, password_hash: hashedPassword }]);

    if (error) {
        if (error.code === '23505') {
            alert('Пользователь с таким именем уже существует. Выберите другой ник.');
        } else {
            console.error('Ошибка регистрации:', error);
        }
        return;
    }

    alert('Регистрация прошла успешно! Теперь вы можете войти.');
    regUsernameInput.value = '';
    regPasswordInput.value = '';
}

// Вход пользователя
async function login() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

    const { data: bannedData } = await supabase
        .from('banned_users')
        .select('username')
        .eq('username', username);

    if (bannedData.length > 0) {
        alert('Вы заблокированы и не можете войти в чат.');
        return;
    }

    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashedPassword);

    if (error || userData.length === 0) {
        alert('Неправильный ник или пароль.');
        return;
    }

    currentUser = username;
    currentUserDisplay.textContent = username;
    authSection.style.display = 'none';
    userPanel.style.display = 'block';
    chatSection.style.display = 'block';
    loadMessages();
}

// Отправка сообщения
async function sendMessage() {
    const message = document.getElementById('message').value.trim();
    const currentTime = new Date().getTime();

    if (!currentUser || !message) {
        alert('Введите сообщение.');
        return;
    }

    if (currentTime - lastMessageTime < 10000) {
        alert('Пожалуйста, подождите 10 секунд перед отправкой следующего сообщения.');
        return;
    }

    const isLink = message.startsWith('http://') || message.startsWith('https://');

    const { data, error } = await supabase
        .from('message')
        .insert([{
            username: currentUser,
            message: isLink ? `<a href="${message}" target="_blank">${message}</a>` : message,
            color: colorInput.value,
            is_link: isLink
        }]);

    if (error) {
        console.error('Ошибка отправки сообщения:', error);
        return;
    }

    document.getElementById('message').value = '';
    lastMessageTime = currentTime;
    loadMessages();
}

// Отправка изображения
async function sendImage() {
    const file = imageUploadInput.files[0];
    const currentTime = new Date().getTime();

    if (!currentUser || !file) {
        alert('Выберите изображение для отправки.');
        return;
    }

    if (currentTime - lastMessageTime < 10000) {
        alert('Пожалуйста, подождите 10 секунд перед отправкой следующего сообщения.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const imageSrc = event.target.result;

        const { data, error } = await supabase
            .from('message')
            .insert([{
                username: currentUser,
                message: `<img src="${imageSrc}" style="max-width: 200px; max-height: 200px;">`,
                color: colorInput.value,
                is_link: false
            }]);

        if (error) {
            console.error('Ошибка отправки изображения:', error);
            return;
        }

        lastMessageTime = currentTime;
        loadMessages();
    };

    reader.readAsDataURL(file);
    imageUploadInput.value = '';
}

// Загрузка сообщений
async function loadMessages() {
    const { data: messages, error } = await supabase
        .from('message')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Ошибка загрузки сообщений:', error);
        return;
    }

    chatBox.innerHTML = '';
    messages.forEach(chatMessage => {
        const messageContent = chatMessage.is_link
            ? `<a href="${chatMessage.message}" target="_blank">${chatMessage.message}</a>`
            : chatMessage.message;

        chatBox.innerHTML += `
            <p>
                <strong style="color:${chatMessage.color || '#000'}">${chatMessage.username}:</strong> 
                ${messageContent}
            </p>`;
    });
}

// Бан пользователя
async function banUserPrompt() {
    const usernameToBan = prompt('Введите имя пользователя для бана:');
    if (usernameToBan) {
        banUser(usernameToBan);
    }
}

async function banUser(username) {
    const { data, error } = await supabase
        .from('banned_users')
        .insert([{ username }]);

    if (error) {
        console.error('Ошибка бана пользователя:', error);
        return;
    }

    await supabase
        .from('message')
        .delete()
        .eq('username', username);

    alert(`Пользователь ${username} был заблокирован и его сообщения удалены.`);
    loadMessages();
}

// Очистка чата
async function clearChat() {
    const { error } = await supabase
        .from('message')
        .delete();

    if (error) {
        console.error('Ошибка очистки чата:', error);
        return;
    }

    alert('Чат был очищен!');
    loadMessages();
}

// Выход пользователя
function logout() {
    currentUser = null;
    authSection.style.display = 'block';
    userPanel.style.display = 'none';
    chatSection.style.display = 'none';
    currentUserDisplay.textContent = '';
}

window.register = register;
window.login = login;
window.sendMessage = sendMessage;
window.sendImage = sendImage;
window.clearChat = clearChat;
window.logout = logout;
window.banUserPrompt = banUserPrompt;