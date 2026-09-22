/**
 * 6. 네온 악센트 컬러 스위처
 *
 * 고른 색은 브라우저에만 저장합니다. (개인 취향이라 서버에 보낼 이유가 없습니다.)
 */
import { storage } from './dom.js';
import { showToast } from './toast.js';
import { STORAGE_KEYS } from '../config.js';

export function initThemeSwitcher() {
  setTheme(storage.getRaw(STORAGE_KEYS.theme, 'orange'));

  document.querySelectorAll('.color-chip').forEach((chip) => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      setTheme(chip.getAttribute('data-color'));
      showToast(`네온 테마가 '${chip.getAttribute('title')}'(으)로 변경되었습니다.`);
    });
  });

  const toggleBtn = document.getElementById('accent-toggle-btn');
  const paletteMenu = document.getElementById('accent-palette-menu');
  if (!toggleBtn || !paletteMenu) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    paletteMenu.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!paletteMenu.contains(e.target) && e.target !== toggleBtn) {
      paletteMenu.classList.remove('show');
    }
  });
}

export function setTheme(themeName) {
  document.body.setAttribute('data-theme', themeName);
  storage.setRaw(STORAGE_KEYS.theme, themeName);

  document.querySelectorAll('.color-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.getAttribute('data-color') === themeName);
  });
}
