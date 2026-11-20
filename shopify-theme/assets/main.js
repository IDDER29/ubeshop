/* Ube Halaya — cart, navigation and product page interactions */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var FREE_SHIPPING = 45;
  var SHIPPING_COST = 5.9;
  var LATTES_PER_CAN = 25;
  var shop = JSON.parse(document.getElementById("ube-shop-data").textContent);
  var root = shop.root.replace(/\/?$/, "/");

  // lowStock: true shows "Plus que quelques exemplaires en stock" on the product page.
  // Only switch it on when stock is really low: a false scarcity claim is illegal in France.
  var PRODUCTS = {
    "canette-1": { name: "Éclat d’Ube", meta: "1 canette · 50 g", content: "1 canette de 50 g", cans: 1, price: 17.9, img: shop.images["format-1"], photo: shop.images["product-main"], lowStock: false },
    "coffret-3": { name: "Coffret découverte", meta: "3 canettes · 150 g", content: "3 canettes de 50 g dans un coffret cadeau", cans: 3, price: 46.9, img: shop.images["format-3"], photo: shop.images["gift-pyramid"], lowStock: false },
    "coffret-6": { name: "Coffret à partager", meta: "6 canettes · 300 g", content: "6 canettes de 50 g dans un coffret cadeau", cans: 6, price: 84.9, img: shop.images["format-6"], photo: shop.images["format-6"], lowStock: false }
  };

  Object.keys(PRODUCTS).forEach(function (key) {
    var variant = shop.variants[key];
    Object.assign(PRODUCTS[key], {
      id: variant.id,
      available: Boolean(variant.available),
      lowStock: variant.lowStock
    });
    if (variant.price !== null) PRODUCTS[key].price = variant.price / 100;
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: shop.currency });
  function money(n) { return euro.format(n).replace(/ /g, " "); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var cart = shop.cart;
  var pending = Promise.resolve();

  function count() { return cart.item_count; }
  function subtotal() { return cart.total_price / 100; }
  function productForVariant(id) {
    return Object.values(PRODUCTS).find(function (product) { return product.id === id; });
  }

  async function requestCart(path, data) {
    var options = { cache: "no-store", headers: { Accept: "application/json" } };
    if (data) {
      options.method = "POST";
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(data);
    }
    var response = await fetch(root + path, options);
    var result = await response.json();
    if (!response.ok) {
      throw new Error(typeof result.description === "string" ? result.description : "Le panier est momentanément indisponible.");
    }
    return result;
  }

  async function refreshCart() {
    cart = await requestCart("cart.js");
    render();
  }

  function enqueue(operation) {
    var result = pending.then(operation).catch(async function (error) {
      try { await refreshCart(); } catch (_) { render(); }
      toast(error.message || "Le panier est momentanément indisponible.");
      return false;
    });
    pending = result;
    return result;
  }

  function add(key, quantity) {
    var variant = PRODUCTS[key];
    if (!variant || !variant.available) return Promise.resolve(false);
    return enqueue(async function () {
      await requestCart("cart/add.js", { items: [{ id: variant.id, quantity: quantity }] });
      try {
        await refreshCart();
      } catch (_) {
        // The add already succeeded. The drawer refreshes again on open.
        toast("Article ajouté. Actualisation du panier en cours.");
      }
      $$(".cart-count").forEach(function (el) {
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
      });
      return true;
    });
  }

  function changeLine(key, quantityFor) {
    return enqueue(async function () {
      var item = cart.items.find(function (line) { return line.key === key; });
      if (!item) return false;
      cart = await requestCart("cart/change.js", {
        id: key,
        quantity: Math.max(0, quantityFor(item.quantity))
      });
      render();
      return true;
    });
  }

  function escapeHTML(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  /* ---------- Drawer (with focus trap) ---------- */

  var drawer = document.getElementById("cart-drawer");
  var itemsEl = document.getElementById("cart-items");
  var lastFocus = null;

  function openCart(trigger) {
    if (isCartOpen()) return;
    lastFocus = trigger instanceof HTMLElement ? trigger : document.activeElement;
    if (nav && nav.classList.contains("is-open")) setMenu(false);
    enqueue(refreshCart);
    drawer.removeAttribute("inert");
    document.body.classList.add("cart-open");
    $(".drawer__close", drawer).focus();
  }
  function closeCart() {
    document.body.classList.remove("cart-open");
    drawer.setAttribute("inert", "");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function isCartOpen() { return document.body.classList.contains("cart-open"); }

  document.addEventListener("keydown", function (e) {
    if (!isCartOpen()) return;
    if (e.key === "Escape") { closeCart(); return; }
    if (e.key !== "Tab") return;
    var focusables = $$("button:not([disabled]), a[href], input", drawer).filter(function (element) {
      return element.getClientRects().length > 0;
    });
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  function lineHTML(item, readonly) {
    var p = productForVariant(item.variant_id) || { name: item.product_title, meta: item.variant_title, img: item.image };
    var name = escapeHTML(p.name);
    var src = p.img ? escapeHTML(p.img) : shop.images["canette-1"];
    var controls = readonly
      ? '<div class="line-item__meta">Quantité : ' + item.quantity + "</div>"
      : '<div class="qty"><button type="button" data-act="dec" aria-label="Retirer une unité">−</button>' +
        '<input type="number" inputmode="numeric" min="0" value="' + item.quantity + '" aria-label="Quantité : ' + name + '" data-act="set">' +
        '<button type="button" data-act="inc" aria-label="Ajouter une unité">+</button></div>';
    return (
      '<li class="line-item" data-id="' + escapeHTML(item.key) + '">' +
      '<img src="' + src + '" alt="" width="72" height="54">' +
      "<div><h3>" + name + '</h3><div class="line-item__meta">' + escapeHTML(p.meta) + "</div>" + controls + "</div>" +
      '<div class="line-item__right"><div class="line-item__price">' + money(item.final_line_price / 100) + "</div>" +
      (readonly ? "" : '<button type="button" class="line-item__remove" data-act="remove">Retirer</button>') + "</div>" +
      "</li>"
    );
  }

  /* The cart page and drawer share the Shopify cart state. */
  function renderPage() {
    var items = cart.items;
    var filled = items.length > 0;
    $$("[data-page-filled]").forEach(function (el) { el.hidden = !filled; });
    $$("[data-page-empty]").forEach(function (el) { el.hidden = filled; });
    $$("[data-filled-text]").forEach(function (el) { el.textContent = filled ? el.dataset.filledText : el.dataset.emptyText; });
    if (!filled) return;
    var sub = subtotal();
    var remaining = Math.max(0, FREE_SHIPPING - sub);
    var shipping = remaining === 0 ? 0 : SHIPPING_COST;
    $$("[data-page-items]").forEach(function (list) {
      var readonly = list.hasAttribute("data-readonly");
      list.innerHTML = items.map(function (item) { return lineHTML(item, readonly); }).join("");
    });
    $$("[data-page-subtotal]").forEach(function (el) { el.textContent = money(sub); });
    $$("[data-page-shipping]").forEach(function (el) { el.textContent = shipping === 0 ? "Offerte" : money(shipping); });
    $$("[data-page-shipping-label]").forEach(function (el) { el.textContent = shipping === 0 ? "livraison offerte" : money(shipping); });
    $$("[data-page-total]").forEach(function (el) { el.textContent = money(sub + shipping); });
    var msg = $("[data-page-ship-msg]");
    if (msg) {
      msg.innerHTML = remaining > 0
        ? "Plus que <strong>" + money(remaining) + "</strong> pour la livraison offerte."
        : "Bonne nouvelle : <strong>la livraison est offerte</strong> !";
      $("[data-page-ship-bar]").style.width = Math.min(100, (sub / FREE_SHIPPING) * 100) + "%";
    }
  }

  function render() {
    renderPage();
    var n = count();
    $$(".cart-count").forEach(function (el) {
      el.textContent = n;
      el.hidden = n === 0;
    });
    $$(".cart-btn").forEach(function (b) {
      b.setAttribute("aria-label", n ? "Ouvrir le panier (" + n + " article" + (n > 1 ? "s" : "") + ")" : "Ouvrir le panier");
    });
    if (!drawer) return;

    var sub = subtotal();
    var remaining = Math.max(0, FREE_SHIPPING - sub);
    $("#ship-msg").innerHTML = sub === 0
      ? "Livraison offerte dès <strong>" + money(FREE_SHIPPING) + "</strong> d’achat."
      : remaining > 0
        ? "Plus que <strong>" + money(remaining) + "</strong> pour la livraison offerte."
        : "Bonne nouvelle : <strong>la livraison est offerte</strong> !";
    $("#ship-bar").style.width = Math.min(100, (sub / FREE_SHIPPING) * 100) + "%";

    var items = cart.items;
    if (!items.length) {
      itemsEl.innerHTML =
        '<li class="drawer__empty"><p class="script">Votre panier est vide…</p>' +
        '<a class="btn btn--sm" href="' + escapeHTML(shop.productUrl) + '">Découvrir Éclat d’Ube</a></li>';
    } else {
      itemsEl.innerHTML = items.map(function (item) { return lineHTML(item); }).join("") + upsellHTML(remaining);
    }
    drawer.classList.toggle("is-empty", !items.length);

    var shipping = sub === 0 || remaining === 0 ? 0 : SHIPPING_COST;
    $("#cart-subtotal").textContent = money(sub);
    $("#cart-shipping").textContent = sub === 0 ? "—" : shipping === 0 ? "Offerte" : money(shipping);
    $("#cart-total").textContent = money(sub + shipping);
    $("#checkout-btn").disabled = !items.length;
  }

  /* Below the free-delivery threshold, suggest the coffret that reaches it */
  function upsellHTML(remaining) {
    var p = PRODUCTS["coffret-3"];
    if (remaining <= 0 || !p.available || p.price < FREE_SHIPPING ||
        cart.items.some(function (item) {
          return item.variant_id === p.id || item.variant_id === PRODUCTS["coffret-6"].id;
        })) return "";
    return '<li class="drawer__upsell">' +
      '<img src="' + p.img + '" alt="" width="64" height="48">' +
      '<div><p class="drawer__upsell-title">Passez au coffret découverte</p>' +
      '<p class="drawer__upsell-text">3 canettes · ' + money(p.price) + ' · livraison offerte</p></div>' +
      '<button type="button" class="btn btn--sm btn--ghost" data-upsell="coffret-3">Ajouter</button></li>';
  }

  function bindLines(listEl) {
    listEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      var li = e.target.closest(".line-item");
      if (!btn || !li || btn.tagName === "INPUT") return;
      var id = li.dataset.id;
      var act = btn.dataset.act;
      changeLine(id, function (quantity) {
        if (act === "inc") return quantity + 1;
        if (act === "dec") return quantity - 1;
        return 0;
      }).then(function () {
        var again = $('.line-item[data-id="' + CSS.escape(id) + '"] [data-act="' + act + '"]', listEl);
        if (again) again.focus();
        else if (listEl === itemsEl) $(".drawer__close", drawer).focus();
      });
    });
    listEl.addEventListener("change", function (e) {
      var li = e.target.closest(".line-item");
      if (!li || e.target.dataset.act !== "set") return;
      var v = parseInt(e.target.value, 10);
      changeLine(li.dataset.id, function () { return isNaN(v) ? 1 : v; });
    });
  }
  if (itemsEl) bindLines(itemsEl);
  $$("[data-page-items]:not([data-readonly])").forEach(bindLines);

  $$("[data-open-cart]").forEach(function (b) { b.addEventListener("click", openCart); });
  if (itemsEl) itemsEl.addEventListener("click", function (e) {
    var up = e.target.closest("[data-upsell]");
    if (up) add(up.dataset.upsell, 1);
  });

  /* Format cards: add the chosen format straight to the cart */
  $$("[data-add]").forEach(function (b) {
    b.addEventListener("click", async function () {
      b.disabled = true;
      var added = await add(b.dataset.add, 1);
      b.disabled = false;
      if (added) openCart(b);
    });
  });
  $$("[data-close-cart]").forEach(function (b) { b.addEventListener("click", closeCart); });

  /* ---------- Toast ---------- */

  var toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.appendChild(toastEl);
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2800);
  }

  /* ---------- Sticky header ---------- */

  var header = document.getElementById("site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */

  var toggle = $(".menu-toggle");
  var nav = document.getElementById("site-nav");
  var navBackdrop = $(".nav-backdrop");
  var mobileMenu = window.matchMedia("(max-width: 900px)");
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (navBackdrop) navBackdrop.hidden = !open;
    if (open) { var first = $("a", nav); if (first) first.focus({ preventScroll: true }); }
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    if (navBackdrop) navBackdrop.addEventListener("click", function () { setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (e.key === "Escape") { setMenu(false); toggle.focus(); return; }
      // Keep Tab inside the open menu (the toggle closes it)
      if (e.key === "Tab") {
        var items = [toggle].concat($$("a", nav));
        var i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    var onBreakpoint = function () { if (!mobileMenu.matches && nav.classList.contains("is-open")) setMenu(false); };
    if (mobileMenu.addEventListener) mobileMenu.addEventListener("change", onBreakpoint);
  }

  /* ---------- First-visit offer (-10 %) ---------- */

  var WELCOME_KEY = "ube-halaya-welcome-seen";
  var WELCOME_DELAY = 6000;
  var welcome = document.getElementById("welcome");
  var welcomeSkipPage = /\bpage-(panier|commande|404)\b/.test(document.body.className);

  function welcomeSeen() {
    try { return localStorage.getItem(WELCOME_KEY) === "1"; } catch (e) { return true; }
  }
  function markWelcomeSeen() {
    try { localStorage.setItem(WELCOME_KEY, "1"); } catch (e) { /* ignore */ }
  }

  var welcomeSignup = $("#welcome-newsletter");
  if (welcomeSignup) welcomeSignup.addEventListener("submit", function () {
    try { sessionStorage.setItem("ube-welcome-signup", "1"); } catch (_) {}
  });
  var returningFromWelcome = location.hash === "#welcome-newsletter";
  try {
    returningFromWelcome = returningFromWelcome || sessionStorage.getItem("ube-welcome-signup") === "1";
    sessionStorage.removeItem("ube-welcome-signup");
  } catch (_) {}

  if (welcome && typeof welcome.showModal === "function") {
    var welcomeSuccess = $("[data-welcome-success]", welcome);
    var welcomeError = $("[data-welcome-error]", welcome);
    if (returningFromWelcome && (welcomeSuccess || welcomeError)) {
      markWelcomeSeen();
      if (welcomeSuccess) {
        $(".welcome__form", welcome).hidden = true;
        $(".welcome__skip", welcome).hidden = true;
        $(".welcome__done", welcome).hidden = false;
      }
      welcome.showModal();
    } else if (!welcomeSkipPage && !welcomeSeen()) {
      setTimeout(function () {
        if (isCartOpen() || document.body.classList.contains("menu-open") || welcomeSeen()) return;
        markWelcomeSeen();
        welcome.showModal();
      }, WELCOME_DELAY);
    }

    $$("[data-close-welcome]", welcome).forEach(function (b) {
      b.addEventListener("click", function () { welcome.close(); });
    });
    // Click on the dimmed backdrop closes it
    welcome.addEventListener("click", function (e) { if (e.target === welcome) welcome.close(); });

    $("[data-copy-code]", welcome).addEventListener("click", function (e) {
      var btn = e.currentTarget;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(btn.dataset.copyCode).then(function () { $("span", btn).textContent = "Copié !"; }, function () {});
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */

  var revealTargets = $$(".h-section, .format-card, .step, .recipe, .discover-banner, .journey article, .why, .tale, .pledges li, .review, .story__copy, .gift-card, .offer-band__copy, .faq, .specs, .final-cta__inner");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach(function (el, i) {
      // Only animate what starts below the fold, so nothing visible on load flickers
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("reveal");
        el.style.transitionDelay = (i % 3) * 80 + "ms";
        io.observe(el);
      }
    });
  }

  /* ---------- Product page ---------- */

  var buyForm = document.getElementById("buy-form");
  if (buyForm) {
    var priceEl = document.getElementById("product-price");
    var btnPrice = document.getElementById("btn-price");
    var addBtn = document.getElementById("add-btn");
    var unitEl = document.getElementById("unit-price");
    var qtyInput = document.getElementById("qty");
    var mainImg = document.getElementById("gallery-img");
    var main = mainImg.parentElement;
    var thumbs = $$(".gallery__thumbs button");

    var selected = function () { var radio = $('[data-format]:checked', buyForm); return radio ? radio.dataset.format : "canette-1"; };
    var qty = function () {
      var v = parseInt(qtyInput.value, 10);
      return isNaN(v) || v < 1 ? 1 : Math.min(99, v);
    };

    var photoTimer;
    var zoomButton = $(".gallery__zoom");
    function resetZoom() {
      main.classList.remove("is-zoomed");
      mainImg.style.transformOrigin = "";
      zoomButton.setAttribute("aria-label", "Agrandir l’image");
      zoomButton.setAttribute("aria-pressed", "false");
    }
    var showPhoto = function (src, alt, immediate) {
      clearTimeout(photoTimer);
      resetZoom();
      var matchingThumb = thumbs.find(function (thumb) { return thumb.dataset.src === src; });
      thumbs.forEach(function (thumb) {
        thumb.setAttribute("aria-pressed", String(thumb === matchingThumb));
      });
      function applyPhoto() {
        mainImg.src = src;
        mainImg.alt = alt || (matchingThumb ? $("img", matchingThumb).alt : "Coffret Éclat d’Ube");
        mainImg.classList.remove("is-swapping");
      }
      if (immediate || reduceMotion || mainImg.getAttribute("src") === src) {
        applyPhoto();
        return;
      }
      mainImg.classList.add("is-swapping");
      photoTimer = setTimeout(applyPhoto, 180);
    };

    var update = function () {
      var p = PRODUCTS[selected()];
      addBtn.disabled = !p.available;
      $("[data-buy-label]", addBtn).textContent = p.available ? "Ajouter au panier" : "Indisponible";
      var mobileButton = $("#mobile-buy-btn");
      mobileButton.disabled = !p.available;
      mobileButton.textContent = p.available ? "Ajouter au panier" : "Indisponible";
      priceEl.textContent = money(p.price);
      btnPrice.textContent = money(p.price * qty());
      unitEl.textContent = money(p.price / (p.cans * LATTES_PER_CAN));
      var contentEl = document.getElementById("format-content");
      if (contentEl) contentEl.textContent = p.content;
      var stockEl = document.getElementById("stock-low");
      if (stockEl) stockEl.hidden = !p.lowStock;
      $("#mobile-buy-price").textContent = money(p.price * qty());
      $("#mobile-buy-format").textContent = p.meta + (qty() > 1 ? " × " + qty() : "");
    };

    var selectFormat = function (id) {
      var radio = $('input[data-format="' + id + '"]', buyForm);
      if (!radio || radio.disabled) return;
      radio.checked = true;
      update();
      showPhoto(PRODUCTS[id].photo);
    };

    buyForm.addEventListener("change", function (e) {
      if (e.target.hasAttribute("data-format")) showPhoto(PRODUCTS[selected()].photo);
      update();
    });
    $$("[data-qty]", buyForm).forEach(function (b) {
      b.addEventListener("click", function () {
        qtyInput.value = Math.max(1, Math.min(99, qty() + parseInt(b.dataset.qty, 10)));
        update();
      });
    });
    qtyInput.addEventListener("input", update);
    qtyInput.addEventListener("blur", function () { qtyInput.value = qty(); update(); });

    var adding = false;
    var addSelected = async function () {
      if (adding || addBtn.disabled) return;
      adding = true;
      var added = await add(selected(), qty());
      adding = false;
      if (!added) return;
      addBtn.classList.add("is-added");
      $("[data-buy-label]", addBtn).textContent = "Ajouté au panier ✓";
      setTimeout(function () {
        addBtn.classList.remove("is-added");
        update();
      }, 1400);
      setTimeout(openCart, 350);
    };
    buyForm.addEventListener("submit", function (e) { e.preventDefault(); addSelected(); });

    // Preselect a format from the URL (?format=coffret-3)
    var params = new URLSearchParams(location.search);
    var fromUrl = Object.keys(PRODUCTS).find(function (key) {
      return PRODUCTS[key].id && PRODUCTS[key].id === shop.selectedVariant;
    }) || params.get("format");
    if (!Object.hasOwn(PRODUCTS, fromUrl)) fromUrl = null;
    if (fromUrl && PRODUCTS[fromUrl].id) {
      $('input[data-format="' + fromUrl + '"]', buyForm).checked = true;
      showPhoto(PRODUCTS[fromUrl].photo, null, true);
    }
    update();

    // Links on the page that pick a format ("Découvrir le trio")
    $$("[data-select-format]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        selectFormat(a.dataset.selectFormat);
        buyForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        toast("Format sélectionné : " + PRODUCTS[a.dataset.selectFormat].name);
      });
    });

    // Gallery
    thumbs.forEach(function (t) {
      t.addEventListener("click", function () { showPhoto(t.dataset.src, $("img", t).alt); });
    });
    zoomButton.addEventListener("click", function () {
      var zoomed = main.classList.toggle("is-zoomed");
      this.setAttribute("aria-label", zoomed ? "Réduire l’image" : "Agrandir l’image");
      this.setAttribute("aria-pressed", String(zoomed));
    });
    mainImg.addEventListener("click", resetZoom);
    main.addEventListener("mousemove", function (e) {
      if (!main.classList.contains("is-zoomed")) return;
      var r = main.getBoundingClientRect();
      mainImg.style.transformOrigin = ((e.clientX - r.left) / r.width) * 100 + "% " + ((e.clientY - r.top) / r.height) * 100 + "%";
    });

    // Sticky add-to-cart bar on phones: visible once the main button is off screen
    var bar = document.getElementById("mobile-buy");
    var barBtn = document.getElementById("mobile-buy-btn");
    barBtn.addEventListener("click", addSelected);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var hidden = !entries[0].isIntersecting && entries[0].boundingClientRect.top < 0;
        bar.classList.toggle("is-visible", hidden);
        bar.setAttribute("aria-hidden", String(!hidden));
        barBtn.tabIndex = hidden ? 0 : -1;
      }).observe(addBtn);
    }

  }

  /* ---------- Swipe rows: page dots (only when the row actually scrolls) ---------- */

  $$("[data-carousel]").forEach(function (track) {
    var slides = Array.prototype.slice.call(track.children);
    var dots = document.createElement("div");
    dots.className = "carousel-dots";
    dots.innerHTML = slides.map(function (s, i) {
      return '<button type="button" aria-label="Afficher l’élément ' + (i + 1) + " sur " + slides.length + '"></button>';
    }).join("");
    track.after(dots);
    var buttons = $$("button", dots);
    function sync() {
      var scrollable = track.scrollWidth > track.clientWidth + 4;
      dots.hidden = !scrollable;
      if (!scrollable) return;
      var start = track.getBoundingClientRect().left + parseFloat(getComputedStyle(track).paddingLeft);
      var active = 0, best = Infinity;
      slides.forEach(function (s, i) {
        var d = Math.abs(s.getBoundingClientRect().left - start);
        if (d < best) { best = d; active = i; }
      });
      buttons.forEach(function (b, i) { b.setAttribute("aria-current", String(i === active)); });
    }
    buttons.forEach(function (b, i) {
      b.addEventListener("click", function () {
        track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
    var raf = null;
    track.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; sync(); });
    }, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  });

  /* ---------- Recipe filters ---------- */

  var recipeTabs = $(".recipe-tabs");
  if (recipeTabs) {
    var recipeGrid = $(".recipe-grid");
    var tabButtons = $$("button", recipeTabs);
    recipeTabs.hidden = false;
    tabButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        var cat = b.dataset.filter;
        tabButtons.forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        $$(".recipe", recipeGrid).forEach(function (card) {
          card.hidden = cat !== "all" && card.dataset.cat !== cat;
        });
        recipeGrid.classList.toggle("is-filtered", cat !== "all");
      });
    });
  }

  var contactForm = $("#contact-message");
  var subject = new URLSearchParams(location.search).get("sujet");
  if (contactForm) {
    contactForm.noValidate = true;
    var requiredFields = $$("[required]", contactForm);
    function checkField(input) {
      var valid = input.checkValidity() && input.value.trim().length >= (input.minLength > 0 ? input.minLength : 1);
      input.closest(".field").classList.toggle("is-invalid", !valid);
      input.setAttribute("aria-invalid", String(!valid));
      return valid;
    }
    requiredFields.forEach(function (input) {
      input.addEventListener("blur", function () { if (input.value) checkField(input); });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") checkField(input);
      });
    });
    contactForm.addEventListener("submit", function (event) {
      var invalid = requiredFields.filter(function (input) { return !checkField(input); });
      if (!invalid.length) return;
      event.preventDefault();
      invalid[0].focus();
    });
  }
  if (contactForm && subject === "avis") {
    $("option[data-sujet=avis]", contactForm).selected = true;
    $("#c-message", contactForm).placeholder = "Votre avis sur Éclat d’Ube, et le prénom à afficher avec (par exemple : Sarah M.)";
  }

  function savingsFor(p) {
    if (!PRODUCTS["canette-1"].id) return null;
    var fullPrice = PRODUCTS["canette-1"].price * p.cans;
    var savings = fullPrice - p.price;
    if (fullPrice <= 0 || p.cans === 1) return null;
    var rate = savings / fullPrice * 100;
    return { savings: savings, banner: "−" + Math.round(rate) + " %" };
  }

  $$("[data-add]").forEach(function (button) {
    var p = PRODUCTS[button.dataset.add];
    button.disabled = !p.available;
    if (!p.available) button.textContent = "Indisponible";
    if (!p.id) return;
    var card = button.closest(".format-card");
    $(".format-card__price", card).textContent = money(p.price);
    $(".format-card__unit", card).textContent = money(p.price / p.cans) + " / canette";
    var offer = savingsFor(p);
    if (!offer) return;
    var badge = $(".format-card__save", card);
    badge.hidden = offer.savings <= 0;
    badge.textContent = offer.banner;
    var details = [];
    if (offer.savings > 0) details.push(money(offer.savings) + " économisés");
    if (p.price >= FREE_SHIPPING) details.push("Livraison offerte");
    var detail = $(".format-card__detail", card);
    detail.textContent = details.join(" · ");
    detail.hidden = !details.length;
  });

  $$(".variant").forEach(function (row) {
    var p = PRODUCTS[$("input", row).dataset.format];
    if (!p.id) return;
    $("strong", row).textContent = money(p.price);
    $(".variant__unit", row).textContent = money(p.price / p.cans) + " / canette";
    var offer = savingsFor(p);
    if (!offer) return;
    var badge = $(".variant__save", row);
    badge.hidden = offer.savings <= 0;
    badge.textContent = offer.banner;
    var detail = $(".variant__saved", row);
    detail.hidden = badge.hidden;
    detail.lastChild.textContent = money(offer.savings) + " économisés";
  });

  var prices = Object.values(PRODUCTS).filter(function (p) { return p.id; }).map(function (p) { return p.price; });
  if (prices.length) {
    var fromPrice = money(Math.min.apply(null, prices));
    $$("[data-from-price]").forEach(function (el) { el.textContent = fromPrice; });
  }
  $$("[data-format-price]").forEach(function (el) {
    var p = PRODUCTS[el.dataset.formatPrice];
    if (p.id) el.textContent = money(p.price);
  });
  $$("[data-latte-price]").forEach(function (el) {
    var p = PRODUCTS[el.dataset.lattePrice];
    if (p.id) el.textContent = money(p.price / (p.cans * LATTES_PER_CAN));
  });

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) enqueue(refreshCart);
  });

  /* ---------- Year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  render();
})();
