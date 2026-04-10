(function () {
  "use strict";

  if (document.getElementById("tst-float-btn")) return;

  var BUILT_IN_TEXTS = [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly at dawn.",
    "Programming is the art of telling another human what one wants the computer to do. Code is like humor: when you have to explain it, it is bad. First solve the problem, then write the code.",
    "In the middle of difficulty lies opportunity. Life is what happens when you are busy making other plans. The only way to do great work is to love what you do. Stay hungry, stay foolish.",
    "The rain in Spain falls mainly on the plain. She sells seashells by the seashore. Peter Piper picked a peck of pickled peppers. Betty Botter bought some butter but she said the butter is bitter.",
    "Space, the final frontier. These are the voyages of the starship Enterprise. Its continuing mission: to explore strange new worlds, to seek out new life and new civilizations, to boldly go where no one has gone before.",
    "It was the best of times, it was the worst of times. It was the age of wisdom, it was the age of foolishness. It was the epoch of belief, it was the epoch of incredulity. It was the season of light.",
    "To be or not to be, that is the question. Whether it is nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and by opposing end them.",
    "All that is gold does not glitter, not all those who wander are lost. The old that is strong does not wither, deep roots are not reached by the frost. From the ashes a fire shall be woken.",
    "Technology is best when it brings people together. Innovation distinguishes between a leader and a follower. The advance of technology is based on making it fit in so that you do not even notice it.",
    "The keyboard is mightier than the sword. Every great developer you know got there by solving problems they were unqualified to solve until they actually did it. Practice makes progress, not perfection."
  ];

  var TIME_LIMITS = [30, 60, 120, 0]; 

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

    combined = combined
      .replace(/[\t\r\n]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();

    if (combined.length > 300) {
      var cut = combined.substring(0, 300);
      var lastSpace = cut.lastIndexOf(" ");
      if (lastSpace > 200) {
        combined = cut.substring(0, lastSpace);
      } else {
        combined = cut;
      }
    }

    return combined || "";
  }

  function getRandomText() {
    var extracted = extractText();
    var pool = BUILT_IN_TEXTS.slice();
    if (extracted.length >= 80) {
      pool.push(extracted);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  var floatBtn = document.createElement("button");
  floatBtn.id = "tst-float-btn";
  floatBtn.textContent = "Typing Test";
  document.body.appendChild(floatBtn);

  var testText = "";
  var startTime = null;
  var timerInterval = null;
  var finished = false;
  var timeLimit = 30;

  function openModal() {
    if (document.getElementById("tst-overlay")) return;

    testText = getRandomText();
    startTime = null;
    finished = false;

    var overlay = document.createElement("div");
    overlay.id = "tst-overlay";

    var modal = document.createElement("div");
    modal.id = "tst-modal";

    var timeBtnsHtml = '<div id="tst-time-select">' +
      '<span class="tst-time-label">Time Limit:</span>';
    TIME_LIMITS.forEach(function (t) {
      var label = t === 0 ? "None" : t + "s";
      var active = t === timeLimit ? " tst-time-active" : "";
      timeBtnsHtml += '<button class="tst-time-btn' + active + '" data-time="' + t + '">' + label + '</button>';
    });
    timeBtnsHtml += '</div>';

    modal.innerHTML =
      '<button id="tst-close-btn" title="Close">&times;</button>' +
      '<div id="tst-title">Typing Speed Test</div>' +
      '<div id="tst-subtitle">~ type the text below as fast as you can ~</div>' +
      timeBtnsHtml +
      '<div id="tst-text-display"></div>' +
      '<textarea id="tst-input" placeholder="Start typing here..." spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>' +
      '<div id="tst-info-bar">' +
      '  <span id="tst-timer">' + (timeLimit > 0 ? "Time: " + timeLimit + ".0s" : "Time: 0.0s") + '</span>' +
      '  <span id="tst-char-count">0 / ' + testText.length + "</span>" +
      "</div>" +
      '<div id="tst-results" style="display:none;"></div>' +
      '<div id="tst-btn-row">' +
      '  <button class="tst-btn tst-btn-secondary" id="tst-retry-btn">New Text</button>' +
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

    var timeBtns = modal.querySelectorAll(".tst-time-btn");
    timeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        timeLimit = parseInt(btn.getAttribute("data-time"), 10);
        timeBtns.forEach(function (b) { b.classList.remove("tst-time-active"); });
        btn.classList.add("tst-time-active");
        retry();
      });
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

    if (!startTime && typed.length > 0) {
      startTime = Date.now();
      timerInterval = setInterval(updateTimer, 100);
    }

    renderText(typed);

    var cc = document.getElementById("tst-char-count");
    if (cc) cc.textContent = typed.length + " / " + testText.length;

    if (typed.length >= testText.length) {
      finishTest(typed);
    }
  }

  function updateTimer() {
    if (!startTime) return;
    var elapsed = (Date.now() - startTime) / 1000;
    var el = document.getElementById("tst-timer");

    if (timeLimit > 0) {
      var remaining = Math.max(0, timeLimit - elapsed);
      if (el) el.textContent = "Time: " + remaining.toFixed(1) + "s";
      if (remaining <= 0) {
        var input = document.getElementById("tst-input");
        finishTest(input ? input.value : "");
      }
    } else {
      if (el) el.textContent = "Time: " + elapsed.toFixed(1) + "s";
    }
  }

  function finishTest(typed) {
    finished = true;
    clearInterval(timerInterval);

    var elapsed = (Date.now() - startTime) / 1000;
    if (timeLimit > 0 && elapsed > timeLimit) elapsed = timeLimit;
    var minutes = elapsed / 60;

    var wpm = Math.round(typed.length / 5 / minutes);

    var correct = 0;
    var len = Math.min(typed.length, testText.length);
    for (var i = 0; i < len; i++) {
      if (typed[i] === testText[i]) correct++;
    }
    var accuracy = len > 0 ? Math.round((correct / len) * 100) : 0;

    var input = document.getElementById("tst-input");
    if (input) input.disabled = true;

    var timeUp = timeLimit > 0 && (Date.now() - startTime) / 1000 >= timeLimit;
    var results = document.getElementById("tst-results");
    if (results) {
      results.style.display = "block";
      results.innerHTML =
        "<h3>" + (timeUp ? "Time's Up!" : "Results") + "</h3>" +
        '<div class="tst-result-row">' +
        '  <div class="tst-result-item"><span class="tst-result-value">' + wpm + '</span><span class="tst-result-label">WPM</span></div>' +
        '  <div class="tst-result-item"><span class="tst-result-value">' + accuracy + '%</span><span class="tst-result-label">Accuracy</span></div>' +
        '  <div class="tst-result-item"><span class="tst-result-value">' + elapsed.toFixed(1) + 's</span><span class="tst-result-label">Time</span></div>' +
        '  <div class="tst-result-item"><span class="tst-result-value">' + typed.length + '</span><span class="tst-result-label">Chars</span></div>' +
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
