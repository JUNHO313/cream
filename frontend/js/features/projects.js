/**
 * 14. 프로젝트 섹션 (카드 · 분야 필터 · 상세 모달)
 *
 * 프로젝트를 추가하려면 backend/data/content.json 의 projects 배열에만 넣으면 됩니다.
 * 카드 · 필터 버튼 · 개수 표시 · 상세 모달이 모두 자동으로 따라옵니다.
 */
import { escapeHTML } from '../ui/dom.js';

let state = { filters: [], items: [], active: 'all' };

export function renderProjects({ filters = [], items = [] } = {}) {
  state = { filters, items, active: 'all' };

  renderFilterButtons();
  renderCards();
  updateCount();
  bindModal();
}

/* ------------------------------------------------------------------ 필터 */

function renderFilterButtons() {
  const container = document.getElementById('project-filters');
  if (!container) return;

  container.innerHTML = state.filters
    .map(
      (f) => `
      <button type="button" class="filter-btn${f.key === state.active ? ' active' : ''}"
              data-filter="${escapeHTML(f.key)}">${escapeHTML(f.label)}</button>`
    )
    .join('');

  container.onclick = (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    closeProjectModal();
    state.active = btn.getAttribute('data-filter');

    container.querySelectorAll('.filter-btn').forEach((b) => {
      b.classList.toggle('active', b === btn);
    });

    applyFilter();
    updateCount();
  };
}

function visibleItems() {
  return state.active === 'all'
    ? state.items
    : state.items.filter((p) => p.category === state.active);
}

function updateCount() {
  const countEl = document.getElementById('filter-result-count');
  const emptyEl = document.getElementById('filter-empty-msg');
  const count = visibleItems().length;

  if (countEl) countEl.textContent = `프로젝트 ${count}개`;
  if (emptyEl) emptyEl.hidden = count > 0;
}

function applyFilter() {
  document.querySelectorAll('#projects-grid .project-card').forEach((card) => {
    const match =
      state.active === 'all' || card.getAttribute('data-category') === state.active;

    if (match) {
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
}

/* -------------------------------------------------------------------- 카드 */

function renderCards() {
  const grid = document.getElementById('projects-grid');
  if (!grid) return;

  grid.innerHTML = state.items.map(cardTemplate).join('');

  grid.onclick = (e) => {
    const detailBtn = e.target.closest('.btn-project-details');
    if (detailBtn) openProjectModal(detailBtn.getAttribute('data-project-id'));
    // 주소가 없는 GitHub/데모 링크는 ui/placeholderLinks.js 가 처리합니다.
  };
}

/** 카드 상단의 브라우저 목업. 종류(type)에 따라 안쪽 모양이 달라집니다. */
function mockupTemplate(mockup = {}) {
  const inner = {
    code: `
      <div class="mockup-inner-preview">
        <div class="mockup-sidebar">
          <div class="mockup-line w40"></div>
          <div class="mockup-line w60"></div>
          <div class="mockup-line w50"></div>
        </div>
        <div class="mockup-code-area">
          <div class="mockup-code-header">
            <span class="pulse-status">${escapeHTML(mockup.statusText || '')}</span>
          </div>
          <div class="mockup-line w80"></div>
          <div class="mockup-line w70"></div>
          <div class="mockup-line w90"></div>
        </div>
      </div>`,

    timetable: `
      <div class="mockup-inner-preview timetable-preview">
        <div class="timetable-grid-mini">
          ${(mockup.cells || [])
            .map((cell, i) =>
              cell
                ? `<div class="tt-cell active-${Math.floor(i / 2) + 1}">${escapeHTML(cell)}</div>`
                : '<div class="tt-cell"></div>'
            )
            .join('')}
        </div>
      </div>`,

    eco: `
      <div class="mockup-inner-preview eco-preview">
        <div class="eco-badge-circle">${escapeHTML(mockup.badgeText || '')}</div>
        <div class="eco-progress-mini"><div class="eco-fill"></div></div>
      </div>`
  };

  return `
    <div class="mockup-banner ${escapeHTML(mockup.variant || '')}">
      <div class="mockup-header-bar">
        <span class="mockup-circle red"></span>
        <span class="mockup-circle yellow"></span>
        <span class="mockup-circle green"></span>
        <span class="mockup-url">${escapeHTML(mockup.url || '')}</span>
      </div>
      ${inner[mockup.type] || inner.code}
    </div>
  `;
}

/** 공개 주소가 있으면 진짜 링크로, 없으면 안내 메시지 버튼으로 만듭니다. */
function quickLinkTemplate(url, note, title, iconClass) {
  const href = url ? ` href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer"` : '';
  return `<a class="quick-link"${href} title="${escapeHTML(title)}" data-note="${escapeHTML(note || '')}">
            <i class="${iconClass}"></i>
          </a>`;
}

function cardTemplate(project) {
  const links = project.links || {};

  return `
    <div class="project-card glass-card reveal-on-scroll"
         data-category="${escapeHTML(project.category)}"
         data-project-id="${escapeHTML(project.id)}">
      <div class="project-media">
        ${mockupTemplate(project.mockup)}
        <div class="project-category-badge">${escapeHTML(project.categoryLabel)}</div>
      </div>

      <div class="project-content">
        <h3 class="project-title">${escapeHTML(project.title)}</h3>
        <p class="project-summary">${escapeHTML(project.summary)}</p>
        <div class="project-tags">
          ${(project.tags || []).map((t) => `<span class="p-tag">${escapeHTML(t)}</span>`).join('')}
        </div>
        <div class="project-footer">
          <button type="button" class="btn-project-details" data-project-id="${escapeHTML(project.id)}">
            <span>상세보기</span>
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </button>
          <div class="project-links-quick">
            ${quickLinkTemplate(links.repo, links.repoNote, 'GitHub 저장소', 'fa-brands fa-github')}
            ${quickLinkTemplate(links.demo, links.demoNote, '라이브 데모', 'fa-solid fa-globe')}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------------- 모달 */

function bindModal() {
  const modal = document.getElementById('project-modal');
  if (!modal || modal.dataset.bound === 'true') return;
  modal.dataset.bound = 'true';

  // 바깥을 클릭하거나 닫기 버튼을 누르면 닫습니다.
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-modal-close]')) {
      closeProjectModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
  });
}

export function openProjectModal(projectId) {
  const project = state.items.find((p) => p.id === projectId);
  const detail = project?.detail;
  const modal = document.getElementById('project-modal');
  if (!detail || !modal) return;

  setText('modal-category', detail.category);
  setText('modal-title', detail.title);
  setText('modal-desc', detail.desc);

  renderProjectMeta(project);

  const banner = document.getElementById('modal-banner');
  if (banner) {
    banner.style.background = detail.bannerBg;
    banner.innerHTML = `
      <div class="modal-banner-inner">
        <div class="modal-banner-icon"><i class="fa-solid fa-tree-city"></i></div>
        <div class="modal-banner-title">${escapeHTML(detail.title.split('-')[0].trim())}</div>
        <div class="modal-banner-sub">Green Smart City Innovation Project</div>
      </div>
    `;
  }

  const techList = document.getElementById('modal-tech-list');
  if (techList) {
    techList.innerHTML = (detail.tech || [])
      .map((t) => `<span class="p-tag">${escapeHTML(t)}</span>`)
      .join('');
  }

  const features = document.getElementById('modal-features');
  if (features) {
    features.innerHTML = (detail.features || [])
      .map((f) => `<li>${escapeHTML(f)}</li>`)
      .join('');
  }

  const links = project.links || {};
  applyModalLink('modal-github-link', links.repo, links.repoNote);
  applyModalLink('modal-demo-link', links.demo, links.demoNote);

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeProjectModal() {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/**
 * 관리자 페이지에서 입력한 역할·날짜·참여인원·참고사항을 모달에 표시합니다.
 * 비어 있는 항목은 아예 그리지 않습니다. ("역할: -" 같은 빈 줄을 남기지 않기 위해)
 */
function renderProjectMeta(project) {
  const container = document.getElementById('modal-meta');
  if (!container) return;

  const rows = [
    ['fa-user-gear', '내가 한 역할', project.role],
    ['fa-regular fa-calendar', '기간', project.period],
    ['fa-users', '참여인원', project.teamSize ? `${project.teamSize}명` : ''],
    ['fa-note-sticky', '참고사항', project.notes]
  ].filter(([, , value]) => value);

  container.hidden = rows.length === 0;

  container.innerHTML = rows
    .map(
      ([icon, label, value]) => `
      <div class="modal-meta-row">
        <span class="modal-meta-label"><i class="${icon.startsWith('fa-regular') ? icon : `fa-solid ${icon}`}"></i> ${escapeHTML(label)}</span>
        <span class="modal-meta-value">${escapeHTML(String(value))}</span>
      </div>`
    )
    .join('');
}

/**
 * 모달 하단 링크에 주소를 채웁니다.
 * 주소가 없으면 data-note 만 남겨, 눌렀을 때 안내 메시지가 뜨게 합니다.
 */
function applyModalLink(id, url, note) {
  const el = document.getElementById(id);
  if (!el) return;

  if (url) {
    el.href = url;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
    el.removeAttribute('data-note');
  } else {
    el.removeAttribute('href');
    el.removeAttribute('target');
    el.setAttribute('data-note', note || '아직 공개된 주소가 없습니다.');
  }
}
