/**
 * CookieWall Bypass - Popup Script
 */

document.addEventListener("DOMContentLoaded", function() {
  var bypassBtn = document.getElementById("bypassBtn");
  var resultMsg = document.getElementById("result-msg");
  var countToday = document.getElementById("countToday");
  var countTotal = document.getElementById("countTotal");
  var toggleAuto = document.getElementById("toggleAuto");
  var toggleReject = document.getElementById("toggleReject");

  // ─── Carica statistiche dallo storage ───
  chrome.storage.local.get(
    ["countTotal", "countToday", "lastDate", "autoBypass", "preferReject"],
    function(data) {
      var today = new Date().toDateString();
      var isNewDay = data.lastDate !== today;

      countTotal.textContent = data.countTotal !== undefined ? data.countTotal : 0;
      countToday.textContent = isNewDay ? 0 : (data.countToday !== undefined ? data.countToday : 0);

      toggleAuto.checked = data.autoBypass !== false;
      toggleReject.checked = data.preferReject !== false;
    }
  );

  // ─── Bypass manuale ───
  bypassBtn.addEventListener("click", function() {
    resultMsg.textContent = "⏳ Eseguendo bypass...";
    bypassBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        resultMsg.textContent = "❌ Nessuna tab attiva";
        bypassBtn.disabled = false;
        return;
      }

      var tabId = tabs[0].id;
      var tabUrl = tabs[0].url || "";

      // Non eseguire su pagine interne del browser
      if (!tabUrl.startsWith("http://") && !tabUrl.startsWith("https://")) {
        resultMsg.textContent = "⚠️ Pagina non supportata";
        bypassBtn.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(tabId, { action: "manualBypass" }, function(response) {
        bypassBtn.disabled = false;

        if (chrome.runtime.lastError) {
          // Content script non ancora iniettato, prova con scripting API
          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              files: ["src/content.js"]
            },
            function() {
              if (chrome.runtime.lastError) {
                resultMsg.textContent = "❌ Errore: ricarica la pagina";
              } else {
                resultMsg.textContent = "✅ Script iniettato!";
                incrementCounter();
              }
            }
          );
          return;
        }

        if (response && response.success) {
          resultMsg.textContent = "✅ Bypass eseguito!";
          bypassBtn.classList.add("success");
          incrementCounter();
        } else {
          resultMsg.textContent = "ℹ️ Nessun banner trovato";
        }

        setTimeout(function() {
          resultMsg.textContent = "";
          bypassBtn.classList.remove("success");
        }, 2500);
      });
    });
  });

  // ─── Toggle impostazioni ───
  toggleAuto.addEventListener("change", function() {
    chrome.storage.local.set({ autoBypass: toggleAuto.checked });
  });

  toggleReject.addEventListener("change", function() {
    chrome.storage.local.set({ preferReject: toggleReject.checked });
  });

  // ─── Aggiorna contatori ───
  function incrementCounter() {
    chrome.storage.local.get(["countTotal", "countToday", "lastDate"], function(d) {
      var today = new Date().toDateString();
      var isNew = d.lastDate !== today;
      var newTotal = (d.countTotal || 0) + 1;
      var newToday = isNew ? 1 : (d.countToday || 0) + 1;

      chrome.storage.local.set({
        countTotal: newTotal,
        countToday: newToday,
        lastDate: today
      }, function() {
        countTotal.textContent = newTotal;
        countToday.textContent = newToday;
      });
    });
  }
});
