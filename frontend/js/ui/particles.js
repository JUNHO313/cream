/**
 * 9. 배경 인터랙티브 파티클
 *
 * 화면 장식이라 데이터와는 무관합니다.
 * "동작을 줄여달라" 설정을 켠 사용자에게는 애니메이션을 돌리지 않습니다.
 */

/** 테마별 파티클 색상 (styles.css 의 악센트 색과 맞춘 값) */
const THEME_RGB = {
  cyan: '0, 240, 255',
  purple: '168, 85, 247',
  emerald: '16, 185, 129',
  orange: '249, 115, 22'
};

function currentRgb() {
  const theme = document.body.getAttribute('data-theme') || 'cyan';
  return THEME_RGB[theme] || THEME_RGB.cyan;
}

export function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  // 접근성: 동작 최소화를 원하는 사용자에게는 애니메이션을 띄우지 않습니다.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  const mouse = { x: null, y: null, radius: 120 };
  let width = 0;
  let height = 0;
  let particles = [];

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.7;
      this.vy = (Math.random() - 0.5) * 0.7;
      this.radius = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y < 0 || this.y > height) this.vy = -this.vy;

      // 마우스 근처의 점은 살짝 밀려납니다.
      if (mouse.x === null || mouse.y === null) return;

      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0 && dist < mouse.radius) {
        const force = (mouse.radius - dist) / mouse.radius;
        this.x -= (dx / dist) * force * 3;
        this.y -= (dy / dist) * force * 3;
      }
    }

    draw(rgb) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb}, ${this.alpha})`;
      ctx.fill();
    }
  }

  function createParticles() {
    const count = Math.min(Math.floor((width * height) / 14000), 80);
    particles = Array.from({ length: count }, () => new Particle());
  }

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    createParticles();
  }

  function drawConnections(rgb) {
    for (let a = 0; a < particles.length; a += 1) {
      for (let b = a + 1; b < particles.length; b += 1) {
        const dx = particles[a].x - particles[b].x;
        const dy = particles[a].y - particles[b].y;
        const dist = Math.hypot(dx, dy);
        if (dist >= 130) continue;

        ctx.strokeStyle = `rgba(${rgb}, ${(1 - dist / 130) * 0.22})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    const rgb = currentRgb();

    drawConnections(rgb);
    particles.forEach((p) => {
      p.update();
      p.draw(rgb);
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });

  resize();
  animate();
}
