(() => {
  // =========================
  // АНТИ-ІНДЕКСАЦІЯ (best effort через JS, НЕ гарантія)
  // =========================
  const addMeta = (name, content) => {
    try {
      const m = document.createElement("meta");
      m.setAttribute("name", name);
      m.setAttribute("content", content);
      document.head.appendChild(m);
    } catch (_) {}
  };

  const addLinkRelCanonical = () => {
    try {
      // Канонікал на поточний URL без параметрів — зменшує дублювання
      const url = new URL(window.location.href);
      url.hash = "";
      url.search = "";
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", url.toString());
      document.head.appendChild(link);
    } catch (_) {}
  };

  const hardenLinksNoFollow = () => {
    try {
      // Ставимо rel="nofollow" на всі <a> (і внутрішні, і зовнішні)
      // Це не блокує індекс, але зменшує "вагу" та сигналізує не переходити.
      document.querySelectorAll("a[href]").forEach((a) => {
        const rel = (a.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
        const need = ["nofollow", "noreferrer", "noopener"];
        need.forEach((x) => {
          if (!rel.includes(x)) rel.push(x);
        });
        a.setAttribute("rel", rel.join(" "));
      });
    } catch (_) {}
  };

  const applyAntiIndexSignals = () => {
    // Найважливіші robots-сигнали (але через JS)
    addMeta("robots", "noindex, nofollow, noarchive, nosnippet");
    addMeta("googlebot", "noindex, nofollow, noarchive, nosnippet");
    addMeta("bingbot", "noindex, nofollow, noarchive, nosnippet");

    // Додатково: прибираємо фрагменти/прев'ю
    // (Google може ігнорувати, але це "best effort")
    addMeta("robots", "max-snippet:0, max-image-preview:none, max-video-preview:0");

    addLinkRelCanonical();
  };

  // Спроба застосувати якомога раніше
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applyAntiIndexSignals();
      hardenLinksNoFollow();
    }, { once: true });
  } else {
    applyAntiIndexSignals();
    hardenLinksNoFollow();
  }

  // ====== НАЛАШТУВАННЯ ======
  const PASSWORD = "sm@rt2026!"; // <-- зміни на свій пароль
  const SESSION_KEY = "wf_pw_ok";

  // Сторінки, де вмикати "замок".
  // Якщо хочеш для всього сайту — залиш як є (true).
  // Якщо лише для конкретних URL — див. нижче.
  const ENABLE_FOR_ALL_PAGES = true;

  // Якщо ENABLE_FOR_ALL_PAGES = false, тоді вкажи дозволені шляхи:
  const ALLOWED_PATHS = ["/private", "/case-1"]; // приклади

  // ====== ЛОГІКА ВКЛЮЧЕННЯ ======
  const path = window.location.pathname.replace(/\/$/, "") || "/";
  const enabled =
    ENABLE_FOR_ALL_PAGES || ALLOWED_PATHS.includes(path);

  if (!enabled) return;

  // Якщо вже введено пароль у цій вкладці — нічого не робимо
  if (sessionStorage.getItem(SESSION_KEY) === "1") return;

  // Ховаємо контент миттєво
  document.documentElement.style.visibility = "hidden";

  // Будуємо overlay
  const overlay = document.createElement("div");
  overlay.setAttribute("data-wf-password-overlay", "1");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 10, 12, 0.5);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    padding: 24px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  `;

  const panel = document.createElement("div");
  panel.style.cssText = `
    width: min(420px, 100%);
    background: rgba(255,255,255,0.92);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    padding: 20px;
  `;

  const title = document.createElement("div");
  title.textContent = "Protected page";
  title.style.cssText = `font-size: 18px; font-weight: 700; margin-bottom: 6px;`;

  const hint = document.createElement("div");
  hint.textContent = "Enter password to continue.";
  hint.style.cssText = `font-size: 13px; opacity: 0.75; margin-bottom: 14px;`;

  const row = document.createElement("div");
  row.style.cssText = `display: flex; gap: 10px;`;

  const input = document.createElement("input");
  input.type = "password";
  input.placeholder = "Password";
  input.autocomplete = "current-password";
  input.style.cssText = `
    flex: 1;
    height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.14);
    outline: none;
    font-size: 14px;
    background: white;
  `;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "Unlock";
  btn.style.cssText = `
    height: 44px;
    padding: 0 14px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
    background: #111;
    color: #fff;
  `;

  const error = document.createElement("div");
  error.style.cssText = `
    margin-top: 10px;
    font-size: 12px;
    color: #b00020;
    display: none;
  `;
  error.textContent = "Wrong password";

  row.appendChild(input);
  row.appendChild(btn);

  panel.appendChild(title);
  panel.appendChild(hint);
  panel.appendChild(row);
  panel.appendChild(error);
  overlay.appendChild(panel);

  const unlock = () => {
    if (input.value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      overlay.remove();
      document.documentElement.style.visibility = "visible";
    } else {
      error.style.display = "block";
      input.value = "";
      input.focus();
    }
  };

  btn.addEventListener("click", unlock);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") unlock();
  });

  // Додаємо overlay якнайшвидше
  const mount = () => {
    document.body.appendChild(overlay);
    document.documentElement.style.visibility = "visible";
    input.focus();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
