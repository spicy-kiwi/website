(function () {
  'use strict';

  var bar = document.getElementById('tagFilterBar');
  var grid = document.getElementById('recipeGrid');
  if (!bar || !grid) return;

  var chips = Array.prototype.slice.call(bar.querySelectorAll('.tag-filter-chips .tag-chip'));
  var items = Array.prototype.slice.call(grid.querySelectorAll('.recipe-filter-item'));
  var countEl = document.getElementById('tagFilterCount');
  var clearBtn = document.getElementById('tagFilterClear');
  var emptyMsg = document.getElementById('tagFilterEmpty');
  var favoriteToggle = document.getElementById('favoriteFilterToggle');
  var totalCount = items.length;

  var active = new Set();
  var favoritesOnly = false;

  function tagsOf(item) {
    var raw = item.getAttribute('data-tags') || '';
    return raw ? raw.split('|') : [];
  }

  function isFavorite(item) {
    var rid = item.getAttribute('data-recipe');
    if (!rid) return false;
    try {
      return window.localStorage.getItem(rid) === 'true';
    } catch (e) {
      return false;
    }
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

  function apply() {
    var visible = 0;
    items.forEach(function (item) {
      var itemTags = tagsOf(item);
      var tagsMatch = active.size === 0 || Array.from(active).every(function (t) { return itemTags.indexOf(t) !== -1; });
      var favMatch = !favoritesOnly || isFavorite(item);
      var matches = tagsMatch && favMatch;
      item.classList.toggle('is-hidden-by-filter', !matches);
      if (matches) visible++;
    });

    chips.forEach(function (chip) {
      chip.classList.toggle('is-active', active.has(chip.getAttribute('data-tag')));
    });

    if (favoriteToggle) {
      favoriteToggle.classList.toggle('is-active', favoritesOnly);
      favoriteToggle.setAttribute('aria-pressed', String(favoritesOnly));
    }

    countEl.textContent = (active.size || favoritesOnly)
      ? visible + ' von ' + totalCount + ' Rezepten'
      : totalCount + ' Rezepte';
    clearBtn.hidden = active.size === 0 && !favoritesOnly;
    emptyMsg.hidden = visible !== 0;
    grid.hidden = visible === 0;
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

  // Re-evaluate the "Nur Favoriten"-Filter, wenn im Grid ein Herz
  // umgeschaltet wird (Klick-Handler aus main.js schreibt synchron in
  // localStorage; wir werten im nächsten Tick neu aus, unabhängig von der
  // Registrierungsreihenfolge der Listener).
  grid.addEventListener('click', function (event) {
    if (event.target.closest('.btnFavourite')) {
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
