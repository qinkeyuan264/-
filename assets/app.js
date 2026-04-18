const $ = (sel) => document.querySelector(sel);

/* v2：与旧 key 隔离，避免历史上写入的 localStorage 长期免密 */
const LOCK_KEY = "personal_file_site_auth_v2";

function hexFromBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

async function sha256Hex(text) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return hexFromBuffer(digest);
}

function getConfig() {
  const cfg = window.__SITE_CONFIG__ || {};
  return {
    passwordHash: String(cfg.PASSWORD_SHA256_HEX || "").trim().toLowerCase(),
    /* 0 = 仅本次浏览器会话（关闭浏览器/新会话需重登）；>0 = 用 localStorage 免密若干天 */
    authCacheDays: Number.isFinite(cfg.AUTH_CACHE_DAYS) ? cfg.AUTH_CACHE_DAYS : 0,
    filesJsonPath: String(cfg.FILES_JSON_PATH || "./data/files.json")
  };
}

/** 与配置一致：若选择“会话登录”，清掉可能残留的 localStorage，避免一打开就像已登录 */
function applyAuthPolicy() {
  const { authCacheDays } = getConfig();
  if (authCacheDays > 0) return;
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem("personal_file_site_auth_v1");
  } catch {
    /* ignore */
  }
}

function readStoredAuth() {
  try {
    return localStorage.getItem(LOCK_KEY);
  } catch {
    return null;
  }
}

function readSessionAuth() {
  try {
    return sessionStorage.getItem(LOCK_KEY);
  } catch {
    return null;
  }
}

function setAuthed(hash) {
  const { authCacheDays } = getConfig();
  const persist = authCacheDays > 0;
  const expiresAt = persist
    ? Date.now() + Math.max(1, authCacheDays) * 24 * 60 * 60 * 1000
    : Date.now() + 365 * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ hash, expiresAt, persist });

  if (persist) {
    try {
      localStorage.setItem(LOCK_KEY, payload);
      try {
        sessionStorage.removeItem(LOCK_KEY);
      } catch {
        /* ignore */
      }
      return;
    } catch {
      /* 无痕等：降级为仅会话 */
    }
  } else {
    try {
      localStorage.removeItem(LOCK_KEY);
    } catch {
      /* ignore */
    }
  }

  try {
    sessionStorage.setItem(LOCK_KEY, payload);
  } catch (e) {
    const msg = e?.message || String(e);
    throw new Error(
      `无法保存登录状态（${msg}）。请关闭无痕/隐私模式，或在浏览器设置里允许本站使用“本地存储”，然后重试。`
    );
  }
}

function clearAuthed() {
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(LOCK_KEY);
  } catch {
    /* ignore */
  }
}

function isAuthed() {
  const { passwordHash, authCacheDays } = getConfig();
  const persist = authCacheDays > 0;
  const raw = persist
    ? readStoredAuth() || readSessionAuth()
    : readSessionAuth();
  if (!raw) return false;
  try {
    const { hash, expiresAt } = JSON.parse(raw);
    if (!hash || !expiresAt) return false;
    if (Date.now() > expiresAt) return false;
    return String(hash).toLowerCase() === passwordHash;
  } catch {
    return false;
  }
}

function showApp() {
  const lock = $("#lockScreen");
  const shell = $("#appShell");
  lock.hidden = true;
  lock.style.setProperty("display", "none");
  shell.hidden = false;
  shell.style.removeProperty("display");
}

function showLock() {
  const lock = $("#lockScreen");
  const shell = $("#appShell");
  shell.hidden = true;
  shell.style.setProperty("display", "none");
  lock.hidden = false;
  lock.style.removeProperty("display");
}

function normalizeType(t) {
  const v = String(t || "").toLowerCase();
  if (["pdf", "word", "excel", "ppt", "other"].includes(v)) return v;
  return "other";
}

function typeLabel(t) {
  const v = normalizeType(t);
  return ({ pdf: "PDF", word: "Word", excel: "Excel", ppt: "PPT", other: "其他" })[v];
}

function safeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function asArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  return [String(v)];
}

function fileMatches(item, q, type) {
  const t = normalizeType(item.type);
  if (type && t !== type) return false;
  if (!q) return true;
  const hay = [
    item.title,
    item.type,
    ...(item.tags || []),
    item.updatedAt,
    item.note
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

function cardHtml(item) {
  const title = safeText(item.title) || "未命名文件";
  const t = normalizeType(item.type);
  const tags = asArray(item.tags).map(safeText).filter(Boolean);
  const updatedAt = safeText(item.updatedAt);
  const note = safeText(item.note);
  const previewUrl = safeText(item.previewUrl);
  const downloadUrl = safeText(item.downloadUrl);

  const pills = [
    `<span class="pill pill--type">${typeLabel(t)}</span>`,
    updatedAt ? `<span class="pill">更新：${updatedAt}</span>` : "",
    ...tags.map((x) => `<span class="pill">${x}</span>`)
  ]
    .filter(Boolean)
    .join("");

  const actions = [
    previewUrl
      ? `<a class="btn btn--primary" href="${previewUrl}" target="_blank" rel="noreferrer">在线预览</a>`
      : `<button class="btn" type="button" disabled title="请在 data/files.json 填写 previewUrl">未配置预览链接</button>`,
    downloadUrl
      ? `<a class="btn" href="${downloadUrl}" target="_blank" rel="noreferrer">下载</a>`
      : ""
  ].join("");

  return `
    <article class="card">
      <div class="card__top">
        <div>
          <div class="title">${title}</div>
          <div class="meta">${pills}</div>
          ${note ? `<div class="meta"><span class="muted">${note}</span></div>` : ""}
        </div>
      </div>
      <div class="card__actions">${actions}</div>
    </article>
  `.trim();
}

async function loadFiles() {
  const { filesJsonPath } = getConfig();
  const res = await fetch(filesJsonPath, { cache: "no-store" });
  if (!res.ok) throw new Error(`加载失败：${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [];
  return list
    .map((x) => ({
      title: x?.title,
      type: x?.type,
      previewUrl: x?.previewUrl,
      downloadUrl: x?.downloadUrl,
      tags: asArray(x?.tags),
      updatedAt: x?.updatedAt,
      note: x?.note
    }))
    .filter((x) => x.title || x.previewUrl || x.downloadUrl);
}

function render(files) {
  const q = safeText($("#searchInput").value).toLowerCase();
  const type = safeText($("#typeSelect").value).toLowerCase();
  const filtered = files.filter((x) => fileMatches(x, q, type));
  $("#fileList").innerHTML = filtered.map(cardHtml).join("");
  $("#statusHint").textContent = filtered.length
    ? `共 ${filtered.length} 个条目`
    : "没有匹配的文件。";
}

async function initApp() {
  applyAuthPolicy();

  if (!isAuthed()) {
    showLock();
  } else {
    showApp();
  }

  $("#logoutBtn").addEventListener("click", () => {
    clearAuthed();
    showLock();
    $("#passwordInput").value = "";
    $("#passwordInput").focus();
  });

  const loginForm = $("#loginForm");
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#loginError").hidden = true;
    $("#loginError").textContent = "密码不正确，请重试。";

    const { passwordHash } = getConfig();
    if (!passwordHash) {
      $("#loginError").textContent =
        "未读取到配置：请确认已部署 assets/config.js，并尝试强制刷新（Ctrl+F5）。";
      $("#loginError").hidden = false;
      return;
    }

    const pwd = $("#passwordInput").value || "";
    let hash;
    try {
      if (!globalThis.crypto?.subtle) {
        throw new Error("当前环境不支持安全校验（需要 HTTPS 或较新浏览器）。");
      }
      hash = await sha256Hex(pwd);
    } catch (err) {
      $("#loginError").textContent =
        err?.message || "校验失败，请换 Chrome/Edge 或检查是否使用 https 打开。";
      $("#loginError").hidden = false;
      return;
    }

    if (hash !== passwordHash) {
      $("#loginError").hidden = false;
      return;
    }
    try {
      setAuthed(hash);
      showApp();
    } catch (err) {
      $("#loginError").textContent =
        err?.message || "登录状态保存失败，请换用普通窗口或 Chrome/Edge 再试。";
      $("#loginError").hidden = false;
    }
  });

  let files = [];
  try {
    files = await loadFiles();
    $("#statusHint").textContent = `已加载 ${files.length} 个条目`;
  } catch (err) {
    $("#statusHint").textContent = `文件列表加载失败：${err?.message || err}`;
  }

  $("#searchInput").addEventListener("input", () => render(files));
  $("#typeSelect").addEventListener("change", () => render(files));

  render(files);
}

initApp();

