function createSnowflakes(numFlakes) {
    const container = document.body;

    for (let i = 0; i < numFlakes; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');

        snowflake.style.left = `${Math.random() * 100}vw`;
        snowflake.style.animationDuration = `${Math.random() * 10 + 5}s`; // Анимация длится от 5 до 15 секунд
        snowflake.style.opacity = Math.random() * 0.5 + 0.3; // Прозрачность от 0.3 до 0.8

        snowflake.style.transform = `translateY(${Math.random() * 100}vh)`;

        container.appendChild(snowflake);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    createSnowflakes(150);
});