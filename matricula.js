/* Vial · inscripció en línia per carnet. Es fa servir a la web de presentació i a inscripcio.html.
   - Amb servidor (window.SYNC_URL): preus de /api/public/carnets i enviament a /api/public/inscripcio.
   - Sense servidor: preus desats en aquest navegador i la sol·licitud arriba a Preinscripcions de la mateixa demostració. */
(function () {
  var root = document.getElementById('matricula');
  if (!root) return;

  var PERMITS = [
    { k: 'AM', n: 'AM', d: 'Ciclomotor', g: 'moto', h: 38, hrs: 8, age: 15 },
    { k: 'A1', n: 'A1', d: 'Moto fins a 125 cc', g: 'moto', h: 42, hrs: 10, age: 16 },
    { k: 'A2', n: 'A2', d: 'Moto de potència mitjana', g: 'moto', h: 45, hrs: 12, age: 18 },
    { k: 'A', n: 'A', d: 'Moto sense límit', g: 'moto', h: 48, hrs: 12, age: 20, req: 'Cal tenir l\'A2 des de fa 2 anys' },
    { k: 'B', n: 'B', d: 'Cotxe', g: 'cotxe', h: 40, hrs: 20, age: 18 },
    { k: 'BE', n: 'B+E', d: 'Cotxe amb remolc', g: 'cotxe', h: 55, hrs: 10, age: 18, req: 'Cal tenir el carnet B' },
    { k: 'C1', n: 'C1', d: 'Camió lleuger', g: 'prof', h: 60, hrs: 20, age: 18 },
    { k: 'C', n: 'C', d: 'Camió', g: 'prof', h: 65, hrs: 24, age: 21, cap: 18 },
    { k: 'CE', n: 'C+E', d: 'Camió amb remolc', g: 'prof', h: 70, hrs: 12, age: 21, cap: 18, req: 'Cal tenir el carnet C' },
    { k: 'D', n: 'D', d: 'Autobús', g: 'prof', h: 75, hrs: 24, age: 24, cap: 21 }
  ];
  var GROUPS = [['tots', 'Tots'], ['moto', 'Moto'], ['cotxe', 'Cotxe'], ['prof', 'Camió i autobús']];
  var INCLOU = ['Matrícula i material', 'Teoria en línia i tests', null, 'Taxa DGT d\'examen', 'Una convocatòria d\'examen pràctic'];
  var STORE = 'ruta-autoescola-v5', BOX = 'vial-preinscripcions';

  var eur = function (n, d) { return n.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
  var by = function (k) { return PERMITS.filter(function (p) { return p.k === k; })[0]; };
  var ageTxt = function (p) { return 'Des dels ' + p.age + ' anys' + (p.cap ? ' (' + p.cap + ' amb CAP)' : ''); };

  /* ---------- oferta del centre: preus, hores incloses i quotes ---------- */
  function defaults() {
    var o = { name: 'Autoescola Bages', carnets: {}, plans: [{ n: 1, fee: 0 }, { n: 3, fee: 0 }, { n: 6, fee: 0 }] };
    PERMITS.forEach(function (p) { o.carnets[p.k] = { pr: Math.round((290 + 94.05 + p.hrs * p.h) * .92 / 10) * 10, hrs: p.hrs }; });
    return o;
  }
  function fromState(st) {
    var o = defaults();
    if (!st) return o;
    if (st.brand && st.brand.name) o.name = st.brand.name;
    if (Array.isArray(st.packs)) PERMITS.forEach(function (p) {
      var k = st.packs.filter(function (x) { return x.t === 'carnet' && x.p === p.k; })[0];
      if (k) o.carnets[p.k] = { pr: k.on ? +k.pr : null, hrs: +k.n || p.hrs };
    });
    var f = st.cfg && st.cfg.fin;
    if (f && Array.isArray(f.plans)) o.plans = f.plans.filter(function (x) { return x.on || x.n === 1; }).map(function (x) { return { n: x.n, fee: +x.fee || 0 }; });
    return o;
  }
  function localOffer() { try { return fromState(JSON.parse(localStorage.getItem(STORE))); } catch (e) { return defaults(); } }
  var server = window.SYNC_URL || '';
  var offer = server ? defaults() : localOffer();

  /* ---------- targetes ---------- */
  var group = 'tots';
  root.innerHTML = '<div class="mat-filter" role="group" aria-label="Tipus de carnet">' + GROUPS.map(function (g) {
    return '<button type="button" data-g="' + g[0] + '" aria-pressed="' + (g[0] === group) + '">' + g[1] + '</button>';
  }).join('') + '</div><div class="mat-grid"></div>';
  var grid = root.querySelector('.mat-grid');

  function monthly(pr) {
    var best = offer.plans.filter(function (x) { return x.n > 1; }).sort(function (a, b) { return b.n - a.n; })[0];
    return best ? 'o ' + eur(Math.ceil(pr * (1 + best.fee / 100) / best.n * 100) / 100, 2) + '/mes en ' + best.n + ' quotes' : 'Pagament únic';
  }
  function cards() {
    grid.innerHTML = PERMITS.filter(function (p) { return group === 'tots' || p.g === group; }).map(function (p) {
      var c = offer.carnets[p.k];
      return '<article class="mat-card"><div class="mat-code">' + p.n + '</div><h3>' + p.d + '</h3>' +
        '<p class="mat-req">' + ageTxt(p) + (p.req ? '<br>' + p.req : '') + '</p>' +
        '<div class="mat-price">' + (c.pr != null ? '<b>' + eur(c.pr) + '</b><span>Carnet complet · ' + c.hrs + ' pràctiques</span><span>' + monthly(c.pr) + '</span>' : '<b class="ask">A consultar</b><span>L\'autoescola t\'informa del preu</span>') + '</div>' +
        '<button type="button" class="pill pill--small pill--block" data-k="' + p.k + '" aria-label="Inscriure\'m al carnet ' + p.n + '">Inscriure\'m</button></article>';
    }).join('');
    [].forEach.call(document.querySelectorAll('[data-school]'), function (el) { el.textContent = offer.name; });
  }

  /* ---------- formulari ---------- */
  var dlg = document.createElement('dialog');
  dlg.className = 'mat-dlg'; dlg.setAttribute('aria-labelledby', 'mat-t');
  var fld = function (id, label, attrs) { return '<div class="f"><label for="mat-' + id + '">' + label + '</label><input id="mat-' + id + '" name="' + id + '" ' + attrs + '></div>'; };
  dlg.innerHTML =
    '<button type="button" class="mat-x" aria-label="Tancar">×</button>' +
    '<div class="mat-body">' +
    '<aside class="mat-side"><p class="eyebrow" data-school></p><div class="mat-code" id="mat-code"></div><h2 id="mat-t"></h2><div id="mat-sum" aria-live="polite"></div></aside>' +
    '<div class="mat-main">' +
    '<form novalidate>' +
    '<div class="f"><label for="mat-p">Carnet</label><select id="mat-p" name="p">' + PERMITS.map(function (p) { return '<option value="' + p.k + '">' + p.n + ' · ' + p.d + '</option>'; }).join('') + '</select></div>' +
    fld('n', 'Nom i cognoms', 'autocomplete="name" maxlength="80"') +
    '<div class="two">' + fld('tel', 'Telèfon', 'type="tel" autocomplete="tel" maxlength="20"') + fld('mail', 'Correu electrònic', 'type="email" autocomplete="email" maxlength="120"') + '</div>' +
    '<div class="two">' + fld('naix', 'Data de naixement', 'type="date" autocomplete="bday"') +
    '<div class="f"><label for="mat-fr">Quan prefereixes fer classes</label><select id="mat-fr" name="fr"><option>Indiferent</option><option>Matins</option><option>Tardes</option></select></div></div>' +
    '<p class="mat-warn" id="mat-age" hidden></p>' +
    '<fieldset class="mat-tutor" hidden><legend>Menor d\'edat: dades del pare, mare o tutor</legend><div class="two">' + fld('tutor', 'Nom i cognoms', 'maxlength="80"') + fld('tutorTel', 'Telèfon', 'type="tel" maxlength="20"') + '</div></fieldset>' +
    '<div class="f"><label for="mat-q">Com voldries pagar</label><select id="mat-q" name="q"></select></div>' +
    '<div class="f"><label for="mat-nota">Comentaris <span>(opcional)</span></label><textarea id="mat-nota" name="nota" rows="2" maxlength="500"></textarea></div>' +
    '<div class="mat-hp" aria-hidden="true"><label>Web<input name="web" tabindex="-1" autocomplete="off"></label></div>' +
    '<label class="chk"><input type="checkbox" name="ok"> <span id="mat-ok"></span></label>' +
    '<p class="err" role="alert" hidden></p>' +
    '<button type="submit" class="pill pill--block">Enviar la inscripció</button>' +
    '<p class="mat-note">No cal pagar res ara: l\'autoescola et confirma la matrícula i el preu.' + (server ? '' : ' Demostració: la sol·licitud es desa en aquest navegador i apareix a Preinscripcions.') + '</p>' +
    '</form>' +
    '<div class="mat-done" hidden tabindex="-1"><p class="eyebrow">Sol·licitud enviada</p><h2>Ja t\'has inscrit</h2><p id="mat-resum"></p>' +
    '<ol><li>L\'autoescola et contacta per confirmar la matrícula.</li><li>Portes el DNI i el certificat mèdic.</li><li>Reps l\'accés a l\'aplicació i reserves les primeres classes.</li></ol>' +
    '<div class="pills"><button type="button" class="pill" id="mat-more">Un altre carnet</button><button type="button" class="pill pill--ghost" id="mat-close">Tancar</button></div></div>' +
    '</div></div>';
  document.body.appendChild(dlg);
  var form = dlg.querySelector('form'), done = dlg.querySelector('.mat-done'), err = form.querySelector('.err'), E = form.elements;

  function ageOf(v) {
    var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(v || ''); if (!m) return null;
    var t = new Date(), a = t.getFullYear() - m[1];
    if (t.getMonth() + 1 < +m[2] || (t.getMonth() + 1 === +m[2] && t.getDate() < +m[3])) a--;
    return a;
  }
  function refresh() {
    var p = by(E.p.value), c = offer.carnets[p.k], q = E.q.value, a = ageOf(E.naix.value), valid = a != null && a >= 0 && a < 100, minor = valid && a < 18;
    dlg.querySelector('#mat-code').textContent = p.n;
    dlg.querySelector('#mat-t').textContent = p.d;
    E.q.innerHTML = offer.plans.map(function (x) {
      var tot = c.pr != null ? c.pr * (1 + x.fee / 100) : null;
      return '<option value="' + x.n + '">' + (x.n === 1 ? 'Pagament únic' : x.n + ' quotes' + (x.fee ? ' (+' + x.fee + ' %)' : ' sense interessos')) + (tot != null && x.n > 1 ? ' · ' + eur(Math.ceil(tot / x.n * 100) / 100, 2) + '/mes' : '') + '</option>';
    }).join('');
    if (q && offer.plans.some(function (x) { return String(x.n) === q; })) E.q.value = q;
    dlg.querySelector('#mat-sum').innerHTML = (c.pr != null ? '<div class="mat-total">' + eur(c.pr) + '</div><p>Preu orientatiu del carnet complet</p><ul>' +
      INCLOU.map(function (x) { return '<li>' + (x || c.hrs + ' pràctiques de conducció') + '</li>'; }).join('') + '</ul>' : '<p>L\'autoescola t\'informarà del preu d\'aquest carnet.</p>') +
      '<p class="mat-req">' + ageTxt(p) + (p.req ? ' · ' + p.req : '') + '<br>Pràctica addicional: ' + eur(p.h) + '</p>';
    var w = dlg.querySelector('#mat-age'), min = p.cap || p.age;
    w.hidden = !(valid && a < min);
    w.textContent = 'Encara no tens l\'edat mínima per al carnet ' + p.n + ' (' + min + ' anys). Pots enviar la sol·licitud i l\'autoescola et dirà quan pots començar.';
    dlg.querySelector('.mat-tutor').hidden = !minor;
    dlg.querySelector('#mat-ok').textContent = minor
      ? 'Soc el pare, mare o tutor (o tinc el seu permís) i accepto que l\'autoescola utilitzi aquestes dades per contactar-nos sobre la inscripció.'
      : 'Accepto que l\'autoescola utilitzi les meves dades per contactar-me sobre aquesta inscripció.';
  }
  function open(k) {
    E.p.value = by(k) ? k : 'B'; form.hidden = false; done.hidden = true; err.hidden = true; refresh();
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    document.documentElement.classList.add('mat-lock'); dlg.scrollTop = 0; dlg.querySelector('.mat-main').scrollTop = 0;
  }
  function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); document.documentElement.classList.remove('mat-lock'); }
  dlg.addEventListener('close', function () { document.documentElement.classList.remove('mat-lock'); });
  dlg.querySelector('.mat-x').addEventListener('click', close);
  dlg.querySelector('#mat-close').addEventListener('click', close);
  // un altre carnet: es mantenen les dades personals
  dlg.querySelector('#mat-more').addEventListener('click', function () { close(); root.scrollIntoView({ behavior: 'smooth' }); });
  var down = null;
  dlg.addEventListener('mousedown', function (e) { down = e.target; });
  dlg.addEventListener('click', function (e) { if (e.target === dlg && down === dlg) close(); });
  ['change', 'input'].forEach(function (ev) { form.addEventListener(ev, function (e) { if (e.target === E.p || e.target === E.naix) refresh(); }); });

  function fail(msg, el) { err.textContent = msg; err.hidden = false; if (el) el.focus(); }
  function collect() {
    var v = function (n) { return E[n].value.trim(); }, a = ageOf(v('naix')), phone = /^\+?[0-9 ]{9,18}$/;
    if (v('n').length < 3) return fail('Indica el teu nom i cognoms.', E.n);
    if (!phone.test(v('tel'))) return fail('Indica un telèfon vàlid.', E.tel);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('mail'))) return fail('Indica un correu electrònic vàlid.', E.mail);
    if (a == null || a < 14 || a > 99) return fail('Revisa la data de naixement.', E.naix);
    if (a < 18 && v('tutor').length < 3) return fail('Indica el nom del pare, mare o tutor.', E.tutor);
    if (a < 18 && !phone.test(v('tutorTel'))) return fail('Indica el telèfon del pare, mare o tutor.', E.tutorTel);
    if (!E.ok.checked) return fail('Cal acceptar l\'ús de les dades per poder contactar amb tu.', E.ok);
    var d = { n: v('n'), tel: v('tel'), mail: v('mail'), p: v('p'), naix: v('naix'), fr: v('fr'), q: +E.q.value || 1, nota: v('nota'), ok: true };
    if (a < 18) { d.tutor = v('tutor'); d.tutorTel = v('tutorTel'); }
    return d;
  }
  function sent(d) {
    var p = by(d.p);
    dlg.querySelector('#mat-resum').textContent = d.n + ', hem rebut la teva sol·licitud per al carnet ' + p.n + ' (' + p.d.toLowerCase() + ').';
    form.hidden = true; done.hidden = false; err.hidden = true; E.ok.checked = false; E.nota.value = ''; done.focus();
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault(); err.hidden = true;
    var d = collect(); if (!d) return;
    if (E.web.value) return sent(d); // camp trampa: només l'omplen els robots
    if (!server) {
      try {
        var list = JSON.parse(localStorage.getItem(BOX) || '[]');
        delete d.ok; d.id = 'pr' + Date.now(); d.ts = Date.now(); d.st = 'nova'; list.push(d); localStorage.setItem(BOX, JSON.stringify(list));
      } catch (x) { return fail('Aquest navegador no permet desar la sol·licitud.'); }
      return sent(d);
    }
    var btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'Enviant…';
    fetch(server + '/api/public/inscripcio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (r.ok) sent(d); else fail(j.error || 'No s\'ha pogut enviar. Torna-ho a provar.'); }); })
      .catch(function () { fail('No hi ha connexió amb l\'autoescola. Torna-ho a provar.'); })
      .then(function () { btn.disabled = false; btn.textContent = 'Enviar la inscripció'; });
  });

  root.addEventListener('click', function (e) {
    var g = e.target.closest('[data-g]'), b = e.target.closest('[data-k]');
    if (g) { group = g.dataset.g; [].forEach.call(root.querySelectorAll('[data-g]'), function (x) { x.setAttribute('aria-pressed', x === g); }); cards(); }
    else if (b) open(b.dataset.k);
  });
  cards();
  if (server) fetch(server + '/api/public/carnets').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { if (j && j.state) { offer = fromState(j.state); cards(); if (dlg.open) refresh(); } }).catch(function () { });
  else addEventListener('storage', function (e) { if (e.key === STORE) { offer = localOffer(); cards(); } });
  var want = new URLSearchParams(location.search).get('carnet');
  if (want) { want = want.toUpperCase().replace('+', '').replace(' ', ''); if (by(want)) open(want); }
})();
