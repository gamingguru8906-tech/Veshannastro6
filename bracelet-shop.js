(function () {
  var PRODUCTS = [
    { sku: "VA-BR-TP-001", name: "Triple Protection Bracelet", mrp: 1139, price: 799, discount: 30, gemstones: "Tiger Eye + Black Obsidian + Hematite", stock: "In Stock", description: "A bold mixed-stone protection bracelet designed for daily wear and grounding.", benefits: "Protection, grounding, confidence, negativity shielding", tags: ["protection", "career", "strength", "grounding"] },
    { sku: "VA-BR-AM-002", name: "Amethyst Bracelet", mrp: 1429, price: 999, discount: 30, gemstones: "Amethyst", stock: "In Stock", description: "A calming purple crystal bracelet for peace, clarity, and spiritual balance.", benefits: "Calm mind, stress relief, intuition, spiritual growth", tags: ["peace", "intuition", "spirituality", "healing"] },
    { sku: "VA-BR-CQ-003", name: "Clear Quartz Bracelet", mrp: 1429, price: 999, discount: 30, gemstones: "Clear Quartz", stock: "In Stock", description: "A clean transparent crystal bracelet known as a universal energy amplifier.", benefits: "Energy amplification, clarity, focus, cleansing", tags: ["clarity", "focus", "healing", "energy"] },
    { sku: "VA-BR-BT-004", name: "Black Tourmaline Bracelet", mrp: 1279, price: 899, discount: 30, gemstones: "Black Tourmaline", stock: "In Stock", description: "A deep black protection bracelet for grounding and energetic shielding.", benefits: "Protection, grounding, negativity removal, stability", tags: ["protection", "grounding", "negativity", "stability"] },
    { sku: "VA-BR-CT-005", name: "Citrine Natural Bracelet", mrp: 1709, price: 1199, discount: 30, gemstones: "Natural Citrine", stock: "In Stock", description: "A bright natural-citrine bracelet associated with abundance, confidence, and motivation.", benefits: "Wealth, abundance, confidence, success mindset", tags: ["wealth", "success", "confidence", "manifestation"] },
    { sku: "VA-BR-YA-006", name: "Yellow Aventurine Bracelet", mrp: 1139, price: 799, discount: 30, gemstones: "Yellow Aventurine", stock: "In Stock", description: "A warm yellow bracelet for optimism, personal power, and positive action.", benefits: "Confidence, optimism, willpower, decision-making", tags: ["confidence", "positivity", "career", "motivation"] },
    { sku: "VA-BR-RJ-007", name: "Red Jasper Bracelet", mrp: 1139, price: 799, discount: 30, gemstones: "Red Jasper", stock: "In Stock", description: "An earthy red bracelet for stamina, courage, and grounded strength.", benefits: "Strength, stamina, courage, stability", tags: ["health", "strength", "grounding", "courage"] },
    { sku: "VA-BR-TE-008", name: "Tiger Eye Bracelet", mrp: 1139, price: 799, discount: 30, gemstones: "Tiger Eye", stock: "In Stock", description: "A glossy golden-brown bracelet for confidence, focus, and practical success.", benefits: "Confidence, focus, courage, protection", tags: ["career", "success", "protection", "confidence"] },
    { sku: "VA-BR-RQ-009", name: "Rose Quartz Bracelet", mrp: 1279, price: 899, discount: 30, gemstones: "Rose Quartz", stock: "In Stock", description: "A soft pink bracelet for emotional healing, self-love, and harmony.", benefits: "Love, emotional healing, self-love, relationship harmony", tags: ["love", "relationships", "healing", "peace"] },
    { sku: "VA-BR-GA-010", name: "Green Aventurine Bracelet", mrp: 1279, price: 899, discount: 30, gemstones: "Green Aventurine", stock: "In Stock", description: "A soothing green bracelet linked with luck, growth, and heart-centered balance.", benefits: "Luck, growth, opportunity, heart balance", tags: ["wealth", "luck", "growth", "heart"] },
    { sku: "VA-BR-LL-011", name: "Lapis Lazuli Bracelet", mrp: 1279, price: 899, discount: 30, gemstones: "Lapis Lazuli", stock: "In Stock", description: "A royal blue bracelet for wisdom, communication, and inner truth.", benefits: "Wisdom, communication, truth, self-awareness", tags: ["wisdom", "communication", "study", "intuition"] },
    { sku: "VA-BR-MN-012", name: "Peach Moonstone Bracelet", mrp: 1139, price: 799, discount: 30, gemstones: "Peach Moonstone", stock: "In Stock", description: "A warm peach-glow bracelet for emotional balance, gentle confidence and intuition.", benefits: "Emotional balance, intuition, soothing energy, self-acceptance", tags: ["moon", "intuition", "peace", "emotional healing"] }
  ];

  /* ── Premium collection (signature stones & yog bracelets) ── */
  var PREMIUM_PRODUCTS = [
    { sku: "VA-BR-WM-015", name: "White Moonstone Bracelet", mrp: 1999, price: 1399, discount: 30, premium: true, gemstones: "White Moonstone", stock: "In Stock", description: "A luminous milk-white moonstone bracelet for emotional steadiness and heightened intuition.", benefits: "Emotional balance, intuition, calm, feminine energy", tags: ["moon", "intuition", "peace", "healing"] },
    { sku: "VA-BR-7C-013", name: "7 Chakra Bracelet", mrp: 1569, price: 1099, discount: 30, premium: true, gemstones: "7 Chakra mixed gemstones", stock: "In Stock", description: "Seven stones tuned to the body's energy centres for full-spectrum alignment.", benefits: "Chakra balance, energy alignment, positivity, overall wellness", tags: ["chakra", "healing", "balance", "spirituality"] },
    { sku: "VA-BR-IO-014", name: "Iolite Bracelet (Neeli)", mrp: 2279, price: 1599, discount: 30, premium: true, gemstones: "Iolite (Neeli — Saturn substitute)", stock: "In Stock", description: "A violet-blue Saturn substitute (Neeli) for vision, discipline and inner direction.", benefits: "Intuition, vision, inner guidance, Saturn support", tags: ["intuition", "clarity", "spirituality", "focus"] },
    { sku: "VA-BR-LK-016", name: "Lakshmi's Loom — Dhan Yog Bracelet", mrp: 1859, price: 1299, discount: 30, premium: true, gemstones: "Citrine + Pyrite + Green Aventurine", stock: "In Stock", description: "A dhan-yog wealth weave of citrine, pyrite and green aventurine to invite steady abundance.", benefits: "Wealth, abundance, money flow, opportunity", tags: ["wealth", "luck", "success", "manifestation"] },
    { sku: "VA-BR-RE-017", name: "The Rose Embrace — Love Bracelet", mrp: 1859, price: 1299, discount: 30, premium: true, gemstones: "Rose Quartz + Rhodonite", stock: "In Stock", description: "A tender rose-quartz and rhodonite pairing to open the heart and draw warm, lasting love.", benefits: "Love, attraction, self-worth, relationship harmony", tags: ["love", "relationships", "healing", "heart"] },
    { sku: "VA-BR-PY-018", name: "Sunforge Pyrite Bracelet", mrp: 1429, price: 999, discount: 30, premium: true, gemstones: "Pyrite", stock: "In Stock", description: "A golden pyrite band with real fire — for drive, money magnetism and bold confidence.", benefits: "Wealth, willpower, confidence, protection", tags: ["wealth", "confidence", "success", "protection"] }
  ];

  /* what the shop rail renders (core + premium); STORE_PRODUCTS is for lookups/cart */
  var RENDER_PRODUCTS = PRODUCTS.concat(PREMIUM_PRODUCTS);

  var BOOK_PRODUCTS = [
    { sku: "VA-BK-ASTRO-001", productType: "Book", name: "Veshannastro Astrology Book", mrp: 799, price: 499, discount: 38, stock: "In Stock", externalLink: "https://amzn.in/d/0iBlqI7H", description: "A practical astrology book for readers who want timing, chart logic and spiritual guidance in one grounded volume.", benefits: "Birth-chart learning, planetary timing, practical remedies", tags: ["book", "astrology", "kundli"], bookKicker: "Astrology manual", bookMark: "☉", bookColors: ["#111827", "#1D4ED8", "#C9A84C"] },
    { sku: "VA-BK-MANI-002", productType: "Journal", name: "Manifestation Journal", mrp: 699, price: 399, discount: 43, stock: "In Stock", externalLink: "", description: "A guided journal for intentions, affirmations, gratitude, moon-cycle reflections and daily manifestation practice.", benefits: "Manifestation, gratitude, clarity, daily ritual", tags: ["journal", "manifestation", "moon"], bookKicker: "Guided journal", bookMark: "☾", bookColors: ["#2A1217", "#8C1C2E", "#F0D080"] }
  ];

  var STORE_PRODUCTS = PRODUCTS.concat(PREMIUM_PRODUCTS).concat(BOOK_PRODUCTS);

  /* representative colour per stone — drives card tint + glow */
  var STONE_COLORS = {
    "VA-BR-TP-001":"#5c4327","VA-BR-AM-002":"#7e57c2","VA-BR-CQ-003":"#9fb0c0","VA-BR-BT-004":"#2f2f36",
    "VA-BR-CT-005":"#d9a521","VA-BR-YA-006":"#e0b73a","VA-BR-RJ-007":"#a83232","VA-BR-TE-008":"#b07d2a",
    "VA-BR-RQ-009":"#e3a0b4","VA-BR-GA-010":"#4f9e6a","VA-BR-LL-011":"#2b4a8c","VA-BR-MN-012":"#e8b89a",
    "VA-BR-WM-015":"#d7deec","VA-BR-7C-013":"#8a5a9e","VA-BR-IO-014":"#4a5a9e","VA-BR-LK-016":"#c9a24a",
    "VA-BR-RE-017":"#e08aa0","VA-BR-PY-018":"#c79a3a"
  };
  function stoneColor(sku){ return STONE_COLORS[sku] || "#c9a84c"; }
  function hexA(h,a){ var n=parseInt(h.slice(1),16); return "rgba("+(n>>16&255)+","+(n>>8&255)+","+(n&255)+","+a+")"; }

  var CONFIG = {
    razorpayKey: "rzp_live_T0NA0F3UpQiZxl",
    brand: "Veshannastro",
    currency: "INR",
    country: "India",
    sizeLabel: "Free size",
    coupons: {
      "HAPPY10": { value: 10, minCartValue: 1, minQty: 2 },
      "NEW15": { value: 15, minCartValue: 1, requiresRec: true },
      "WELCOME": { flat: 50, minCartValue: 1 }
    },
    targetSheet: "https://docs.google.com/spreadsheets/d/1AGXiDHUkKbWXl8n0Ji-UMYpgA5bJQPtaOf9l1-iaAoA/edit?usp=sharing",
    /* Dedicated Apps Script Web App bound directly to the "gemstones
       orders" sheet above — replaces the old shared Bookings webhook,
       which had no columns for a shipping address or a cart of items. */
    orderWebhook: "https://script.google.com/macros/s/AKfycbzceyZBf_55PIJzJPb7WqmDab-rPRC74YeWprUZEaL6GHD7AuVvuC3XD0NYt5lHLg8o/exec"
  };

  var state = { cart: [], activeFilter: "all", couponCode: null, recUnlocked: false };
  try { state.recUnlocked = sessionStorage.getItem("va_rec_unlocked") === "1"; } catch (e) {}
  var els = {};
  var IMAGE_EXTENSIONS = ["webp", "jpg", "jpeg", "png"];

  function init() {
    if (!document.getElementById("bracelet-shop")) return;
    window.braceletImageFallback = braceletImageFallback;
    window.braceletAltOk = braceletAltOk;
    injectCheckoutShell();
    cacheEls();
    buildFilters();
    renderProducts();
    renderBooks();
    
    var params = new URLSearchParams(window.location.search);
    var bundleStr = params.get("maya_bundle");
    if (bundleStr) {
      var items = bundleStr.split(",");
      items.forEach(function(sku) {
        if (sku) {
          var item = state.cart.find(function (entry) { return entry.sku === sku; });
          if (item) item.qty += 1;
          else state.cart.push({ sku: sku, qty: 1 });
        }
      });
      if (state.cart.length > 0) {
         state.recUnlocked = true;
         try { sessionStorage.setItem("va_rec_unlocked", "1"); } catch (e) {}
         state.couponCode = "NEW15";
         openCart();
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    renderCart();
    bindEvents();
  }

  function injectCheckoutShell() {
    if (document.getElementById("br-cart-panel")) return;
    document.body.insertAdjacentHTML("beforeend", [
      '<div class="br-cart-panel" id="br-cart-panel" aria-hidden="true">',
      '  <div class="br-drawer" role="dialog" aria-modal="true" aria-label="Product cart">',
      '    <div class="br-drawer-head"><h3>Your Cart</h3><button type="button" class="br-close" id="br-cart-close" aria-label="Close cart">&times;</button></div>',
      '    <div class="br-cart-items" id="br-cart-items"></div>',
      '    <div class="br-summary">',
      '      <div class="br-coupon"><input id="br-coupon-code" type="text" inputmode="text" autocomplete="off" placeholder="Coupon code"><button type="button" id="br-apply-coupon">Apply</button></div>',
      '      <div class="br-coupon-msg" id="br-coupon-msg"></div>',
      '      <div class="br-totals" id="br-totals"></div>',
      '      <button type="button" class="br-checkout-btn" id="br-checkout-btn">Checkout</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="br-checkout-modal" id="br-checkout-modal" aria-hidden="true">',
      '  <div class="br-checkout-card" role="dialog" aria-modal="true" aria-label="Product checkout">',
      '    <div class="br-checkout-head"><div><h3>Product Checkout</h3><p>Prepaid checkout for Indian customers. Bracelets are free size; books and journals are shipped as listed.</p></div><button type="button" class="br-close" id="br-checkout-close" aria-label="Close checkout">&times;</button></div>',
      '    <div class="br-checkout-body">',
      '      <form id="br-checkout-form" novalidate>',
      '        <div class="br-form-grid">',
      field("br-name", "Full name", "name", "name", "", "text", true),
      field("br-phone", "Mobile number", "phone", "tel", "", "text", true, "10"),
      field("br-email", "Email", "email", "email", "", "email", true),
      field("br-address1", "Shipping address", "address1", "address-line1", "full", "text", true),
      field("br-address2", "Apartment, landmark", "address2", "address-line2", "full", "text", false),
      field("br-city", "City", "city", "address-level2", "", "text", true),
      stateSelect(),
      field("br-pincode", "Pincode", "pincode", "postal-code", "", "text", true, "6"),
      field("br-country", "Country", "country", "country-name", "", "text", false, "", "India", true),
      '          <div class="br-field full"><label for="br-notes">Special instructions</label><textarea id="br-notes" name="notes" placeholder="Optional"></textarea></div>',
      '        </div>',
      '        <div class="br-form-error" id="br-form-error">Please fill all required checkout details correctly.</div>',
      '      </form>',
      '      <aside class="br-order-box" aria-label="Order summary"><h4>Order Summary</h4><div class="br-order-lines" id="br-order-lines"></div><div class="br-totals br-order-total" id="br-order-total"></div><button type="button" class="br-pay-btn" id="br-pay-btn">Pay with Razorpay</button><p class="br-helper">Your order details are prepared for Google Sheets after successful payment. Keep the Razorpay payment ID for support.</p></aside>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="br-toast" id="br-toast" role="status" aria-live="polite"></div>'
    ].join(""));
  }

  function field(id, label, name, autocomplete, extraClass, type, required, maxlength, value, readonly) {
    return '<div class="br-field ' + (extraClass || "") + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + name + '" autocomplete="' + autocomplete + '" type="' + (type || "text") + '"' + (maxlength ? ' maxlength="' + maxlength + '"' : "") + (required ? " required" : "") + (readonly ? " readonly" : "") + (value ? ' value="' + value + '"' : "") + "></div>";
  }

  function stateSelect() {
    var states = ["", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"];
    return '<div class="br-field"><label for="br-state">State</label><select id="br-state" name="state" autocomplete="address-level1" required>' + states.map(function (s) {
      return '<option value="' + esc(s) + '">' + (s || "Select state") + "</option>";
    }).join("") + "</select></div>";
  }

  function cacheEls() {
    [
      "br-grid", "br-filters", "br-cart-open", "br-cart-panel", "br-cart-close", "br-cart-items",
      "br-cart-count", "br-totals", "br-checkout-btn", "br-coupon-code", "br-apply-coupon",
      "br-coupon-msg", "br-checkout-modal", "br-checkout-close", "br-order-lines",
      "br-order-total", "br-pay-btn", "br-checkout-form", "br-form-error", "br-toast",
      "br-scroll-prev", "br-scroll-next", "ac-books"
    ].forEach(function (id) {
      els[id] = document.getElementById(id);
    });
  }

  function buildFilters() {
    var filters = ["all", "premium", "protection", "wealth", "love", "intuition", "healing", "career"];
    els["br-filters"].innerHTML = filters.map(function (filter) {
      var label = filter === "all" ? "All" : (filter === "premium" ? "✦ Premium" : filter.charAt(0).toUpperCase() + filter.slice(1));
      return '<button type="button" class="br-filter' + (filter === state.activeFilter ? " active" : "") + '" data-filter="' + filter + '">' + label + "</button>";
    }).join("");
  }

  function renderProducts() {
    var products = RENDER_PRODUCTS.filter(function (product) {
      if (state.activeFilter === "all") return true;
      if (state.activeFilter === "premium") return !!product.premium;
      return product.tags.indexOf(state.activeFilter) > -1;
    });
    els["br-grid"].innerHTML = products.map(function (product) {
      var col = stoneColor(product.sku);
      var glow = "radial-gradient(circle at 50% 42%," + hexA(col, .5) + "," + hexA(col, .08) + " 70%)";
      return [
        '<article class="br-card' + (product.premium ? ' br-card--premium' : '') + '" data-sku="' + product.sku + '" style="--scol:' + col + '">',
        '  <div class="br-media" data-view="' + product.sku + '" style="cursor:pointer;background:' + glow + '">',
        '    <img class="br-img-main" src="' + imageFor(product) + '" data-img-base="images/bracelets/' + product.sku + '" data-img-ext-index="0" alt="' + esc(product.name) + '" loading="lazy" decoding="async" onerror="window.braceletImageFallback(this);">',
        '    <img class="br-img-alt" src="images/bracelets/' + product.sku + '-1.' + IMAGE_EXTENSIONS[0] + '" data-img-base="images/bracelets/' + product.sku + '-1" data-img-ext-index="0" alt="" loading="lazy" decoding="async" onload="window.braceletAltOk &amp;&amp; window.braceletAltOk(this)" onerror="window.braceletImageFallback(this);">',
        '    <span class="br-badge">' + product.discount + '% OFF</span>',
        (product.premium ? '    <span class="br-premium-ribbon">Premium</span>' : ''),
        '  </div>',
        '  <div class="br-body">',
        '    <h3 class="br-name" data-view="' + product.sku + '" style="cursor:pointer">' + esc(product.name) + '</h3>',
        '    <p class="br-stone">' + esc(product.gemstones) + '</p>',
        '    <div class="br-price"><strong>' + money(product.price) + '</strong><s>' + money(product.mrp) + '</s></div>',
        '    <div class="br-actions">',
        '      <button type="button" class="br-view" data-view="' + product.sku + '">View details</button>',
        '      <button type="button" class="br-add" data-add="' + product.sku + '" aria-label="Add ' + esc(product.name) + ' to cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>',
        '    </div>',
        '  </div>',
        '</article>'
      ].join("");
    }).join("");
    scrollRailToStart();
  }

  function renderBooks() {
    var host = els["ac-books"];
    if (!host) return;
    host.innerHTML = BOOK_PRODUCTS.map(function (product) {
      var tags = product.tags.map(function (tag) { return "<span>" + esc(tag) + "</span>"; }).join("");
      var colors = product.bookColors || ["#111827", "#6E1423", "#C9A84C"];
      return [
        '<article class="ac-card" data-sku="' + product.sku + '">',
        '  <div class="ac-book-scene">',
        '    <div class="ac-book" style="--book-a:' + colors[0] + ';--book-b:' + colors[1] + ';--book-c:' + colors[2] + ';">',
        '      <span class="ac-book-spine"></span><span class="ac-book-pages"></span>',
        '      <div class="ac-book-cover"><span class="ac-book-kicker">' + esc(product.bookKicker) + '</span><span class="ac-book-mark">' + esc(product.bookMark) + '</span><span class="ac-book-title">' + esc(product.name) + '</span></div>',
        '    </div>',
        '  </div>',
        '  <div class="ac-info">',
        '    <span class="ac-type">' + esc(product.productType) + ' · Veshannastro</span>',
        '    <h3 class="ac-name">' + esc(product.name) + '</h3>',
        '    <p class="ac-copy">' + esc(product.description) + '</p>',
        product.externalLink ? '    <a class="ac-link" href="' + esc(product.externalLink) + '" target="_blank" rel="noopener">View Amazon listing</a>' : '',
        '    <div class="br-tags">' + tags + '</div>',
        '    <div class="br-buy-row">',
        '      <div class="br-price"><strong>' + money(product.price) + '</strong><span><s>' + money(product.mrp) + '</s> launch price</span></div>',
        '      <button type="button" class="br-add" data-add="' + product.sku + '" aria-label="Add ' + esc(product.name) + ' to cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>',
        '    </div>',
        '  </div>',
        '</article>'
      ].join("");
    }).join("");
  }

  function renderCart() {
    var sub = subtotal();
    var discount = discountValue();
    var grand = grandTotal();
    els["br-cart-count"].textContent = String(totalQty());
    els["br-checkout-btn"].disabled = !state.cart.length;

    if (!state.cart.length) {
      els["br-cart-items"].innerHTML = '<div class="br-empty">Your cart is empty. Add a bracelet, book or journal to begin checkout.</div>';
    } else {
      els["br-cart-items"].innerHTML = state.cart.map(function (item) {
        var product = productBySku(item.sku);
        if (!product) return "";
        return [
          '<div class="br-line">',
          cartThumb(product),
          '  <div><h4>' + esc(product.name) + '</h4><p>' + esc(product.sku) + ' - ' + esc(productOptionLabel(product)) + '</p>',
          '  <div class="br-qty"><button type="button" data-dec="' + product.sku + '">-</button><span>' + item.qty + '</span><button type="button" data-inc="' + product.sku + '">+</button><button type="button" class="br-remove" data-remove="' + product.sku + '">Remove</button></div></div>',
          '  <div class="br-line-price">' + money(product.price * item.qty) + '</div>',
          '</div>'
        ].join("");
      }).join("");
    }

    els["br-totals"].innerHTML = totalsHtml(sub, discount, grand);
    renderOrderSummary();
  }

  function renderOrderSummary() {
    if (!els["br-order-lines"]) return;
    els["br-order-lines"].innerHTML = state.cart.map(function (item) {
      var product = productBySku(item.sku);
      return product ? '<div class="br-order-line"><span>' + esc(product.name) + ' x ' + item.qty + '</span><strong>' + money(product.price * item.qty) + '</strong></div>' : "";
    }).join("");
    els["br-order-total"].innerHTML = totalsHtml(subtotal(), discountValue(), grandTotal());
    els["br-pay-btn"].textContent = "Pay " + money(grandTotal()) + " with Razorpay";
  }

  function bindEvents() {
    els["br-filters"].addEventListener("click", function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button) return;
      state.activeFilter = button.getAttribute("data-filter");
      buildFilters();
      renderProducts();
    });

    if (els["br-scroll-prev"]) {
      els["br-scroll-prev"].addEventListener("click", function () { scrollRail(-1); });
    }
    if (els["br-scroll-next"]) {
      els["br-scroll-next"].addEventListener("click", function () { scrollRail(1); });
    }

    els["br-grid"].addEventListener("click", function (event) {
      var button = event.target.closest("[data-add]");
      if (button) { addToCart(button.getAttribute("data-add"), button); return; }
      var view = event.target.closest("[data-view]");
      if (view) { window.location.href = "shop-product.html?sku=" + encodeURIComponent(view.getAttribute("data-view")); }
    });

    if (els["ac-books"]) {
      els["ac-books"].addEventListener("click", function (event) {
        var button = event.target.closest("[data-add]");
        if (button) addToCart(button.getAttribute("data-add"), button);
      });
    }

    document.querySelectorAll("[data-open-store-cart]").forEach(function (button) {
      button.addEventListener("click", openCart);
    });

    els["br-cart-open"].addEventListener("click", openCart);
    els["br-cart-close"].addEventListener("click", closeCart);
    els["br-cart-panel"].addEventListener("click", function (event) {
      if (event.target === els["br-cart-panel"]) closeCart();
    });

    els["br-cart-items"].addEventListener("click", function (event) {
      var inc = event.target.closest("[data-inc]");
      var dec = event.target.closest("[data-dec]");
      var remove = event.target.closest("[data-remove]");
      if (inc) changeQty(inc.getAttribute("data-inc"), 1);
      if (dec) changeQty(dec.getAttribute("data-dec"), -1);
      if (remove) removeItem(remove.getAttribute("data-remove"));
    });

    els["br-apply-coupon"].addEventListener("click", applyCoupon);
    els["br-coupon-code"].addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCoupon();
      }
    });

    els["br-checkout-btn"].addEventListener("click", openCheckout);
    els["br-checkout-close"].addEventListener("click", closeCheckout);
    els["br-checkout-modal"].addEventListener("click", function (event) {
      if (event.target === els["br-checkout-modal"]) closeCheckout();
    });
    els["br-pay-btn"].addEventListener("click", payNow);

    ["br-phone", "br-pincode"].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "");
      });
    });
  }

  function addToCart(sku, button) {
    var item = state.cart.find(function (entry) { return entry.sku === sku; });
    if (item) item.qty += 1;
    else state.cart.push({ sku: sku, qty: 1 });
    renderCart();
    flyToCart(button);
    toast("Added to cart");
  }

  function changeQty(sku, delta) {
    var item = state.cart.find(function (entry) { return entry.sku === sku; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter(function (entry) { return entry.sku !== sku; });
    renderCart();
  }

  function removeItem(sku) {
    state.cart = state.cart.filter(function (entry) { return entry.sku !== sku; });
    renderCart();
  }

  function applyCoupon() {
    var input = els["br-coupon-code"];
    var code = (input.value || "").trim().toUpperCase();
    if (!code) {
      els["br-coupon-msg"].textContent = "Enter HAPPY10 to apply 10% off.";
      return;
    }
    var validCoupon = CONFIG.coupons[code];
    if (!validCoupon) {
      state.couponCode = null;
      els["br-coupon-msg"].textContent = "This coupon is not valid.";
      renderCart();
      return;
    }
    if (validCoupon.requiresRec && !state.recUnlocked) {
      state.couponCode = null;
      els["br-coupon-msg"].textContent = code + " unlocks after a free recommendation from Maaya. Ask Maaya for a bracelet pick to claim 15% off.";
      renderCart();
      return;
    }
    if (subtotal() < validCoupon.minCartValue || (validCoupon.minQty && totalQty() < validCoupon.minQty)) {
      state.couponCode = null;
      els["br-coupon-msg"].textContent = validCoupon.minQty
        ? ("Add at least " + validCoupon.minQty + " items to use this coupon.")
        : "Cart value is too low for this coupon.";
      renderCart();
      return;
    }
    state.couponCode = code;
    input.value = code;
    els["br-coupon-msg"].textContent = code + " applied. " + (validCoupon.flat ? ("Rs. " + validCoupon.flat + " off added.") : (validCoupon.value + "% discount added."));
    renderCart();
  }

  function openCart() {
    els["br-cart-panel"].classList.add("open");
    els["br-cart-panel"].setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    els["br-cart-panel"].classList.remove("open");
    els["br-cart-panel"].setAttribute("aria-hidden", "true");
  }

  function openCheckout() {
    if (!state.cart.length) {
      toast("Add a bracelet first");
      return;
    }
    closeCart();
    renderOrderSummary();
    els["br-checkout-modal"].classList.add("open");
    els["br-checkout-modal"].setAttribute("aria-hidden", "false");
  }

  function closeCheckout() {
    els["br-checkout-modal"].classList.remove("open");
    els["br-checkout-modal"].setAttribute("aria-hidden", "true");
  }

  function payNow() {
    if (!state.cart.length) {
      toast("Cart is empty");
      return;
    }
    if (!validateCheckout()) return;
    if (window.location.protocol === "file:") {
      alert("Payment cannot run from a local file. Please open the live https website to accept Razorpay payments.");
      return;
    }
    if (typeof Razorpay === "undefined") {
      alert("Razorpay could not be loaded. Please check the connection and try again.");
      return;
    }

    var amount = grandTotal();
    var customer = customerData();
    els["br-pay-btn"].disabled = true;
    els["br-pay-btn"].textContent = "Opening Razorpay...";

    try {
      var rzp = new Razorpay({
        key: CONFIG.razorpayKey,
        amount: amount * 100,
        currency: CONFIG.currency,
        name: CONFIG.brand,
        description: "Veshannastro Product Order",
        prefill: { name: customer.name, email: customer.email, contact: "+91" + customer.phone },
        notes: { category: "Gemstone Bracelet", coupon: state.couponCode || "", country: CONFIG.country },
        theme: { color: "#6E1423" },
        modal: { ondismiss: function () { els["br-pay-btn"].disabled = false; renderOrderSummary(); } },
        handler: function (response) {
          var order = buildOrderPayload(customer, response.razorpay_payment_id);
          logBraceletOrder(order);
          try { fbq("track", "Purchase", { value: amount, currency: "INR" }); } catch (err) {}
          state.cart = [];
          state.couponCode = null;
          renderCart();
          closeCheckout();
          toast("Payment successful. Order received.");
          openWhatsAppConfirmation(order);
        }
      });
      try { fbq("track", "InitiateCheckout", { value: amount, currency: "INR" }); } catch (err) {}
      rzp.on("payment.failed", function (response) {
        els["br-pay-btn"].disabled = false;
        renderOrderSummary();
        var msg = response && response.error && response.error.description ? response.error.description : "Unknown error";
        alert("Payment failed: " + msg);
      });
      rzp.open();
    } catch (err) {
      els["br-pay-btn"].disabled = false;
      renderOrderSummary();
      alert("Could not open Razorpay: " + err.message);
    }
  }

  function validateCheckout() {
    var required = ["br-name", "br-phone", "br-email", "br-address1", "br-city", "br-state", "br-pincode"];
    var ok = true;
    required.forEach(function (id) {
      var input = document.getElementById(id);
      var valid = input && String(input.value || "").trim();
      if (id === "br-phone") valid = /^[6-9]\d{9}$/.test(input.value.trim());
      if (id === "br-pincode") valid = /^\d{6}$/.test(input.value.trim());
      if (id === "br-email") valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value.trim());
      if (input) input.style.borderColor = valid ? "" : "rgba(166,56,47,.75)";
      if (!valid) ok = false;
    });
    els["br-form-error"].classList.toggle("show", !ok);
    return ok;
  }

  function customerData() {
    return {
      name: value("br-name"),
      phone: value("br-phone"),
      email: value("br-email"),
      address1: value("br-address1"),
      address2: value("br-address2"),
      city: value("br-city"),
      state: value("br-state"),
      pincode: value("br-pincode"),
      country: "India",
      notes: value("br-notes")
    };
  }

  function buildOrderPayload(customer, paymentId) {
    var items = state.cart.map(function (item) {
      var product = productBySku(item.sku);
      if (!product) return null;
      return {
        sku: product.sku,
        name: product.name,
        product_type: product.productType || "Bracelet",
        quantity: item.qty,
        option: productOptionLabel(product),
        unit_price: product.price,
        line_total: product.price * item.qty,
        gemstones: product.gemstones || "",
        benefits: product.benefits || ""
      };
    }).filter(Boolean);

    return {
      timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      order_id: "VA-BR-" + Date.now(),
      category: "Product Store",
      source: "Website Product Checkout",
      payment_status: "Paid",
      payment_id: paymentId,
      payment_method: "Razorpay prepaid",
      currency: "INR",
      customer: customer,
      items: items,
      item_summary: items.map(function (item) {
        return item.name + " x " + item.quantity + " (" + item.option + ")";
      }).join("; "),
      subtotal: subtotal(),
      coupon: state.couponCode || "",
      discount: discountValue(),
      total: grandTotal(),
      shipping_country: "India",
      target_sheet: CONFIG.targetSheet
    };
  }

  function logBraceletOrder(order) {
    try {
      fetch(CONFIG.orderWebhook, {
        method: "POST",
        body: JSON.stringify(order),
        mode: "no-cors"
      });
    } catch (err) {
      console.warn("Bracelet order sheet log failed:", err);
    }
  }

  function openWhatsAppConfirmation(order) {
    var msg = [
      "Hi Veshannastro, I have paid for my gemstone bracelet order.",
      "",
      "Order ID: " + order.order_id,
      "Payment ID: " + order.payment_id,
      "Total: " + money(order.total),
      "Name: " + order.customer.name,
      "Items: " + order.item_summary
    ].join("\n");
    setTimeout(function () {
      window.open("https://wa.me/918827684725?text=" + encodeURIComponent(msg), "_blank");
    }, 650);
  }

  function totalsHtml(subtotalValue, discount, grand) {
    var couponText = state.couponCode
      ? (state.couponCode === "NEW15" ? " (NEW15 · AI pick)" : " (" + state.couponCode + ")")
      : "";
    return [
      "<div><span>Subtotal</span><strong>" + money(subtotalValue) + "</strong></div>",
      "<div><span>Coupon" + couponText + "</span><strong>- " + money(discount) + "</strong></div>",
      "<div><span>Shipping</span><strong>Free across India</strong></div>",
      '<div class="grand"><span>Total payable now</span><strong>' + money(grand) + "</strong></div>"
    ].join("");
  }

  function flyToCart(button) {
    if (!button || !els["br-cart-open"] || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var from = button.getBoundingClientRect();
    var to = els["br-cart-open"].getBoundingClientRect();
    var bead = document.createElement("span");
    bead.className = "br-fly-bead";
    bead.style.left = from.left + from.width / 2 - 9 + "px";
    bead.style.top = from.top + from.height / 2 - 9 + "px";
    document.body.appendChild(bead);
    requestAnimationFrame(function () {
      bead.style.transform = "translate(" + (to.left - from.left + to.width / 2 - from.width / 2) + "px," + (to.top - from.top + to.height / 2 - from.height / 2) + "px) scale(.45)";
      bead.style.opacity = "0";
    });
    setTimeout(function () { bead.remove(); }, 650);
  }

  function toast(message) {
    els["br-toast"].textContent = message;
    els["br-toast"].classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () {
      els["br-toast"].classList.remove("show");
    }, 2200);
  }

  function subtotal() {
    return state.cart.reduce(function (sum, item) {
      var product = productBySku(item.sku);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);
  }

  function discountValue() {
    var sub = subtotal();
    if (!state.couponCode) return 0;
    var coupon = CONFIG.coupons[state.couponCode];
    if (!coupon || sub < coupon.minCartValue) return 0;
    if (coupon.minQty && totalQty() < coupon.minQty) return 0;
    if (coupon.requiresRec && !state.recUnlocked) return 0;
    if (coupon.flat) return Math.min(coupon.flat, sub);
    return Math.round(sub * coupon.value / 100);
  }

  function grandTotal() {
    return Math.max(0, subtotal() - discountValue());
  }

  function totalQty() {
    return state.cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function productBySku(sku) {
    return STORE_PRODUCTS.find(function (product) { return product.sku === sku; });
  }

  function imageFor(product) {
    return "images/bracelets/" + product.sku + "." + IMAGE_EXTENSIONS[0];
  }

  function productOptionLabel(product) {
    if (product.productType === "Book") return "Paperback";
    if (product.productType === "Journal") return "Guided journal";
    return CONFIG.sizeLabel;
  }

  function cartThumb(product) {
    if (product.productType === "Book" || product.productType === "Journal") {
      var colors = product.bookColors || ["#111827", "#6E1423", "#C9A84C"];
      return '<div class="br-line-img ac-cart-book" style="--book-a:' + colors[0] + ';--book-b:' + colors[1] + ';--book-c:' + colors[2] + ';">' + esc(product.bookMark || "☉") + '</div>';
    }
    return '<img class="br-line-img" src="' + imageFor(product) + '" data-img-base="images/bracelets/' + product.sku + '" data-img-ext-index="0" alt="" onerror="window.braceletImageFallback(this);">';
  }

  function braceletAltOk(img) {
    if (img.classList.contains("br-missing")) return;
    var card = img.closest(".br-card");
    if (card) card.classList.add("has-alt");
  }

  function braceletImageFallback(img) {
    var base = img.getAttribute("data-img-base");
    var index = parseInt(img.getAttribute("data-img-ext-index") || "0", 10) + 1;
    if (!base || index >= IMAGE_EXTENSIONS.length) {
      img.classList.add("br-missing");
      if (img.classList.contains("br-line-img")) img.style.display = "none";
      return;
    }
    img.setAttribute("data-img-ext-index", String(index));
    img.src = base + "." + IMAGE_EXTENSIONS[index];
  }

  function scrollRail(direction) {
    var rail = els["br-grid"];
    if (!rail) return;
    var card = rail.querySelector(".br-card");
    var step = card ? card.getBoundingClientRect().width + 16 : Math.round(rail.clientWidth * .8);
    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  function scrollRailToStart() {
    var rail = els["br-grid"];
    if (rail) rail.scrollTo({ left: 0, behavior: "smooth" });
  }

  function value(id) {
    var input = document.getElementById(id);
    return input ? String(input.value || "").trim() : "";
  }

  function money(amount) {
    return "Rs. " + Number(amount || 0).toLocaleString("en-IN");
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  window.braceletShopApi = {
    addToCart: addToCart,
    registerProduct: function(product) {
      if (!productBySku(product.sku)) STORE_PRODUCTS.push(product);
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();