(function () {
  'use strict';

  var input = document.getElementById('searchInput');
  var resultsBox = document.getElementById('searchResults');
  var wrap = document.getElementById('searchWrap');
  if (!input || !resultsBox || !wrap || typeof Fuse === 'undefined') return;

  var fuse = null;
  var debounceTimer = null;
  var activeIndex = -1;
  var currentResults = [];

  fetch('/index.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      fuse = new Fuse(data, {
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: 'title', weight: 0.45 },
          { name: 'tags', weight: 0.2 },
          { name: 'ingredients', weight: 0.25 },
          { name: 'description', weight: 0.1 }
        ]
      });
      input.disabled = false;
      input.placeholder = 'Rezepte, Zutaten, Tags …';
    })
    .catch(function () {
      input.placeholder = 'Suche momentan nicht verfügbar';
      input.disabled = true;
    });

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function render(results) {
    currentResults = results;
    activeIndex = -1;

    if (!results.length) {
      resultsBox.innerHTML = '<div class="search-empty">Keine Treffer.</div>';
      resultsBox.hidden = false;
      return;
    }

    var html = results.slice(0, 8).map(function (r, i) {
      var item = r.item;
      var snippet = item.description || item.ingredients || '';
      if (snippet.length > 90) snippet = snippet.slice(0, 90) + '…';
      return (
        '<a class="search-result" href="' + item.url + '" data-index="' + i + '">' +
          '<span class="search-result-title">' + escapeHtml(item.title) + '</span>' +
          '<span class="search-result-section">' + escapeHtml(item.section) + '</span>' +
          (snippet ? '<span class="search-result-snippet">' + escapeHtml(snippet) + '</span>' : '') +
        '</a>'
      );
    }).join('');

    resultsBox.innerHTML = html;
    resultsBox.hidden = false;
  }

  function search(query) {
    if (!fuse || query.trim().length < 2) {
      resultsBox.hidden = true;
      resultsBox.innerHTML = '';
      return;
    }
    render(fuse.search(query, { limit: 8 }));
  }

  input.addEventListener('input', function () {
    var value = input.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () { search(value); }, 120);
  });

  input.addEventListener('focus', function () {
    if (input.value.trim().length >= 2 && resultsBox.innerHTML) {
      resultsBox.hidden = false;
    }
  });

  input.addEventListener('keydown', function (e) {
    var links = resultsBox.querySelectorAll('.search-result');
    if (!links.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, links.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && links[activeIndex]) {
        e.preventDefault();
        window.location.href = links[activeIndex].href;
      }
      return;
    } else if (e.key === 'Escape') {
      resultsBox.hidden = true;
      input.blur();
      return;
    } else {
      return;
    }

    links.forEach(function (l, i) { l.classList.toggle('is-active', i === activeIndex); });
    links[activeIndex].scrollIntoView({ block: 'nearest' });
  });

  document.addEventListener('click', function (e) {
    if (!wrap.contains(e.target)) {
      resultsBox.hidden = true;
    }
  });
})();
