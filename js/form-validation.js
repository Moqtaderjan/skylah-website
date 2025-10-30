document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) {
        console.error('Contact form not found!');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    
    if (!submitBtn) {
        console.error('Submit button not found!');
        return;
    }

    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    // Form validation
    function validateForm() {
        let isValid = true;
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });

        // Check hCaptcha
        const hCaptchaResponse = document.querySelector('textarea[name="h-captcha-response"]');
        if (!hCaptchaResponse || !hCaptchaResponse.value) {
            showError('captchaError', 'Please complete the hCaptcha verification');
            isValid = false;
        }

        // Name validation
        const name = document.getElementById('name').value.trim();
        if (!name) {
            showError('nameError', 'Please enter your full name');
            isValid = false;
        }

        // Email validation
        const email = document.getElementById('email').value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            showError('emailError', 'Please enter your email address');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        // Inquiry type validation
        const inquiry = document.getElementById('inquiry').value;
        if (!inquiry) {
            showError('inquiryError', 'Please select an inquiry type');
            isValid = false;
        }

        // Message validation
        const message = document.getElementById('message').value.trim();
        if (!message) {
            showError('messageError', 'Please enter your message');
            isValid = false;
        } else if (message.length < 10) {
            showError('messageError', 'Message must be at least 10 characters long');
            isValid = false;
        }

        return isValid;
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

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

    // Form submission - With test mode
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous messages
        document.getElementById('formSuccess').style.display = 'none';
        document.getElementById('formError').style.display = 'none';

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Set loading state
        setLoadingState(true);

    const TEST_MODE = false;

        if (TEST_MODE) {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Show success animation and message
            showSuccessAnimation();
            showMessage('formSuccess', 'Test successful! Form is ready to send real messages.');
            contactForm.reset();
            
            // Reset hCaptcha
            if (window.hcaptcha) {
                window.hcaptcha.reset();
            }
            
            setLoadingState(false);
            return;
        }

        try {
            // Real submission code
            // Build payload, include captcha token if present
            const payload = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                company: document.getElementById('company')?.value.trim() || '',
                phone: document.getElementById('phone')?.value.trim() || '',
                inquiry: document.getElementById('inquiry').value,
                message: document.getElementById('message').value.trim(),
                botcheck: document.querySelector('[name="botcheck"]')?.value || ''
            };

            // If an hCaptcha textarea or token input exists, include it so server can verify
            const hcaptchaInput = document.querySelector('textarea[name="h-captcha-response"]') || document.querySelector('[name="h-captcha-response"]');
            if (hcaptchaInput && hcaptchaInput.value) {
                payload['h-captcha-response'] = hcaptchaInput.value;
            }

            // Client posts to existing Express API route
            const endpoint = '/submit-form';
            console.log('📤 Submitting to API', endpoint);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Safely parse response: some upstream providers may return empty or non-JSON bodies.
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch (parseErr) {
                // Non-JSON response — surface the raw text as the error message
                data = { success: false, message: text || 'Invalid response from server' };
            }

            console.log('🌐 Server response:', data);

            if (data && data.success) {
                showSuccessAnimation();
                showMessage('formSuccess', 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.');
                contactForm.reset();
                
                if (window.hcaptcha) {
                    window.hcaptcha.reset();
                }
            } else {
                const msg = (data && data.message) ? data.message : `Submission failed (status ${response.status})`;
                throw new Error(msg);
            }

        } catch (error) {
            console.error('❌ Form submission error:', error);
            showMessage('formError', `Sorry, there was an error: ${error.message}. Please try again.`, true);
        } finally {
            setLoadingState(false);
        }
    });

    console.log('✅ Form validation with hCaptcha loaded successfully');
});
// Success animation function
function showSuccessAnimation() {
    const animation = document.getElementById('successAnimation');
    const confetti = document.querySelectorAll('.confetti');
    
    // Show animation
    animation.classList.add('active');
    
    // Simple confetti animation
    confetti.forEach((piece, index) => {
        piece.style.animation = `none`;
        void piece.offsetWidth; // Trigger reflow
        
        piece.style.animation = `
            confettiFall ${0.5 + index * 0.1}s ease-out ${0.2 + index * 0.1}s both,
            confettiFade 1s ease-in ${1 + index * 0.1}s both
        `;
    });
    
    // Hide after 3 seconds
    setTimeout(() => {
        animation.classList.remove('active');
    }, 3000);
}

// Add confetti keyframes dynamically
const confettiStyles = `
@keyframes confettiFall {
    0% {
        transform: translateY(-100px) rotate(0deg);
        opacity: 1;
    }
    100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
    }
}

@keyframes confettiFade {
    0%, 70% { opacity: 1; }
    100% { opacity: 0; }
}
`;

// Inject confetti styles
const styleSheet = document.createElement('style');
styleSheet.textContent = confettiStyles;
document.head.appendChild(styleSheet);