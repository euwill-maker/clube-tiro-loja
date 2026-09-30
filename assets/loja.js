/* Loja do Clube de Tiro São Lourenço — catálogo, filtros, pedido e WhatsApp.
   Dados: window.LOJA_PRODUTOS / LOJA_CATS / LOJA_PARCELAS (assets/produtos.js, gerado)
   Config: window.LOJA_CONFIG (assets/config.js) */
(function () {
  'use strict';
  var C = window.LOJA_CONFIG, P = window.LOJA_PRODUTOS, CATS = window.LOJA_CATS, PARC = window.LOJA_PARCELAS || 10;
  var byId = {}; P.forEach(function (p, i) { p._i = i; byId[p.id] = p; });
  var catName = {}; CATS.forEach(function (c) { catName[c.id] = c.nome; });
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // ---------- utilidades ----------
  var BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function money(v) { return BRL.format(v).replace(/ /g, ' '); }
  function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(p, big) { return 'assets/img/p/' + p.img + (big ? '' : '-m') + '.webp'; }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function waUrl(text) { return 'https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(text); }
  function plural(n, a, b) { return n + ' ' + (n === 1 ? a : b); }
  P.forEach(function (p) { p._s = norm([p.n, p.m, p.cod, catName[p.c]].join(' ')); });

  // ---------- métricas (só liga com ID no config) ----------
  function track(ev, data) {
    try {
      if (window.fbq) fbq('track', ev, data || {});
      if (window.gtag) gtag('event', ev, data || {});
    } catch (e) {}
  }
  (function loadTags() {
    if (C.metaPixel) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', C.metaPixel); fbq('track', 'PageView');
    }
    if (C.ga4) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.ga4; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', C.ga4);
    }
  })();

  // ---------- estado ----------
  var BANDS = [
    { id: 'a', nome: 'Até R$ 200', min: 0, max: 200 },
    { id: 'b', nome: 'R$ 200 a 500', min: 200, max: 500 },
    { id: 'c', nome: 'R$ 500 a 1.000', min: 500, max: 1000 },
    { id: 'd', nome: 'R$ 1.000 a 2.500', min: 1000, max: 2500 },
    { id: 'e', nome: 'Acima de R$ 2.500', min: 2500, max: Infinity },
  ];
  var S = { q: '', cat: '', brands: [], band: '', sort: 'rel', shown: C.porPagina };
  var params = new URLSearchParams(location.search);
  if (catName[params.get('c')]) S.cat = params.get('c');
  if (params.get('q')) S.q = params.get('q');
  var cart = store('slo-loja-pedido') || {};
  Object.keys(cart).forEach(function (id) { if (!byId[id] || !(cart[id] > 0)) delete cart[id]; });

  // ---------- filtro ----------
  function matches(p, ignoreCat) {
    if (!ignoreCat && S.cat && p.c !== S.cat) return false;
    if (S.brands.length && S.brands.indexOf(p.m) < 0) return false;
    if (S.band) {
      var b = BANDS.filter(function (x) { return x.id === S.band; })[0];
      if (p.pix == null || p.pix < b.min || p.pix >= b.max) return false;
    }
    if (S.q) {
      var words = norm(S.q).split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (p._s.indexOf(words[i]) < 0) return false;
    }
    return true;
  }
  function sorted(list) {
    var l = list.slice();
    var price = function (p) { return p.pix == null ? Infinity : p.pix; };
    if (S.sort === 'menor') l.sort(function (a, b) { return price(a) - price(b); });
    else if (S.sort === 'maior') l.sort(function (a, b) { return (b.pix || 0) - (a.pix || 0); });
    else if (S.sort === 'az') l.sort(function (a, b) { return a.n.localeCompare(b.n, 'pt-BR'); });
    return l;
  }

  // ---------- render ----------
  function priceHtml(p, big) {
    if (p.pix == null) return '<p class="price-ask">Preço sob consulta</p>';
    return '<p class="price-pix">' + money(p.pix) + '<small>no PIX</small></p>' +
      '<p class="price-card">ou ' + PARC + 'x de ' + money(p.card / PARC) + (big ? ' sem juros (' + money(p.card) + ' no cartão)' : '') + '</p>';
  }
  function cardHtml(p) {
    var inCart = cart[p.id] > 0;
    var add = p.pix == null
      ? '<a class="card-add" href="' + waUrl('Olá! Quero saber o preço e o prazo de: ' + p.n + ' (' + p.m + ', cód. ' + p.cod + ').') + '" target="_blank" rel="noopener" data-ask="' + p.id + '"><svg class="i i-fill" aria-hidden="true"><use href="#i-wa"/></svg>Consultar</a>'
      : '<button class="card-add' + (inCart ? ' in' : '') + '" type="button" data-add="' + p.id + '" aria-label="Adicionar ' + esc(p.n) + ' ao pedido"><svg class="i" aria-hidden="true"><use href="#i-' + (inCart ? 'cart' : 'plus') + '"/></svg>' + (inCart ? 'No pedido (' + cart[p.id] + ')' : 'Adicionar') + '</button>';
    return '<li class="card"><button class="card-hit" type="button" data-open="' + p.id + '">' +
      '<span class="card-img"><img src="' + img(p) + '" alt="" loading="lazy" decoding="async" width="440" height="440"></span>' +
      '<span class="card-info"><span class="card-brand">' + esc(p.m) + '</span><span class="card-name">' + esc(p.n) + '</span>' +
      '<span class="card-price">' + priceHtml(p) + '</span></span></button>' + add + '</li>';
  }
  function renderChips() {
    var counts = {}, total = 0;
    P.forEach(function (p) { if (matches(p, true)) { counts[p.c] = (counts[p.c] || 0) + 1; total++; } });
    var html = '<button class="chip" type="button" data-cat="" aria-pressed="' + (!S.cat) + '">Todos<small>' + total + '</small></button>';
    CATS.forEach(function (c) {
      if (!counts[c.id] && S.cat !== c.id) return;
      html += '<button class="chip" type="button" data-cat="' + c.id + '" aria-pressed="' + (S.cat === c.id) + '">' + esc(c.nome) + '<small>' + (counts[c.id] || 0) + '</small></button>';
    });
    $('#chips').innerHTML = html;
  }
  function render(keepScroll) {
    var list = sorted(P.filter(function (p) { return matches(p); }));
    $('#grid').innerHTML = list.slice(0, S.shown).map(cardHtml).join('');
    $('#more').hidden = list.length <= S.shown;
    $('#more').textContent = 'Ver mais ' + Math.min(C.porPagina, list.length - S.shown) + ' de ' + (list.length - S.shown) + ' produtos';
    $('#empty').hidden = list.length > 0;
    $('#result').innerHTML = '<b>' + plural(list.length, 'produto', 'produtos') + '</b>' + (S.cat ? ' em ' + esc(catName[S.cat]) : '');
    var nf = S.brands.length + (S.band ? 1 : 0);
    $('#filterN').hidden = !nf; $('#filterN').textContent = nf;
    $('#qClear').hidden = !S.q;
    renderChips();
    var u = new URL(location.href);
    S.cat ? u.searchParams.set('c', S.cat) : u.searchParams.delete('c');
    S.q ? u.searchParams.set('q', S.q) : u.searchParams.delete('q');
    history.replaceState(history.state, '', u);
  }
  function resetPaging() { S.shown = C.porPagina; }
  function toTop() {
    var y = $('#tools').getBoundingClientRect().top + scrollY - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header'));
    if (scrollY > y) scrollTo({ top: y });
  }

  // ---------- pedido ----------
  function saveCart() { store('slo-loja-pedido', cart); updateCartUi(); }
  function cartList() { return Object.keys(cart).map(function (id) { return { p: byId[id], q: cart[id] }; }); }
  function totals() {
    var t = { n: 0, pix: 0, card: 0, ask: 0 };
    cartList().forEach(function (x) { t.n += x.q; if (x.p.pix == null) t.ask++; else { t.pix += x.p.pix * x.q; t.card += x.p.card * x.q; } });
    return t;
  }
  var toastT;
  function toast(msg) { var el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove('show'); }, 1800); }
  function add(id, q) {
    cart[id] = (cart[id] || 0) + (q || 1);
    saveCart();
    var b = $('#cartOpen'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    var p = byId[id];
    toast('Adicionado ao pedido');
    track('AddToCart', { content_ids: [p.cod], content_name: p.n, value: p.pix || 0, currency: 'BRL' });
  }
  function setQty(id, q) { if (q <= 0) delete cart[id]; else cart[id] = Math.min(q, 99); saveCart(); }
  function updateCartUi() {
    var t = totals();
    $('#cartCount').hidden = !t.n; $('#cartCount').textContent = t.n;
    $('#cartOpen').setAttribute('aria-label', 'Ver pedido (' + plural(t.n, 'item', 'itens') + ')');
    $('#cartbar').hidden = !t.n; document.body.classList.toggle('has-cartbar', !!t.n);
    $('#cartbarN').textContent = plural(t.n, 'item', 'itens') + ' no pedido';
    $('#cartbarTotal').textContent = t.pix ? money(t.pix) + ' no PIX' + (t.ask ? ' + a consultar' : '') : 'preço a consultar';
    // botões dos cards visíveis
    document.querySelectorAll('[data-add]').forEach(function (b) {
      var id = b.getAttribute('data-add'), n = cart[id] || 0;
      b.classList.toggle('in', n > 0);
      b.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-' + (n ? 'cart' : 'plus') + '"/></svg>' + (n ? 'No pedido (' + n + ')' : 'Adicionar');
    });
    if ($('#cart').open) renderCart();
  }
  function renderCart() {
    var items = cartList(), t = totals(), who = store('slo-loja-cliente') || {};
    if (!items.length) {
      $('#cartBody').innerHTML = '<div class="c-empty"><svg class="i" style="width:40px;height:40px;color:var(--yellow)" aria-hidden="true"><use href="#i-cart"/></svg><p>Seu pedido está vazio.</p><button class="btn btn-outline btn-sm" type="button" data-close>Ver produtos</button></div>';
      $('#cartFoot').innerHTML = ''; return;
    }
    var h = '<ul class="c-items">' + items.map(function (x) {
      var p = x.p;
      return '<li class="c-item"><button class="c-thumb" type="button" data-open="' + p.id + '" aria-label="Ver ' + esc(p.n) + '" style="border:0;padding:0;cursor:pointer"><img src="' + img(p) + '" alt="" loading="lazy"></button><div>' +
        '<p class="c-name">' + esc(p.n) + '</p><p class="c-meta">' + esc(p.m) + ' · cód. ' + esc(p.cod) + '</p>' +
        '<div class="c-row"><div class="qty"><button type="button" data-qty="' + p.id + '" data-d="-1" aria-label="Diminuir"><svg class="i" aria-hidden="true"><use href="#i-' + (x.q > 1 ? 'minus' : 'trash') + '"/></svg></button><output>' + x.q + '</output><button type="button" data-qty="' + p.id + '" data-d="1" aria-label="Aumentar"><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></button></div>' +
        '<span class="c-sub">' + (p.pix == null ? 'a consultar' : money(p.pix * x.q)) + '</span></div></div></li>';
    }).join('') + '</ul>';
    h += '<div class="c-sum"><div class="tot"><span>Total no PIX</span><span>' + money(t.pix) + '</span></div>' +
      (t.card ? '<div class="card-tot"><span>No cartão (até ' + PARC + 'x sem juros)</span><span>' + money(t.card) + '</span></div>' : '') +
      (t.ask ? '<div class="card-tot"><span>' + plural(t.ask, 'item', 'itens') + ' com preço a consultar</span><span>—</span></div>' : '') +
      '<div class="card-tot"><span>Frete / retirada</span><span>combinado no WhatsApp</span></div></div>';
    h += '<form class="c-form" id="cForm" novalidate>' +
      '<label>Seu nome<input id="cNome" name="nome" autocomplete="name" value="' + esc(who.nome || '') + '" placeholder="Como podemos te chamar"></label>' +
      '<label>Cidade<input id="cCidade" name="cidade" autocomplete="address-level2" value="' + esc(who.cidade || '') + '" placeholder="Ex.: São Lourenço do Oeste"></label>' +
      '<label>Como prefere receber<select id="cEntrega"><option>Retirar no clube</option><option' + (who.entrega === 'Receber em casa' ? ' selected' : '') + '>Receber em casa</option></select></label>' +
      '</form>';
    $('#cartBody').innerHTML = h;
    $('#cartFoot').innerHTML = '<button class="btn btn-wa btn-block" type="button" id="cSend"><svg class="i i-fill" aria-hidden="true"><use href="#i-wa"/></svg>Enviar pedido no WhatsApp</button><p class="c-hint">Sob encomenda: o clube confirma prazo, frete e pagamento na conversa.</p>';
  }
  function sendOrder() {
    var nome = $('#cNome').value.trim(), cidade = $('#cCidade').value.trim(), entrega = $('#cEntrega').value;
    $('#cNome').classList.toggle('err', !nome); $('#cCidade').classList.toggle('err', !cidade);
    if (!nome || !cidade) { (nome ? $('#cCidade') : $('#cNome')).focus(); toast('Preencha nome e cidade'); return; }
    store('slo-loja-cliente', { nome: nome, cidade: cidade, entrega: entrega });
    var t = totals(), lines = ['Olá! Quero fazer este pedido na loja do clube:', ''];
    cartList().forEach(function (x, i) {
      lines.push((i + 1) + ') ' + x.q + 'x ' + x.p.n + ' — ' + x.p.m + ', cód. ' + x.p.cod + (x.p.pix == null ? ' — preço a consultar' : ' — ' + money(x.p.pix * x.q)));
    });
    lines.push('');
    if (t.pix) lines.push('Total no PIX: ' + money(t.pix) + ' (ou ' + money(t.card) + ' no cartão em até ' + PARC + 'x)');
    if (t.ask) lines.push(plural(t.ask, 'item', 'itens') + ' com preço a consultar.');
    lines.push('Entrega: ' + entrega.toLowerCase());
    lines.push('Nome: ' + nome);
    lines.push('Cidade: ' + cidade);
    lines.push('');
    lines.push('Pode me confirmar o prazo' + (entrega === 'Receber em casa' ? ', o frete' : '') + ' e a forma de pagamento?');
    track('Lead', { value: t.pix, currency: 'BRL', num_items: t.n });
    window.open(waUrl(lines.join('\n')), '_blank', 'noopener');
  }

  // ---------- folhas (dialog) + botão voltar do celular ----------
  var openStack = [];
  function openSheet(id) {
    var d = document.getElementById(id);
    if (!d.open) { d.showModal(); openStack.push(id); history.pushState({ sheet: id }, ''); }
    document.body.classList.add('lock');
  }
  function closeSheet(d, fromPop) {
    if (!d.open) return;
    d.close();
    openStack = openStack.filter(function (x) { return x !== d.id; });
    if (!openStack.length) document.body.classList.remove('lock');
    if (d.id === 'prod') { var u = new URL(location.href); u.searchParams.delete('p'); history.replaceState(history.state, '', u); document.title = baseTitle; }
    if (!fromPop && history.state && history.state.sheet === d.id) history.back();
  }
  window.addEventListener('popstate', function () {
    var top = openStack[openStack.length - 1];
    if (top) closeSheet(document.getElementById(top), true);
  });
  document.querySelectorAll('dialog').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeSheet(d); });
    d.addEventListener('click', function (e) {
      if (e.target === d || e.target.closest('[data-close]')) closeSheet(d);
    });
  });

  // ---------- produto ----------
  var baseTitle = document.title, prodQty = 1;
  function specRow(s) {
    var k = s.indexOf(':');
    return '<li><span>' + esc(s.slice(0, k).trim()) + '</span><b>' + esc(s.slice(k + 1).trim()) + '</b></li>';
  }
  function openProduct(id, push) {
    var p = byId[id]; if (!p) return;
    prodQty = 1;
    var rel = P.filter(function (x) { return x.c === p.c && x.id !== p.id && x.pix != null; })
      .sort(function (a, b) { return Math.abs(a.pix - (p.pix || 0)) - Math.abs(b.pix - (p.pix || 0)); }).slice(0, 8);
    var h = '<div class="p-img"><img src="' + img(p, true) + '" alt="' + esc(p.n) + '" width="900" height="900"></div>' +
      '<div class="p-main"><p class="p-brand">' + esc(p.m) + '</p><h2 class="p-name" id="prodName">' + esc(p.n) + '</h2><p class="p-code">Código ' + esc(p.cod) + ' · ' + esc(catName[p.c]) + '</p>' +
      '<div class="p-price">' + priceHtml(p, true) + '</div></div>' +
      '<p class="p-note"><svg class="i" aria-hidden="true"><use href="#i-box"/></svg><span><b>Sob encomenda.</b> O clube pede ao fornecedor depois que você fecha: prazo e frete confirmados no WhatsApp.' +
      (p.c === 'carregadores' ? ' Para carregadores, o atendimento confirma se é preciso apresentar seu registro.' : '') + '</span></p>';
    if (p.d) h += '<div class="p-sec"><h3>Sobre o produto</h3><p class="p-desc">' + esc(p.d) + '</p></div>';
    if (p.s.length) h += '<div class="p-sec"><h3>Especificações</h3><ul class="specs">' + p.s.map(specRow).join('') + '</ul></div>';
    if (rel.length) h += '<div class="p-rel"><div class="p-sec" style="padding-top:0"><h3>Veja também</h3></div><ul class="rel">' + rel.map(cardHtml).join('') + '</ul></div>';
    $('#prodBody').innerHTML = h;
    $('#prodBody').scrollTop = 0;
    renderProdFoot(p);
    if (!$('#prod').open) openSheet('prod');
    var u = new URL(location.href); u.searchParams.set('p', p.id); history.replaceState(history.state, '', u);
    document.title = p.n + ' · Loja do Clube de Tiro São Lourenço';
    track('ViewContent', { content_ids: [p.cod], content_name: p.n, value: p.pix || 0, currency: 'BRL' });
  }
  function renderProdFoot(p) {
    var ask = 'Olá! Tenho uma dúvida sobre: ' + p.n + ' (' + p.m + ', cód. ' + p.cod + ').';
    if (p.pix == null) {
      $('#prodFoot').innerHTML = '<a class="btn btn-wa btn-block" href="' + waUrl('Olá! Quero saber o preço e o prazo de: ' + p.n + ' (' + p.m + ', cód. ' + p.cod + ').') + '" target="_blank" rel="noopener"><svg class="i i-fill" aria-hidden="true"><use href="#i-wa"/></svg>Consultar preço no WhatsApp</a>';
      return;
    }
    var n = cart[p.id] || 0;
    $('#prodFoot').innerHTML = '<div class="p-actions"><div class="qty"><button type="button" id="pMinus" aria-label="Diminuir"><svg class="i" aria-hidden="true"><use href="#i-minus"/></svg></button><output id="pQty">' + prodQty + '</output><button type="button" id="pPlus" aria-label="Aumentar"><svg class="i" aria-hidden="true"><use href="#i-plus"/></svg></button></div>' +
      '<button class="btn btn-yellow" type="button" id="pAdd" data-id="' + p.id + '"><svg class="i" aria-hidden="true"><use href="#i-cart"/></svg>Adicionar</button></div>' +
      (n ? '<button class="btn btn-outline btn-sm btn-block" type="button" id="pGoCart">Já tem ' + n + ' no pedido · ver pedido</button>' : '<a class="btn btn-outline btn-sm btn-block" href="' + waUrl(ask) + '" target="_blank" rel="noopener"><svg class="i i-fill" aria-hidden="true"><use href="#i-wa"/></svg>Tirar dúvida no WhatsApp</a>');
  }

  // ---------- filtros ----------
  var draft = { brands: [], band: '' };
  function renderFilters() {
    var brands = {}; P.forEach(function (p) { brands[p.m] = (brands[p.m] || 0) + 1; });
    $('#fBrands').innerHTML = Object.keys(brands).sort().map(function (b) {
      return '<button class="chip" type="button" data-brand="' + esc(b) + '" aria-pressed="' + (draft.brands.indexOf(b) >= 0) + '">' + esc(b) + '<small>' + brands[b] + '</small></button>';
    }).join('');
    $('#fPrices').innerHTML = BANDS.map(function (b) {
      return '<button class="chip" type="button" data-band="' + b.id + '" aria-pressed="' + (draft.band === b.id) + '">' + b.nome + '</button>';
    }).join('');
    var n = P.filter(function (p) { var s0 = S.brands, s1 = S.band; S.brands = draft.brands; S.band = draft.band; var ok = matches(p); S.brands = s0; S.band = s1; return ok; }).length;
    $('#filtersApply').textContent = 'Ver ' + plural(n, 'produto', 'produtos');
  }

  // ---------- eventos ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-open],[data-add],[data-cat],[data-qty],[data-brand],[data-band],[data-ask]');
    if (!t) return;
    if (t.hasAttribute('data-ask')) { var pa = byId[t.getAttribute('data-ask')]; track('Contact', { content_name: pa.n }); return; }
    if (t.hasAttribute('data-open')) { openProduct(t.getAttribute('data-open')); return; }
    if (t.hasAttribute('data-add')) { add(t.getAttribute('data-add')); return; }
    if (t.hasAttribute('data-cat')) { S.cat = t.getAttribute('data-cat'); resetPaging(); render(); toTop(); t.scrollIntoView && t.scrollIntoView({ inline: 'nearest', block: 'nearest' }); return; }
    if (t.hasAttribute('data-qty')) { var id = t.getAttribute('data-qty'); setQty(id, (cart[id] || 0) + +t.getAttribute('data-d')); return; }
    if (t.hasAttribute('data-brand')) {
      var b = t.getAttribute('data-brand'), i = draft.brands.indexOf(b);
      i >= 0 ? draft.brands.splice(i, 1) : draft.brands.push(b); renderFilters(); return;
    }
    if (t.hasAttribute('data-band')) { var bd = t.getAttribute('data-band'); draft.band = draft.band === bd ? '' : bd; renderFilters(); }
  });
  $('#prodFoot').addEventListener('click', function (e) {
    var p = byId[new URL(location.href).searchParams.get('p')]; if (!p) return;
    if (e.target.closest('#pMinus')) { prodQty = Math.max(1, prodQty - 1); $('#pQty').textContent = prodQty; }
    if (e.target.closest('#pPlus')) { prodQty = Math.min(99, prodQty + 1); $('#pQty').textContent = prodQty; }
    if (e.target.closest('#pAdd')) { add(p.id, prodQty); prodQty = 1; renderProdFoot(p); }
    if (e.target.closest('#pGoCart')) { renderCart(); openSheet('cart'); }
  });
  $('#prodCopy').addEventListener('click', function () {
    var url = location.href;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast('Link do produto copiado'); }, function () { prompt('Copie o link:', url); });
  });
  $('#cartFoot').addEventListener('click', function (e) { if (e.target.closest('#cSend')) sendOrder(); });
  $('#cartBody').addEventListener('change', function () {
    var n = $('#cNome'), c = $('#cCidade'), en = $('#cEntrega');
    if (n) store('slo-loja-cliente', { nome: n.value.trim(), cidade: c.value.trim(), entrega: en.value });
  });
  function openCart() { renderCart(); openSheet('cart'); track('InitiateCheckout', { value: totals().pix, currency: 'BRL' }); }
  $('#cartOpen').addEventListener('click', openCart);
  $('#cartbarBtn').addEventListener('click', openCart);
  $('#filterOpen').addEventListener('click', function () { draft = { brands: S.brands.slice(), band: S.band }; renderFilters(); openSheet('filters'); });
  $('#filtersClear').addEventListener('click', function () { draft = { brands: [], band: '' }; renderFilters(); });
  $('#filtersApply').addEventListener('click', function () { S.brands = draft.brands; S.band = draft.band; resetPaging(); render(); closeSheet($('#filters')); toTop(); });
  $('#more').addEventListener('click', function () { S.shown += C.porPagina; render(); });
  $('#sort').addEventListener('change', function (e) { S.sort = e.target.value; resetPaging(); render(); });
  var qT;
  $('#q').value = S.q;
  $('#q').addEventListener('input', function (e) { clearTimeout(qT); qT = setTimeout(function () { S.q = e.target.value.trim(); resetPaging(); render(); }, 160); });
  $('#q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.target.blur(); toTop(); } });
  $('#qClear').addEventListener('click', function () { $('#q').value = ''; S.q = ''; resetPaging(); render(); $('#q').focus(); });

  // ---------- links fixos ----------
  $('#linkClube').href = $('#footClube').href = C.siteClube;
  $('#footInsta').href = C.instagram;
  $('#emptyWa').href = waUrl('Olá! Procurei na loja do clube e não achei: ');
  $('#emptyWa').target = '_blank';
  document.querySelectorAll('.js-parc').forEach(function (el) { el.textContent = PARC; });
  $('#previewBar').hidden = !C.preview;

  render();
  updateCartUi();
  if (byId[params.get('p')]) openProduct(params.get('p'));
})();
