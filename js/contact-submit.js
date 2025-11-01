document.addEventListener("DOMContentLoaded", function () { 
  const form = document.getElementById("contactForm");
  const successEl = document.getElementById("formSuccess");
  const errorEl = document.getElementById("formError");

  if (!form) return console.error("Contact form not found!");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear previous messages
    successEl.style.display = "none";
    errorEl.style.display = "none";

    // Collect form data
    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company?.value.trim() || "",
      phone: form.phone?.value.trim() || "",
      inquiry: form.inquiry.value,
      message: form.message.value.trim(),
      website: form.message.value.trim(), 
    };

    // Basic front-end validation
    if (!formData.name || !formData.email || !formData.message) {
      errorEl.textContent = "Please fill in all required fields.";
      errorEl.style.display = "block";
      return;
    }

    try {
      const response = await fetch("/api/submit-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        form.reset();
        showSuccessAnimation("Message sent successfully!", "We'll get back to you within 24 hours.");
      } else {
        errorEl.textContent = data.message || "Something went wrong.";
        errorEl.style.display = "block";
        successEl.style.display = "none";
      }

    } catch (err) {
      console.error("Form submission error:", err);
      errorEl.textContent = "Something went wrong. Please try again later.";
      errorEl.style.display = "block";
      successEl.style.display = "none";
    }
  });
});

function showSuccessAnimation(title, subtitle) {
    const overlay = document.createElement("div");
    overlay.className = "success-animation active";
    overlay.innerHTML = `
        <div class="checkmark-circle"><div class="checkmark"></div></div>
        <div class="success-message">${title}</div>
        <div class="success-submessage">${subtitle}</div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.classList.remove("active");
        setTimeout(() => document.body.removeChild(overlay), 500);
    }, 3000); // overlay disappears after 3s
}
