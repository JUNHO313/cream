/**
 * 10. 스크롤 관련 효과
 *
 * - 헤더 배경 변화, 상단 진행바, 맨 위로 버튼, 현재 메뉴 표시
 * - 화면에 들어올 때 나타나는 애니메이션 (스크롤 리빌)
 *
 * 스크롤 이벤트는 1초에 수십 번 발생하므로,
 * 실제 계산은 화면을 다시 그리는 시점(requestAnimationFrame)에 한 번만 합니다.
 */

export function initScrollEffects() {
  const header = document.getElementById('main-header');
  const progressBar = document.getElementById('scroll-progress-bar');
  const backToTopBtn = document.getElementById('back-to-top');
  const progressCircle = document.getElementById('progress-ring-circle');
  const navLinks = document.querySelectorAll('.nav-link');

  const circumference = 2 * Math.PI * 21; // 원형 진행바 반지름 21에 맞춘 둘레
  let ticking = false;

  function update() {
    ticking = false;

    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const percent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

    header?.classList.toggle('scrolled', scrollY > 40);

    if (progressBar) progressBar.style.width = `${percent}%`;

    if (backToTopBtn && progressCircle) {
      const show = scrollY > 300;
      backToTopBtn.classList.toggle('show', show);
      if (show) {
        progressCircle.style.strokeDashoffset =
          circumference - (percent / 100) * circumference;
      }
    }

    // 섹션은 콘텐츠를 그린 뒤 위치가 바뀌므로 매번 다시 읽습니다.
    let currentId = '';
    document.querySelectorAll('section[id]').forEach((section) => {
      const top = section.offsetTop - 120;
      if (scrollY >= top && scrollY < top + section.offsetHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();

  document.getElementById('back-to-top')?.addEventListener('click', scrollToTop);
}

export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** 스킬 막대를 표시된 퍼센트만큼 채웁니다. */
function fillSkillBars(root) {
  root.querySelectorAll('.skill-bar-fill').forEach((fill) => {
    fill.style.width = fill.style.getPropertyValue('--percent') || '85%';
  });
}

/**
 * 화면에 들어온 요소에 revealed 클래스를 붙입니다.
 * 콘텐츠를 서버에서 받아 나중에 그리므로, 그린 뒤 다시 불러야 합니다.
 * 이미 관찰 중인 요소는 건너뜁니다.
 */
let revealObserver = null;

export function initScrollReveal() {
  revealObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        fillSkillBars(entry.target);
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal-on-scroll:not([data-revealing])').forEach((el) => {
    el.setAttribute('data-revealing', 'true');
    revealObserver.observe(el);
  });

  // 스킬 영역은 카드 단위가 아니라 전체가 한 번에 차오르도록 따로 관찰합니다.
  const skillsGrid = document.getElementById('skills-grid');
  if (skillsGrid && !skillsGrid.hasAttribute('data-revealing')) {
    skillsGrid.setAttribute('data-revealing', 'true');
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) fillSkillBars(skillsGrid);
        });
      },
      { threshold: 0.2 }
    ).observe(skillsGrid);
  }
}
