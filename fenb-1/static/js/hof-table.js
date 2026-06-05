(function () {
  'use strict';

  var table = document.querySelector('.fenb-hof-table');
  if (!table) return;

  var tbody = table.querySelector('tbody');
  var rows = Array.from(tbody.querySelectorAll('tr.fenb-hof-row'));

  // ── Alternating row colours ──────────────────────────────
  // Managed in JS so stripes stay correct after filtering/sorting.
  function applyAltRows() {
    var idx = 0;
    rows.forEach(function (row) {
      if (!row.hidden) {
        row.classList.toggle('fenb-hof-row--alt', idx % 2 === 1);
        idx++;
      } else {
        row.classList.remove('fenb-hof-row--alt');
      }
    });
  }

  // ── Sort ─────────────────────────────────────────────────
  var sortState = { col: 'year', dir: 'desc' };

  function sortRows() {
    var sorted = rows.slice().sort(function (a, b) {
      var av, bv;
      if (sortState.col === 'year') {
        av = parseInt(a.dataset.year, 10);
        bv = parseInt(b.dataset.year, 10);
      } else {
        av = a.dataset.name;
        bv = b.dataset.name;
      }
      if (av < bv) return sortState.dir === 'asc' ? -1 : 1;
      if (av > bv) return sortState.dir === 'asc' ? 1 : -1;
      return 0;
    });
    sorted.forEach(function (row) { tbody.appendChild(row); });
    rows = sorted;
    updateSortUI();
    applyAltRows();
  }

  function updateSortUI() {
    table.querySelectorAll('.fenb-hof-th-sort').forEach(function (th) {
      th.setAttribute('aria-sort',
        th.dataset.col === sortState.col
          ? (sortState.dir === 'asc' ? 'ascending' : 'descending')
          : 'none');
    });
  }

  table.querySelectorAll('.fenb-hof-th-sort').forEach(function (th) {
    function activate() {
      var col = th.dataset.col;
      if (sortState.col === col) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.col = col;
        sortState.dir = col === 'year' ? 'desc' : 'asc';
      }
      sortRows();
    }
    th.addEventListener('click', activate);
    th.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });

  // ── Filter ────────────────────────────────────────────────
  var filterTh  = document.getElementById('fenb-hof-cat-th');
  var dropdown  = document.getElementById('fenb-hof-cat-dropdown');
  var badge     = document.getElementById('fenb-hof-filter-badge');
  var clearBtn  = document.getElementById('fenb-hof-clear-btn');
  var checkboxes = dropdown
    ? Array.from(dropdown.querySelectorAll('.fenb-hof-cat-cb'))
    : [];

  function getActive() {
    return checkboxes
      .filter(function (cb) { return cb.checked; })
      .map(function (cb) { return cb.value; });
  }

  function applyFilter() {
    var active = getActive();
    rows.forEach(function (row) {
      if (active.length === 0) {
        row.hidden = false;
      } else {
        var cats = (row.dataset.categories || '').split(' ');
        row.hidden = !active.some(function (a) { return cats.indexOf(a) !== -1; });
      }
    });
    if (badge) {
      if (active.length > 0) {
        badge.textContent = active.length;
        badge.removeAttribute('hidden');
      } else {
        badge.textContent = '';
        badge.setAttribute('hidden', '');
      }
    }
    applyAltRows();
  }

  function positionDropdown() {
    if (!filterTh || !dropdown) return;
    var rect = filterTh.getBoundingClientRect();
    dropdown.style.top  = (rect.bottom + window.scrollY + 4) + 'px';
    // right-align to the th's right edge
    dropdown.style.left = (rect.right + window.scrollX - dropdown.offsetWidth) + 'px';
  }

  function openDropdown() {
    if (!dropdown) return;
    // briefly make visible but off-screen to measure width, then position
    dropdown.style.visibility = 'hidden';
    dropdown.removeAttribute('hidden');
    positionDropdown();
    dropdown.style.visibility = '';
    filterTh && filterTh.setAttribute('aria-expanded', 'true');
    var first = dropdown.querySelector('.fenb-hof-cat-cb');
    if (first) first.focus();
  }

  function closeDropdown() {
    if (!dropdown) return;
    dropdown.setAttribute('hidden', '');
    filterTh && filterTh.setAttribute('aria-expanded', 'false');
  }

  if (filterTh && dropdown) {
    function toggleDropdown() {
      dropdown.hasAttribute('hidden') ? openDropdown() : closeDropdown();
    }

    filterTh.addEventListener('click', toggleDropdown);
    filterTh.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDropdown(); }
      if (e.key === 'Escape') { closeDropdown(); filterTh.focus(); }
    });

    // Trap Escape from inside the dropdown
    dropdown.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeDropdown(); filterTh.focus(); }
    });

    checkboxes.forEach(function (cb) {
      cb.addEventListener('change', applyFilter);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        checkboxes.forEach(function (cb) { cb.checked = false; });
        applyFilter();
        closeDropdown();
        filterTh.focus();
      });
    }

    document.addEventListener('click', function (e) {
      if (!dropdown.hasAttribute('hidden') &&
          !dropdown.contains(e.target) &&
          !filterTh.contains(e.target)) {
        closeDropdown();
      }
    });

    window.addEventListener('resize', function () {
      if (!dropdown.hasAttribute('hidden')) positionDropdown();
    });

    window.addEventListener('scroll', function () {
      if (!dropdown.hasAttribute('hidden')) positionDropdown();
    }, { passive: true });
  }

  // ── Initial state ─────────────────────────────────────────
  sortRows(); // confirms year-desc + sets aria-sort + stripes
})();
