/* ============================================================
   Maaya — AI Query Consultant : self-contained embeddable widget
   Vanilla JS. No dependencies. Framework-agnostic.

   USAGE — add ONE line before </body> on any page:
     <script src="maya-widget.js" data-maya-api="http://localhost:3000/api/chat" defer></script>

   The widget injects its own CSS + HTML, so nothing else is needed.
   It is anchored to the BOTTOM-LEFT so it never collides with the
   site's existing bottom-right elements (WhatsApp, sticky CTAs, etc.).

   Backend contract (Node/Express server.js in the "AI query" folder):
     POST { message, history:[{role,content}] }  ->  { reply }
   ============================================================ */
(function () {
  "use strict";

  // Don't inject twice if the script is included on the page more than once.
  if (window.__mayaWidgetLoaded) return;
  window.__mayaWidgetLoaded = true;

  // ---- Resolve backend endpoint ----
  var currentScript =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  var API_URL =
    (currentScript && currentScript.getAttribute("data-maya-api")) ||
    window.MAYA_API_URL ||
    "/api/chat";

  var WELCOME =
    "Hello, I'm Maaya, your query consultant. I handle everything about your " +
    "orders and our services — tracking, status, issues, and what we offer. " +
    "How can I help you today?";

  // ---- Inject styles (scoped under .maya-widget) ----
  var CSS = [
    ".maya-widget{position:fixed;left:24px;bottom:24px;z-index:2147483000;",
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;}",
    ".maya-widget *,.maya-widget *::before,.maya-widget *::after{box-sizing:border-box;}",

    /* Launcher */
    ".maya-launcher{position:relative;width:66px;height:66px;border:none;border-radius:50%;cursor:pointer;color:#fff;",
    "background:linear-gradient(135deg,#ff2e63,#ff6b35);",
    "box-shadow:0 8px 26px rgba(255,46,99,.55),0 2px 8px rgba(0,0,0,.2);",
    "display:flex;align-items:center;justify-content:center;transition:transform .18s ease,box-shadow .18s ease;",
    "animation:maya-bob 2.6s ease-in-out infinite;}",
    ".maya-launcher:hover{transform:scale(1.08);box-shadow:0 10px 32px rgba(255,46,99,.7);}",
    ".maya-launcher:active{transform:scale(.96);}",
    ".maya-launcher-icon{position:relative;z-index:2;}",
    ".maya-launcher-pulse{position:absolute;inset:0;border-radius:50%;background:#ff2e63;z-index:1;",
    "animation:maya-pulse 1.9s cubic-bezier(.4,0,.6,1) infinite;}",
    "@keyframes maya-pulse{0%{transform:scale(1);opacity:.7;}70%{transform:scale(1.9);opacity:0;}100%{transform:scale(1.9);opacity:0;}}",
    "@keyframes maya-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-5px);}}",

    /* Window */
    ".maya-window{position:absolute;left:0;bottom:84px;width:370px;max-width:calc(100vw - 32px);height:560px;",
    "max-height:calc(100vh - 120px);background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.25);",
    "display:flex;flex-direction:column;overflow:hidden;transform:translateY(16px) scale(.96);opacity:0;",
    "pointer-events:none;transition:transform .22s ease,opacity .22s ease;}",
    ".maya-window.maya-open{transform:translateY(0) scale(1);opacity:1;pointer-events:auto;}",

    /* Header */
    ".maya-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;",
    "background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;}",
    ".maya-header-id{display:flex;align-items:center;gap:12px;}",
    ".maya-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;",
    "align-items:center;justify-content:center;font-weight:700;font-size:18px;}",
    ".maya-header-text{display:flex;flex-direction:column;line-height:1.25;}",
    ".maya-name{font-weight:700;font-size:17px;}",
    ".maya-role{font-size:12px;opacity:.9;display:flex;align-items:center;gap:6px;}",
    ".maya-status-dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 3px rgba(52,211,153,.3);}",
    ".maya-close{background:none;border:none;color:#fff;font-size:26px;line-height:1;cursor:pointer;opacity:.85;padding:0 4px;}",
    ".maya-close:hover{opacity:1;}",

    /* Messages */
    ".maya-messages{flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:#fafbfe;}",
    ".maya-msg{max-width:82%;padding:10px 14px;border-radius:16px;line-height:1.45;word-wrap:break-word;",
    "white-space:pre-wrap;animation:maya-fade .2s ease;}",
    ".maya-msg-bot{align-self:flex-start;background:#f1f3f9;color:#1f2333;border-bottom-left-radius:5px;}",
    ".maya-msg-user{align-self:flex-end;background:#4f46e5;color:#fff;border-bottom-right-radius:5px;}",
    ".maya-msg-error{align-self:flex-start;background:#fde8e8;color:#9b1c1c;border-bottom-left-radius:5px;}",
    "@keyframes maya-fade{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}",

    /* Typing */
    ".maya-typing{display:none;gap:4px;padding:0 20px 8px;align-items:center;}",
    ".maya-typing.maya-show{display:flex;}",
    ".maya-typing span{width:7px;height:7px;border-radius:50%;background:#6b7280;animation:maya-blink 1.2s infinite ease-in-out;}",
    ".maya-typing span:nth-child(2){animation-delay:.2s;}",
    ".maya-typing span:nth-child(3){animation-delay:.4s;}",
    "@keyframes maya-blink{0%,80%,100%{opacity:.25;transform:translateY(0);}40%{opacity:1;transform:translateY(-4px);}}",

    /* Input */
    ".maya-input-bar{display:flex;align-items:center;gap:8px;padding:12px;border-top:1px solid #eceef5;background:#fff;}",
    ".maya-input{flex:1;border:1px solid #d8dcea;border-radius:22px;padding:11px 16px;font-size:15px;",
    "font-family:inherit;outline:none;transition:border-color .15s ease;}",
    ".maya-input:focus{border-color:#4f46e5;}",
    ".maya-send{width:44px;height:44px;flex:none;border:none;border-radius:50%;",
    "background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;cursor:pointer;display:flex;",
    "align-items:center;justify-content:center;transition:transform .15s ease,opacity .15s ease;}",
    ".maya-send:hover{transform:scale(1.06);}",
    ".maya-send:disabled{opacity:.5;cursor:not-allowed;transform:none;}",

    "@media (prefers-reduced-motion:reduce){.maya-launcher,.maya-launcher-pulse,.maya-msg,.maya-typing span{animation:none;}}",
    "@media (max-width:420px){.maya-widget{left:12px;bottom:12px;}.maya-window{width:calc(100vw - 24px);height:calc(100vh - 96px);}}"
  ].join("");

  var styleEl = document.createElement("style");
  styleEl.setAttribute("data-maya-style", "");
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ---- Inject markup ----
  var HTML =
    '<section class="maya-window" role="dialog" aria-label="Maaya chat" aria-hidden="true">' +
      '<header class="maya-header">' +
        '<div class="maya-header-id">' +
          '<span class="maya-avatar" aria-hidden="true">M</span>' +
          '<div class="maya-header-text">' +
            '<span class="maya-name">Maaya</span>' +
            '<span class="maya-role"><span class="maya-status-dot" aria-hidden="true"></span>Query Consultant · Online</span>' +
          '</div>' +
        '</div>' +
        '<button class="maya-close" type="button" aria-label="Close chat">&times;</button>' +
      '</header>' +
      '<div class="maya-messages" role="log" aria-live="polite"></div>' +
      '<div class="maya-typing" aria-hidden="true"><span></span><span></span><span></span></div>' +
      '<form class="maya-input-bar" autocomplete="off">' +
        '<input class="maya-input" type="text" placeholder="Ask about your order or our services…" aria-label="Type your message" maxlength="1000" required />' +
        '<button class="maya-send" type="submit" aria-label="Send message">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>' +
        '</button>' +
      '</form>' +
    '</section>' +
    '<button class="maya-launcher" type="button" aria-label="Chat with Maaya" data-maya-open>' +
      '<span class="maya-launcher-pulse" aria-hidden="true"></span>' +
      '<svg class="maya-launcher-icon" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">' +
        '<path fill="currentColor" d="M12 2C6.48 2 2 6.03 2 11c0 2.38 1.02 4.55 2.71 6.19L4 22l5.13-1.6c.9.26 1.86.4 2.87.4 5.52 0 10-4.03 10-9S17.52 2 12 2z"/>' +
      '</svg>' +
    '</button>';

  var root = document.createElement("div");
  root.className = "maya-widget";
  root.setAttribute("aria-live", "polite");
  root.innerHTML = HTML;
  document.body.appendChild(root);

  // ---- Wire logic ----
  var windowEl = root.querySelector(".maya-window");
  var launcher = root.querySelector(".maya-launcher");
  var closeBtn = root.querySelector(".maya-close");
  var messagesEl = root.querySelector(".maya-messages");
  var typingEl = root.querySelector(".maya-typing");
  var form = root.querySelector(".maya-input-bar");
  var input = root.querySelector(".maya-input");
  var sendBtn = root.querySelector(".maya-send");

  var history = [];
  var opened = false;

  function openWindow() {
    windowEl.classList.add("maya-open");
    windowEl.setAttribute("aria-hidden", "false");
    launcher.style.display = "none";
    if (!opened) {
      opened = true;
      addMessage(WELCOME, "bot");
    }
    setTimeout(function () { input.focus(); }, 200);
  }

  function closeWindow() {
    windowEl.classList.remove("maya-open");
    windowEl.setAttribute("aria-hidden", "true");
    launcher.style.display = "flex";
  }

  function addMessage(text, type) {
    var el = document.createElement("div");
    el.className = "maya-msg maya-msg-" + type;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function setTyping(on) {
    typingEl.classList.toggle("maya-show", on);
    if (on) messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setBusy(busy) {
    input.disabled = busy;
    sendBtn.disabled = busy;
  }

  async function sendMessage(text) {
    addMessage(text, "user");
    history.push({ role: "user", content: text });
    setBusy(true);
    setTyping(true);
    try {
      var res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history, session_id: window.localStorage.getItem("maya_session_id") || "" })
      });
      if (!res.ok) throw new Error("Server responded with " + res.status);
      var data = await res.json();
      if (data && data.session_id) {
        try { window.localStorage.setItem("maya_session_id", data.session_id); } catch (_storageError) { /* Cookie fallback remains active. */ }
      }
      var reply = data && data.reply ? data.reply : "";
      setTyping(false);
      if (reply) {
        addMessage(reply, "bot");
        history.push({ role: "assistant", content: reply });
      } else {
        addMessage("I didn't receive a response. Please send your message again.", "error");
      }
    } catch (err) {
      setTyping(false);
      addMessage("I'm unable to reach the service right now. Please check the connection and try again.", "error");
      if (window.console) console.error("[Maaya] request failed:", err);
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  launcher.addEventListener("click", openWindow);
  closeBtn.addEventListener("click", closeWindow);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendMessage(text);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && windowEl.classList.contains("maya-open")) closeWindow();
  });
})();
