function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    if (username && password) {
        const hashedPassword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        const users = JSON.parse(localStorage.getItem('chatUsers')) || {};
        if (users[username]) {
            alert('Пользователь с таким ником уже существует.');
        } else {
            users[username] = hashedPassword;
            localStorage.setItem('chatUsers', JSON.stringify(users));
            alert('Регистрация успешна!');
        }
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
}
