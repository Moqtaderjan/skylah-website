// animations.js

// Show full-screen success animation with checkmark and optional messages
export function showSuccessAnimation(title = "Message sent successfully!", subtitle = "We'll get back to you soon.") {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "success-animation active";
    overlay.innerHTML = `
        <div class="checkmark-circle"><div class="checkmark"></div></div>
        <div class="success-message">${title}</div>
        <div class="success-submessage">${subtitle}</div>
        <div class="confetti"></div><div class="confetti"></div><div class="confetti"></div><div class="confetti"></div><div class="confetti"></div>
    `;
    document.body.appendChild(overlay);

    // Animate confetti
    const confettiPieces = overlay.querySelectorAll(".confetti");
    confettiPieces.forEach((piece, i) => {
        piece.style.animation = 'none';
        void piece.offsetWidth; // force reflow to reset animation
        piece.style.animation = `confettiFall ${0.5 + i * 0.1}s ease-out ${0.2 + i * 0.1}s both, confettiFade 1s ease-in ${1 + i * 0.1}s both`;
    });

    // Remove overlay after 3 seconds
    setTimeout(() => {
        overlay.classList.remove("active");
        setTimeout(() => overlay.remove(), 500);
    }, 3000);
}

// Optional: show a small success message inside a page element
export function showSuccessMessage(messageEl, text) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.style.display = "block";
    messageEl.classList.add("animated");
    setTimeout(() => messageEl.style.display = "none", 5000);
}

// Inject confetti keyframes dynamically
(function injectConfettiKeyframes() {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
        @keyframes confettiFall {
            0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        @keyframes confettiFade {
            0%,70% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(styleSheet);
})();
