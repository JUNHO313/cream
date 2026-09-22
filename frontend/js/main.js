/**
 * 0. 진입점
 *
 * 이 파일은 "무엇을 어떤 순서로 켜는지"만 정합니다.
 * 실제 내용은 각 모듈에 나눠져 있습니다.
 *
 *   js/api/       서버와 통신
 *   js/ui/        화면 장식·공통 도구 (서버와 무관)
 *   js/features/  서버 데이터로 그리는 섹션
 *
 * 화면 장식은 서버 없이도 동작해야 하므로 먼저 켜고,
 * 서버에서 내용을 받아온 뒤에 섹션들을 그립니다.
 */
import { portfolioApi } from './api/portfolio.api.js';
import { showToast } from './ui/toast.js';
import { initThemeSwitcher } from './ui/theme.js';
import { initAvatar } from './ui/avatar.js';
import { initTypingEffect, buildPhrases } from './ui/typing.js';
import { initParticleCanvas } from './ui/particles.js';
import { initScrollEffects, initScrollReveal } from './ui/scroll.js';
import { init3DTilt, initCursorFollower } from './ui/effects.js';
import { initMobileNav } from './ui/nav.js';
import { initPlaceholderLinks } from './ui/placeholderLinks.js';
import { renderError } from './ui/dom.js';

import { renderSkills } from './features/skills.js';
import { renderProjects } from './features/projects.js';
import { renderTimeline } from './features/timeline.js';
import { initGuestbook } from './features/guestbook.js';
import { initContactForm, initCopyButtons } from './features/contact.js';

document.addEventListener('DOMContentLoaded', () => {
  initStaticUI();
  loadContent();
});

/** 서버가 없어도 동작하는 부분 */
function initStaticUI() {
  initThemeSwitcher();
  initAvatar();
  initParticleCanvas();
  initScrollEffects();
  init3DTilt();
  initCursorFollower();
  initMobileNav();
  initPlaceholderLinks();
  initContactForm();
}

/** 서버에서 내용을 받아 각 섹션을 그립니다. */
async function loadContent() {
  try {
    const { profile, skills, projects, timeline, guestbookOptions } =
      await portfolioApi.fetchBootstrap();

    initTypingEffect(buildPhrases(profile));
    initCopyButtons(profile);

    renderSkills(skills);
    renderProjects(projects);
    renderTimeline(timeline);

    // 내용을 그린 뒤에 등장 애니메이션을 연결합니다. (순서가 바뀌면 동작하지 않습니다)
    initScrollReveal();

    await initGuestbook(guestbookOptions);
  } catch (err) {
    handleLoadFailure(err);
  }
}

/**
 * 서버에 닿지 못했을 때.
 * 빈 화면을 보여주는 대신, 무엇이 문제이고 무엇을 하면 되는지 적어둡니다.
 */
function handleLoadFailure(err) {
  console.error('[콘텐츠 불러오기 실패]', err);

  const message = err.message || '내용을 불러오지 못했습니다.';
  const retry = () => loadContent();

  renderError(document.getElementById('skills-grid'), message, { onRetry: retry });
  renderError(document.getElementById('projects-grid'), message, { onRetry: retry });
  renderError(document.getElementById('timeline-container'), message, { onRetry: retry });
  renderError(document.getElementById('guestbook-feed'), message, { onRetry: retry });

  initTypingEffect(buildPhrases({}));
  showToast(message, 'error');
}
