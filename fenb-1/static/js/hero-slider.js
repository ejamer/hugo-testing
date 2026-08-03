// Homepage hero carousel.
//
// The template renders every slide that hadn't already expired as of the last
// build, tagged with data-publish-from/data-expires (see layouts/index.html).
// Here we re-check those dates against the visitor's real clock — via
// event-dates.js — so a slide goes live/retires on its date without needing a
// new deploy. If nothing is currently live, the fallback logo slate (rendered
// alongside the real slides) is shown instead of an empty carousel.
(function () {
  var slider = document.getElementById('fenb-hero-slider');
  if (!slider) return;

  var fallback = slider.querySelector('.fenb-hero-slide--fallback');
  var allSlides = Array.prototype.slice.call(slider.querySelectorAll('.fenb-hero-slide:not(.fenb-hero-slide--fallback)'));
  var allDots = Array.prototype.slice.call(slider.querySelectorAll('.fenb-hero-dot'));
  var chrome = slider.querySelectorAll('.fenb-hero-slider-btn, .fenb-hero-dots, .fenb-hero-pause');

  function hideChrome() {
    Array.prototype.forEach.call(chrome, function (el) { el.style.display = 'none'; });
  }

  function isLive(slide) {
    if (!window.FenbEventDates) return true;
    return window.FenbEventDates.isWithinWindow(slide.dataset.publishFrom, slide.dataset.expires);
  }

  var slides = [];
  var dots = [];
  allSlides.forEach(function (slide, i) {
    if (isLive(slide)) {
      slides.push(slide);
      if (allDots[i]) dots.push(allDots[i]);
    } else {
      slide.classList.remove('is-active');
      slide.style.display = 'none';
      if (allDots[i]) allDots[i].style.display = 'none';
    }
  });

  if (slides.length === 0) {
    hideChrome();
    if (fallback) fallback.classList.add('is-active');
    return;
  }
  if (fallback) fallback.classList.remove('is-active');

  // Whichever slide/dot survived filtering becomes the initial active one,
  // regardless of which one the server marked active among the unfiltered list.
  slides.forEach(function (s) { s.classList.remove('is-active'); });
  dots.forEach(function (d) { d.classList.remove('is-active'); d.setAttribute('aria-selected', 'false'); });
  slides[0].classList.add('is-active');
  if (dots[0]) { dots[0].classList.add('is-active'); dots[0].setAttribute('aria-selected', 'true'); }

  if (slides.length < 2) {
    hideChrome();
    return;
  }

  var pauseBtn = slider.querySelector('.fenb-hero-pause');
  var pauseIcon = pauseBtn && pauseBtn.querySelector('.fenb-icon-pause');
  var playIcon = pauseBtn && pauseBtn.querySelector('.fenb-icon-play');
  var current = 0;
  var interval = 5000;
  var timer;
  var paused = false;

  function show(index) {
    slides[current].classList.remove('is-active');
    if (dots[current]) {
      dots[current].classList.remove('is-active');
      dots[current].setAttribute('aria-selected', 'false');
    }
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    if (dots[current]) {
      dots[current].classList.add('is-active');
      dots[current].setAttribute('aria-selected', 'true');
    }
  }

  function startTimer() { timer = setInterval(function () { show(current + 1); }, interval); }
  function stopTimer() { clearInterval(timer); }
  function resetTimer() { stopTimer(); if (!paused) startTimer(); }

  slider.querySelector('.fenb-hero-slider-btn--prev').addEventListener('click', function () {
    show(current - 1); resetTimer();
  });
  slider.querySelector('.fenb-hero-slider-btn--next').addEventListener('click', function () {
    show(current + 1); resetTimer();
  });

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      show(dots.indexOf(dot)); resetTimer();
    });
  });

  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      if (paused) {
        stopTimer();
        pauseBtn.setAttribute('aria-pressed', 'true');
        pauseBtn.setAttribute('aria-label', 'Play slideshow');
        if (pauseIcon) pauseIcon.style.display = 'none';
        if (playIcon) playIcon.style.display = '';
      } else {
        startTimer();
        pauseBtn.setAttribute('aria-pressed', 'false');
        pauseBtn.setAttribute('aria-label', 'Pause slideshow');
        if (pauseIcon) pauseIcon.style.display = '';
        if (playIcon) playIcon.style.display = 'none';
      }
    });
  }

  startTimer();
})();
