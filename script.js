/* ================================================================
   PEACHY — Navigation, GSAP motion, slider and form interactions
   Triple-checked v9 · stable smartphone layout, full hero logo and responsive interactions.
   ================================================================ */

"use strict";

(() => {
  const ROUTES = {
    home: {
      title: "peachy Café | Coffee, Good Food & Bright Days",
      description:
        "Discover warm coffee, fresh food and bright café moments at peachy. Explore the menu, our story and contact options."
    },
    menu: {
      title: "Menu | peachy Café",
      description:
        "Explore peachy coffee, matcha, breakfast, bagels and sweet treats."
    },
    about: {
      title: "About peachy | Our Café Story",
      description:
        "Get to know the idea, values and visual world behind peachy café."
    },
    contact: {
      title: "Contact peachy | Catering, Jobs & General Requests",
      description:
        "Send a catering, job or general enquiry to peachy café."
    },
    imprint: {
      title: "Impressum | peachy Café Concept",
      description: "Legal provider-information placeholder for the peachy concept website."
    },
    privacy: {
      title: "Datenschutz | peachy Café Concept",
      description: "Privacy-information placeholder for the peachy concept website."
    }
  };

  const state = {
    route: "home",
    lastFocusedElement: null,
    gsapContext: null
  };

  const elements = {
    body: document.body,
    main: document.querySelector("#main-content"),
    views: [...document.querySelectorAll("[data-view]")],
    routeLinks: [...document.querySelectorAll("[data-route-link]")],
    metaDescription: document.querySelector('meta[name="description"]'),
    ogTitle: document.querySelector('meta[property="og:title"]'),
    ogDescription: document.querySelector('meta[property="og:description"]'),
    mobileMenu: document.querySelector("[data-mobile-menu]"),
    menuOpenButton: document.querySelector("[data-menu-open]"),
    menuCloseButton: document.querySelector("[data-menu-close]"),
    momentsTrack: document.querySelector("[data-moments-track]"),
    sliderPrevious: document.querySelector("[data-slider-prev]"),
    sliderNext: document.querySelector("[data-slider-next]"),
    requestType: document.querySelector("[data-request-type]"),
    contactForm: document.querySelector("[data-contact-form]"),
    formStatus: document.querySelector("[data-form-status]")
  };

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactViewportQuery = window.matchMedia("(max-width: 767px)");

  function normalizeRoute(value) {
    const route = String(value || "")
      .replace(/^#/, "")
      .split("/")[0]
      .trim()
      .toLowerCase();

    return Object.prototype.hasOwnProperty.call(ROUTES, route) ? route : "home";
  }

  function routeFromLocation() {
    return normalizeRoute(window.location.hash);
  }

  function updateMetadata(route) {
    const metadata = ROUTES[route];
    document.title = metadata.title;
    elements.metaDescription?.setAttribute("content", metadata.description);
    elements.ogTitle?.setAttribute("content", metadata.title);
    elements.ogDescription?.setAttribute("content", metadata.description);
  }

  function updateActiveLinks(route) {
    elements.routeLinks.forEach((link) => {
      const isActive = link.dataset.routeLink === route;

      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function focusMainContent() {
    if (!elements.main) return;

    elements.main.focus({ preventScroll: true });
  }

  function scrollPageToTop() {
    const root = document.documentElement;
    const previousInlineScrollBehavior = root.style.scrollBehavior;

    /* Prevent CSS smooth scrolling and native fragment positioning from
       leaving a newly selected page part-way down the document. */
    root.style.scrollBehavior = "auto";
    root.scrollTop = 0;
    elements.body.scrollTop = 0;
    window.scrollTo(0, 0);

    window.requestAnimationFrame(() => {
      root.scrollTop = 0;
      elements.body.scrollTop = 0;
      window.scrollTo(0, 0);

      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousInlineScrollBehavior;
      });
    });
  }

  function showRoute(route, options = {}) {
    const { scrollToTop = true, focusMain = false } = options;
    const validRoute = normalizeRoute(route);

    closeMobileMenu({ restoreFocus: false });

    elements.views.forEach((view) => {
      const isActive = view.dataset.view === validRoute;
      view.hidden = !isActive;
      view.setAttribute("aria-hidden", String(!isActive));
    });

    state.route = validRoute;
    updateMetadata(validRoute);
    updateActiveLinks(validRoute);

    if (scrollToTop) {
      scrollPageToTop();
    }

    if (focusMain) {
      focusMainContent();
    }

    window.requestAnimationFrame(() => {
      initializeRouteAnimations(validRoute);
      window.ScrollTrigger?.refresh();
    });
  }

  function navigate(route, options = {}) {
    const validRoute = normalizeRoute(route);
    const targetHash = `#${validRoute}`;

    /* pushState changes the URL without triggering the browser's native
       fragment jump. showRoute then performs one controlled top reset. */
    if (window.location.hash !== targetHash) {
      window.history.pushState({ route: validRoute }, "", targetHash);
    }

    showRoute(validRoute, { ...options, scrollToTop: true });
  }

  function handleLocationChange() {
    showRoute(routeFromLocation(), { scrollToTop: true, focusMain: true });
  }

  /* ----------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------- */

  function getFocusableElements(container) {
    if (!container) return [];

    return [...container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => !element.hidden);
  }

  function openMobileMenu() {
    if (!elements.mobileMenu || !elements.menuOpenButton) return;

    state.lastFocusedElement = document.activeElement;
    elements.mobileMenu.hidden = false;
    elements.menuOpenButton.setAttribute("aria-expanded", "true");
    elements.body.classList.add("menu-is-open");
    elements.menuCloseButton?.focus();
  }

  function closeMobileMenu(options = {}) {
    const { restoreFocus = true } = options;

    if (!elements.mobileMenu || elements.mobileMenu.hidden) return;

    elements.mobileMenu.hidden = true;
    elements.menuOpenButton?.setAttribute("aria-expanded", "false");
    elements.body.classList.remove("menu-is-open");

    if (restoreFocus && state.lastFocusedElement instanceof HTMLElement) {
      state.lastFocusedElement.focus();
    }
  }

  function trapMobileMenuFocus(event) {
    if (elements.mobileMenu?.hidden || event.key !== "Tab") return;

    const focusable = getFocusableElements(elements.mobileMenu);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ----------------------------------------------------------------
     GSAP animation system
     ---------------------------------------------------------------- */

  function hasGsap() {
    return Boolean(window.gsap && window.ScrollTrigger);
  }

  function revealWithoutMotion(view) {
    view.querySelectorAll(
      "[data-hero-brand], [data-hero-art], [data-hero-actions], [data-hero-claim], [data-drink-row] .product-card, [data-food-row] .product-card, [data-reveal]"
    ).forEach((element) => {
      element.style.removeProperty("opacity");
      element.style.removeProperty("visibility");
      element.style.removeProperty("transform");
    });
  }

  function createScrollReveal(element) {
    const direction = element.dataset.reveal || "up";
    const from = { autoAlpha: 0, duration: 0.68, ease: "power2.out" };
    const compactOffset = compactViewportQuery.matches;

    /* On phones all reveals stay within their own vertical flow. Large
       horizontal offsets can otherwise look like overlapping content while
       the animation is entering and can expand the visual viewport. */
    if (direction === "left") compactOffset ? (from.y = 18) : (from.x = -70);
    if (direction === "right") compactOffset ? (from.y = 18) : (from.x = 70);
    if (direction === "up") from.y = compactOffset ? 18 : 24;
    if (direction === "scale") from.scale = 0.92;

    from.scrollTrigger = {
      trigger: element,
      start: "top 88%",
      toggleActions: "restart none restart reset"
    };

    window.gsap.from(element, from);
  }

  function initializeHomeAnimations(view) {
    const timeline = window.gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: {
        trigger: view.querySelector(".home-hero"),
        start: "top 88%",
        toggleActions: "restart none restart reset"
      }
    });
    const heroBrand = view.querySelector("[data-hero-brand]");
    const heroArt = view.querySelector("[data-hero-art]");
    const heroActions = view.querySelector("[data-hero-actions]");
    const heroClaim = view.querySelector("[data-hero-claim]");
    const compactOffset = compactViewportQuery.matches;

    if (heroBrand) {
      timeline.from(
        heroBrand,
        compactOffset
          ? { y: 16, autoAlpha: 0, duration: 0.75 }
          : { x: -150, autoAlpha: 0, duration: 1.15 },
        0
      );
    }

    if (heroArt) {
      timeline.from(
        heroArt,
        compactOffset
          ? { y: 24, autoAlpha: 0, duration: 0.8 }
          : { x: "38vw", autoAlpha: 0, duration: 1.25 },
        0.08
      );
    }

    if (heroActions) {
      timeline.from(heroActions, { y: 18, autoAlpha: 0, duration: 0.65 }, 0.62);
    }

    if (heroClaim) {
      timeline.from(heroClaim, { y: 24, autoAlpha: 0, duration: 0.72 }, 0.72);
    }

    const drinkCards = view.querySelectorAll("[data-drink-row] .product-card");
    if (drinkCards.length > 0) {
      window.gsap.from(drinkCards, {
        x: compactOffset ? 0 : -160,
        y: compactOffset ? 16 : 0,
        autoAlpha: 0,
        duration: 0.85,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: view.querySelector("[data-drink-row]"),
          start: "top 86%",
          toggleActions: "restart none restart reset"
        }
      });
    }

    const foodCards = view.querySelectorAll("[data-food-row] .product-card");
    if (foodCards.length > 0) {
      window.gsap.from(foodCards, {
        x: compactOffset ? 0 : 160,
        y: compactOffset ? 16 : 0,
        autoAlpha: 0,
        duration: 0.85,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: view.querySelector("[data-food-row]"),
          start: "top 86%",
          toggleActions: "restart none restart reset"
        }
      });
    }
  }

  function initializeRouteAnimations(route) {
    const view = document.querySelector(`[data-view="${route}"]`);
    if (!view) return;

    window.ScrollTrigger?.getAll().forEach((trigger) => trigger.kill());
    state.gsapContext?.revert();
    state.gsapContext = null;

    if (motionQuery.matches || !hasGsap()) {
      revealWithoutMotion(view);
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    state.gsapContext = window.gsap.context(() => {
      if (route === "home") {
        initializeHomeAnimations(view);
      } else {
        const firstHeading = view.querySelector(".inner-hero h1, .legal-page h1");
        if (firstHeading) {
          window.gsap.from(firstHeading, {
            y: 24,
            autoAlpha: 0,
            duration: 0.72,
            ease: "power2.out"
          });
        }
      }

      view.querySelectorAll("[data-reveal]").forEach(createScrollReveal);
    }, view);
  }

  /* ----------------------------------------------------------------
     Accessible horizontal moments slider
     ---------------------------------------------------------------- */

  function sliderStep() {
    if (!elements.momentsTrack) return 0;

    const card = elements.momentsTrack.querySelector(".moment-card");
    const gap = Number.parseFloat(getComputedStyle(elements.momentsTrack).columnGap || "0");
    return card ? card.getBoundingClientRect().width + gap : elements.momentsTrack.clientWidth * 0.8;
  }

  function scrollSlider(direction) {
    if (!elements.momentsTrack) return;

    elements.momentsTrack.scrollBy({
      left: direction * sliderStep(),
      behavior: motionQuery.matches ? "auto" : "smooth"
    });
  }

  function handleSliderKeyboard(event) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollSlider(1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollSlider(-1);
    }

    if (event.key === "Home") {
      event.preventDefault();
      elements.momentsTrack?.scrollTo({ left: 0, behavior: motionQuery.matches ? "auto" : "smooth" });
    }

    if (event.key === "End") {
      event.preventDefault();
      elements.momentsTrack?.scrollTo({
        left: elements.momentsTrack.scrollWidth,
        behavior: motionQuery.matches ? "auto" : "smooth"
      });
    }
  }

  /* ----------------------------------------------------------------
     Contact request switcher and validation
     ---------------------------------------------------------------- */

  function setGroupEnabled(group, isEnabled) {
    group.hidden = !isEnabled;
    group.querySelectorAll("input, select, textarea, button").forEach((control) => {
      control.disabled = !isEnabled;
    });
  }

  function setContactKind(kind, options = {}) {
    const { scrollToForm = false } = options;
    const validKind = ["catering", "jobs", "general"].includes(kind) ? kind : "general";

    if (elements.requestType) {
      elements.requestType.value = validKind;
    }

    document.querySelectorAll("[data-contact-choice]").forEach((button) => {
      const isActive = button.dataset.contactChoice === validKind;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll("[data-fields-for]").forEach((group) => {
      setGroupEnabled(group, group.dataset.fieldsFor === validKind);
    });

    if (elements.formStatus) {
      elements.formStatus.textContent = "";
    }

    if (scrollToForm) {
      window.requestAnimationFrame(() => {
        document.querySelector("#request-form")?.scrollIntoView({
          behavior: motionQuery.matches ? "auto" : "smooth",
          block: "start"
        });
      });
    }
  }

  function errorMessageFor(control) {
    if (control.validity.valueMissing) return "Please complete this required field.";
    if (control.validity.typeMismatch) return "Please enter a valid email address.";
    if (control.validity.rangeUnderflow) return `Please enter a value of at least ${control.min}.`;
    if (control.validity.tooShort) return `Please use at least ${control.minLength} characters.`;
    return "Please check this field.";
  }

  function errorElementFor(control) {
    if (!control.id) return null;

    const existingError = elements.contactForm?.querySelector(
      `[data-error-for="${control.id}"]`
    );

    if (existingError) return existingError;
    if (!elements.contactForm) return null;

    const errorElement = document.createElement("span");
    errorElement.className = "field-error";
    errorElement.dataset.errorFor = control.id;
    control.insertAdjacentElement("afterend", errorElement);
    return errorElement;
  }

  function clearFieldError(control) {
    control.removeAttribute("aria-invalid");
    const errorElement = errorElementFor(control);

    if (errorElement) {
      errorElement.textContent = "";
    }
  }

  function showFieldError(control) {
    control.setAttribute("aria-invalid", "true");
    const errorElement = errorElementFor(control);

    if (errorElement) {
      errorElement.textContent = errorMessageFor(control);
    }
  }

  function validateForm(form) {
    const controls = [...form.querySelectorAll("input, select, textarea")]
      .filter((control) => !control.disabled);
    let firstInvalid = null;

    controls.forEach((control) => {
      clearFieldError(control);

      if (!control.checkValidity()) {
        showFieldError(control);
        firstInvalid ||= control;
      }
    });

    firstInvalid?.focus();
    return firstInvalid === null;
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!validateForm(form)) {
      if (elements.formStatus) {
        elements.formStatus.textContent = "Please check the highlighted fields.";
      }
      return;
    }

    const requestKind = elements.requestType?.value || "general";
    form.reset();
    setContactKind(requestKind);

    if (elements.formStatus) {
      elements.formStatus.textContent =
        "Thank you — the prototype validated your request successfully. Connect a secure form provider before launch to transmit submissions.";
    }
  }

  /* ----------------------------------------------------------------
     In-page actions
     ---------------------------------------------------------------- */

  function scrollToTarget(targetId) {
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: motionQuery.matches ? "auto" : "smooth",
        block: "start"
      });
    });
  }

  function handleDocumentClick(event) {
    const routeLink = event.target.closest("[data-route-link]");
    const contactAction = event.target.closest("[data-contact-kind]");
    const scrollAction = event.target.closest("[data-scroll-to]");

    if (contactAction) {
      event.preventDefault();
      const kind = contactAction.dataset.contactKind;

      if (state.route !== "contact") {
        if (window.location.hash !== "#contact") {
          window.location.hash = "contact";
        } else {
          showRoute("contact", { scrollToTop: true });
        }

        window.setTimeout(() => setContactKind(kind, { scrollToForm: true }), 80);
      } else {
        setContactKind(kind, { scrollToForm: true });
      }
      return;
    }

    if (scrollAction) {
      event.preventDefault();
      const targetId = scrollAction.dataset.scrollTo;

      if (state.route !== "menu") {
        if (window.location.hash !== "#menu") {
          window.location.hash = "menu";
        } else {
          showRoute("menu", { scrollToTop: true });
        }

        window.setTimeout(() => scrollToTarget(targetId), 80);
      } else {
        scrollToTarget(targetId);
      }
      return;
    }

    if (routeLink) {
      const route = routeLink.dataset.routeLink;
      if (!route) return;

      event.preventDefault();
      navigate(route, { scrollToTop: true, focusMain: true });
    }
  }

  function handleDocumentKeydown(event) {
    if (event.key === "Escape" && elements.mobileMenu && !elements.mobileMenu.hidden) {
      closeMobileMenu();
      return;
    }

    trapMobileMenuFocus(event);
  }

  function handleCompactViewportChange() {
    /* A menu opened on a phone must never remain as an invisible scroll lock
       after the device rotates or the viewport crosses into desktop mode. */
    if (!compactViewportQuery.matches) {
      closeMobileMenu({ restoreFocus: false });
    }

    initializeRouteAnimations(state.route);
    window.ScrollTrigger?.refresh();
  }

  function bindEvents() {
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("keydown", handleDocumentKeydown);

    elements.menuOpenButton?.addEventListener("click", openMobileMenu);
    elements.menuCloseButton?.addEventListener("click", () => closeMobileMenu());

    elements.sliderPrevious?.addEventListener("click", () => scrollSlider(-1));
    elements.sliderNext?.addEventListener("click", () => scrollSlider(1));
    elements.momentsTrack?.addEventListener("keydown", handleSliderKeyboard);

    document.querySelectorAll("[data-contact-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        setContactKind(button.dataset.contactChoice, { scrollToForm: true });
      });
    });

    elements.requestType?.addEventListener("change", (event) => {
      setContactKind(event.target.value);
    });

    elements.contactForm?.addEventListener("submit", handleFormSubmit);
    elements.contactForm?.addEventListener("input", (event) => {
      if (event.target.matches("input, select, textarea")) {
        clearFieldError(event.target);
      }
    });

    motionQuery.addEventListener?.("change", () => initializeRouteAnimations(state.route));
    compactViewportQuery.addEventListener?.("change", handleCompactViewportChange);
  }

  function initialize() {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });

    setContactKind("catering");
    bindEvents();

    const initialRoute = routeFromLocation();
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#home");
    }

    showRoute(initialRoute, { scrollToTop: false, focusMain: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
