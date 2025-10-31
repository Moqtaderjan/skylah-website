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

            if (!isError) {
                setTimeout(() => {
                    messageElement.style.display = 'none';
                }, 5000);
            }
        }
    }

    // Loading state for submit button
    function setLoadingState(loading) {
        if (loading) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline-block';
            submitBtn.disabled = true;
        } else {
            btnText.style.display = 'inline-block';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    // Validate form
    function validateForm() {
        let isValid = true;

        document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');

        // Always check hCaptcha (invisible mode: use getResponse)
        // let hCaptchaToken = "";
        // if (window.hcaptcha && typeof window.hcaptcha.getResponse === "function") {
        //     hCaptchaToken = window.hcaptcha.getResponse();
        // }
        // if (!hCaptchaToken) {
        //     showError('captchaError', 'Please complete the hCaptcha verification (click the checkbox)');
        //     isValid = false;
        // }

        const name = document.getElementById('name').value.trim();
        if (!name) { showError('nameError', 'Please enter your full name'); isValid = false; }

        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) { showError('emailError', 'Please enter your email address'); isValid = false; }
        else if (!emailRegex.test(email)) { showError('emailError', 'Please enter a valid email address'); isValid = false; }

        const inquiry = document.getElementById('inquiry').value;
        if (!inquiry) { showError('inquiryError', 'Please select an inquiry type'); isValid = false; }

        const message = document.getElementById('message').value.trim();
        if (!message) { showError('messageError', 'Please enter your message'); isValid = false; }
        else if (message.length < 10) { showError('messageError', 'Message must be at least 10 characters long'); isValid = false; }

        return isValid;
    }

    // Success animation
    function showSuccessAnimation() {
        const animation = document.getElementById('successAnimation');
        const confetti = document.querySelectorAll('.confetti');

        animation.classList.add('active');
        confetti.forEach((piece, index) => {
            piece.style.animation = 'none';
            void piece.offsetWidth;
            piece.style.animation = `
                confettiFall ${0.5 + index * 0.1}s ease-out ${0.2 + index * 0.1}s both,
                confettiFade 1s ease-in ${1 + index * 0.1}s both
            `;
        });
        setTimeout(() => animation.classList.remove('active'), 3000);
    }

    // Inject confetti keyframes dynamically
    const confettiStyles = `
    @keyframes confettiFall {
        0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    @keyframes confettiFade {
        0%, 70% { opacity: 1; }
        100% { opacity: 0; }
    }`;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = confettiStyles;
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
                access_key: contactForm.dataset.web3Key, // store key in data attribute or env
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                from_email: document.getElementById('email').value.trim(),
                subject: "New Contact Form Submission - Skylah LLC",
                company: document.getElementById('company')?.value.trim() || '',
                phone: document.getElementById('phone')?.value.trim() || '',
                inquiry: document.getElementById('inquiry').value,
                message: document.getElementById('message').value.trim(),
                botcheck: document.querySelector('[name="botcheck"]')?.value || '',
            };

            // Include hCaptcha token if present
            // if (window.hcaptcha) {
            //     const token = window.hcaptcha && window.hcaptcha.getResponse ? window.hcaptcha.getResponse() : "";
            //     if (token) payload['h-captcha-response'] = token;
            // }

            const endpoint = '/api/submit-form';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            let data;
            try { data = text ? JSON.parse(text) : {}; } 
            catch { data = { success: false, message: text || 'Invalid response from server' }; }

            console.log('Server response:', data);

            // Check actual Web3Forms response
            if (data.success && data.body && data.body.message && data.body.message.includes('Email sent')) {
                showSuccessAnimation();
                showMessage('formSuccess', 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.');
                contactForm.reset();
                if (window.hcaptcha) window.hcaptcha.reset();
            } else {
                const msg = data?.body?.message || `Submission failed (status ${response.status})`;
                throw new Error(msg);
            }

        } catch (error) {
            console.error('Form submission error:', error);
            showMessage('formError', `Sorry, there was an error: ${error.message}. Please try again.`, true);
        } finally {
            setLoadingState(false);
        }
    });

    // console.log('Form validation with hCaptcha loaded successfully');
});
