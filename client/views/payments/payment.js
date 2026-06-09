// 1. Timer logic
function startTimer(duration, display) {
    let timer = duration, minutes, seconds;
    setInterval(() => {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            timer = 0;
            // Handle timeout here
        }
    }, 1000);
}

// 2. Selection logic
const paymentCards = document.querySelectorAll('.payment-card');

paymentCards.forEach(card => {
    card.addEventListener('click', () => {
        // Remove active class from all
        paymentCards.forEach(c => {
            c.classList.remove('active');
            c.querySelector('.radio-circle').classList.remove('checked');
            c.querySelector('.radio-circle').textContent = "";
        });

        // Add to selected
        card.classList.add('active');
        const circle = card.querySelector('.radio-circle');
        circle.classList.add('checked');
        circle.textContent = "✓";
    });
});

// Initialize on load
window.onload = () => {
    const twentyNineMinutes = 29 * 60 + 23;
    const display = document.querySelector('#timer');
    startTimer(twentyNineMinutes, display);
};