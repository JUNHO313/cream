/**
 * 12. 모바일 네비게이션
 */
export function initMobileNav() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');
  if (!menuBtn || !navMenu) return;

  menuBtn.addEventListener('click', () => {
    const willOpen = !navMenu.classList.contains('open');
    menuBtn.classList.toggle('open', willOpen);
    navMenu.classList.toggle('open', willOpen);
    menuBtn.setAttribute('aria-expanded', String(willOpen));
  });

  // 메뉴 항목을 누르면 자동으로 닫힙니다.
  navMenu.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-link')) return;
    menuBtn.classList.remove('open');
    navMenu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
}
