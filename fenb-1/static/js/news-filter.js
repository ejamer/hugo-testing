(function () {
  var seasonSelect = document.getElementById('news-season-select');
  var filterBtns   = document.querySelectorAll('.fenb-news-filter-btn');
  var metaBtns     = document.querySelectorAll('.fenb-news-filter-meta');
  var noResults    = document.querySelector('.fenb-news-no-results');

  if (!seasonSelect) return;

  function activeCategories() {
    var out = [];
    filterBtns.forEach(function (b) {
      if (b.classList.contains('is-active')) out.push(b.dataset.category);
    });
    return out;
  }

  function applyFilters() {
    var season  = seasonSelect.value;
    var active  = activeCategories();
    var visible = 0;

    document.querySelectorAll('.fenb-news-card').forEach(function (card) {
      // No category selected means no filtering by category — show everything.
      var catMatch    = active.length === 0 || active.indexOf(card.dataset.category) !== -1;
      var seasonMatch = season === 'all' || card.dataset.season === season;
      var show = catMatch && seasonMatch;
      card.hidden = !show;
      if (show) visible++;
    });

    if (noResults) noResults.hidden = visible > 0;
  }

  seasonSelect.addEventListener('change', applyFilters);

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      btn.classList.toggle('is-active');
      applyFilters();
    });
  });

  metaBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      applyFilters();
    });
  });
})();
