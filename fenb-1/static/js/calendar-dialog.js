// Add-to-Calendar / Subscribe modal (layouts/partials/calendar-dialog.html).
// Any element with data-cal-dialog="event" | "subscribe" opens the page's single
// <dialog>, filled from the trigger's attributes:
//   data-cal-ics     Apple/Outlook link (.ics file, or webcal:// feed for subscribe)
//   data-cal-google  Google Calendar link
//   data-cal-feed    plain https feed URL (subscribe only)
//   data-cal-title, data-cal-meta  event summary lines (event only)
// Delegated on document, so triggers rendered later by events-calendar.js work too.
(function () {
  var dialog = document.getElementById('fenb-cal-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  var opener = null;

  function setLink(name, href) {
    var a = dialog.querySelector('[data-cal-link="' + name + '"]');
    if (href) a.setAttribute('href', href); else a.removeAttribute('href');
  }

  function open(trigger) {
    var mode = trigger.dataset.calDialog;
    var isEvent = mode === 'event';
    dialog.querySelector('#fenb-cal-dialog-title').textContent =
      isEvent ? dialog.dataset.headingEvent : dialog.dataset.headingSubscribe;
    dialog.querySelector('[data-cal-field="title"]').textContent = trigger.dataset.calTitle || '';
    dialog.querySelector('[data-cal-field="meta"]').textContent = trigger.dataset.calMeta || '';
    dialog.querySelector('[data-cal-part="summary"]').hidden = !isEvent;
    dialog.querySelector('[data-cal-part="intro"]').hidden = isEvent;
    dialog.querySelector('[data-cal-part="feed"]').hidden = isEvent;
    setLink('ics', trigger.dataset.calIcs);
    setLink('google', trigger.dataset.calGoogle);
    setLink('feed', isEvent ? '' : trigger.dataset.calFeed);
    opener = trigger;
    dialog.showModal();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-cal-dialog]');
    if (trigger) { e.preventDefault(); open(trigger); }
  });

  dialog.addEventListener('click', function (e) {
    // Backdrop clicks land on the <dialog> element itself; the close button and any
    // chosen option also close it.
    if (e.target === dialog || e.target.closest('[data-cal-dialog-close]') || e.target.closest('[data-cal-link]')) {
      dialog.close();
    }
  });

  // Return focus to the trigger (Safari doesn't focus buttons on click, so the
  // browser's own restore can't be relied on).
  dialog.addEventListener('close', function () {
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  });
})();
