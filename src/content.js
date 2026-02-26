/**
 * CookieWall Bypass - Content Script
 * Viene iniettato in ogni pagina. Rileva e bypassa cookie wall e banner.
 *
 * STRATEGIE USATE:
 * 1. Click automatico su "Rifiuta tutto" / "Reject all" (preferito per privacy)
 * 2. Click su "Accetta" come fallback se non c'è il rifiuto
 * 3. Rimozione degli overlay che bloccano la pagina
 * 4. Ripristino dello scroll del body
 * 5. Rimozione delle classi CSS che bloccano la navigazione
 */

(function () {
  "use strict";

  // ─────────────────────────────────────────────
  // CONFIGURAZIONE
  // ─────────────────────────────────────────────

  const CONFIG = {
    // Quante volte riprovare se il banner non è ancora apparso
    maxRetries: 15,
    retryDelay: 400, // ms
    // Abilita log in console (utile per debug)
    debug: false,
  };

  function log(...args) {
    if (CONFIG.debug) console.log("[CookieBypass]", ...args);
  }

  // ─────────────────────────────────────────────
  // SELETTORI: pulsanti RIFIUTA (priorità alta)
  // ─────────────────────────────────────────────

  const REJECT_SELECTORS = [
    // Testo esplicito IT/EN/FR/DE/ES
    'button[id*="reject"]',
    'button[id*="rifiut"]',
    'button[id*="decline"]',
    'button[class*="reject"]',
    'button[class*="decline"]',
    'a[id*="reject"]',
    'a[class*="reject"]',

    // Librerie comuni di CMP (Consent Management Platform)
    // OneTrust
    "#onetrust-reject-all-handler",
    ".onetrust-close-btn-handler",
    // Cookiebot
    "#CybotCookiebotDialogBodyButtonDecline",
    // Quantcast
    ".qc-cmp2-summary-buttons button:last-child",
    // Didomi
    "#didomi-notice-disagree-button",
    ".didomi-continue-without-agreeing",
    // TrustArc
    ".truste_popframe .pdynamicbutton a.pdc-btn-secondary",
    // Iubenda
    ".iubenda-cs-reject-btn",
    // Cookiehub
    ".ch2-deny-all-btn",
    // Termly
    "#termly-code-snippet-support .t-declineAllBtn",
    // Sourcepoint
    ".sp_choice_type_REJECT_ALL",
    ".sp_choice_type_13",
    // Usercentrics
    "[data-testid='uc-deny-all-button']",
    // Borlabs
    "#BorlabsCookieBoxSaveBtn",
    // Complianz
    ".cmplz-deny",
    // CookieYes
    ".cky-btn-reject",
    // Moove GDPR
    "#moove_gdpr_cookie_modal_save_settings_button",
    // Axeptio
    "button.axeptio_btn_dismiss",
    // Piwik PRO
    ".ppms_cm_reject-all",
  ];

  // ─────────────────────────────────────────────
  // SELETTORI: pulsanti ACCETTA (fallback)
  // ─────────────────────────────────────────────

  const ACCEPT_SELECTORS = [
    "#onetrust-accept-btn-handler",
    "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
    ".didomi-components-button--color-green",
    "#didomi-notice-agree-button",
    ".iubenda-cs-accept-btn",
    ".ch2-allow-all-btn",
    ".cky-btn-accept",
    ".cmplz-accept",
    '[aria-label="Accetta tutti i cookie"]',
    '[aria-label="Accept all cookies"]',
    '[aria-label="Tout accepter"]',
    '[aria-label="Alle akzeptieren"]',
  ];

  // ─────────────────────────────────────────────
  // SELETTORI: contenitori del banner da rimuovere
  // ─────────────────────────────────────────────

  const BANNER_CONTAINER_SELECTORS = [
    "#onetrust-consent-sdk",
    "#cookiebanner",
    "#cookie-banner",
    "#cookie-notice",
    "#cookie-law-info-bar",
    "#gdpr-cookie-notice",
    "#gdpr-banner",
    "#CybotCookiebotDialog",
    "#CybotCookiebotDialogBodyUnderlay",
    ".didomi-popup-container",
    ".didomi-notice",
    "#didomi-host",
    ".cc-window",
    ".cookieconsent",
    ".cookie-consent",
    "#cookie-consent-banner",
    "#cookie-overlay",
    ".cookie-overlay",
    ".gdpr-overlay",
    "#gdpr-overlay",
    ".privacy-popup",
    "#privacy-popup",
    ".iubenda-cs-container",
    "#iubenda-cs-banner",
    ".ch2-container",
    ".cky-consent-container",
    "#moove_gdpr_cookie_modal_wrap",
    ".axeptio_overlay",
    "#axeptio_overlay",
    ".ppms_cm_popup_overlay",
    // Overlay generici che bloccano la pagina
    '[class*="cookie-wall"]',
    '[class*="cookiewall"]',
    '[id*="cookie-wall"]',
    '[id*="cookiewall"]',
    '[class*="consent-wall"]',
    '[id*="consent-wall"]',
  ];

  // ─────────────────────────────────────────────
  // CLASSI CSS da rimuovere dal <body> (bloccano scroll)
  // ─────────────────────────────────────────────

  const BODY_CLASSES_TO_REMOVE = [
    "overflow-hidden",
    "no-scroll",
    "noscroll",
    "cookie-open",
    "modal-open",
    "didomi-popup-open",
    "has-overlay",
    "body-fixed",
  ];

  // ─────────────────────────────────────────────
  // FUNZIONI UTILITY
  // ─────────────────────────────────────────────

  function tryClick(selector) {
    const el = document.querySelector(selector);
    if (el && isVisible(el)) {
      log(`Click su: ${selector}`);
      el.click();
      return true;
    }
    return false;
  }

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function removeElement(selector) {
    const els = document.querySelectorAll(selector);
    els.forEach((el) => {
      log(`Rimozione elemento: ${selector}`);
      el.remove();
    });
    return els.length > 0;
  }

  function restoreBodyScroll() {
    const body = document.body;
    const html = document.documentElement;

    // Rimuovi classi che bloccano lo scroll
    BODY_CLASSES_TO_REMOVE.forEach((cls) => {
      body.classList.remove(cls);
      html.classList.remove(cls);
    });

    // Ripristina gli stili inline
    const overflowStyles = ["overflow", "overflow-y", "overflow-x"];
    overflowStyles.forEach((prop) => {
      if (
        body.style[prop] === "hidden" ||
        body.style[prop] === "clip"
      ) {
        body.style[prop] = "";
      }
      if (
        html.style[prop] === "hidden" ||
        html.style[prop] === "clip"
      ) {
        html.style[prop] = "";
      }
    });

    // Ripristina la posizione fixed del body (trucco comune per bloccare scroll)
    if (body.style.position === "fixed") {
      const scrollY = parseInt(body.style.top || "0") * -1;
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      window.scrollTo(0, scrollY);
    }
  }

  // ─────────────────────────────────────────────
  // RILEVAMENTO TESTO (per pulsanti non standard)
  // ─────────────────────────────────────────────

  const REJECT_TEXT_PATTERNS = [
    /rifiut/i,
    /non accett/i,
    /reject all/i,
    /decline all/i,
    /refuse all/i,
    /tout refuser/i,
    /alle ablehnen/i,
    /rechazar todo/i,
    /continue without/i,
    /continua senza/i,
    /solo necessari/i,
    /only necessary/i,
    /only essential/i,
  ];

  const ACCEPT_TEXT_PATTERNS = [
    /accetta tutti/i,
    /accetta tutto/i,
    /accept all/i,
    /accepter tout/i,
    /alle akzeptieren/i,
    /aceptar todo/i,
    /ok, capito/i,
    /ho capito/i,
    /i understand/i,
    /i agree/i,
  ];

  function findButtonByText(patterns) {
    const buttons = document.querySelectorAll(
      'button, a[role="button"], [class*="btn"], [class*="button"]'
    );
    for (const btn of buttons) {
      if (!isVisible(btn)) continue;
      const text = btn.innerText || btn.textContent || "";
      for (const pattern of patterns) {
        if (pattern.test(text.trim())) {
          return btn;
        }
      }
    }
    return null;
  }

  // ─────────────────────────────────────────────
  // LOGICA PRINCIPALE
  // ─────────────────────────────────────────────

  function attemptBypass() {
    let acted = false;

    // 1. Prova a cliccare "Rifiuta tutto" (meglio per privacy)
    for (const sel of REJECT_SELECTORS) {
      if (tryClick(sel)) {
        acted = true;
        break;
      }
    }

    // 2. Se non trovato tramite selettore, cerca per testo
    if (!acted) {
      const rejectBtn = findButtonByText(REJECT_TEXT_PATTERNS);
      if (rejectBtn && isVisible(rejectBtn)) {
        log("Click rifiuta (ricerca testo)");
        rejectBtn.click();
        acted = true;
      }
    }

    // 3. Fallback: accetta (meglio che rimanere bloccati)
    if (!acted) {
      for (const sel of ACCEPT_SELECTORS) {
        if (tryClick(sel)) {
          acted = true;
          log("Fallback: accettato (nessun rifiuta trovato)");
          break;
        }
      }
    }

    // 4. Ancora niente? Cerca per testo accetta
    if (!acted) {
      const acceptBtn = findButtonByText(ACCEPT_TEXT_PATTERNS);
      if (acceptBtn && isVisible(acceptBtn)) {
        log("Click accetta (ricerca testo, fallback)");
        acceptBtn.click();
        acted = true;
      }
    }

    // 5. Rimuovi i contenitori del banner comunque
    for (const sel of BANNER_CONTAINER_SELECTORS) {
      removeElement(sel);
    }

    // 6. Ripristina lo scroll
    restoreBodyScroll();

    return acted;
  }

  // ─────────────────────────────────────────────
  // OBSERVER: reagisce a banner caricati dinamicamente
  // ─────────────────────────────────────────────

  let retryCount = 0;
  let observer = null;

  function startObserver() {
    if (observer) return;

    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // Controlla se è stato aggiunto un banner
          const hasNewNodes = Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === 1 && // Element node
              (node.id?.match(/cookie|gdpr|consent|privacy/i) ||
                node.className?.toString().match(/cookie|gdpr|consent|privacy/i))
          );
          if (hasNewNodes) {
            log("Nuovo elemento cookie rilevato");
            setTimeout(attemptBypass, 100);
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function retryBypass() {
    if (retryCount >= CONFIG.maxRetries) {
      log("Max retry raggiunti, stop.");
      return;
    }
    retryCount++;
    const acted = attemptBypass();
    if (!acted) {
      setTimeout(retryBypass, CONFIG.retryDelay);
    } else {
      log(`Bypass completato al tentativo ${retryCount}`);
    }
  }

  // ─────────────────────────────────────────────
  // ENTRY POINT
  // ─────────────────────────────────────────────

  function init() {
    // Esegui subito
    attemptBypass();
    // Osserva modifiche DOM (banner caricati con JS async)
    startObserver();
    // Retry per qualche secondo dopo il caricamento
    setTimeout(retryBypass, 500);
    setTimeout(retryBypass, 1500);
    setTimeout(retryBypass, 3000);
  }

  // Aspetta che il DOM sia pronto
  if (
    document.readyState === "loading" ||
    document.readyState === "interactive"
  ) {
    document.addEventListener("DOMContentLoaded", init);
    // Esegui anche subito per catturare elementi già presenti
    init();
  } else {
    init();
  }

  // Ascolta messaggi dal popup
  if (typeof chrome !== "undefined" && chrome.runtime) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === "manualBypass") {
        const result = attemptBypass();
        restoreBodyScroll();
        sendResponse({ success: result });
      }
      if (msg.action === "ping") {
        sendResponse({ alive: true });
      }
    });
  }
})();
