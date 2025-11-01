document.addEventListener('DOMContentLoaded', function() { 
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return console.error('Contact form not found!');

    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return console.error('Submit button not found!');

    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Show error
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    // Show general message
    function showMessage(elementId, message, isError = false) {
        const messageElement = document.getElementById(elementId);
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.style.display = 'block';
            messageElement.className = isError ? 'message-error' : 'message-success';
            if (!isError) setTimeout(() => messageElement.style.display = 'none', 5000);
        }
    }

    // Loading state
    function setLoadingState(loading) {
        btnText.style.display = loading ? 'none' : 'inline-block';
        btnLoading.style.display = loading ? 'inline-block' : 'none';
        submitBtn.disabled = loading;
    }

    // Form validation
    function validateForm() {
        let isValid = true;
        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

        const name = document.getElementById('name').value.trim();
        if (!name) { showError('nameError', 'Please enter your full name'); isValid = false; }

        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) { showError('emailError', 'Please enter your email'); isValid = false; }
        else if (!emailRegex.test(email)) { showError('emailError', 'Please enter a valid email'); isValid = false; }

        const inquiry = document.getElementById('inquiry').value;
        if (!inquiry) { showError('inquiryError', 'Please select an inquiry type'); isValid = false; }

        const message = document.getElementById('message').value.trim();
        if (!message) { showError('messageError', 'Please enter your message'); isValid = false; }
        else if (message.length < 10) { showError('messageError', 'Message must be at least 10 characters'); isValid = false; }

        return isValid;
    }

    // Success animation
    function showSuccessAnimation() {
        const animation = document.getElementById('successAnimation');
        const confetti = document.querySelectorAll('.confetti');
        animation?.classList.add('active');
        confetti.forEach((piece, i) => {
            piece.style.animation = 'none';
            void piece.offsetWidth;
            piece.style.animation = `confettiFall ${0.5 + i * 0.1}s ease-out ${0.2 + i * 0.1}s both, confettiFade 1s ease-in ${1 + i * 0.1}s both`;
        });
        setTimeout(() => animation?.classList.remove('active'), 3000);
    }

    // Inject confetti keyframes dynamically
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes confettiFall {0%{transform:translateY(-100px) rotate(0deg);opacity:1;}100%{transform:translateY(100vh) rotate(360deg);opacity:0;}}
        @keyframes confettiFade {0%,70%{opacity:1;}100%{opacity:0;}}
    `;
    document.head.appendChild(styleSheet);

    // Form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        document.getElementById('formSuccess').style.display = 'none';
        document.getElementById('formError').style.display = 'none';

        if (!validateForm()) return;

        setLoadingState(true);

        try {
            const payload = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                company: document.getElementById('company')?.value.trim() || '',
                phone: document.getElementById('phone')?.value.trim() || '',
                inquiry: document.getElementById('inquiry').value,
                message: document.getElementById('message').value.trim(),
                "h-captcha-response": document.querySelector('[name="h-captcha-response"]').value
            };

            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log('Server response:', data);

            if (data.success) {
                showSuccessAnimation();
                showMessage('formSuccess', 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.');
                contactForm.reset();
            } else {
                throw new Error(data.message || `Submission failed (status ${response.status})`);
            }

        } catch (error) {
            console.error('Form submission error:', error);
            showMessage('formError', `Sorry, there was an error: ${error.message}`, true);
        } finally {
            setLoadingState(false);
        }
    });
});
