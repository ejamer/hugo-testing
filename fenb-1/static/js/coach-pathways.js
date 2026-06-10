(function () {
  'use strict';

  var modal = document.getElementById('fenb-pathway-modal');
  if (!modal) return;

  var closeBtn = modal.querySelector('.fenb-pathway-modal-close');
  var titleEl = modal.querySelector('.fenb-pathway-modal-title');
  var imgEl = modal.querySelector('.fenb-pathway-modal-image');
  var triggers = document.querySelectorAll('[data-pathway-modal-open]');
  var closeTargets = modal.querySelectorAll('[data-pathway-modal-close]');
  var lastFocused = null;

  function openModal(trigger) {
    lastFocused = trigger;
    titleEl.textContent = trigger.dataset.title || '';
    imgEl.src = trigger.dataset.image || '';
    imgEl.alt = trigger.dataset.alt || trigger.dataset.title || '';
    modal.removeAttribute('hidden');
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function closeModal() {
    modal.setAttribute('hidden', '');
    imgEl.src = '';
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeModal();
  }

  triggers.forEach(function (trigger) {
    trigger.addEventListener('click', function () { openModal(trigger); });
  });

  closeTargets.forEach(function (el) {
    el.addEventListener('click', closeModal);
  });
})();
