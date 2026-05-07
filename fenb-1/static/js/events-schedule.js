(function () {
  var seasonSelect = document.getElementById('schedule-season-select');
  var filterBtns   = document.querySelectorAll('.fenb-schedule-filter-btn');
  var metaBtns     = document.querySelectorAll('.fenb-schedule-filter-meta');

  if (!seasonSelect) return;

  function activeCategories() {
    var out = [];
    filterBtns.forEach(function (b) {
      if (b.classList.contains('is-active')) out.push(b.dataset.category);
    });
    return out;
  }

  function applyFilters() {
    var season = seasonSelect.value;
    var active = activeCategories();

    document.querySelectorAll('.fenb-schedule-season-block').forEach(function (block) {
      var isThisSeason = block.dataset.season === season;
      block.hidden = !isThisSeason;
      if (!isThisSeason) return;

      block.querySelectorAll('.fenb-schedule-month').forEach(function (month) {
        var visible = 0;
        month.querySelectorAll('.fenb-schedule-item').forEach(function (item) {
          var show = active.indexOf(item.dataset.category) !== -1;
          item.hidden = !show;
          if (show) visible++;
        });
        month.hidden = visible === 0;
      });
    });
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
      var all = btn.dataset.action === 'all';
      filterBtns.forEach(function (b) { b.classList.toggle('is-active', all); });
      applyFilters();
    });
  });

  applyFilters();
})();
