(function () {
  function initGuidanceRails() {
    setupKundliRail();
    setupNumerologyLayout();
    setupRailButtons();
  }

  function setupKundliRail() {
    var panel = document.getElementById("gp-panel-kundli");
    if (!panel) return;
    var grid = panel.querySelector(".gp-svc-grid");
    if (!grid || grid.classList.contains("gp-side-rail")) return;
    grid.classList.add("gp-side-rail");
    var wrapper = wrapRail(grid, "gp-side-rail-wrap");
    insertControls(wrapper, "Kundli and Life Path cards");
  }

  function setupNumerologyLayout() {
    var panel = document.getElementById("gp-panel-numerology");
    if (!panel) return;
    var grid = panel.querySelector(".gp-svc-grid");
    if (!grid || grid.classList.contains("gp-num-layout")) return;

    var cards = Array.prototype.slice.call(grid.children).filter(function (node) {
      return node.classList && node.classList.contains("gp-svc");
    });
    if (!cards.length) return;

    grid.classList.add("gp-num-layout");

    var consultationCard = cards[0];
    var consultBlock = document.createElement("div");
    consultBlock.className = "gp-num-consult-block";
    consultBlock.appendChild(consultationCard);

    var reportsBlock = document.createElement("div");
    reportsBlock.className = "gp-num-reports-block";
    reportsBlock.innerHTML = [
      '<div class="gp-report-head">',
      '  <div class="gp-report-title"><span>Numerology reports</span><strong>Choose a focused <em>report</em></strong></div>',
      '</div>',
      '<div class="gp-report-rail-wrap"><div class="gp-report-rail"></div></div>'
    ].join("");

    var reportRail = reportsBlock.querySelector(".gp-report-rail");
    cards.slice(1).forEach(function (card) {
      reportRail.appendChild(card);
    });

    grid.appendChild(consultBlock);
    grid.appendChild(reportsBlock);
    insertControls(reportsBlock.querySelector(".gp-report-head"), "Numerology report cards");
  }

  function wrapRail(rail, className) {
    var wrapper = document.createElement("div");
    wrapper.className = className;
    rail.parentNode.insertBefore(wrapper, rail);
    wrapper.appendChild(rail);
    return wrapper;
  }

  function insertControls(target, label) {
    if (!target || target.querySelector(".gp-rail-controls")) return;
    var controls = document.createElement("div");
    controls.className = "gp-rail-controls";
    controls.setAttribute("aria-label", label + " scroll controls");
    controls.innerHTML = [
      '<button type="button" class="gp-rail-btn" data-gp-scroll="-1" aria-label="Previous ' + escapeAttr(label) + '">',
      '  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
      '</button>',
      '<button type="button" class="gp-rail-btn" data-gp-scroll="1" aria-label="Next ' + escapeAttr(label) + '">',
      '  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
      '</button>'
    ].join("");
    if (target.classList.contains("gp-side-rail-wrap")) target.insertBefore(controls, target.firstChild);
    else target.appendChild(controls);
  }

  function setupRailButtons() {
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-gp-scroll]");
      if (!button) return;
      var container = button.closest(".gp-side-rail-wrap, .gp-num-reports-block");
      if (!container) return;
      var rail = container.querySelector(".gp-side-rail, .gp-report-rail");
      if (!rail) return;
      var card = rail.querySelector(".gp-svc");
      var step = card ? card.getBoundingClientRect().width + 16 : Math.round(rail.clientWidth * .82);
      rail.scrollBy({
        left: Number(button.getAttribute("data-gp-scroll")) * step,
        behavior: "smooth"
      });
    });
  }

  function escapeAttr(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGuidanceRails);
  } else {
    initGuidanceRails();
  }
})();
