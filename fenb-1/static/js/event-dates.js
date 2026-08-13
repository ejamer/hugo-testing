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

  window.FenbEventDates = {
    todayMidnight: todayMidnight,
    parseDate: parseDate,
    isUpcoming: isUpcoming
  };
}());
