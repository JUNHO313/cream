/**
 * 7. 프로필 사진 업로드 / 교체
 *
 * 올린 사진은 이 브라우저에만 저장됩니다. (서버로 올라가지 않습니다.)
 * 여러 기기에서 같은 사진을 보이게 하려면 나중에 파일 업로드 API 를 붙이면 됩니다.
 */
import { storage } from './dom.js';
import { showToast } from './toast.js';
import { STORAGE_KEYS } from '../config.js';

/** 화면의 사진 관련 요소들을 한 번에 모아옵니다. */
function getElements() {
  return {
    img: document.getElementById('user-profile-img'),
    svg: document.getElementById('default-avatar-svg'),
    heroImg: document.getElementById('hero-profile-img'),
    heroSvg: document.getElementById('hero-default-svg'),
    resetBtn: document.getElementById('btn-avatar-reset'),
    fileInput: document.getElementById('avatar-file-input')
  };
}

/** 사진(src)을 넣거나, src 가 없으면 기본 아바타로 되돌립니다. */
function applyAvatar(src) {
  const { img, svg, heroImg, heroSvg, resetBtn } = getElements();
  const hasPhoto = Boolean(src);

  for (const [imgEl, svgEl] of [
    [img, svg],
    [heroImg, heroSvg]
  ]) {
    if (!imgEl || !svgEl) continue;
    imgEl.src = src || '';
    imgEl.style.display = hasPhoto ? 'block' : 'none';
    svgEl.style.display = hasPhoto ? 'none' : 'block';
  }

  if (resetBtn) resetBtn.style.display = hasPhoto ? 'inline-flex' : 'none';
}

export function initAvatar() {
  const saved = storage.getRaw(STORAGE_KEYS.avatar);

  if (saved) {
    applyAvatar(saved);
  } else {
    // 프로젝트 폴더에 profile.jpg 가 있으면 그걸 씁니다. 없으면 기본 아바타 그대로.
    const probe = new Image();
    probe.src = 'profile.jpg';
    probe.onload = () => {
      if (!storage.getRaw(STORAGE_KEYS.avatar)) applyAvatar('profile.jpg');
    };
  }

  const { fileInput, resetBtn } = getElements();
  fileInput?.addEventListener('change', handleAvatarUpload);
  resetBtn?.addEventListener('click', resetToDefaultAvatar);
}

function handleAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일(JPG, PNG 등)만 업로드할 수 있습니다.', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    applyAvatar(dataUrl);
    storage.setRaw(STORAGE_KEYS.avatar, dataUrl);
    showToast('📸 프로필 사진이 성공적으로 변경되었습니다!');
  };
  reader.onerror = () => showToast('사진을 읽지 못했습니다.', 'error');
  reader.readAsDataURL(file);
}

function resetToDefaultAvatar() {
  storage.remove(STORAGE_KEYS.avatar);
  applyAvatar(null);

  const { fileInput } = getElements();
  if (fileInput) fileInput.value = '';

  showToast('기본 아바타로 복원되었습니다.');
}
