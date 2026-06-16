(function () {
  var slider = document.getElementById('fenb-hero-slider');
  if (!slider) return;
  var slides = slider.querySelectorAll('.fenb-hero-slide');
  if (slides.length < 2) return;
  var dots = slider.querySelectorAll('.fenb-hero-dot');
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
      show(parseInt(this.dataset.index)); resetTimer();
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
