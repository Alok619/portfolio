/* Ask-AI widget. Builds a floating "Ask AI" chat, grounds answers in the
   current page's text, and calls the /api/ask serverless function (Claude).
   Self-contained — safe to load on any page without collisions. */
(function () {
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function fmt(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }

  var ENDPOINT = '/api/ask';
  var titleEl = document.querySelector('.cs-hero__title');
  var project = ((titleEl && titleEl.textContent) || document.title || 'this project').trim();
  // Grab the page's readable text as grounding context (captured before the widget mounts).
  var context = (document.body.innerText || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 12000);

  var root = document.createElement('div');
  root.className = 'askai';
  root.innerHTML =
    '<button class="askai__pill" data-open><span class="askai__orb"></span>Ask AI</button>' +
    '<div class="askai__panel" role="dialog" aria-label="Ask AI about this project">' +
      '<div class="askai__head"><span class="askai__orb"></span>' +
        '<div class="askai__title">Ask about ' + esc(project) + '<small>AI-answered from this case study</small></div>' +
        '<button class="askai__close" data-close aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div>' +
      '<div class="askai__log" data-log></div>' +
      '<form class="askai__form" data-form>' +
        '<textarea class="askai__input" data-input rows="1" placeholder="Ask anything about this project…"></textarea>' +
        '<button class="askai__send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var log = root.querySelector('[data-log]');
  var form = root.querySelector('[data-form]');
  var input = root.querySelector('[data-input]');
  var history = [];
  var greeted = false;
  var busy = false;

  function open() { root.classList.add('is-open'); if (!greeted) { greet(); greeted = true; } setTimeout(function () { input.focus(); }, 60); }
  function close() { root.classList.remove('is-open'); }
  root.querySelector('[data-open]').addEventListener('click', open);
  root.querySelector('[data-close]').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });

  function bubble(cls, text, asHtml) {
    var d = document.createElement('div');
    d.className = 'askai__msg askai__msg--' + cls;
    if (asHtml) d.innerHTML = text; else d.textContent = text;
    log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
  }

  function greet() {
    var hint = document.createElement('div');
    hint.className = 'askai__hint';
    hint.textContent = 'Hi! Ask me anything about the ' + project + ' case study — the problem, the process, key decisions, or outcomes.';
    log.appendChild(hint);
    var chips = document.createElement('div');
    chips.className = 'askai__chips';
    ['What problem did this solve?', "What was Alok's role?", 'How was it designed?'].forEach(function (q) {
      var b = document.createElement('button');
      b.className = 'askai__chip'; b.type = 'button'; b.textContent = q;
      b.addEventListener('click', function () { input.value = q; sendMessage(); });
      chips.appendChild(b);
    });
    log.appendChild(chips);
    log.scrollTop = log.scrollHeight;
  }

  function sendMessage() {
    var q = (input.value || '').trim();
    if (!q || busy) return;
    input.value = ''; input.style.height = 'auto';
    bubble('user', q);
    history.push({ role: 'user', content: q });
    busy = true;

    var typing = document.createElement('div');
    typing.className = 'askai__typing';
    typing.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(typing); log.scrollTop = log.scrollHeight;

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project: project, context: context, messages: history })
    })
      .then(function (r) { return r.json().catch(function () { return { error: 'Bad response' }; }); })
      .then(function (data) {
        typing.remove();
        if (data && data.answer) {
          bubble('ai', fmt(data.answer), true);
          history.push({ role: 'assistant', content: data.answer });
        } else {
          bubble('ai', "I couldn't reach the AI just now. This feature works once the site is deployed with the /api/ask function — in the meantime you can email Alok at alok.kac@gmail.com.");
        }
      })
      .catch(function () {
        typing.remove();
        bubble('ai', "The AI isn't available here yet (it needs the deployed backend). You can reach Alok at alok.kac@gmail.com.");
      })
      .finally(function () { busy = false; log.scrollTop = log.scrollHeight; });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); sendMessage(); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
  input.addEventListener('input', function () { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 100) + 'px'; });
})();
