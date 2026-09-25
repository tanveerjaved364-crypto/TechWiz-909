const loginForm = document.querySelector("#login");
const loginError = document.querySelector("#error");

loginForm.onsubmit = async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  const loginFormData = new FormData(loginForm);
  const loginRequest = Object.fromEntries(loginFormData);

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginRequest),
    });
    const loginResult = await response.json();

    if (!response.ok) {
      throw new Error(loginResult.error || "Sign in failed");
    }

    window.location = loginResult.redirect;
  } catch (error) {
    loginError.textContent = error.message;
  }
};
