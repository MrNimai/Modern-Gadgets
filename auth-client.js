function tvResolveApiBase() {
  if (window.location.protocol === "file:") {
    return "http://localhost:5173";
  }

  if (window.location.port === "5173") {
    return "";
  }

  const host = window.location.hostname || "localhost";
  return `${window.location.protocol}//${host}:5173`;
}

const TV_API_BASE = tvResolveApiBase();

function tvApiUrl(path) {
  return `${TV_API_BASE}${path}`;
}

function tvServerHint() {
  const host = window.location.hostname || "localhost";
  return `Run \`node server.js\` and open http://${host}:5173`;
}

async function tvReadJsonSafe(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {};
  }

  return res.json().catch(() => ({}));
}

async function tvFetchJson(url, options) {
  let res;

  try {
    res = await fetch(tvApiUrl(url), {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      ...options,
    });
  } catch (error) {
    throw new Error(`Auth server unreachable. ${tvServerHint()}`);
  }

  const data = await tvReadJsonSafe(res);

  if (!res.ok) {
    let msg = (data && data.error) || "";
    if (!msg && res.status === 404) {
      msg = `Auth API not found. ${tvServerHint()}`;
    }
    if (!msg) {
      msg = `Request failed (${res.status}).`;
    }

    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function tvGetMe() {
  try {
    const res = await fetch(tvApiUrl("/api/me"), { credentials: "include" });
    const data = await tvReadJsonSafe(res);
    return data.user || null;
  } catch {
    return null;
  }
}

function tvSetAuthUi(user) {
  const areas = document.querySelectorAll("[data-auth-area]");
  areas.forEach((area) => {
    if (!user) {
      area.innerHTML =
        '<a class="account-btn" href="login.html" data-auth-login>Login</a>' +
        '<a class="account-btn account-secondary" href="signup.html" data-auth-signup>Sign up</a>';
      return;
    }

    const safeName = (user.name || user.email || "Account").replace(/</g, "&lt;");
    area.innerHTML =
      '<a class="account-btn" href="profile.html" data-auth-profile>' +
      safeName +
      "</a>" +
      '<button type="button" class="account-btn account-secondary" data-auth-logout>Logout</button>';

    const logoutBtn = area.querySelector("[data-auth-logout]");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await tvFetchJson("/api/auth/logout", { method: "POST", body: "{}" });
        } finally {
          window.location.href = "index.html";
        }
      });
    }
  });
}

async function tvInitAuth() {
  const user = await tvGetMe();
  tvSetAuthUi(user);
  return user;
}

window.TechVerseAuth = {
  apiBase: TV_API_BASE,
  init: tvInitAuth,
  me: tvGetMe,
  fetchJson: tvFetchJson,
};

document.addEventListener("DOMContentLoaded", () => {
  tvInitAuth().catch(() => {});
});
