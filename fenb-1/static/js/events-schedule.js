(function () {
  // Register links are only rendered server-side while the event hasn't started as
  // of the last build (see layouts/events/schedule.html); that can go stale on a
  // static site that only rebuilds on release, so re-check against the visitor's
  // own clock and hide any that have since passed.
  if (window.FenbEventDates) {
    document.querySelectorAll('.fenb-event-register-link[data-event-date]').forEach(function (link) {
      link.hidden = !window.FenbEventDates.isUpcoming(link.dataset.eventDate);
    });
  }
})();

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

  // Deep-link format: #YYYY-YYYY (e.g. /events/schedule/#2025-2026) — mirrors the
  // calendar view's #YYYY-MM (static/js/events-calendar.js). Season labels in the data
  // use an en dash ("2025–2026"); the hash uses a plain hyphen so it's easy to type and
  // share, and either form is accepted. Unknown/malformed hashes are ignored, leaving
  // the server-selected current season.
  function seasonFromHash() {
    var hash = location.hash;
    try { hash = decodeURIComponent(hash); } catch (e) { /* malformed escape — match as-is */ }
    var m = hash.match(/^#(\d{4})[-–](\d{4})$/);
    if (!m) return null;
    var label = m[1] + '–' + m[2];
    for (var i = 0; i < seasonSelect.options.length; i++) {
      if (seasonSelect.options[i].value === label) return label;
    }
    return null;
  }

  function updateHash() {
    var target = '#' + seasonSelect.value.replace('–', '-');
    if (location.hash !== target) {
      history.replaceState(null, '', target);
    }
  }

  var initial = seasonFromHash();
  if (initial) seasonSelect.value = initial;

  seasonSelect.addEventListener('change', function () {
    updateHash();
    applyFilters();
  });

  // Editing the hash in the address bar doesn't reload the page; follow it.
  // replaceState() in updateHash() doesn't fire 'hashchange', so this can't loop.
  window.addEventListener('hashchange', function () {
    var fromHash = seasonFromHash();
    if (!fromHash) return;
    seasonSelect.value = fromHash;
    applyFilters();
  });

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
