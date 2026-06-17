(function () {
  'use strict';

  var cal = window.FENB_CAL;
  // Hugo's html/template JS-context escaping serializes the array as a JSON string;
  // parse it back to a real array if needed.
  var events = typeof cal.events === 'string' ? JSON.parse(cal.events) : cal.events;
  var categoryLabels = typeof cal.categoryLabels === 'string' ? JSON.parse(cal.categoryLabels) : cal.categoryLabels;
  // Sort once so byDay day-arrays are always in chronological order
  events.sort(function (a, b) { return a.start_date < b.start_date ? -1 : a.start_date > b.start_date ? 1 : 0; });
  // today at midnight, for future-date checks
  var today = cal.today ? new Date(cal.today + 'T00:00:00') : (function () { var d = new Date(); d.setHours(0,0,0,0); return d; }());

  var fr = document.documentElement.lang.startsWith('fr');
  var year, month; // current display state (month is 0-indexed)

  function init() {
    var now = new Date();
    year = now.getFullYear();
    month = now.getMonth();

    populateSelectors();
    attachNavListeners();
    render();
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
    syncSelectors();
    renderGrid();
    renderEventList();
  }

  function renderGrid() {
    var grid = document.getElementById('cal-grid');
    grid.innerHTML = '';

    var firstOfMonth = new Date(year, month, 1);
    var lastOfMonth  = new Date(year, month + 1, 0);

    // Build day -> [{e, idx}] map, expanding multi-day events across the month
    var byDay = {};
    getMonthEventsWithIndex().forEach(function (item) {
      var startD = new Date(item.e.start_date + 'T00:00:00');
      var endD   = (item.e.end_date && item.e.end_date > item.e.start_date)
                   ? new Date(item.e.end_date + 'T00:00:00')
                   : startD;

      // Clamp to current month
      var cur = new Date(Math.max(startD.getTime(), firstOfMonth.getTime()));
      var end = new Date(Math.min(endD.getTime(),   lastOfMonth.getTime()));

      while (cur <= end) {
        var d = cur.getDate();
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(item);
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

    var firstDow    = new Date(year, month, 1).getDay(); // 0 = Sunday
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today  = new Date();
    var todayY = today.getFullYear();
    var todayM = today.getMonth();
    var todayD = today.getDate();

    // Empty padding cells before first day
    for (var i = 0; i < firstDow; i++) {
      var empty = document.createElement('div');
      empty.className = 'fenb-cal-cell fenb-cal-cell--empty';
      empty.setAttribute('aria-hidden', 'true');
      grid.appendChild(empty);
    }

    // Day cells
    for (var d = 1; d <= daysInMonth; d++) {
      (function (day) {
        var cell = document.createElement('div');
        cell.className = 'fenb-cal-cell';
        cell.setAttribute('role', 'gridcell');

        if (todayY === year && todayM === month && todayD === day) {
          cell.classList.add('fenb-cal-cell--today');
        }

        var numEl = document.createElement('span');
        numEl.className = 'fenb-cal-day-num';
        numEl.textContent = day;
        cell.appendChild(numEl);

        if (byDay[day]) {
          cell.classList.add('fenb-cal-cell--has-events');

          var bars = document.createElement('div');
          bars.className = 'fenb-cal-bars';

          var dots = document.createElement('div');
          dots.className = 'fenb-cal-dots';

          byDay[day].forEach(function (item) {
            (function (it) {
              var bar = document.createElement('div');
              bar.className = 'fenb-cal-bar fenb-cal-bar--' + it.e.category;
              bar.textContent = it.e.title;
              bar.title = it.e.title;
              bar.setAttribute('role', 'button');
              bar.setAttribute('tabindex', '0');
              bar.addEventListener('click', function (ev) {
                ev.stopPropagation();
                scrollToEventCard(it.idx);
              });
              bar.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  scrollToEventCard(it.idx);
                }
              });
              bars.appendChild(bar);

              var dot = document.createElement('span');
              dot.className = 'fenb-cal-dot fenb-cal-dot--' + it.e.category;
              dot.setAttribute('role', 'button');
              dot.setAttribute('tabindex', '0');
              dot.setAttribute('aria-label', it.e.title);
              dot.addEventListener('click', function (ev) {
                ev.stopPropagation();
                scrollToEventCard(it.idx);
              });
              dot.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  scrollToEventCard(it.idx);
                }
              });
              dots.appendChild(dot);
            }(item));
          });

          // Cell-level gap-click: scrolls to the chronologically first event.
          // Dot clicks stopPropagation so they take priority on their own tap target.
          var firstIdx = byDay[day][0].idx;
          cell.addEventListener('click', function () {
            scrollToEventCard(firstIdx);
          });

          cell.appendChild(bars);
          cell.appendChild(dots);
        }

        grid.appendChild(cell);
      }(d));
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

    var items = getMonthEventsWithIndex();

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
          '<h3 class="fenb-event-title">' + esc(e.title) + '</h3>' +
          '<p class="fenb-event-date-range">' + esc(formatEventDate(e)) + '</p>' +
          '<p class="fenb-event-meta">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
              '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>' +
              '<circle cx="12" cy="10" r="3"></circle>' +
            '</svg>' +
            esc(e.location) +
          '</p>' +
          linksHtml +
        '</div>';

      evGrid.appendChild(article);
    });

    listEl.appendChild(evGrid);
  }

  init();
}());
