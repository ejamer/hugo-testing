(function () {
  'use strict';

  var cal = window.FENB_CAL;
  // Hugo's html/template JS-context escaping serializes the array as a JSON string;
  // parse it back to a real array if needed.
  var events = typeof cal.events === 'string' ? JSON.parse(cal.events) : cal.events;
  var categoryLabels = typeof cal.categoryLabels === 'string' ? JSON.parse(cal.categoryLabels) : cal.categoryLabels;
  // Sort once so byDay day-arrays are always in chronological order
  events.sort(function (a, b) { return a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0; });
  // today at midnight, for future-date checks. Always derived from the visitor's
  // own clock (not a Hugo build-time value) so this stays correct between deploys.
  var today = window.FenbEventDates.todayMidnight();

  var fr = document.documentElement.lang.startsWith('fr');
  var year, month; // current display state (month is 0-indexed)

  function init() {
    var fromHash = parseHash();
    var now = new Date();
    year = fromHash ? fromHash.year : now.getFullYear();
    month = fromHash ? fromHash.month : now.getMonth();

    populateSelectors();
    attachNavListeners();
    attachHashListener();
    render();
  }

  // Editing the URL hash directly (e.g. pasting a new #YYYY-MM and hitting Enter)
  // changes location.hash without a full page load, so init()'s one-time read of it
  // never re-fires. Listen for that case too. history.replaceState() (used by
  // updateHash() below) does not itself trigger 'hashchange', so this can't loop.
  function attachHashListener() {
    window.addEventListener('hashchange', function () {
      var fromHash = parseHash();
      if (!fromHash) return; // malformed/partial edit — leave the current view as-is
      year = fromHash.year;
      month = fromHash.month;
      render();
    });
  }

  // Deep-link format: #YYYY-MM (1-indexed month). Returns {year, month} with
  // month 0-indexed, or null if the hash is absent/malformed.
  function parseHash() {
    var m = location.hash.match(/^#(\d{4})-(\d{2})$/);
    if (!m) return null;
    var mo = parseInt(m[2], 10);
    if (mo < 1 || mo > 12) return null;
    return { year: parseInt(m[1], 10), month: mo - 1 };
  }

  function updateHash() {
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var target = '#' + year + '-' + pad(month + 1);
    if (location.hash !== target) {
      history.replaceState(null, '', target);
    }
  }

  function populateSelectors() {
    var yearSet = {};
    events.forEach(function (e) {
      yearSet[parseInt(e.start_date.substring(0, 4), 10)] = true;
    });
    var years = Object.keys(yearSet).map(Number).sort();

    var monthSel = document.getElementById('cal-month-select');
    var yearSel = document.getElementById('cal-year-select');

    cal.months.forEach(function (name, i) {
      var opt = document.createElement('option');
      opt.value = i;
      opt.textContent = name;
      monthSel.appendChild(opt);
    });

    years.forEach(function (y) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSel.appendChild(opt);
    });

    if (!yearSet[year]) {
      var opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      yearSel.appendChild(opt);
    }

    monthSel.addEventListener('change', function () {
      month = parseInt(this.value, 10);
      render();
    });
    yearSel.addEventListener('change', function () {
      year = parseInt(this.value, 10);
      render();
    });
  }

  function attachNavListeners() {
    document.getElementById('cal-prev').addEventListener('click', function () {
      month--;
      if (month < 0) { month = 11; year--; }
      render();
    });
    document.getElementById('cal-next').addEventListener('click', function () {
      month++;
      if (month > 11) { month = 0; year++; }
      render();
    });
  }

  // Returns [{e, idx}] for events that overlap the current month.
  // Includes multi-day events that start before or end after this month.
  function getMonthEventsWithIndex() {
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var monthFirst = year + '-' + pad(month + 1) + '-01';
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var monthLast  = year + '-' + pad(month + 1) + '-' + pad(daysInMonth);

    var result = [];
    events.forEach(function (e, idx) {
      var effectiveEnd = (e.end_date && e.end_date > e.start_date) ? e.end_date : e.start_date;
      // Overlaps if event starts on/before last day of month AND ends on/after first day
      if (e.start_date <= monthLast && effectiveEnd >= monthFirst) {
        result.push({ e: e, idx: idx });
      }
    });
    return result;
  }

  function syncSelectors() {
    var monthSel = document.getElementById('cal-month-select');
    var yearSel = document.getElementById('cal-year-select');
    monthSel.value = month;
    if (!yearSel.querySelector('option[value="' + year + '"]')) {
      var opt = document.createElement('option');
      opt.value = year;
      opt.textContent = year;
      yearSel.appendChild(opt);
    }
    yearSel.value = year;
  }

  function render() {
    updateHash();
    syncSelectors();
    renderGrid();
    renderEventList();
  }

  function isoDate(dt) {
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate());
  }

  // Click handler for an event shown in the grid. cellY/cellM is the month of the
  // cell it was clicked in. Events from an adjacent month (shown in the padding
  // cells before the 1st / after the last day) switch the calendar to that month
  // first — unless the event also overlaps the displayed month (e.g. Oct 31–Nov 1),
  // in which case its card is already in the list below.
  function goToEvent(item, cellY, cellM) {
    if (cellY !== year || cellM !== month) {
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      var monthFirst = year + '-' + pad(month + 1) + '-01';
      var monthLast  = year + '-' + pad(month + 1) + '-' + pad(new Date(year, month + 1, 0).getDate());
      var e = item.e;
      var effectiveEnd = (e.end_date && e.end_date > e.start_date) ? e.end_date : e.start_date;
      if (!(e.start_date <= monthLast && effectiveEnd >= monthFirst)) {
        year = cellY;
        month = cellM;
        render();
      }
    }
    scrollToEventCard(item.idx);
  }

  function renderGrid() {
    var grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    // Visible range: the Sunday on/before the 1st through the Saturday on/after the
    // last day. Padding days from the adjacent months are drawn as real (dimmed)
    // cells with their own events.
    var firstOfMonth = new Date(year, month, 1);
    var lastOfMonth  = new Date(year, month + 1, 0);
    var gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
    var gridEnd   = new Date(year, month + 1, 0 + (6 - lastOfMonth.getDay()));
    var rangeFirst = isoDate(gridStart);
    var rangeLast  = isoDate(gridEnd);

    // Build 'YYYY-MM-DD' -> [{e, idx}] map, expanding multi-day events across the range
    var byDate = {};
    events.forEach(function (e, idx) {
      var effectiveEnd = (e.end_date && e.end_date > e.start_date) ? e.end_date : e.start_date;
      if (e.start_date > rangeLast || effectiveEnd < rangeFirst) return;
      var startD = new Date(e.start_date + 'T00:00:00');
      var endD   = new Date(effectiveEnd + 'T00:00:00');
      var cur = new Date(Math.max(startD.getTime(), gridStart.getTime()));
      var end = new Date(Math.min(endD.getTime(),   gridEnd.getTime()));
      while (cur <= end) {
        var key = isoDate(cur);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push({ e: e, idx: idx });
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      }
    });

    // Weekday header row
    cal.weekdays.forEach(function (wd) {
      var cell = document.createElement('div');
      cell.className = 'fenb-cal-weekday';
      cell.setAttribute('aria-hidden', 'true');
      cell.innerHTML =
        '<span class="fenb-cal-wd-long">' + wd + '</span>' +
        '<span class="fenb-cal-wd-short">' + wd.charAt(0) + '</span>';
      grid.appendChild(cell);
    });

    var todayKey = isoDate(new Date());

    for (var dt = new Date(gridStart); dt <= gridEnd; dt = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1)) {
      (function (cellDate) {
        var cellY = cellDate.getFullYear();
        var cellM = cellDate.getMonth();
        var key = isoDate(cellDate);
        var outside = cellY !== year || cellM !== month;

        var cell = document.createElement('div');
        cell.className = 'fenb-cal-cell';
        cell.setAttribute('role', 'gridcell');
        if (outside) cell.classList.add('fenb-cal-cell--outside');
        if (key === todayKey) cell.classList.add('fenb-cal-cell--today');

        var numEl = document.createElement('span');
        numEl.className = 'fenb-cal-day-num';
        numEl.textContent = cellDate.getDate();
        cell.appendChild(numEl);

        var dayItems = byDate[key];
        if (dayItems) {
          // hide_card events have no card to scroll to, so they render as plain labels.
          // The cell is only clickable when at least one event on it has a card.
          var cardItems = dayItems.filter(function (it) { return !it.e.hide_card; });
          if (cardItems.length) cell.classList.add('fenb-cal-cell--has-events');

          var bars = document.createElement('div');
          bars.className = 'fenb-cal-bars';

          var dots = document.createElement('div');
          dots.className = 'fenb-cal-dots';

          // On padding cells, tell screen readers which month the event is in —
          // activating it switches the calendar there.
          var labelSuffix = outside ? ' (' + cal.months[cellM] + ' ' + cellY + ')' : '';

          dayItems.forEach(function (it) {
            var hasCard = !it.e.hide_card;
            var activate = function (ev) {
              if (ev.type === 'keydown') {
                if (ev.key !== 'Enter' && ev.key !== ' ') return;
                ev.preventDefault();
              }
              ev.stopPropagation();
              goToEvent(it, cellY, cellM);
            };

            var bar = document.createElement('div');
            bar.className = 'fenb-cal-bar fenb-cal-bar--' + it.e.category;
            bar.textContent = evTitle(it.e);
            bar.title = evTitle(it.e) + labelSuffix;

            var dot = document.createElement('span');
            dot.className = 'fenb-cal-dot fenb-cal-dot--' + it.e.category;
            dot.title = evTitle(it.e);

            if (hasCard) {
              bar.setAttribute('role', 'button');
              bar.setAttribute('tabindex', '0');
              if (outside) bar.setAttribute('aria-label', evTitle(it.e) + labelSuffix);
              bar.addEventListener('click', activate);
              bar.addEventListener('keydown', activate);

              dot.setAttribute('role', 'button');
              dot.setAttribute('tabindex', '0');
              dot.setAttribute('aria-label', evTitle(it.e) + labelSuffix);
              dot.addEventListener('click', activate);
              dot.addEventListener('keydown', activate);
            } else {
              bar.classList.add('fenb-cal-bar--no-card');
              dot.classList.add('fenb-cal-bar--no-card');
              dot.setAttribute('role', 'img');
              dot.setAttribute('aria-label', evTitle(it.e));
            }
            bars.appendChild(bar);
            dots.appendChild(dot);
          });

          // Cell-level gap-click: goes to the chronologically first event with a card.
          // Bar/dot clicks stopPropagation so they take priority on their own tap target.
          if (cardItems.length) {
            cell.addEventListener('click', function () {
              goToEvent(cardItems[0], cellY, cellM);
            });
          }

          cell.appendChild(bars);
          cell.appendChild(dots);
        }

        grid.appendChild(cell);
      }(dt));
    }
  }

  function scrollToEventCard(idx) {
    var target = document.getElementById('fenb-cal-event-' + idx);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('fenb-cal-card--highlight');
      setTimeout(function () {
        target.classList.remove('fenb-cal-card--highlight');
      }, 1500);
    }
  }

  function evTitle(e) {
    return (fr && e.title_fr) ? e.title_fr : e.title;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatEventDate(e) {
    var sD   = new Date(e.start_date + 'T00:00:00');
    var eD   = (e.end_date && e.end_date > e.start_date) ? new Date(e.end_date + 'T00:00:00') : sD;
    var isRange   = sD.toDateString() !== eD.toDateString();
    var sameMonth = sD.getMonth() === eD.getMonth() && sD.getFullYear() === eD.getFullYear();
    var sMon = cal.monthsShort[sD.getMonth()];
    var eMon = cal.monthsShort[eD.getMonth()];
    var sDay = sD.getDate();
    var eDay = eD.getDate();
    var yr   = sD.getFullYear();
    if (!isRange) {
      return fr ? (sDay + ' ' + sMon + ' ' + yr) : (sMon + ' ' + sDay + ', ' + yr);
    }
    if (sameMonth) {
      return fr ? (sDay + '–' + eDay + ' ' + sMon + ' ' + yr)
                : (sMon + ' ' + sDay + '–' + eDay + ', ' + yr);
    }
    return fr ? (sDay + ' ' + sMon + ' – ' + eDay + ' ' + eMon + ' ' + yr)
              : (sMon + ' ' + sDay + ' – ' + eMon + ' ' + eDay + ', ' + yr);
  }

  function renderEventList() {
    var listEl = document.getElementById('cal-events');
    listEl.innerHTML = '';

    // hide_card events (e.g. private board meetings) show on the grid only — no card.
    var items = getMonthEventsWithIndex().filter(function (item) { return !item.e.hide_card; });

    if (items.length === 0) {
      var msg = document.createElement('p');
      msg.className = 'fenb-cal-no-events';
      msg.textContent = cal.noEvents;
      listEl.appendChild(msg);
      return;
    }

    var evGrid = document.createElement('div');
    evGrid.className = 'fenb-events-grid';

    items.forEach(function (item) {
      var e   = item.e;
      var idx = item.idx;
      var d   = new Date(e.start_date + 'T00:00:00');

      var eventDate = new Date(e.start_date + 'T00:00:00');
      var linksHtml = '';
      var detailsUrl = (fr && e.details_url_fr) ? e.details_url_fr : e.details_url_en;
      if (detailsUrl) {
        linksHtml += '<a href="' + esc(detailsUrl) + '" class="fenb-event-details-link" target="_blank" rel="noopener noreferrer">' + esc(cal.detailsLabel) + ' →</a>';
      }
      var registerUrl = (fr && e.registration_url_fr) ? e.registration_url_fr : e.registration_url_en;
      if (registerUrl && eventDate >= today) {
        linksHtml += '<a href="' + esc(registerUrl) + '" class="fenb-event-register-link" target="_blank" rel="noopener noreferrer">' + esc(cal.registerLabel) + ' →</a>';
      }
      var resultsUrl = (fr && e.results_url_fr) ? e.results_url_fr : e.results_url_en;
      if (resultsUrl) {
        linksHtml += '<a href="' + esc(resultsUrl) + '" class="fenb-event-results-link" target="_blank" rel="noopener noreferrer">' + esc(cal.resultsLabel) + ' →</a>';
      }
      // Add to Calendar — icon pinned bottom-right of the card that opens the shared
      // calendar dialog (js/calendar-dialog.js). Mirrors the "icon" style of
      // partials/ics/add-button.html — keep the markup in sync. ics_url / google_url are
      // built by Hugo; hidden once the event has ended.
      var icsHtml = '';
      var endDate = new Date((e.end_date || e.start_date) + 'T00:00:00');
      if (e.ics_url && endDate >= today) {
        icsHtml =
          '<button type="button" class="fenb-event-ics-btn" data-cal-dialog="event"' +
            ' data-cal-title="' + esc(evTitle(e)) + '"' +
            ' data-cal-meta="' + esc(formatEventDate(e) + ' · ' + e.location) + '"' +
            ' data-cal-ics="' + esc(e.ics_url) + '" data-cal-google="' + esc(e.google_url) + '"' +
            ' aria-label="' + esc(cal.icsLabel) + '" data-tooltip="' + esc(cal.icsLabel) + '">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line>' +
              '<line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' +
              '<line x1="12" y1="13" x2="12" y2="19"></line><line x1="9" y1="16" x2="15" y2="16"></line>' +
            '</svg>' +
          '</button>';
      }

      var article = document.createElement('article');
      article.className = 'fenb-event-card fenb-event-card--' + e.category;
      article.id = 'fenb-cal-event-' + idx;
      article.innerHTML =
        '<div class="fenb-event-date-badge">' +
          '<span class="fenb-event-day">' + d.getDate() + '</span>' +
          '<span class="fenb-event-month">' + esc(cal.monthsShort[d.getMonth()]) + '</span>' +
          '<span class="fenb-event-year">' + d.getFullYear() + '</span>' +
        '</div>' +
        '<div class="fenb-event-body">' +
          '<span class="fenb-tag fenb-tag--' + e.category + '">' + esc(categoryLabels[e.category] || e.category) + '</span>' +
          '<h3 class="fenb-event-title">' + esc(evTitle(e)) + '</h3>' +
          '<p class="fenb-event-date-range">' + esc(formatEventDate(e)) + '</p>' +
          '<p class="fenb-event-meta">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>' +
              '<circle cx="12" cy="10" r="3"></circle>' +
            '</svg>' +
            esc(e.location) +
          '</p>' +
          linksHtml +
        '</div>' +
        icsHtml;

      evGrid.appendChild(article);
    });

    listEl.appendChild(evGrid);
  }

  init();
}());
