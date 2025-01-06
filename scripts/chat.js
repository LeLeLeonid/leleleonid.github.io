import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ffwexpayporxtkmuqbic.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmd2V4cGF5cG9yeHRrbXVxYmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYwMTc5NDMsImV4cCI6MjA1MTU5Mzk0M30.hfL3fDuwagm1-8GKof5LoUd6d6CoVA1oVEnByT-wWOI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function register() {
    const regUsername = regUsernameInput.value.trim();
    const regPassword = regPasswordInput.value;

    if (!regUsername || !regPassword) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    if (!/^[a-zA-Z0-9_.]+$/.test(regUsername)) {
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
            alert('Пользователь с таким именем уже существует.');
        } else {
            alert('Ошибка регистрации: ' + error.message);
        }
    } else {
        alert('Регистрация прошла успешно!');
        regUsernameInput.value = '';
        regPasswordInput.value = '';
    }
}

async function login() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        alert('Пожалуйста, заполните все поля.');
        return;
    }

    const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

    const { data: bannedUser } = await supabase
        .from('banned_users')
        .select('*')
        .eq('username', username)
        .single();

    if (bannedUser) {
        alert('Вы заблокированы и не можете войти в чат.');
        return;
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', hashedPassword)
        .single();

    if (error || !user) {
        alert('Неправильный ник или пароль.');
    } else {
        currentUser = username;
        currentUserDisplay.textContent = username;
        authSection.style.display = 'none';
        userPanel.style.display = 'block';
        chatSection.style.display = 'block';
        loadMessages();
    }
}

async function loadMessages() {
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Ошибка загрузки сообщений:', error.message);
        return;
    }

    chatBox.innerHTML = '';
    messages.forEach((chatMessage, index) => {
        const isSuperUserLogged = isSuperUser(currentUser, passwordInput.value);
        const deleteButton = isSuperUserLogged
            ? `<button class="superuser-button" onclick="deleteMessage('${chatMessage.id}')">Удалить</button>`
            : '';
        const editButton = isSuperUserLogged
            ? `<button class="superuser-button" onclick="editMessage('${chatMessage.id}')">Редактировать</button>`
            : '';
        const messageContent = chatMessage.is_link
            ? `<a href="${chatMessage.message}" target="_blank">${chatMessage.message}</a>`
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

    const { error } = await supabase.from('messages').insert([{
        username: currentUser,
        message: isLink ? message : message,
        color: colorInput.value,
        is_link: isLink
    }]);

    if (error) {
        console.error('Ошибка отправки сообщения:', error.message);
    } else {
        loadMessages();
        document.getElementById('message').value = '';
        lastMessageTime = currentTime;
    }
}

async function deleteMessage(messageId) {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

    if (error) {
        console.error('Ошибка удаления сообщения:', error.message);
    } else {
        loadMessages();
    }
}