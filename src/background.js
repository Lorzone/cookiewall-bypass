/**
 * CookieWall Bypass - Background Script
 * Gestisce la comunicazione e lo stato dell'estensione.
 *
 * NOTA: chrome.action.onClicked NON viene fired quando è definito
 * un default_popup nel manifest (il popup ha priorità).
 * Il bypass manuale viene gestito direttamente da popup.js.
 */

// Listener minimale per messaggi futuri dal content script
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action === "bypassDone") {
    sendResponse({ received: true });
  }
  return true;
});
