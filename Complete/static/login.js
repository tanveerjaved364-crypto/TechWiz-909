// SkillSprint AI - Login & Registration Controller

const tabLogin = document.querySelector("#tabLogin");
const tabRegister = document.querySelector("#tabRegister");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const loginError = document.querySelector("#loginError");
const registerMsg = document.querySelector("#registerMsg");
const loginBtn = document.querySelector("#loginBtn");
const registerBtn = document.querySelector("#registerBtn");
const registerRoleSelect = document.querySelector("#registerRoleSelect");

// Switch Tabs
if (tabLogin && tabRegister) {
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
    loginError.textContent = "";
    registerMsg.textContent = "";
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
    loginError.textContent = "";
    registerMsg.textContent = "";
  });
}

// Populate roles from API if available
async function loadAvailableRoles() {
  if (!registerRoleSelect) return;
  try {
    const res = await fetch("/api/roles");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.roles) && data.roles.length) {
        registerRoleSelect.innerHTML = data.roles
          .map((r) => `<option value="${r}">${r}</option>`)
          .join("");
      }
    }
  } catch (_) {
    // Keep default fallback options
  }
}
loadAvailableRoles();

// Login Form Submit
if (loginForm) {
  loginForm.onsubmit = async (event) => {
    event.preventDefault();
    loginError.textContent = "";
    loginError.className = "auth-msg error";
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    const loginFormData = new FormData(loginForm);
    const loginRequest = Object.fromEntries(loginFormData);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginRequest),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Sign in failed");
      }

      loginBtn.textContent = "Redirecting...";
      window.location = result.redirect;
    } catch (error) {
      loginError.textContent = error.message;
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign In";
    }
  };
}

// Register Form Submit
if (registerForm) {
  registerForm.onsubmit = async (event) => {
    event.preventDefault();
    registerMsg.textContent = "";
    registerMsg.className = "auth-msg";
    registerBtn.disabled = true;
    registerBtn.textContent = "Creating account...";

    const registerFormData = new FormData(registerForm);
    const registerRequest = Object.fromEntries(registerFormData);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerRequest),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }

      registerMsg.className = "auth-msg success";
      registerMsg.textContent = result.message || "Account created! Loading your portal...";
      registerBtn.textContent = "Success! Loading...";

      setTimeout(() => {
        window.location = result.redirect || "/portal";
      }, 1000);
    } catch (error) {
      registerMsg.className = "auth-msg error";
      registerMsg.textContent = error.message;
      registerBtn.disabled = false;
      registerBtn.textContent = "Create Account & Start Onboarding";
    }
  };
}
