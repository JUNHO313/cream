/**
 * 장준호 (그린스마트시티학과 202220824 | 인천) 포트폴리오 웹사이트 - 메인 스크립트 (script.js)
 * 인터랙티브 캔버스, 타이핑 효과, 테마 스위처, 프로젝트 모달, 방명록 시스템, 프로필 사진 업로드 등
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 테마 초기화
  initThemeSwitcher();

  // 2. 프로필 아바타 초기화 (로컬 저장 사진 or 기본 아바타)
  initAvatar();

  // 3. 타이핑 애니메이션 시작
  initTypingEffect();

  // 4. 파티클 인터랙티브 캔버스 초기화
  initParticleCanvas();

  // 5. 스크롤 프로그레스 및 네비게이션 감지
  initScrollEffects();

  // 6. 3D 틸트 효과 (히어로 카드)
  init3DTilt();

  // 7. 커스텀 커서 팔로워
  initCursorFollower();

  // 8. 스킬 탭 필터링 & 애니메이션
  initSkillsFilter();

  // 9. 프로젝트 탭 필터링
  initProjectFilters();

  // 10. 방명록 시스템 초기화
  initGuestbook();

  // 11. 모바일 네비게이션 제어
  initMobileNav();

  // 12. 스크롤 트리거 리빌 애니메이션
  initScrollReveal();

  // 13. 퀵 이메일 복사 버튼
  const quickEmailBtn = document.getElementById('quick-copy-email');
  if (quickEmailBtn) {
    quickEmailBtn.addEventListener('click', () => {
      copyText('junho122009@naver.com', '이메일(junho122009@naver.com)이 복사되었습니다!');
    });
  }
});

/* ==========================================================================
   1. THEME SWITCHER (네온 악센트 컬러 스위처)
   ========================================================================== */
function initThemeSwitcher() {
  const savedTheme = localStorage.getItem('jh_portfolio_theme') || 'orange';
  setTheme(savedTheme);

  const chips = document.querySelectorAll('.color-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = chip.getAttribute('data-color');
      setTheme(color);
      showToast(`네온 테마가 '${chip.getAttribute('title')}'(으)로 변경되었습니다.`);
    });
  });

  const toggleBtn = document.getElementById('accent-toggle-btn');
  const paletteMenu = document.getElementById('accent-palette-menu');
  if (toggleBtn && paletteMenu) {
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
}

function setTheme(themeName) {
  document.body.setAttribute('data-theme', themeName);
  localStorage.setItem('jh_portfolio_theme', themeName);

  document.querySelectorAll('.color-chip').forEach(chip => {
    chip.classList.toggle('active', chip.getAttribute('data-color') === themeName);
  });
}

/* ==========================================================================
   2. PROFILE AVATAR HANDLER (사용자 사진 업로드 / 교체)
   ========================================================================== */
function initAvatar() {
  const savedAvatar = localStorage.getItem('jh_custom_avatar');
  const imgEl = document.getElementById('user-profile-img');
  const svgEl = document.getElementById('default-avatar-svg');
  const heroImg = document.getElementById('hero-profile-img');
  const heroSvg = document.getElementById('hero-default-svg');
  const resetBtn = document.getElementById('btn-avatar-reset');

  if (savedAvatar) {
    if (imgEl && svgEl) {
      imgEl.src = savedAvatar;
      imgEl.style.display = 'block';
      svgEl.style.display = 'none';
    }
    if (heroImg && heroSvg) {
      heroImg.src = savedAvatar;
      heroImg.style.display = 'block';
      heroSvg.style.display = 'none';
    }
    if (resetBtn) resetBtn.style.display = 'inline-flex';
  } else {
    // Check if profile.jpg exists in project folder
    const testImg = new Image();
    testImg.src = 'profile.jpg';
    testImg.onload = () => {
      if (!localStorage.getItem('jh_custom_avatar')) {
        if (imgEl && svgEl) {
          imgEl.src = 'profile.jpg';
          imgEl.style.display = 'block';
          svgEl.style.display = 'none';
        }
        if (heroImg && heroSvg) {
          heroImg.src = 'profile.jpg';
          heroImg.style.display = 'block';
          heroSvg.style.display = 'none';
        }
        if (resetBtn) resetBtn.style.display = 'inline-flex';
      }
    };
  }
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일(JPG, PNG 등)만 업로드할 수 있습니다.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const imgEl = document.getElementById('user-profile-img');
    const svgEl = document.getElementById('default-avatar-svg');
    const heroImg = document.getElementById('hero-profile-img');
    const heroSvg = document.getElementById('hero-default-svg');
    const resetBtn = document.getElementById('btn-avatar-reset');

    if (imgEl && svgEl) {
      imgEl.src = dataUrl;
      imgEl.style.display = 'block';
      svgEl.style.display = 'none';
    }
    if (heroImg && heroSvg) {
      heroImg.src = dataUrl;
      heroImg.style.display = 'block';
      heroSvg.style.display = 'none';
    }
    if (resetBtn) resetBtn.style.display = 'inline-flex';
    localStorage.setItem('jh_custom_avatar', dataUrl);
    showToast('📸 프로필 사진이 성공적으로 변경되었습니다!');
  };
  reader.readAsDataURL(file);
}

function resetToDefaultAvatar() {
  localStorage.removeItem('jh_custom_avatar');
  const imgEl = document.getElementById('user-profile-img');
  const svgEl = document.getElementById('default-avatar-svg');
  const heroImg = document.getElementById('hero-profile-img');
  const heroSvg = document.getElementById('hero-default-svg');
  const resetBtn = document.getElementById('btn-avatar-reset');
  const fileInput = document.getElementById('avatar-file-input');

  if (imgEl && svgEl) {
    imgEl.src = '';
    imgEl.style.display = 'none';
    svgEl.style.display = 'block';
  }
  if (heroImg && heroSvg) {
    heroImg.src = '';
    heroImg.style.display = 'none';
    heroSvg.style.display = 'block';
  }
  if (resetBtn) resetBtn.style.display = 'none';
  if (fileInput) fileInput.value = '';
  showToast('기본 아바타로 복원되었습니다.');
}

/* ==========================================================================
   3. TYPING EFFECT (히어로 섹션 동적 타이핑)
   ========================================================================== */
function initTypingEffect() {
  const targetElement = document.getElementById('typing-text');
  if (!targetElement) return;

  const phrases = [
    "그린스마트시티학과 202220824 장준호",
    "인천 기반 지속 가능한 스마트시티 엔지니어",
    "도시 데이터 시각화 & IoT 대시보드 빌더",
    "미래 친환경 도시를 혁신하는 풀스택 개발자"
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 80;

  function type() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      targetElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
      typingSpeed = 40;
    } else {
      targetElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typingSpeed = 85;
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
      typingSpeed = 1800; // 문장 완성 후 대기 시간
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typingSpeed = 350; // 다음 문장 시작 전 대기
    }

    setTimeout(type, typingSpeed);
  }

  type();
}

/* ==========================================================================
   4. PARTICLE CANVAS (배경 인터랙티브 네온 파티클)
   ========================================================================== */
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const mouse = { x: null, y: null, radius: 120 };

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createParticles();
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
  });
  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    draw() {
      const theme = document.body.getAttribute('data-theme') || 'cyan';
      let rgb = "0, 240, 255";
      if (theme === 'purple') rgb = "168, 85, 247";
      if (theme === 'emerald') rgb = "16, 185, 129";
      if (theme === 'orange') rgb = "249, 115, 22";

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${this.alpha})`;
      ctx.fill();
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y < 0 || this.y > height) this.vy = -this.vy;

      // 마우스 반응
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 3;
          this.y -= (dy / dist) * force * 3;
        }
      }
    }
  }

  function createParticles() {
    particles = [];
    const count = Math.min(Math.floor((width * height) / 14000), 80);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    const theme = document.body.getAttribute('data-theme') || 'cyan';
    let rgb = "0, 240, 255";
    if (theme === 'purple') rgb = "168, 85, 247";
    if (theme === 'emerald') rgb = "16, 185, 129";
    if (theme === 'orange') rgb = "249, 115, 22";

    // 파티클 연결선
    for (let a = 0; a < particles.length; a++) {
      for (let b = a + 1; b < particles.length; b++) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 130) {
          const opacity = (1 - dist / 130) * 0.22;
          ctx.strokeStyle = `rgba(${rgb}, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(particles[b].x, particles[b].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(animate);
  }

  resize();
  animate();
}

/* ==========================================================================
   5. SCROLL EFFECTS (헤더 상태, 프로그레스 바, 활성 메뉴, 탑버튼)
   ========================================================================== */
function initScrollEffects() {
  const header = document.getElementById('main-header');
  const progressBar = document.getElementById('scroll-progress-bar');
  const backToTopBtn = document.getElementById('back-to-top');
  const progressCircle = document.getElementById('progress-ring-circle');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const circumference = 2 * Math.PI * 21; // r = 21, circumference ~ 131.95

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progressPercent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

    // 헤더 스크롤 배경 변화
    if (header) {
      header.classList.toggle('scrolled', scrollY > 40);
    }

    // 상단 진행바
    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }

    // 맨 위로 가기 버튼 & 원형 프로그레스
    if (backToTopBtn && progressCircle) {
      if (scrollY > 300) {
        backToTopBtn.classList.add('show');
        const offset = circumference - (progressPercent / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
      } else {
        backToTopBtn.classList.remove('show');
      }
    }

    // 네비게이션 현재 위치 하이라이트
    let currentSectionId = '';
    sections.forEach(section => {
      const top = section.offsetTop - 120;
      const height = section.offsetHeight;
      if (scrollY >= top && scrollY < top + height) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
    });
  });
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

/* ==========================================================================
   6. 3D TILT EFFECT (히어로 섹션 개발자 창 틸트)
   ========================================================================== */
function init3DTilt() {
  const card = document.getElementById('hero-tilt-card');
  if (!card) return;

  const windowBox = card.querySelector('.ide-window');

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    windowBox.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    windowBox.style.transform = `rotateX(0deg) rotateY(0deg) scale(1)`;
  });
}

/* ==========================================================================
   7. CURSOR FOLLOWER
   ========================================================================== */
function initCursorFollower() {
  const follower = document.getElementById('cursor-follower');
  if (!follower) return;

  // 터치 디바이스인 경우 비활성화
  if (window.matchMedia('(pointer: coarse)').matches) {
    follower.style.display = 'none';
    return;
  }

  let mouseX = -100, mouseY = -100;
  let posX = -100, posY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function render() {
    posX += (mouseX - posX) * 0.18;
    posY += (mouseY - posY) * 0.18;
    follower.style.transform = `translate(${posX}px, ${posY}px) translate(-50%, -50%)`;
    requestAnimationFrame(render);
  }
  render();

  // 인터랙티브 요소 호버 시 커서 확대
  const interactives = document.querySelectorAll('a, button, input, textarea, select, .project-card, .skill-card, .avatar-upload-badge');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      follower.style.width = '54px';
      follower.style.height = '54px';
      follower.style.background = 'rgba(var(--primary-rgb), 0.25)';
    });
    el.addEventListener('mouseleave', () => {
      follower.style.width = '32px';
      follower.style.height = '32px';
      follower.style.background = 'rgba(var(--primary-rgb), 0.15)';
    });
  });
}

/* ==========================================================================
   8. SKILLS FILTER & PROGRESS BARS
   ========================================================================== */
function initSkillsFilter() {
  const tabBtns = document.querySelectorAll('.skill-tab-btn');
  const skillCards = document.querySelectorAll('.skill-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      skillCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   9. PROJECTS FILTERING & MODAL DETAILS (그린스마트시티 프로젝트 DB)
   ========================================================================== */
const projectDatabase = {
  citypulse: {
    category: "Smart City & IoT",
    title: "CityPulse - 실시간 스마트시티 환경 관제 대시보드",
    desc: "인천 및 수도권 도심 전역에 설치된 IoT 센서(미세먼지 AQI, 소음, 온습도, 가로등 전력 소비)의 스트리밍 데이터를 실시간 GIS 지도 위에 렌더링하고, 이상 기후 및 에너지 과소비 구역을 조기 감지하여 관제 센터와 시민에게 즉각 경보를 전달하는 스마트시티 통합 대시보드 솔루션입니다.",
    tech: ["React 18", "Leaflet GIS Map", "FastAPI (Python)", "MQTT Broker", "PostgreSQL / PostGIS", "Chart.js"],
    features: [
      "Leaflet 기반 대화형 도시 구역별 히트맵(Heatmap) 및 센서 마커 실시간 시각화",
      "MQTT 및 WebSocket 기반 초당 수천 건의 센서 텔레메트리 스트리밍 데이터 수신",
      "대기질(AQI) 지수 및 기온 이상 발생 시 구역별 자동 알림 및 시뮬레이션 리포트",
      "시민용 모바일 친화 UI 및 관리자용 세부 센서 제어 콘솔 제공"
    ],
    bannerBg: "linear-gradient(135deg, #091e3a, #064e3b)",
    previewType: "gis"
  },
  greencampus: {
    category: "Green Campus",
    title: "GreenCampus - 대학생을 위한 스마트 친환경 캠퍼스 올인원 허브",
    desc: "학번(202220824) 기반의 개인 맞춤형 그린 캠퍼스 웹 플랫폼입니다. 공강일과 동선을 최적화한 수강신청 시간표 자동 생성 알고리즘뿐만 아니라, 교내 전기 셔틀버스 실시간 위치 추적, 캠퍼스 건물별 탄소 배출량 모니터링, 식당 잔반 줄이기 캠페인을 결합하였습니다.",
    tech: ["Next.js 14", "TypeScript", "PostgreSQL", "Prisma ORM", "Tailwind CSS", "Zustand"],
    features: [
      "수강신청 최적 시간표 자동 조합 알고리즘 및 건물 간 도보 이동거리 최소화 동선 추천",
      "캠퍼스 내 전기 셔틀버스 실시간 GPS 위치 및 도착 예정 시간(ETA) 안내",
      "학식 친환경 메뉴(로컬푸드) 표시 및 학생 리뷰 시스템",
      "PWA(Progressive Web App) 탑재로 스마트폰 홈 화면에서 앱처럼 사용 가능"
    ],
    bannerBg: "linear-gradient(135deg, #06281e, #134e4a)",
    previewType: "timetable"
  },
  ecocycle: {
    category: "Green Tech Challenge",
    title: "EcoCycle - 제로웨이스트 실천 & 탄소 중립 커뮤니티 플랫폼",
    desc: "인천 시민들이 일상 속 친환경 습관(텀블러 사용, 분리수거, 다회용기 이용 등)을 사진으로 인증하고 에코 포인트를 획득하는 게이미피케이션 플랫폼입니다. 축적된 포인트는 지역 화폐(인천이음) 또는 대중교통 마일리지로 환전할 수 있습니다.",
    tech: ["React", "Express (Node.js)", "MySQL", "AWS S3", "Docker", "Jest"],
    features: [
      "친환경 실천 인증 사진 업로드 및 일일 챌린지 달성도 트래커",
      "지역별/캠퍼스별 탄소 저감 기여도 실시간 리더보드 랭킹 시스템",
      "AWS S3 이미지 업로드 최적화 및 람다(Lambda) 리사이징 적용",
      "Jest 기반 백엔드 API 유닛 테스트로 서비스 신뢰도 보장"
    ],
    bannerBg: "linear-gradient(135deg, #1e3a1e, #064e3b)",
    previewType: "eco"
  },
  devorbit: {
    category: "Web Full-Stack",
    title: "DevOrbit - 스마트시티 연구팀 & 개발자 실시간 협업 플랫폼",
    desc: "그린 스마트시티 프로젝트 및 소프트웨어 개발 연구팀을 위한 웹 소켓 기반 실시간 협업 워크스페이스입니다. 다중 사용자가 동시에 코드와 마크다운 기술 문서를 편집하고 토론할 수 있는 환경을 제공합니다.",
    tech: ["React", "Node.js", "WebSocket (Socket.io)", "MongoDB", "TailwindCSS"],
    features: [
      "Monaco Editor 기반 실시간 동시 문서/코드 편집 및 동기화",
      "스마트시티 연구 보고서 및 마크다운 지식 베이스 검색",
      "JWT 기반 사용자 권한 관리 및 팀별 독립 워크스페이스"
    ],
    bannerBg: "linear-gradient(135deg, #0f172a, #1e1b4b)",
    previewType: "code"
  }
};

function initProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const countEl = document.getElementById('filter-result-count');
  const emptyEl = document.getElementById('filter-empty-msg');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeProjectModal();

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      const visibleCount = [...projectCards].filter(
        card => filter === 'all' || card.getAttribute('data-category') === filter
      ).length;

      countEl.textContent = `프로젝트 ${visibleCount}개`;
      emptyEl.hidden = visibleCount > 0;

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });
}

function openProjectModal(projectId) {
  const data = projectDatabase[projectId];
  if (!data) return;

  const modal = document.getElementById('project-modal');
  document.getElementById('modal-category').textContent = data.category;
  document.getElementById('modal-title').textContent = data.title;
  document.getElementById('modal-desc').textContent = data.desc;

  // Banner Mockup
  const banner = document.getElementById('modal-banner');
  banner.style.background = data.bannerBg;
  banner.innerHTML = `
    <div style="padding: 16px; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #fff; text-align: center;">
      <div style="font-size: 2.2rem; margin-bottom: 8px;"><i class="fa-solid fa-tree-city"></i></div>
      <div style="font-family: var(--font-code); font-weight: 700; font-size: 1.1rem; color: var(--primary-neon);">${data.title.split('-')[0]}</div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Green Smart City Innovation Project</div>
    </div>
  `;

  // Tech list
  const techList = document.getElementById('modal-tech-list');
  techList.innerHTML = data.tech.map(t => `<span class="p-tag">${t}</span>`).join('');

  // Features list
  const featuresList = document.getElementById('modal-features');
  featuresList.innerHTML = data.features.map(f => `<li>${f}</li>`).join('');

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function closeProjectModalOnOutside(e) {
  if (e.target.id === 'project-modal') {
    closeProjectModal();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeProjectModal();
  }
});

/* ==========================================================================
   10. INTERACTIVE GUESTBOOK (방명록 LocalStorage 시스템)
   ========================================================================== */
const DEFAULT_GUESTBOOK = [
  {
    id: 1,
    author: "그린스마트시티학과 교수님",
    badge: "교수님/멘토",
    avatar: "👨‍🏫",
    content: "장준호 학생(학번 202220824), 그린스마트시티학과의 핵심인 도시 지속가능성과 최신 IT 소프트웨어 기술을 융합하는 능력이 매우 뛰어납니다. 인천과 대한민국의 스마트시티 혁신 인재로의 성장을 응원합니다!",
    date: "2026.08.28",
    likes: 15
  },
  {
    id: 2,
    author: "김민재 (과동기)",
    badge: "그린스마트시티학과 동문",
    avatar: "🌱",
    content: "준호야 포트폴리오 디자인 진짜 멋지다! 그린 스마트시티 컨셉이랑 다크 네온 분위기가 찰떡이네. CityPulse 프로젝트 지도 시각화 부분 완성도 대박이야 👍",
    date: "2026.08.30",
    likes: 9
  },
  {
    id: 3,
    author: "인천 스마트시티 프로젝트 팀원",
    badge: "동료 개발자",
    avatar: "🏙️",
    content: "지난번 EcoCycle 및 센서 데이터 파이프라인 개발할 때 FastAPI 백엔드 연동 꼼꼼하게 처리해주셔서 감사했습니다. 앞으로도 함께 좋은 연구 만들어가요!",
    date: "2026.09.01",
    likes: 7
  }
];

let selectedAvatar = "🌱";

function initGuestbook() {
  // 아바타 선택자
  const avatarButtons = document.querySelectorAll('.avatar-opt');
  avatarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      avatarButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAvatar = btn.getAttribute('data-avatar');
    });
  });

  // 글자 수 카운터
  const textarea = document.getElementById('gb-content');
  const counter = document.getElementById('gb-char-count');
  if (textarea && counter) {
    textarea.addEventListener('input', () => {
      counter.textContent = textarea.value.length;
    });
  }

  renderGuestbook();
}

function getStoredGuestbook() {
  const data = localStorage.getItem('jh_guestbook_data');
  if (!data) {
    localStorage.setItem('jh_guestbook_data', JSON.stringify(DEFAULT_GUESTBOOK));
    return DEFAULT_GUESTBOOK;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_GUESTBOOK;
  }
}

function renderGuestbook() {
  const feed = document.getElementById('guestbook-feed');
  const countSpan = document.getElementById('guestbook-count');
  if (!feed) return;

  const messages = getStoredGuestbook();
  if (countSpan) countSpan.textContent = messages.length;

  if (messages.length === 0) {
    feed.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-regular fa-comment-dots" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        첫 번째 방명록을 남겨주세요!
      </div>
    `;
    return;
  }

  feed.innerHTML = messages.map(msg => `
    <div class="gb-item" data-id="${msg.id}">
      <div class="gb-item-header">
        <div class="gb-author-info">
          <span class="gb-avatar">${msg.avatar}</span>
          <span class="gb-author-name">${escapeHTML(msg.author)}</span>
          <span class="gb-badge-tag">${escapeHTML(msg.badge)}</span>
        </div>
        <span class="gb-date">${msg.date}</span>
      </div>
      <div class="gb-text">${escapeHTML(msg.content)}</div>
      <div class="gb-item-footer">
        <button class="btn-like ${msg.liked ? 'liked' : ''}" onclick="toggleLikeGuestbook(${msg.id})">
          <i class="fa-${msg.liked ? 'solid' : 'regular'} fa-heart"></i>
          <span>좋아요 <strong>${msg.likes}</strong></span>
        </button>
        <button class="btn-delete-gb" onclick="deleteGuestbookMessage(${msg.id})" title="메시지 삭제">
          <i class="fa-regular fa-trash-can"></i> 삭제
        </button>
      </div>
    </div>
  `).join('');
}

function handleGuestbookSubmit(e) {
  e.preventDefault();
  const authorInput = document.getElementById('gb-author');
  const badgeSelect = document.getElementById('gb-badge');
  const contentInput = document.getElementById('gb-content');

  const author = authorInput.value.trim();
  const badge = badgeSelect.value;
  const content = contentInput.value.trim();

  if (!author || !content) {
    showToast('작성자와 내용을 모두 입력해주세요.');
    return;
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

  const newMessage = {
    id: Date.now(),
    author,
    badge,
    avatar: selectedAvatar,
    content,
    date: dateStr,
    likes: 0,
    liked: false
  };

  const messages = getStoredGuestbook();
  messages.unshift(newMessage);
  localStorage.setItem('jh_guestbook_data', JSON.stringify(messages));

  authorInput.value = '';
  contentInput.value = '';
  document.getElementById('gb-char-count').textContent = '0';

  renderGuestbook();
  showToast('🎉 방명록이 성공적으로 등록되었습니다! 감사합니다.');
}

function toggleLikeGuestbook(id) {
  const messages = getStoredGuestbook();
  const item = messages.find(m => m.id === id);
  if (item) {
    if (item.liked) {
      item.likes = Math.max(0, item.likes - 1);
      item.liked = false;
    } else {
      item.likes += 1;
      item.liked = true;
    }
    localStorage.setItem('jh_guestbook_data', JSON.stringify(messages));
    renderGuestbook();
  }
}

function deleteGuestbookMessage(id) {
  if (confirm('이 방명록 메시지를 삭제하시겠습니까?')) {
    let messages = getStoredGuestbook();
    messages = messages.filter(m => m.id !== id);
    localStorage.setItem('jh_guestbook_data', JSON.stringify(messages));
    renderGuestbook();
    showToast('메시지가 삭제되었습니다.');
  }
}

function resetSampleGuestbook() {
  if (confirm('기본 샘플 방명록 데이터로 초기화하시겠습니까?')) {
    localStorage.setItem('jh_guestbook_data', JSON.stringify(DEFAULT_GUESTBOOK));
    renderGuestbook();
    showToast('방명록이 샘플 데이터로 복원되었습니다.');
  }
}

/* ==========================================================================
   11. CONTACT FORM & UTILITIES
   ========================================================================== */
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const subject = document.getElementById('c-subject').value.trim();
  const message = document.getElementById('c-message').value.trim();

  if (!name || !email || !subject || !message) {
    showToast('모든 항목을 올바르게 입력해주세요.');
    return;
  }

  showToast(`📩 ${name} 님의 문의가 접수되었습니다. (junho122009@naver.com으로 확인 후 회신 드립니다)`);
  document.getElementById('contact-form').reset();
}

function copyText(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(successMsg || '클립보드에 복사되었습니다.');
    }).catch(() => {
      fallbackCopy(text, successMsg);
    });
  } else {
    fallbackCopy(text, successMsg);
  }
}

function fallbackCopy(text, successMsg) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast(successMsg || '클립보드에 복사되었습니다.');
  } catch (err) {
    showToast('복사에 실패했습니다. 직접 복사해주세요.');
  }
  document.body.removeChild(textArea);
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--primary-neon);"></i> <span>${escapeHTML(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   12. MOBILE NAVIGATION
   ========================================================================== */
function initMobileNav() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      menuBtn.classList.toggle('open');
      navMenu.classList.toggle('open');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuBtn.classList.remove('open');
        navMenu.classList.remove('open');
      });
    });
  }
}

/* ==========================================================================
   13. SCROLL REVEAL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // 프로그레스 바 애니메이션 연동
        const skillFills = entry.target.querySelectorAll('.skill-bar-fill');
        skillFills.forEach(fill => {
          fill.style.width = fill.style.getPropertyValue('--percent') || '85%';
        });
      }
    });
  }, {
    threshold: 0.15
  });

  reveals.forEach(el => observer.observe(el));

  // 스킬 그리드 진입 시 전체 스킬 바 애니메이션 트리거
  const skillsGrid = document.getElementById('skills-grid');
  if (skillsGrid) {
    const skillsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fills = skillsGrid.querySelectorAll('.skill-bar-fill');
          fills.forEach(fill => {
            fill.style.width = fill.style.getPropertyValue('--percent') || '85%';
          });
        }
      });
    }, { threshold: 0.2 });
    skillsObserver.observe(skillsGrid);
  }
}
