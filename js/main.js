document.addEventListener('DOMContentLoaded', () => {
  const playButton = document.getElementById('playButton');
  const modeSelection = document.getElementById('modeSelection');

  if (playButton) {
    playButton.addEventListener('click', () => {
      if (typeof revealModes === 'function') {
        revealModes();
        return;
      }
      if (!modeSelection) return;
      modeSelection.hidden = false;
      modeSelection.removeAttribute('hidden');
      modeSelection.style.display = 'grid';
    });
  }

  const modeButtons = document.querySelectorAll('[data-mode]');
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.mode;
      if (!mode) return;
      if (typeof initGame === 'function') {
        initGame(mode);
      } else {
        console.log('Iniciando Draft en modo:', mode);
      }
    });
  });
});
