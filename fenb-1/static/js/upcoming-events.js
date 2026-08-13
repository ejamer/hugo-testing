// Homepage "Upcoming Events" section.
//
// The template renders every event still upcoming as of the last build, plus 4
// placeholder cards, in chronological order (see layouts/index.html). Without JS,
// CSS shows only the first 4 of those DOM children as a reasonable fallback. Here
// we recompute against the visitor's real clock and show the true first 4 upcoming
// events, so the list stays correct between site builds (see event-dates.js).
(function () {
  var MAX_VISIBLE = 4;

  document.addEventListener('DOMContentLoaded', function () {
    var container = document.getElementById('fenb-upcoming-events');
    if (!container || !window.FenbEventDates) return;

    var cards = Array.prototype.slice.call(container.querySelectorAll('.fenb-event-card[data-event-date]'));
    var placeholders = Array.prototype.slice.call(container.querySelectorAll('.fenb-event-card--placeholder'));

    var upcoming = cards
      .filter(function (card) { return window.FenbEventDates.isUpcoming(card.dataset.eventDate); })
      .sort(function (a, b) { return a.dataset.eventDate < b.dataset.eventDate ? -1 : 1; });

    var visible = upcoming.slice(0, MAX_VISIBLE);

    // Explicit 'flex' (the card's real display value), not '', is required here:
    // clearing the inline style falls back to the CSS cascade, and the nth-child
    // fallback rule in fenb-events.css still hides anything past DOM position 4 —
    // so a cleared style wouldn't actually reveal a card/placeholder sitting there.
    cards.forEach(function (card) {
      card.style.display = visible.indexOf(card) === -1 ? 'none' : 'flex';
    });

    var neededPlaceholders = Math.max(0, MAX_VISIBLE - visible.length);
    placeholders.forEach(function (placeholder, i) {
      placeholder.style.display = i < neededPlaceholders ? 'flex' : 'none';
    });

    // Register links only make sense while the event hasn't started yet; the
    // server-rendered default can go stale the same way the card list does.
    container.querySelectorAll('.fenb-event-register-link[data-event-date]').forEach(function (link) {
      link.style.display = window.FenbEventDates.isUpcoming(link.dataset.eventDate) ? '' : 'none';
    });
  });
}());
