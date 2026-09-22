/**
 * 3. 프로젝트 목록
 *
 * 왼쪽에 저장된 프로젝트를 보여줍니다.
 * 한 건을 누르면 오른쪽 폼에 불러와 수정할 수 있습니다.
 *
 * 각 항목에는 상태(공개/초안)를 배지로 표시합니다.
 * 공개인데 빠진 칸이 있는 옛 데이터에는 '보완 필요'도 함께 보여줍니다.
 */
import { escapeHTML, formatDate } from '../../js/ui/dom.js';

let items = [];
let selectedId = null;
let onSelect = () => {};

export function initList(handler) {
  onSelect = handler;

  document.getElementById('project-list').addEventListener('click', (e) => {
    const button = e.target.closest('.project-item');
    if (!button) return;

    onSelect(button.dataset.id);
  });
}

export function setItems(nextItems) {
  items = nextItems;
  render();
}

export function setSelected(id) {
  selectedId = id;
  render();
}

export function findItem(id) {
  return items.find((item) => item.id === id) || null;
}

function render() {
  const container = document.getElementById('project-list');
  const countEl = document.getElementById('project-count');

  countEl.textContent = items.length;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="list-empty">
        <i class="fa-regular fa-folder-open"></i>
        아직 저장된 프로젝트가 없습니다.<br>
        '새 프로젝트' 버튼으로 시작해보세요.
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(itemTemplate).join('');
}

function itemTemplate(project) {
  const isPublished = project.status === 'published';

  // 공개 상태인데 비어 있는 칸이 있으면 알려줍니다.
  const needsAttention = isPublished && project.missingFields?.length > 0;

  const statusBadge = isPublished
    ? '<span class="badge badge-published"><i class="fa-solid fa-globe"></i> 공개</span>'
    : '<span class="badge badge-draft"><i class="fa-regular fa-pen-to-square"></i> 초안</span>';

  const warnBadge = needsAttention
    ? `<span class="badge badge-warn" title="${escapeHTML(project.missingFields.join(', '))} 비어 있음">
         <i class="fa-solid fa-triangle-exclamation"></i> 보완 필요
       </span>`
    : '';

  // 비슷한 프로젝트가 있으면 어떤 것들과 겹치는지 마우스를 올려 확인할 수 있습니다.
  const duplicates = project.possibleDuplicates || [];
  const dupBadge = duplicates.length
    ? `<span class="badge badge-dup" title="비슷한 프로젝트: ${escapeHTML(duplicates.map((d) => d.title).join(', '))}">
         <i class="fa-solid fa-clone"></i> 중복 의심
       </span>`
    : '';

  return `
    <button type="button" class="project-item${project.id === selectedId ? ' active' : ''}"
            data-id="${escapeHTML(project.id)}">
      <div class="project-item-title">${escapeHTML(project.title || '(제목 없음)')}</div>
      <div class="project-item-meta">
        ${statusBadge}
        ${warnBadge}
        ${dupBadge}
        <span>${escapeHTML(formatDate(project.updatedAt))} 수정</span>
      </div>
    </button>
  `;
}
