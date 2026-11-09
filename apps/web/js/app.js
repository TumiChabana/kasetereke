/* KaSetereke traveller app: one page, many screens, switched by the #hash in the address bar.
   No framework. Data comes from js/data.js; saved places, bookings and reviews live in this browser
   (localStorage) until the database is connected. */
(function () {
  'use strict';

  const KS = window.KS;
  const app = document.getElementById('app');
  const STORE_KEY = 'ksetereke:v1';

  // Dummy user: never put a real name, email or phone number in this public repo.
  const USER = { name: 'Thabo Mokoena', email: 'thabo@example.com' };

  // ---------- storage (wrapped in try/catch because browsers can block it) ----------
  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { return {}; }
  }
  function writeStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  const state = Object.assign({ saved: [], bookings: [], reviews: [], draft: null }, readStore());

  // ---------- small helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const money = (n) => 'M' + Number(n).toLocaleString('en-US');
  const getDistrict = (id) => KS.districts.find((d) => d.id === id);
  const getPlace = (id) => KS.places.find((p) => p.id === id);
  const isSaved = (id) => state.saved.indexOf(id) !== -1;
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const nightsBetween = (a, b) => {
    const [y1, m1, d1] = a.split('-').map(Number);
    const [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  };
  const prettyDate = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ---------- shared pieces (header, bottom nav, list card) ----------
  const ICON_BACK = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const header = (title, backHref, extra) =>
    '<header class="top' + (extra ? ' top--search' : '') + '">' +
      (backHref ? '<a class="top__back" href="' + backHref + '" aria-label="Back">' + ICON_BACK + '</a>' : '') +
      '<h1 class="top__title">' + esc(title) + '</h1>' +
      (extra || '') +
    '</header>';

  const navBar = (active) => {
    const svg = (d) => '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
    const ICONS = {
      explore: svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
      saved: svg('<path d="M6 3h12v18l-6-4-6 4z"/>'),
      trips: svg('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6"/>'),
      profile: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
      map: svg('<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>')
    };
    const link = (key, href, label) => '<a href="' + href + '"' + (key === active ? ' aria-current="page"' : '') + '>' + ICONS[key] + '<span>' + label + '</span></a>';
    return '<nav class="nav no-print" aria-label="Main">' +
      link('explore', '#/home', 'Explore') +
      link('saved', '#/saved', 'Saved') +
      '<a class="nav__map" href="#/map" aria-label="Map">' + ICONS.map + '</a>' +
      link('trips', '#/trips', 'Trips') +
      link('profile', '#/profile', 'Profile') +
    '</nav>';
  };

  const saveButton = (p) =>
    '<button type="button" class="save" data-save="' + p.id + '" aria-pressed="' + isSaved(p.id) + '" aria-label="Save ' + esc(p.name) + '">' +
    (isSaved(p.id) ? '&#9733;' : '&#9734;') + '</button>';

  const card = (p) =>
    '<article class="card card--' + p.type + '">' +
      '<a class="card__link" href="#/place/' + p.id + '">' +
        '<div class="thumb thumb--' + p.type + '"><span aria-hidden="true">' + esc(p.name.charAt(0)) + '</span>' + (p.image ? '<img src="' + esc(p.image) + '" alt="Photo of ' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' : '') + '</div>'  +
        '<div class="card__body">' +
          '<h3 class="card__name">' + esc(p.name) + '</h3>' +
          '<p class="card__sub">' + esc(p.tagline) + '</p>' +
          (p.price ? '<p class="card__price">' + money(p.price) + ' a night</p>' : '<p class="card__price card__price--heritage">Heritage and nature</p>') +
          '<p class="card__meta"><span class="match">' + p.match + '% match</span><span>&#9733; ' + p.rating.toFixed(1) + '</span></p>' +
        '</div>' +
      '</a>' +
      saveButton(p) +
    '</article>';

  const empty = (title, text, href, label) =>
    '<div class="empty"><h2>' + esc(title) + '</h2><p>' + esc(text) + '</p><a class="btn" href="' + href + '">' + esc(label) + '</a></div>';

  // ---------- screens: each returns { title, html, after? } ----------
  const screens = {};

  screens.splash = () => ({
    title: 'Welcome',
    html:
      '<main class="splash">' +
        '<h1>KaSetereke</h1>' +
        '<p class="splash__tag">10 districts. One tap each.</p>' +
        '<a class="btn" href="#/login">Get started</a>' +
      '</main>'
  });

  screens.login = () => ({
    title: 'Log in',
    html:
      header('Welcome back') +
      '<main>' +
        '<p class="lede">Sign in to keep exploring by district.</p>' +
        '<form id="login" class="form" novalidate>' +
          '<label for="email">Email</label><input id="email" type="email" autocomplete="email" placeholder="you@example.com">' +
          '<label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password">' +
          '<button class="btn" type="submit">Log in</button>' +
        '</form>' +
        '<p class="small">Practice login: nothing is checked or saved yet. Real login arrives with the database.</p>' +
        '<p class="center"><a href="#/home">Continue without an account</a></p>' +
      '</main>',
    after: () => {
      document.getElementById('login').addEventListener('submit', (e) => { e.preventDefault(); location.hash = '#/home'; });
    }
  });

    // Home: one photo card for the sideways-scrolling rows
  const pcard = (p, badge) => {
    const d = getDistrict(p.districtId);
    return '<a class="pcard" href="#/place/' + p.id + '">' +
      '<div class="pcard__img thumb--' + p.type + '"><span class="pcard__letter" aria-hidden="true">' + esc(p.name.charAt(0)) + '</span>' +
        (p.image ? '<img src="' + esc(p.image) + '" alt="Photo of ' + esc(p.name) + '" loading="lazy" onerror="this.remove()">' : '') +
        '<span class="pcard__badge">' + esc(badge) + '</span></div>' +
      '<h3 class="pcard__name">' + esc(p.name) + '</h3>' +
      '<div class="pcard__meta"><span class="pcard__sub">' + esc(d.name) + '</span><span class="pcard__rate">&#9733; ' + p.rating.toFixed(1) + '</span></div></a>';
  };

  // Home: a titled shelf of cards. picks = [[placeId, badgeText], ...]
  const shelf = (title, picks) => {
    const cards = picks.map((x) => ({ p: getPlace(x[0]), badge: x[1] })).filter((x) => x.p).map((x) => pcard(x.p, x.badge));
    return '<section class="shelf"><div class="shelf__head"><h2>' + esc(title) + '</h2><a href="#/districts">See all</a></div>' +
      (cards.length ? '<div class="hrow">' + cards.join('') + '</div>' : '<p class="small">Nothing to show yet.</p>') + '</section>';
  };

  screens.home = () => {
    const first = USER.name.split(' ')[0];
    const initials = USER.name.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
    // A district counts as explored when you have saved or booked a place in it.
    const seen = {};
    state.saved.concat(state.bookings.map((b) => b.placeId)).forEach((id) => { const p = getPlace(id); if (p) seen[p.districtId] = true; });
    const explored = Object.keys(seen).length;
    const cats = [['Stays', '#/districts'], ['Heritage', '#/districts'], ['Nature', '#/coming-soon'], ['Camping', '#/coming-soon'], ['Events', '#/coming-soon']];
    return {
      title: 'Home',
      html:
        '<header class="top top--home">' +
          '<div class="home__row">' +
            '<div><p class="home__hi">Hi, ' + esc(first) + '!</p><p class="home__sub">Ready for your next escape?</p></div>' +
            '<div class="avatar avatar--small" aria-hidden="true">' + esc(initials) + '</div>' +
          '</div>' +
          '<p class="pill">' + explored + ' of ' + KS.districts.length + ' Districts Explored</p>' +
        '</header>' +
        '<div class="home__search"><a class="search" href="#/search"><span>Where in Lesotho?</span>' +
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a></div>' +
        '<main class="home">' +
          '<section class="banner"><h2>Explore Lesotho By District</h2>' +
            '<p>Find local BnBs, lodges &amp; monuments right where you are. One tap, no typing.</p>' +
            '<a class="pillbtn" href="#/districts">Explore now &rarr;</a></section>' +
          '<ul class="cats">' + cats.map((c) =>
            '<li><a href="' + c[1] + '"><span class="cats__img"><span aria-hidden="true">' + c[0].charAt(0) + '</span>' +
            '<img src="img/cat-' + c[0].toLowerCase() + '.jpg" alt="" onerror="this.remove()"></span>' + c[0] + '</a></li>').join('') + '</ul>' +
          shelf('Top picks for you', [['maliba-lodge', 'Family pick'], ['katse-dam', 'Great view']]) +
          shelf('Trending right now', [['maletsunyane-falls', '#1 spot'], ['sani-pass', 'Bucket list']]) +
        '</main>' + navBar('explore')
    };
  };

  screens.districts = () => ({
    title: 'Choose your district',
    html:
      '<header class="top top--tall"><p>Hi, ' + esc(USER.name.split(' ')[0]) + '!</p><h1 class="top__title">Choose your district</h1></header>' +
      '<main>' +
        '<p class="lede">One tap, no typing needed.</p>' +
        '<ul class="grid">' + KS.districts.map((d) => {
          const n = KS.places.filter((p) => p.districtId === d.id).length;
          return '<li><a class="dbtn" href="#/district/' + d.id + '"><span>' + esc(d.name) + '</span><small>' + n + (n === 1 ? ' place' : ' places') + '</small></a></li>';
        }).join('') + '</ul>' +
      '</main>' + navBar('explore')
  });

  screens.district = (args) => {
    const d = getDistrict(args[0]);
    if (!d) return screens.notFound();
    const tab = args[1] || 'all';
    const wanted = { all: null, stays: 'stay', heritage: 'heritage' }[tab];
    const list = KS.places.filter((p) => p.districtId === d.id && (!wanted || p.type === wanted));
    const tabs = [['all', 'All'], ['stays', 'Stays'], ['heritage', 'Heritage']].map((t) =>
      '<a class="tab" href="#/district/' + d.id + (t[0] === 'all' ? '' : '/' + t[0]) + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + '</a>').join('');
    return {
      title: d.name,
      html:
        header(d.name, '#/districts', '<a class="search search--list" href="#/search"><span>Search places</span><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></a>') +
        '<main><div class="tabs">' + tabs + '</div>' +
          (list.length ? list.map(card).join('') : empty('Nothing listed in ' + d.name + ' yet', 'Try another tab or pick a different district.', '#/home', 'Choose a district')) +
        '</main>' + navBar('explore')
    };
  };

  screens.place = (args) => {
    const p = getPlace(args[0]);
    if (!p) return screens.notFound();
    const d = getDistrict(p.districtId);
    return {
      title: p.name,
      html:
        '<div class="hero hero--' + p.type + '">' +
          (p.image ? '<img class="hero__img" src="' + esc(p.image) + '" alt="Photo of ' + esc(p.name) + '" onerror="this.remove()">' : '') +
          '<a class="hero__btn hero__back" href="#/district/' + p.districtId + '" aria-label="Back">' + ICON_BACK + '</a>' +
          '<button type="button" class="hero__btn hero__save" data-save="' + p.id + '" aria-pressed="' + isSaved(p.id) + '" aria-label="' + (isSaved(p.id) ? 'Remove ' : 'Save ') + esc(p.name) + '">' + (isSaved(p.id) ? '&#9829;' : '&#9825;') + '</button>' +
          '<div class="hero__text"><p>' + esc(d.name) + ' &middot; ' + (p.type === 'stay' ? 'stay' : 'heritage site') + '</p><h1>' + esc(p.name) + '</h1></div>' +
        '</div>' +
        '<main>' +
          '<p class="eyebrow-free">' + esc(d.name) + ' &ndash; ' + esc(p.tagline) + '</p>' +
          '<ul class="stats">' +
            '<li><strong>' + p.rating.toFixed(1) + '</strong><span>Rating</span></li>' +
            '<li><strong>' + p.match + '%</strong><span>Match</span></li>' +
            '<li><strong>' + (p.price ? money(p.price) : 'Free') + '</strong><span>' + (p.price ? 'Per night' : 'Entry info soon') + '</span></li>' +
          '</ul>' +
          '<p class="tags">' + p.tags.map((t) => '<span class="tag tag--' + p.type + '">' + esc(t) + '</span>').join('') + '</p>' +
          (p.type === 'stay' ? '<a class="btn" href="#/book/' + p.id + '">Book now</a>' : '') +
          '<p class="center"><a href="#/review/' + p.id + '">Write a review</a></p>' +
        '</main>' + navBar('explore')
    };
  };

  screens.book = (args) => {
    const p = getPlace(args[0]);
    if (!p || p.type !== 'stay') return screens.notFound();
    return {
      title: 'Book your stay',
      html:
        header('Book your stay', '#/place/' + p.id) +
        '<main>' +
          '<p class="lede">' + esc(p.name) + ' &ndash; ' + esc(getDistrict(p.districtId).name) + '</p>' +
          '<form id="bookform" class="form" novalidate>' +
            '<label for="ci">Check-in date</label><input id="ci" type="date" required>' +
            '<label for="co">Check-out date</label><input id="co" type="date" required>' +
            '<label for="guests">Guests</label><select id="guests">' + [1, 2, 3, 4, 5, 6].map((n) => '<option value="' + n + '"' + (n === 2 ? ' selected' : '') + '>' + n + (n === 1 ? ' guest' : ' guests') + '</option>').join('') + '</select>' +
            '<p id="sum" class="sum" aria-live="polite"></p>' +
            '<p id="err" class="error" role="alert"></p>' +
            '<button class="btn" type="submit">Continue to payment</button>' +
          '</form>' +
        '</main>',
      after: () => {
        const ci = document.getElementById('ci'), co = document.getElementById('co');
        const guests = document.getElementById('guests'), sum = document.getElementById('sum'), err = document.getElementById('err');
        const today = new Date(), tomorrow = new Date(today.getTime() + 86400000), later = new Date(today.getTime() + 4 * 86400000);
        ci.min = isoDate(today);
        const d = state.draft && state.draft.placeId === p.id ? state.draft : null;
        ci.value = d ? d.checkIn : isoDate(tomorrow);
        co.value = d ? d.checkOut : isoDate(later);
        if (d) guests.value = d.guests;
        function update() {
          if (ci.value && co.value && co.value <= ci.value) co.min = ci.value;
          const n = ci.value && co.value ? nightsBetween(ci.value, co.value) : 0;
          sum.textContent = n > 0 ? n + (n === 1 ? ' night x ' : ' nights x ') + money(p.price) + ' = ' + money(n * p.price) : '';
          return n;
        }
        [ci, co, guests].forEach((el) => el.addEventListener('input', update));
        update();
        document.getElementById('bookform').addEventListener('submit', (e) => {
          e.preventDefault();
          const n = update();
          if (n < 1) { err.textContent = 'Check-out must be at least one day after check-in.'; return; }
          state.draft = { placeId: p.id, checkIn: ci.value, checkOut: co.value, guests: Number(guests.value), nights: n, total: n * p.price };
          writeStore();
          location.hash = '#/pay/' + p.id;
        });
      }
    };
  };

  screens.pay = (args) => {
    const p = getPlace(args[0]);
    const d = state.draft;
    if (!p || !d || d.placeId !== p.id) { location.hash = '#/book/' + (p ? p.id : ''); return { title: 'Payment', html: '' }; }
    return {
      title: 'Payment',
      html:
        header('Payment', '#/book/' + p.id) +
        '<main>' +
          '<p class="lede">' + esc(p.name) + ': ' + d.nights + (d.nights === 1 ? ' night' : ' nights') + ', ' + d.guests + (d.guests === 1 ? ' guest' : ' guests') + '</p>' +
          '<form id="payform" class="form" novalidate>' +
            '<fieldset class="choice"><legend>Mobile money</legend>' +
              '<label><input type="radio" name="method" value="mpesa" checked> M-Pesa</label>' +
              '<label><input type="radio" name="method" value="ecocash"> EcoCash</label>' +
            '</fieldset>' +
            '<label for="phone">Mobile money number</label><input id="phone" type="tel" inputmode="tel" autocomplete="off" required>' +
            '<p class="small">Practice payment only. No money moves and this number is not saved.</p>' +
            '<p id="err" class="error" role="alert"></p>' +
            '<button class="btn" type="submit">Pay ' + money(d.total) + '</button>' +
          '</form>' +
        '</main>',
      after: () => {
        document.getElementById('payform').addEventListener('submit', (e) => {
          e.preventDefault();
          if (document.getElementById('phone').value.replace(/\D/g, '').length < 8) {
            document.getElementById('err').textContent = 'Enter your mobile money number.';
            return;
          }
          const booking = {
            id: 'K5-' + (10000 + Math.floor(Math.random() * 90000)),
            placeId: p.id, checkIn: d.checkIn, checkOut: d.checkOut, guests: d.guests,
            nights: d.nights, total: d.total, status: 'confirmed', createdAt: new Date().toISOString()
          };
          state.bookings.unshift(booking);
          state.draft = null;
          writeStore();
          location.hash = '#/confirmed/' + booking.id;
        });
      }
    };
  };

  const findBooking = (id) => state.bookings.find((b) => b.id === id);

  screens.confirmed = (args) => {
    const b = findBooking(args[0]);
    if (!b) return screens.notFound();
    const p = getPlace(b.placeId);
    return {
      title: 'Booking confirmed',
      html:
        '<main class="done">' +
          '<svg viewBox="0 0 64 64" width="96" height="96" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="none" stroke="#34c759" stroke-width="4"/><path d="M18 33l9 9 19-21" fill="none" stroke="#34c759" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<h1>Booking confirmed!</h1>' +
          '<p>' + esc(p.name) + ' &ndash; ' + b.nights + (b.nights === 1 ? ' night' : ' nights') + ', ' + b.guests + (b.guests === 1 ? ' guest' : ' guests') + '</p>' +
          '<a class="btn" href="#/receipt/' + b.id + '">View receipt</a>' +
          '<a class="btn btn--ghost" href="#/home">Back to home</a>' +
        '</main>'
    };
  };

  screens.receipt = (args) => {
    const b = findBooking(args[0]);
    if (!b) return screens.notFound();
    const p = getPlace(b.placeId);
    const row = (k, v) => '<div class="row"><dt>' + k + '</dt><dd>' + v + '</dd></div>';
    return {
      title: 'Receipt',
      html:
        header('Receipt', '#/trips') +
        '<main>' +
          '<section class="receipt">' +
            '<h2>' + esc(p.name) + '</h2>' +
            '<p class="small">Booking ID: ' + esc(b.id) + '</p>' +
            '<dl>' +
              row('Check-in', prettyDate(b.checkIn)) + row('Check-out', prettyDate(b.checkOut)) +
              row('Nights', b.nights) + row('Guests', b.guests) +
              '<div class="row row--total"><dt>Total paid</dt><dd>' + money(b.total) + '</dd></div>' +
            '</dl>' +
            '<p class="small">Blockchain record: not recorded yet (added in Part B).</p>' +
          '</section>' +
          '<button type="button" class="btn btn--ghost no-print" data-print>Download PDF</button>' +
        '</main>' + navBar('trips')
    };
  };

  screens.review = (args) => {
    const p = getPlace(args[0]);
    if (!p) return screens.notFound();
    return {
      title: 'Write a review',
      html:
        header('Write a review', '#/place/' + p.id) +
        '<main>' +
          '<p class="lede">' + esc(p.name) + ' &ndash; ' + esc(getDistrict(p.districtId).name) + '</p>' +
          '<form id="reviewform" class="form" novalidate>' +
            '<fieldset class="stars"><legend>Your rating</legend>' +
              [1, 2, 3, 4, 5].map((n) => '<label><input type="radio" name="rating" value="' + n + '"><span>' + n + '</span></label>').join('') +
            '</fieldset>' +
            '<label for="text">Share your experience with us</label>' +
            '<textarea id="text" rows="5" maxlength="500"></textarea>' +
            '<p id="err" class="error" role="alert"></p>' +
            '<button class="btn" type="submit">Submit review</button>' +
          '</form>' +
        '</main>',
      after: () => {
        document.getElementById('reviewform').addEventListener('submit', (e) => {
          e.preventDefault();
          const chosen = document.querySelector('input[name="rating"]:checked');
          if (!chosen) { document.getElementById('err').textContent = 'Pick a rating from 1 to 5.'; return; }
          state.reviews.push({ placeId: p.id, rating: Number(chosen.value), text: document.getElementById('text').value.trim(), createdAt: new Date().toISOString() });
          writeStore();
          location.hash = '#/thanks/' + p.id;
        });
      }
    };
  };

  screens.thanks = (args) => {
    const p = getPlace(args[0]);
    return {
      title: 'Thank you',
      html:
        '<main class="done"><h1>Thank you!</h1><p>Your review helps other travellers.</p>' +
        '<a class="btn" href="' + (p ? '#/place/' + p.id : '#/home') + '">Back to listing</a></main>'
    };
  };

  screens.saved = () => {
    const list = state.saved.map(getPlace).filter(Boolean);
    return {
      title: 'Saved',
      html:
        header('Saved') +
        '<main>' + (list.length ? list.map(card).join('') : empty('Nothing saved yet', 'Tap the star on a place to keep it here.', '#/home', 'Explore districts')) + '</main>' +
        navBar('saved')
    };
  };

  screens.trips = () => ({
    title: 'Trips',
    html:
      header('Your trips') +
      '<main>' + (state.bookings.length ? state.bookings.map((b) => {
        const p = getPlace(b.placeId);
        return '<article class="card trip"><a class="card__link" href="#/receipt/' + b.id + '"><div class="card__body">' +
          '<h3 class="card__name">' + esc(p.name) + '</h3>' +
          '<p class="card__sub">' + prettyDate(b.checkIn) + ' to ' + prettyDate(b.checkOut) + '</p>' +
          '<p class="card__price">' + money(b.total) + ' &ndash; ' + esc(b.id) + '</p></div></a></article>';
      }).join('') : empty('No trips yet', 'Book a stay and your receipt will appear here.', '#/home', 'Find a stay')) + '</main>' +
      navBar('trips')
  });

  screens.profile = () => ({
    title: 'Profile',
    html:
      '<header class="top top--tall top--center"><div class="avatar" aria-hidden="true">TM</div><h1 class="top__title">' + esc(USER.name) + '</h1><p>' + esc(USER.email) + '</p></header>' +
      '<main>' +
        '<ul class="stats">' +
          '<li><strong>' + state.saved.length + '</strong><span>Saved</span></li>' +
          '<li><strong>' + state.bookings.length + '</strong><span>Trips</span></li>' +
          '<li><strong>' + state.reviews.length + '</strong><span>Reviews</span></li>' +
        '</ul>' +
        '<p class="small">Practice account. Real accounts arrive with the database.</p>' +
        '<a class="btn btn--ghost" href="#/">Log out</a>' +
      '</main>' + navBar('profile')
  });

  screens.notFound = () => ({
    title: 'Coming soon',
    html:
      header('Coming soon!', '#/home') +
      '<main>' + empty('This part is not built yet', 'We are still building this part of KaSetereke.', '#/home', 'Back to safety') + '</main>'
  });

  // ---------- router: read the hash, pick a screen, draw it ----------
  function route(keepScroll) {
    const parts = location.hash.replace(/^#/, '').split('/').filter(Boolean);   // '#/district/maseru' -> ['district','maseru']
    const make = screens[parts[0] || 'splash'] || screens.notFound;
    const screen = make(parts.slice(1));
    document.title = screen.title + ' - KaSetereke';
    app.innerHTML = screen.html;
    if (screen.after) screen.after();
    if (!keepScroll) window.scrollTo(0, 0);
  }

  // One click listener handles every Save star and the print button.
  app.addEventListener('click', (e) => {
    const save = e.target.closest('[data-save]');
    if (save) {
      const id = save.dataset.save;
      state.saved = isSaved(id) ? state.saved.filter((x) => x !== id) : state.saved.concat(id);
      writeStore();
      route(true);
      return;
    }
    if (e.target.closest('[data-print]')) window.print();
  });

  // Offline banner
  const banner = document.getElementById('offline');
  const syncOnline = () => { banner.hidden = navigator.onLine; };
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);
  syncOnline();

  window.addEventListener('hashchange', () => route());
  route();
})();
