document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contactForm");
  const successEl = document.getElementById("formSuccess");
  const errorEl = document.getElementById("formError");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Clear previous messages
    successEl.style.display = "none";
    errorEl.style.display = "none";

    const formData = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      company: form.company.value.trim(),
      phone: form.phone.value.trim(),
      inquiry: form.inquiry.value,
      message: form.message.value.trim(),
      "h-captcha-response": document.querySelector('textarea[name="h-captcha-response"]')?.value || ""
    };

    try {
      const res = await fetch("/api/submit-form", {  // make sure this matches your backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { success: false, message: text || "Invalid response from server" };
      }

      if (data.success) {
        form.reset();
        if (window.hcaptcha) window.hcaptcha.reset();
        successEl.textContent = "Message sent successfully!";
        successEl.style.display = "block";
        errorEl.style.display = "none";
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
