import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ffwexpayporxtkmuqbic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmd2V4cGF5cG9yeHRrbXVxYmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMTc5NDMsImV4cCI6MjA1MTU5Mzk0M30.hfL3fDuwagm1-8GKof5LoUd6d6CoVA1oVEnByT-wWOI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM полностью загружен');
    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('clear-chat-btn').addEventListener('click', clearChat);
    document.getElementById('imageUpload').addEventListener('change', sendImage);
    console.log("Обработчики событий добавлены");
});

let lastMessageTime = 0;
let currentUser = null;
let currentUserId = null;

const savedUser = localStorage.getItem('currentUser');
const savedUserId = localStorage.getItem('currentUserId');

if (savedUser && savedUserId) {
    currentUser = savedUser;
    currentUserId = savedUserId;
    currentUserDisplay.textContent = currentUser;
    authSection.style.display = 'none';
    userPanel.style.display = 'block';
    chatSection.style.display = 'block';
    loadMessages();
    setupRealtimeMessages();
}

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

    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ username: regUsername, password_hash: hashedPassword }]);

        if (error) {
            if (error.code === '23505') {
                alert('Пользователь с таким именем уже существует.');
            } else {
                console.error('Ошибка регистрации:', error);
                alert('Произошла ошибка при регистрации.');
            }
            return;
        }

        alert('Регистрация прошла успешно!');
        regUsernameInput.value = '';
        regPasswordInput.value = '';
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        alert('Произошла ошибка при регистрации.');
    }
}

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
    currentUserId = userData[0].id;
    currentUserDisplay.textContent = username;
    authSection.style.display = 'none';
    userPanel.style.display = 'block';
    chatSection.style.display = 'block';

    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('currentUserId', currentUserId);

    loadMessages();
    setupRealtimeMessages();
}

async function setupRealtimeMessages() {
    const channel = supabase.channel('public:message')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message' }, payload => {
            loadMessages();
        })
        .subscribe();
}

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
            id: currentUserId,  // Используем UUID пользователя
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

    const fileName = `${currentUser}_${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Ошибка загрузки изображения:', uploadError);
        return;
    }

    const imageUrl = supabase.storage.from('chat-images').getPublicUrl(fileName).publicURL;

    const { data: messageData, error: messageError } = await supabase
        .from('message')
        .insert([{
            id: currentUserId,
            username: currentUser,
            message: `<img src="${imageUrl}" style="max-width: 200px; max-height: 200px;">`,
            color: colorInput.value,
            is_link: false
        }]);

    if (messageError) {
        console.error('Ошибка отправки изображения:', messageError);
        return;
    }

    lastMessageTime = currentTime;
    loadMessages();
    imageUploadInput.value = '';
}

async function loadMessages() {
    const { data: messages, error } = await supabase
        .from('message')
        .select('*')
        .order('created_at', { ascending: true });

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

    chatBox.scrollTop = chatBox.scrollHeight;
}

async function banUser(username) {
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username);

    if (userError || userData.length === 0) {
        alert('Пользователь не найден.');
        return;
    }

    const userId = userData[0].id;

    const { error: banError } = await supabase
        .from('banned_users')
        .insert([{ id: userId, username }]);

    if (banError) {
        console.error('Ошибка бана пользователя:', banError);
        return;
    }

    // Удаляем все сообщения забаненного пользователя
    await supabase
        .from('message')
        .delete()
        .eq('id', userId);

    alert(`Пользователь ${username} был заблокирован, и его сообщения удалены.`);
    loadMessages();
}

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

function logout() {
    currentUser = null;
    currentUserId = null;

    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');

    authSection.style.display = 'block';
    userPanel.style.display = 'none';
    chatSection.style.display = 'none';
    currentUserDisplay.textContent = '';
}

async function banUserPrompt() {
    const usernameToBan = prompt('Введите имя пользователя для бана:');
    if (usernameToBan) {
        await banUser(usernameToBan);
    }
}

if (currentUser) {
    loadMessages();
    setupRealtimeMessages();
}

window.login = login;
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.sendImage = sendImage;
window.logout = logout;