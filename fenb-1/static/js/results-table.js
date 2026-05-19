(function () {
  'use strict';

  var lang = document.documentElement.lang || 'en';
  var labels = {
    show: lang === 'fr' ? 'Afficher les positions' : 'Show placements',
    hide: lang === 'fr' ? 'Masquer les positions' : 'Hide placements',
  };

  function parsePlaceNum(text) {
    if (!text || text === '—') return Infinity;
    return parseInt(text.replace('T', ''), 10) || Infinity;
  }

  function sortTableByCol(tbody, colIndex, ascending) {
    var rows = Array.from(tbody.querySelectorAll('tr'));
    rows.sort(function (a, b) {
      var aCells = a.children;
      var bCells = b.children;
      var aText = aCells[colIndex] ? aCells[colIndex].textContent.trim() : '';
      var bText = bCells[colIndex] ? bCells[colIndex].textContent.trim() : '';
      // Numeric sort for Place column (detected by presence of Infinity sentinel)
      var aNum = parsePlaceNum(aText);
      var bNum = parsePlaceNum(bText);
      if (aNum !== Infinity || bNum !== Infinity) {
        return ascending ? aNum - bNum : bNum - aNum;
      }
      return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
    });
    rows.forEach(function (row) { tbody.appendChild(row); });
  }

  function enhanceTable(table, placeColIndex) {
    table.classList.add('fenb-results-table');

    // Default sort: ascending by Place (so best results appear first)
    var tbody = table.querySelector('tbody');
    if (tbody) {
      sortTableByCol(tbody, placeColIndex, true);
    }

    // Hide Place column cells
    table.querySelectorAll('tr').forEach(function (row) {
      var cell = row.children[placeColIndex];
      if (cell) {
        cell.dataset.placeCell = '1';
        cell.hidden = true;
      }
    });

    // Toggle button
    var btn = document.createElement('button');
    btn.className = 'fenb-results-toggle';
    btn.textContent = labels.show;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () {
      var isShown = btn.getAttribute('aria-pressed') === 'true';
      table.querySelectorAll('[data-place-cell]').forEach(function (cell) {
        cell.hidden = isShown;
      });
      btn.setAttribute('aria-pressed', isShown ? 'false' : 'true');
      btn.textContent = isShown ? labels.show : labels.hide;
    });
    table.parentNode.insertBefore(btn, table);

    // Sortable headers
    var headers = table.querySelectorAll('thead th');
    var sortState = Array(headers.length).fill(null); // null=unsorted, true=asc, false=desc

    headers.forEach(function (th, colIdx) {
      th.classList.add('fenb-sortable-th');
      th.setAttribute('aria-sort', 'none');
      th.setAttribute('tabindex', '0');

      function doSort() {
        var nextAsc = sortState[colIdx] !== true;
        sortState[colIdx] = nextAsc;
        // For Place col, must reveal cells temporarily to sort correctly
        sortTableByCol(tbody, colIdx, nextAsc);
        headers.forEach(function (h, i) {
          h.setAttribute('aria-sort', i === colIdx ? (nextAsc ? 'ascending' : 'descending') : 'none');
          sortState[i] = i === colIdx ? nextAsc : null;
        });
      }

      th.addEventListener('click', doSort);
      th.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(); }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var body = document.querySelector('.fenb-article-body');
    if (!body) return;

    body.querySelectorAll('table').forEach(function (table) {
      var headers = table.querySelectorAll('thead th');
      if (!headers.length) return;
      // Place column is always last
      var placeColIndex = headers.length - 1;
      enhanceTable(table, placeColIndex);
    });
  });
})();
