/**
 * 11. 마우스 관련 장식 효과 (3D 틸트 · 커서 팔로워)
 *
 * 둘 다 마우스가 있는 환경에서만 의미가 있어 한 파일에 묶었습니다.
 */

/** 히어로 섹션의 코드 창이 마우스를 따라 살짝 기울어집니다. */
export function init3DTilt() {
  const card = document.getElementById('hero-tilt-card');
  const windowBox = card?.querySelector('.ide-window');
  if (!card || !windowBox) return;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((e.clientY - rect.top - centerY) / centerY) * -10;
    const rotateY = ((e.clientX - rect.left - centerX) / centerX) * 10;

    windowBox.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    windowBox.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
  });
}

/**
 * 마우스를 부드럽게 따라다니는 원.
 * 클릭할 수 있는 요소 위에서는 커집니다.
 *
 * 카드·버튼이 서버 데이터로 나중에 그려지므로,
 * 요소마다 이벤트를 다는 대신 문서 전체에서 한 번만 감지합니다.
 */
export function initCursorFollower() {
  const follower = document.getElementById('cursor-follower');
  if (!follower) return;

  // 터치 기기에는 마우스 커서가 없습니다.
  if (window.matchMedia('(pointer: coarse)').matches) {
    follower.style.display = 'none';
    return;
  }

  const INTERACTIVE = 'a, button, input, textarea, select, .project-card, .skill-card, .avatar-upload-badge';

  let mouseX = -100;
  let mouseY = -100;
  let posX = -100;
  let posY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // 나중에 추가된 요소에도 자동으로 적용됩니다.
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(INTERACTIVE)) setSize(true);
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(INTERACTIVE)) setSize(false);
  });

  function setSize(large) {
    follower.style.width = large ? '54px' : '32px';
    follower.style.height = large ? '54px' : '32px';
    follower.style.background = `rgba(var(--primary-rgb), ${large ? 0.25 : 0.15})`;
  }

  (function render() {
    posX += (mouseX - posX) * 0.18;
    posY += (mouseY - posY) * 0.18;
    follower.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  })();
}
