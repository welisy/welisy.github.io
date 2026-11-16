(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $all = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* tema claro / escuro */
  var toggle = document.querySelector('.theme-toggle');
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t) return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* filtro por área */
  var items = $all('[data-area]');
  var chips = $all('.chip');
  function matches(el, f) {
    return f === 'all' || el.getAttribute('data-area').split(' ').indexOf(f) > -1;
  }
  chips.forEach(function (chip) {
    var f = chip.getAttribute('data-filter');
    var count = chip.querySelector('.count');
    if (count) count.textContent = items.filter(function (el) { return matches(el, f); }).length;
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      items.forEach(function (el) {
        var show = matches(el, f);
        el.classList.toggle('is-hidden', !show);
        if (show) el.classList.add('in');
      });
      $all('[data-group]').forEach(function (g) {
        g.classList.toggle('is-hidden', g.querySelectorAll('[data-area]:not(.is-hidden)').length === 0);
      });
    });
  });

  /* fluxo que acende em sequência */
  var flows = $all('.flow');
  flows.forEach(function (flow) {
    $all('li', flow).forEach(function (li, i) { li.style.setProperty('--i', i); });
  });
  function runFlow(flow) {
    if (!flow || reduce) return;
    flow.classList.remove('run');
    void flow.offsetWidth;
    flow.classList.add('run');
  }
  $all('.case').forEach(function (c) {
    c.addEventListener('mouseenter', function () { runFlow(c.querySelector('.flow')); });
  });

  /* contadores */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var start = null;
    var dur = 1200;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString('pt-BR') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (hasIO && !reduce) {
    root.classList.add('anim');

    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    $all('.reveal').forEach(function (el) { revealObs.observe(el); });

    var flowObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runFlow(e.target); flowObs.unobserve(e.target); }
      });
    }, { threshold: 0.7 });
    flows.forEach(function (f) { flowObs.observe(f); });

    var counters = $all('[data-count]');
    counters.forEach(function (el) { el.textContent = '0' + (el.getAttribute('data-suffix') || ''); });
    var statsObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { counters.forEach(countUp); statsObs.disconnect(); }
      });
    }, { threshold: 0.4 });
    var stats = document.querySelector('.stats');
    if (stats) statsObs.observe(stats);
  }

  /* menu: destaca a seção visível */
  if (hasIO) {
    var links = {};
    $all('.topbar nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle('active', k === e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) navObs.observe(s);
    });
  }

  /* copiar e-mail */
  var toastEl = document.querySelector('.toast');
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }
  $all('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { toast('E-mail copiado'); }, function () {
          window.location.href = 'mailto:' + text;
        });
      } else {
        window.location.href = 'mailto:' + text;
      }
    });
  });
})();
