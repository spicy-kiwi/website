(function () {
  'use strict';

  // Tag-Filter auf /rezepte/.
  // Ohne Filter zeigt die Seite die normale Seitennummerierung (9 Rezepte pro Seite).
  // Sobald ein Tag oder "Nur Favoriten" aktiv ist, werden einmal alle Karten aus
  // /rezepte/karten.html nachgeladen und alle Treffer angezeigt, die Seitennummerierung
  // wird dann ausgeblendet.

  var bar = document.getElementById('tagFilterBar');
  var grid = document.getElementById('recipeGrid');
  if (!bar || !grid) return;

  var chips = Array.prototype.slice.call(bar.querySelectorAll('.tag-filter-chips .tag-chip'));
  var pageItems = Array.prototype.slice.call(grid.querySelectorAll('.recipe-filter-item'));
  var countEl = document.getElementById('tagFilterCount');
  var clearBtn = document.getElementById('tagFilterClear');
  var emptyMsg = document.getElementById('tagFilterEmpty');
  var favoriteToggle = document.getElementById('favoriteFilterToggle');
  var pager = document.getElementById('recipePager');
  var totalCount = parseInt(bar.getAttribute('data-total'), 10) || pageItems.length;
  var cardsUrl = bar.getAttribute('data-cards');

  var active = new Set();
  var favoritesOnly = false;
  var allItems = null;   // alle Karten, sobald geladen
  var loading = null;
  var showingPage = true;

  function tagsOf(item) {
    var raw = item.getAttribute('data-tags') || '';
    return raw ? raw.split('|') : [];
  }

  function readFavorite(rid) {
    if (!rid) return false;
    try {
      return window.localStorage.getItem(rid) === 'true';
    } catch (e) {
      return false;
    }
  }

  function isFavorite(item) {
    return readFavorite(item.getAttribute('data-recipe'));
  }

  // Herzen in neu eingefügten Karten auf den gespeicherten Stand bringen
  function refreshHearts(root) {
    root.querySelectorAll('.btnFavourite').forEach(function (btn) {
      var fav = readFavorite(btn.getAttribute('data-rid'));
      btn.textContent = fav ? '❤️' : '🖤';
      btn.setAttribute('aria-pressed', String(fav));
    });
  }

  function loadAll() {
    if (allItems) return Promise.resolve(allItems);
    if (loading) return loading;
    if (!cardsUrl) {
      allItems = pageItems;
      return Promise.resolve(allItems);
    }
    loading = fetch(cardsUrl)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        allItems = Array.prototype.slice.call(doc.querySelectorAll('#allRecipes .recipe-filter-item'));
        return allItems;
      })
      .catch(function () {
        // Ohne Nachladen wenigstens die aktuelle Seite filtern
        allItems = pageItems;
        return allItems;
      });
    return loading;
  }

  function syncUrl() {
    var params = new URLSearchParams(window.location.search);
    if (active.size) {
      params.set('tags', Array.from(active).join(','));
    } else {
      params.delete('tags');
    }
    if (favoritesOnly) {
      params.set('favorites', '1');
    } else {
      params.delete('favorites');
    }
    var query = params.toString();
    var newUrl = window.location.pathname + (query ? '?' + query : '') + window.location.hash;
    window.history.replaceState(null, '', newUrl);
  }

  function replaceGrid(items) {
    var frag = document.createDocumentFragment();
    items.forEach(function (item) { frag.appendChild(item); });
    grid.innerHTML = '';
    grid.appendChild(frag);
    refreshHearts(grid);
  }

  function updateControls() {
    chips.forEach(function (chip) {
      chip.classList.toggle('is-active', active.has(chip.getAttribute('data-tag')));
    });
    if (favoriteToggle) {
      favoriteToggle.classList.toggle('is-active', favoritesOnly);
      favoriteToggle.setAttribute('aria-pressed', String(favoritesOnly));
    }
    clearBtn.hidden = active.size === 0 && !favoritesOnly;
  }

  function apply() {
    updateControls();
    var filtering = active.size > 0 || favoritesOnly;

    if (!filtering) {
      if (!showingPage) {
        replaceGrid(pageItems);
        showingPage = true;
      }
      if (pager) pager.hidden = false;
      countEl.textContent = totalCount + ' Rezepte';
      emptyMsg.hidden = true;
      grid.hidden = false;
      return;
    }

    if (pager) pager.hidden = true;
    if (!allItems) countEl.textContent = 'Lade Rezepte …';

    loadAll().then(function (items) {
      // Inzwischen alles abgewählt? Dann nichts mehr tun.
      if (active.size === 0 && !favoritesOnly) return;
      var matches = items.filter(function (item) {
        var itemTags = tagsOf(item);
        var tagsMatch = Array.from(active).every(function (t) { return itemTags.indexOf(t) !== -1; });
        return tagsMatch && (!favoritesOnly || isFavorite(item));
      });
      replaceGrid(matches.map(function (item) { return document.importNode(item, true); }));
      showingPage = false;
      countEl.textContent = matches.length + ' von ' + totalCount + ' Rezepten';
      emptyMsg.hidden = matches.length !== 0;
      grid.hidden = matches.length === 0;
    });
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var tag = chip.getAttribute('data-tag');
      if (active.has(tag)) {
        active.delete(tag);
      } else {
        active.add(tag);
      }
      apply();
      syncUrl();
    });
  });

  if (favoriteToggle) {
    favoriteToggle.addEventListener('click', function () {
      favoritesOnly = !favoritesOnly;
      apply();
      syncUrl();
    });
  }

  clearBtn.addEventListener('click', function () {
    active.clear();
    favoritesOnly = false;
    apply();
    syncUrl();
  });

  // "Nur Favoriten" neu auswerten, wenn im Grid ein Herz umgeschaltet wird
  // (main.js schreibt synchron in localStorage; wir werten im nächsten Tick aus).
  grid.addEventListener('click', function (event) {
    if (event.target.closest('.btnFavourite') && favoritesOnly) {
      setTimeout(apply, 0);
    }
  });

  var initialParams = new URLSearchParams(window.location.search);
  var initialTags = initialParams.get('tags');
  if (initialTags) {
    initialTags.split(',').forEach(function (t) {
      if (chips.some(function (c) { return c.getAttribute('data-tag') === t; })) {
        active.add(t);
      }
    });
  }
  favoritesOnly = initialParams.get('favorites') === '1';
  apply();
})();
