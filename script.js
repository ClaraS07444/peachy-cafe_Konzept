/* ================================================================
   PEACHY — Navigation, native motion, slider and form interactions
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
    scrollResetFrame: null,
    activeAnimations: [],
    motionObservers: []
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

  function scrollToPageTop() {
    const root = document.documentElement;
    if (state.scrollResetFrame) {
      window.cancelAnimationFrame(state.scrollResetFrame);
    }

    root.style.setProperty("scroll-behavior", "auto", "important");
    root.scrollTop = 0;
    document.body.scrollTop = 0;

    state.scrollResetFrame = window.requestAnimationFrame(() => {
      root.style.removeProperty("scroll-behavior");
      state.scrollResetFrame = null;
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
      scrollToPageTop();
    }

    if (focusMain) {
      focusMainContent();
    }

    window.requestAnimationFrame(() => {
      initializeRouteAnimations(validRoute);

      if (scrollToTop) {
        scrollToPageTop();
      }
    });
  }

  function navigate(route, options = {}) {
    const validRoute = normalizeRoute(route);
    const targetHash = `#${validRoute}`;

    if (window.location.hash !== targetHash) {
      window.location.hash = validRoute;
      return;
    }

    showRoute(validRoute, options);
  }

  function handleHashChange() {
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
     Dependency-free motion system
     ---------------------------------------------------------------- */

  const MOTION_EASE = {
    strong: "cubic-bezier(0.22, 1, 0.36, 1)",
    soft: "cubic-bezier(0.16, 1, 0.3, 1)"
  };

  function clearPreparedStyles(element) {
    element.style.removeProperty("opacity");
    element.style.removeProperty("transform");
  }

  function cleanupMotion() {
    state.motionObservers.forEach((observer) => observer.disconnect());
    state.motionObservers = [];

    state.activeAnimations.forEach(({ animation, element }) => {
      animation.cancel();
      clearPreparedStyles(element);
    });
    state.activeAnimations = [];
  }

  function revealWithoutMotion(view) {
    view.querySelectorAll(
      "[data-hero-brand], [data-hero-art], [data-hero-actions], [data-hero-claim], [data-drink-row] .product-card, [data-food-row] .product-card, [data-reveal]"
    ).forEach(clearPreparedStyles);
  }

  function prepareElement(element, transform) {
    if (!element) return;
    element.style.opacity = "0";
    element.style.transform = transform;
  }

  function animatePreparedElement(element, options = {}) {
    if (!element) return;

    const {
      transform = "translate3d(0, 24px, 0)",
      duration = 680,
      delay = 0,
      easing = MOTION_EASE.soft
    } = options;

    if (typeof element.animate !== "function") {
      clearPreparedStyles(element);
      return;
    }

    const animation = element.animate(
      [
        { opacity: 0, transform },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
      ],
      {
        duration,
        delay,
        easing,
        fill: "both"
      }
    );

    clearPreparedStyles(element);
    state.activeAnimations.push({ animation, element });

    animation.addEventListener(
      "finish",
      () => {
        animation.cancel();
        state.activeAnimations = state.activeAnimations.filter(
          (entry) => entry.animation !== animation
        );
      },
      { once: true }
    );
  }

  function observeOnce(trigger, callback, rootMargin = "0px 0px -12% 0px") {
    if (!("IntersectionObserver" in window)) {
      callback();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        callback();
      },
      { rootMargin, threshold: 0.08 }
    );

    observer.observe(trigger);
    state.motionObservers.push(observer);
  }

  function transformForDirection(direction) {
    if (direction === "left") return "translate3d(-70px, 0, 0)";
    if (direction === "right") return "translate3d(70px, 0, 0)";
    if (direction === "scale") return "translate3d(0, 0, 0) scale(0.92)";
    return "translate3d(0, 24px, 0)";
  }

  function createScrollReveal(element) {
    const transform = transformForDirection(element.dataset.reveal || "up");
    prepareElement(element, transform);
    observeOnce(element, () => {
      animatePreparedElement(element, { transform, duration: 680 });
    });
  }

  function createStaggeredRowReveal(row, direction) {
    if (!row) return;

    const cards = [...row.querySelectorAll(".product-card")];
    const transform = `translate3d(${direction * 160}px, 0, 0)`;
    cards.forEach((card) => prepareElement(card, transform));

    observeOnce(row, () => {
      cards.forEach((card, index) => {
        animatePreparedElement(card, {
          transform,
          duration: 850,
          delay: index * 70,
          easing: MOTION_EASE.strong
        });
      });
    }, "0px 0px -14% 0px");
  }

  function initializeHomeAnimations(view) {
    const heroBrand = view.querySelector("[data-hero-brand]");
    const heroArt = view.querySelector("[data-hero-art]");
    const heroActions = view.querySelector("[data-hero-actions]");
    const heroClaim = view.querySelector("[data-hero-claim]");

    const heroAnimations = [
      {
        element: heroBrand,
        transform: "translate3d(-150px, 0, 0)",
        duration: 1150,
        delay: 0
      },
      {
        element: heroArt,
        transform: "translate3d(38vw, 0, 0)",
        duration: 1250,
        delay: 80
      },
      {
        element: heroActions,
        transform: "translate3d(0, 18px, 0)",
        duration: 650,
        delay: 620
      },
      {
        element: heroClaim,
        transform: "translate3d(0, 24px, 0)",
        duration: 720,
        delay: 720
      }
    ];

    heroAnimations.forEach((settings) => {
      prepareElement(settings.element, settings.transform);
      animatePreparedElement(settings.element, {
        ...settings,
        easing: MOTION_EASE.strong
      });
    });

    createStaggeredRowReveal(view.querySelector("[data-drink-row]"), -1);
    createStaggeredRowReveal(view.querySelector("[data-food-row]"), 1);
  }

  function initializeRouteAnimations(route) {
    const view = document.querySelector(`[data-view="${route}"]`);
    cleanupMotion();
    if (!view) return;

    if (motionQuery.matches) {
      revealWithoutMotion(view);
      return;
    }

    if (route === "home") {
      initializeHomeAnimations(view);
    } else {
      const firstHeading = view.querySelector(".inner-hero h1, .legal-page h1");
      if (firstHeading && !firstHeading.closest("[data-reveal]")) {
        const transform = "translate3d(0, 24px, 0)";
        prepareElement(firstHeading, transform);
        animatePreparedElement(firstHeading, { transform, duration: 720 });
      }
    }

    view.querySelectorAll("[data-reveal]").forEach(createScrollReveal);
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

  function errorElementFor(control, createIfMissing = true) {
    if (!control.id) return null;

    let errorElement = elements.contactForm?.querySelector(
      `[data-error-for="${control.id}"]`
    );

    if (!errorElement && createIfMissing && elements.contactForm) {
      errorElement = document.createElement("span");
      errorElement.className = "field-error";
      errorElement.dataset.errorFor = control.id;
      control.insertAdjacentElement("afterend", errorElement);
    }

    if (errorElement && !errorElement.id) {
      errorElement.id = `${control.id}-error`;
    }

    return errorElement;
  }

  function clearFieldError(control) {
    control.removeAttribute("aria-invalid");
    const errorElement = errorElementFor(control, false);

    if (errorElement) {
      errorElement.textContent = "";

      const describedBy = (control.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== errorElement.id);

      if (describedBy.length > 0) {
        control.setAttribute("aria-describedby", describedBy.join(" "));
      } else {
        control.removeAttribute("aria-describedby");
      }
    }
  }

  function showFieldError(control) {
    control.setAttribute("aria-invalid", "true");
    const errorElement = errorElementFor(control);

    if (errorElement) {
      errorElement.textContent = errorMessageFor(control);

      const describedBy = new Set(
        (control.getAttribute("aria-describedby") || "")
          .split(/\s+/)
          .filter(Boolean)
      );
      describedBy.add(errorElement.id);
      control.setAttribute("aria-describedby", [...describedBy].join(" "));
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

  function bindEvents() {
    window.addEventListener("hashchange", handleHashChange);
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

    const hadInitialHash = Boolean(window.location.hash);
    const initialRoute = routeFromLocation();
    if (!hadInitialHash) {
      window.history.replaceState(null, "", "#home");
    }

    showRoute(initialRoute, { scrollToTop: hadInitialHash, focusMain: false });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
