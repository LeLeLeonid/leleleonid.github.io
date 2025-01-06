import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ffwexpayporxtkmuqbic.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_KEY'; // Замените на ваш ключ
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
let currentUserId = null; // UUID пользователя

// Восстановление сессии из localStorage при загрузке страницы
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

// Вход пользователя
async function login() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

    // Проверяем, не заблокирован ли пользователь
    const { data: bannedData } = await supabase
        .from('banned_users')
        .select('username')
        .eq('username', username);

    if (bannedData.length > 0) {
        alert('Вы заблокированы и не можете войти в чат.');
        return;
    }

    // Ищем пользователя в таблице users
    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashedPassword);

    if (error || userData.length === 0) {
        alert('Неправильный ник или пароль.');
        return;
    }

    // Устанавливаем текущего пользователя и его UUID
    currentUser = username;
    currentUserId = userData[0].id;
    currentUserDisplay.textContent = username;
    authSection.style.display = 'none';
    userPanel.style.display = 'block';
    chatSection.style.display = 'block';

    // Сохраняем данные пользователя в localStorage
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('currentUserId', currentUserId);

    loadMessages();
    setupRealtimeMessages();
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

function logout() {
    currentUser = null;
    currentUserId = null;
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

document.getElementById('login-btn').addEventListener('click', login);
document.getElementById('register-btn').addEventListener('click', register);
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('ban-btn').addEventListener('click', banUserPrompt);
document.getElementById('clear-chat-btn').addEventListener('click', clearChat);
document.getElementById('imageUpload').addEventListener('change', sendImage);


if (currentUser) {
    loadMessages();
    setupRealtimeMessages();
}

