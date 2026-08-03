// Shared date helpers for event pages.
//
// Hugo bakes `now` into the page at build time. On a static, GitHub Pages-hosted
// site that only rebuilds on a push to main, that timestamp can be days or weeks
// stale — so "upcoming" event lists computed from it drift out of date between
// releases. These helpers recompute against the visitor's own clock instead,
// so pages self-correct on every load regardless of when the site was last built.
(function () {
  function todayMidnight() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
  }

  function isUpcoming(dateStr) {
    return parseDate(dateStr) >= todayMidnight();
  }

  // Inclusive on both ends: fromStr may show today, toStr still shows through
  // the end of the day it names (the day after toStr is the first hidden day).
  function isWithinWindow(fromStr, toStr) {
    var today = todayMidnight();
    if (fromStr && parseDate(fromStr) > today) return false;
    if (toStr && parseDate(toStr) < today) return false;
    return true;
  }

  window.FenbEventDates = {
    todayMidnight: todayMidnight,
    parseDate: parseDate,
    isUpcoming: isUpcoming,
    isWithinWindow: isWithinWindow
  };
}());
