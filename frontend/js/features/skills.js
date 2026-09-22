/**
 * 13. 스킬 섹션
 *
 * 서버에서 받은 목록으로 탭과 카드를 만듭니다.
 * 기술을 추가하려면 backend/data/content.json 의 skills 배열에만 넣으면 됩니다.
 */
import { escapeHTML } from '../ui/dom.js';

let state = { filters: [], items: [], active: 'all' };

export function renderSkills({ filters = [], items = [] } = {}) {
  state = { filters, items, active: 'all' };

  renderTabs();
  renderCards();
}

function renderTabs() {
  const container = document.getElementById('skills-filter-container');
  if (!container) return;

  container.innerHTML = state.filters
    .map(
      (f) => `
      <button type="button" class="skill-tab-btn${f.key === state.active ? ' active' : ''}"
              data-filter="${escapeHTML(f.key)}">
        <i class="${escapeHTML(f.icon)}"></i> ${escapeHTML(f.label)}
      </button>`
    )
    .join('');

  // 버튼마다 이벤트를 다는 대신, 감싸는 상자에서 한 번만 감지합니다.
  container.onclick = (e) => {
    const btn = e.target.closest('.skill-tab-btn');
    if (!btn) return;

    state.active = btn.getAttribute('data-filter');
    container.querySelectorAll('.skill-tab-btn').forEach((b) => {
      b.classList.toggle('active', b === btn);
    });
    applyFilter();
  };
}

function renderCards() {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  grid.innerHTML = state.items.map(cardTemplate).join('');
}

function cardTemplate(skill) {
  return `
    <div class="skill-card glass-card" data-category="${escapeHTML(skill.category)}">
      <div class="skill-header">
        <div class="skill-icon-wrapper ${escapeHTML(skill.iconTheme || '')}">
          <i class="${escapeHTML(skill.icon)}"></i>
        </div>
        <div class="skill-title-wrap">
          <h3 class="skill-name">${escapeHTML(skill.name)}</h3>
          <span class="skill-level-text">숙련도: ${escapeHTML(skill.level)}</span>
        </div>
        <span class="skill-percent">${Number(skill.percent)}%</span>
      </div>
      <div class="skill-bar-track">
        <div class="skill-bar-fill" style="--percent: ${Number(skill.percent)}%;"></div>
      </div>
      <p class="skill-desc">${escapeHTML(skill.desc)}</p>
    </div>
  `;
}

function applyFilter() {
  document.querySelectorAll('#skills-grid .skill-card').forEach((card) => {
    const match =
      state.active === 'all' || card.getAttribute('data-category') === state.active;

    if (match) {
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
}
