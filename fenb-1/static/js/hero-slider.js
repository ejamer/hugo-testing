(function () {
  var slider = document.getElementById('fenb-hero-slider');
  if (!slider) return;
  var slides = slider.querySelectorAll('.fenb-hero-slide');
  if (slides.length < 2) return;
  var current = 0;
  var interval = 5000;
  var timer;

  function show(index) {
    slides[current].classList.remove('is-active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('is-active');
  }

  function advance() { show(current + 1); }

  function startTimer() { timer = setInterval(advance, interval); }
  function resetTimer() { clearInterval(timer); startTimer(); }

  slider.querySelector('.fenb-hero-slider-btn--prev').addEventListener('click', function () {
    show(current - 1); resetTimer();
  });
  slider.querySelector('.fenb-hero-slider-btn--next').addEventListener('click', function () {
    show(current + 1); resetTimer();
  });

  startTimer();
})();
