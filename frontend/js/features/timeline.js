/**
 * 15. 여정(학력·활동) 섹션
 */
import { escapeHTML } from '../ui/dom.js';

export function renderTimeline(items = []) {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  container.innerHTML =
    '<div class="timeline-line"></div>' + items.map(itemTemplate).join('');
}

function itemTemplate(item) {
  return `
    <div class="timeline-item reveal-on-scroll">
      <div class="timeline-dot"><i class="${escapeHTML(item.icon)}"></i></div>
      <div class="timeline-content glass-card">
        <div class="timeline-date">
          <i class="fa-regular fa-calendar"></i> ${escapeHTML(item.date)}
        </div>
        <h3 class="timeline-title">${escapeHTML(item.title)}</h3>
        <p class="timeline-text">${escapeHTML(item.text)}</p>
        <div class="timeline-tags">
          ${(item.tags || []).map((t) => `<span>${escapeHTML(t)}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}
