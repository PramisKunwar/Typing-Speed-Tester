(function () {
  "use strict";

  // Prevent double injection
  if (document.getElementById("tst-float-btn")) return;

  // --- Text Extraction ---
  function extractText() {
    var paragraphs = document.querySelectorAll("p");
    var texts = [];

    paragraphs.forEach(function (p) {
      var t = p.textContent.trim();
      if (t.length >= 80) {
        texts.push(t);
      }
    });

    var combined = texts.join(" ");

    if (combined.length < 100) {
      combined = document.body.innerText || "";
    }

    // Clean up
    combined = combined
      .replace(/[\t\r\n]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();

    // Take a portion of ~200-300 chars, ending at a word boundary
    if (combined.length > 300) {
      var cut = combined.substring(0, 300);
      var lastSpace = cut.lastIndexOf(" ");
      if (lastSpace > 200) {
        combined = cut.substring(0, lastSpace);
      } else {
        combined = cut;
      }
    }

    return combined || "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";
  }

  // --- Floating Button ---
  var floatBtn = document.createElement("button");
  floatBtn.id = "tst-float-btn";
  floatBtn.textContent = "Typing Test";
  document.body.appendChild(floatBtn);

  // --- State ---
  var testText = "";
  var startTime = null;
  var timerInterval = null;
  var finished = false;

  // --- Build Modal ---
  function openModal() {
    if (document.getElementById("tst-overlay")) return;

    testText = extractText();
    startTime = null;
    finished = false;

    var overlay = document.createElement("div");
    overlay.id = "tst-overlay";

    var modal = document.createElement("div");
    modal.id = "tst-modal";

    modal.innerHTML =
      '<button id="tst-close-btn" title="Close">&times;</button>' +
      '<div id="tst-title">Typing Speed Test</div>' +
      '<div id="tst-subtitle">~ type the text below as fast as you can ~</div>' +
      '<div id="tst-text-display"></div>' +
      '<textarea id="tst-input" placeholder="Start typing here..." spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>' +
      '<div id="tst-info-bar">' +
      '  <span id="tst-timer">Time: 0.0s</span>' +
      '  <span id="tst-char-count">0 / ' + testText.length + "</span>" +
      "</div>" +
      '<div id="tst-results" style="display:none;"></div>' +
      '<div id="tst-btn-row">' +
      '  <button class="tst-btn tst-btn-secondary" id="tst-retry-btn">Retry</button>' +
      '  <button class="tst-btn" id="tst-close-btn2">Close</button>' +
      "</div>";

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    renderText("");

    var input = document.getElementById("tst-input");
    input.focus();

    // Events
    input.addEventListener("input", onInput);
    document.getElementById("tst-close-btn").addEventListener("click", closeModal);
    document.getElementById("tst-close-btn2").addEventListener("click", closeModal);
    document.getElementById("tst-retry-btn").addEventListener("click", retry);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  function renderText(typed) {
    var display = document.getElementById("tst-text-display");
    if (!display) return;

    var html = "";
    for (var i = 0; i < testText.length; i++) {
      var ch = testText[i] === " " ? "&nbsp;" : escapeHtml(testText[i]);
      if (i < typed.length) {
        if (typed[i] === testText[i]) {
          html += '<span class="tst-correct">' + ch + "</span>";
        } else {
          html += '<span class="tst-incorrect">' + ch + "</span>";
        }
      } else if (i === typed.length) {
        html += '<span class="tst-cursor tst-pending">' + ch + "</span>";
      } else {
        html += '<span class="tst-pending">' + ch + "</span>";
      }
    }
    display.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function onInput() {
    if (finished) return;

    var input = document.getElementById("tst-input");
    var typed = input.value;

    // Start timer on first keystroke
    if (!startTime && typed.length > 0) {
      startTime = Date.now();
      timerInterval = setInterval(updateTimer, 100);
    }

    renderText(typed);

    // Update char count
    var cc = document.getElementById("tst-char-count");
    if (cc) cc.textContent = typed.length + " / " + testText.length;

    // Check completion
    if (typed.length >= testText.length) {
      finishTest(typed);
    }
  }

  function updateTimer() {
    if (!startTime) return;
    var elapsed = (Date.now() - startTime) / 1000;
    var el = document.getElementById("tst-timer");
    if (el) el.textContent = "Time: " + elapsed.toFixed(1) + "s";
  }

  function finishTest(typed) {
    finished = true;
    clearInterval(timerInterval);

    var elapsed = (Date.now() - startTime) / 1000;
    var minutes = elapsed / 60;

    // WPM: (chars / 5) / minutes
    var wpm = Math.round(typed.length / 5 / minutes);

    // Accuracy
    var correct = 0;
    for (var i = 0; i < testText.length; i++) {
      if (typed[i] === testText[i]) correct++;
    }
    var accuracy = Math.round((correct / testText.length) * 100);

    var input = document.getElementById("tst-input");
    if (input) input.disabled = true;

    var results = document.getElementById("tst-results");
    if (results) {
      results.style.display = "block";
      results.innerHTML =
        "<h3>Results</h3>" +
        '<div class="tst-result-row">' +
        '  <div class="tst-result-item"><span class="tst-result-value">' + wpm + '</span><span class="tst-result-label">WPM</span></div>' +
        '  <div class="tst-result-item"><span class="tst-result-value">' + accuracy + '%</span><span class="tst-result-label">Accuracy</span></div>' +
        '  <div class="tst-result-item"><span class="tst-result-value">' + elapsed.toFixed(1) + 's</span><span class="tst-result-label">Time</span></div>' +
        "</div>";
    }

    updateTimer();
  }

  function retry() {
    closeModal();
    setTimeout(openModal, 100);
  }

  function closeModal() {
    clearInterval(timerInterval);
    var overlay = document.getElementById("tst-overlay");
    if (overlay) overlay.remove();
  }

  floatBtn.addEventListener("click", openModal);
})();
