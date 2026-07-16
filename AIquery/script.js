/* ============================================================
   Maya — AI Query Consultant Widget (frontend logic)
   Vanilla JS. No dependencies. Framework-agnostic.

   The backend endpoint is read from the <script> tag's
   data-maya-api attribute, defaulting to /api/chat.
   ============================================================ */
(function () {
  "use strict";

  // Resolve API endpoint from the loading <script> tag (or fallback).
  var currentScript = document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();
  var API_URL =
    (currentScript && currentScript.getAttribute("data-maya-api")) ||
    "/api/chat";

  var WELCOME =
    "Hello, I'm Maya, your query consultant. I handle everything about your " +
    "orders and our services — tracking, status, issues, and what we offer. " +
    "How can I help you today?";

  // Elements
  var launcher = document.getElementById("maya-launcher");
  var windowEl = document.getElementById("maya-window");
  var closeBtn = document.getElementById("maya-close");
  var messagesEl = document.getElementById("maya-messages");
  var typingEl = document.getElementById("maya-typing");
  var form = document.getElementById("maya-form");
  var input = document.getElementById("maya-input");
  var sendBtn = document.getElementById("maya-send");

  // Conversation history sent to the backend for context.
  // System prompt is enforced server-side; we only send user/assistant turns.
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
        body: JSON.stringify({ message: text, history: history })
      });

      if (!res.ok) {
        throw new Error("Server responded with " + res.status);
      }

      var data = await res.json();
      var reply = (data && data.reply) ? data.reply : "";

      setTyping(false);
      if (reply) {
        addMessage(reply, "bot");
        history.push({ role: "assistant", content: reply });
      } else {
        addMessage("I didn't receive a response. Please send your message again.", "error");
      }
    } catch (err) {
      setTyping(false);
      addMessage(
        "I'm unable to reach the service right now. Please check the connection and try again.",
        "error"
      );
      // eslint-disable-next-line no-console
      console.error("[Maya] request failed:", err);
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  // Events
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
    if (e.key === "Escape" && windowEl.classList.contains("maya-open")) {
      closeWindow();
    }
  });
})();
