(function () {
  var overlay = null;

  function openLightbox(img) {
    if (overlay) return;

    overlay = document.createElement('div');
    overlay.className = 'fenb-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', img.alt || 'Image');

    var lbImg = document.createElement('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbImg.className = 'fenb-lightbox-img';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'fenb-lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';

    overlay.appendChild(lbImg);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      overlay.classList.add('fenb-lightbox--open');
    });

    function close() {
      if (!overlay) return;
      overlay.classList.remove('fenb-lightbox--open');
      var el = overlay;
      overlay = null;
      el.addEventListener('transitionend', function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, { once: true });
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    overlay.addEventListener('click', function (e) {
      if (e.target !== lbImg) close();
    });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-lightbox-zone] img:not([aria-hidden="true"]):not(.fenb-no-lightbox)').forEach(function (img) {
      img.addEventListener('click', function () { openLightbox(img); });
    });
  });
})();
