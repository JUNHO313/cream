/**
 * 2. 프로젝트 입력 폼
 *
 * 하는 일
 *  - 빈 폼(새 프로젝트) / 불러온 폼(수정)을 전환
 *  - 초안·공개에 따라 검사 강도를 바꿔가며 입력값 확인
 *  - 저장 버튼 문구를 '새로 저장' / '수정' 으로 바꿈
 *
 * 검사를 화면에서도 하는 이유는 서버까지 갔다 오지 않고 바로 알려주기 위해서입니다.
 * 진짜 방어는 서버(project.service.js)에서 다시 합니다.
 */
import { escapeHTML } from '../../js/ui/dom.js';

/**
 * 공개할 때 반드시 필요한 칸.
 * 서버의 REQUIRED_FOR_PUBLISH 와 같은 목록입니다. 한쪽만 바꾸면 안 됩니다.
 */
const REQUIRED_FOR_PUBLISH = [
  { key: 'title', label: '제목' },
  { key: 'role', label: '내가 한 역할' },
  { key: 'summary', label: '설명' },
  { key: 'period', label: '날짜' },
  { key: 'teamSize', label: '참여인원 수' }
];

const TEXT_FIELDS = ['title', 'role', 'summary', 'period', 'notes'];

/** 지금 수정 중인 프로젝트 id. null 이면 '새 프로젝트' 상태입니다. */
let editingId = null;

/* ------------------------------------------------------------------ 요소 찾기 */

const form = () => document.getElementById('project-form');
const field = (name) => document.getElementById(`f-${name}`);

function selectedStatus() {
  return form().querySelector('input[name="status"]:checked')?.value || 'draft';
}

/* -------------------------------------------------------------------- 상태 */

export function getEditingId() {
  return editingId;
}

/** 빈 폼으로 되돌립니다. (새 프로젝트 작성) */
export function resetForm() {
  editingId = null;
  form().reset();

  // reset() 은 라디오를 HTML 기본값(초안)으로 되돌립니다.
  clearAllErrors();
  updateCounters();
  syncLabels();
}

/** 기존 프로젝트를 폼에 채웁니다. (수정) */
export function fillForm(project) {
  editingId = project.id;

  field('title').value = project.title || '';
  field('role').value = project.role || '';
  field('summary').value = project.summary || '';
  field('period').value = project.period || '';
  field('teamSize').value = project.teamSize ?? '';
  field('notes').value = project.notes || '';

  const status = project.status === 'published' ? 'published' : 'draft';
  form().querySelector(`input[name="status"][value="${status}"]`).checked = true;

  clearAllErrors();
  updateCounters();
  syncLabels();
}

/** 폼에 입력된 값을 서버에 보낼 형태로 모읍니다. */
export function collectValues() {
  const values = { status: selectedStatus() };

  for (const name of TEXT_FIELDS) {
    values[name] = field(name).value.trim();
  }

  const teamSize = field('teamSize').value.trim();
  values.teamSize = teamSize === '' ? null : Number(teamSize);

  return values;
}

/* -------------------------------------------------------------------- 검사 */

/**
 * 입력값을 확인합니다.
 * @returns {{ok: boolean, firstErrorField: string|null}}
 */
export function validate() {
  clearAllErrors();

  const values = collectValues();
  const errors = [];

  // 초안이든 공개든 제목은 있어야 목록에서 구분할 수 있습니다.
  if (!values.title) {
    errors.push(['title', '제목을 입력해주세요.']);
  }

  if (values.teamSize !== null) {
    if (!Number.isInteger(values.teamSize) || values.teamSize < 1) {
      errors.push(['teamSize', '참여인원 수는 1 이상의 정수로 입력해주세요.']);
    } else if (values.teamSize > 1000) {
      errors.push(['teamSize', '참여인원 수는 1000명 이하로 입력해주세요.']);
    }
  }

  // 공개일 때만 나머지 칸을 확인합니다. 초안은 비어 있어도 됩니다.
  if (values.status === 'published') {
    for (const { key, label } of REQUIRED_FOR_PUBLISH) {
      if (key === 'title') continue; // 위에서 이미 확인

      const empty = values[key] === null || values[key] === '';
      if (empty) {
        errors.push([key, `공개하려면 ${label}을(를) 입력해주세요.`]);
      }
    }
  }

  errors.forEach(([key, message]) => showFieldError(key, message));

  return { ok: errors.length === 0, firstErrorField: errors[0]?.[0] || null };
}

function showFieldError(key, message) {
  const input = field(key);
  const errorEl = form().querySelector(`[data-error-for="${key}"]`);

  input?.classList.add('has-error');
  input?.setAttribute('aria-invalid', 'true');

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
}

function clearAllErrors() {
  form().querySelectorAll('.input').forEach((input) => {
    input.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
  });
  form().querySelectorAll('[data-error-for]').forEach((el) => {
    el.hidden = true;
    el.textContent = '';
  });
}

export function focusField(key) {
  field(key)?.focus();
}

/* ----------------------------------------------------------- 화면 문구 갱신 */

/**
 * 저장 버튼 문구와 제목을 지금 상태에 맞게 바꿉니다.
 *  - 새 프로젝트 → '새로 저장'
 *  - 기존 수정   → '수정'
 */
function syncLabels() {
  const isEditing = editingId !== null;
  const status = selectedStatus();

  document.getElementById('btn-save-label').textContent = isEditing ? '수정' : '새로 저장';
  document.getElementById('form-title').textContent = isEditing ? '프로젝트 수정' : '새 프로젝트';

  document.getElementById('form-hint').textContent =
    status === 'published'
      ? '공개 상태입니다. 참고사항을 뺀 모든 칸이 필요합니다.'
      : '초안 상태입니다. 빈칸이 있어도 저장됩니다.';

  document.getElementById('btn-delete').hidden = !isEditing;
  document.getElementById('btn-cancel').hidden = !isEditing;
}

/** 글자 수 표시 갱신 */
function updateCounters() {
  form().querySelectorAll('[data-count-for]').forEach((el) => {
    const name = el.getAttribute('data-count-for');
    el.textContent = field(name)?.value.length ?? 0;
  });
}

/* ------------------------------------------------------------------ 초기화 */

export function initForm() {
  const f = form();

  // 글자 수 표시
  f.addEventListener('input', (e) => {
    if (e.target.matches('[maxlength]')) updateCounters();

    // 고치기 시작하면 그 칸의 오류 표시는 지웁니다.
    if (e.target.classList.contains('has-error')) {
      e.target.classList.remove('has-error');
      e.target.removeAttribute('aria-invalid');

      const key = e.target.name;
      const errorEl = f.querySelector(`[data-error-for="${key}"]`);
      if (errorEl) errorEl.hidden = true;
    }
  });

  // 초안 ↔ 공개를 바꾸면 안내 문구도 함께 바뀝니다.
  f.addEventListener('change', (e) => {
    if (e.target.name === 'status') {
      clearAllErrors();
      syncLabels();
    }
  });

  resetForm();
}

/** 저장 중에는 버튼을 잠급니다. (두 번 눌러 중복 저장되는 것 방지) */
export function setSaving(saving) {
  const btn = document.getElementById('btn-save');
  const label = document.getElementById('btn-save-label');

  btn.disabled = saving;
  if (saving) {
    btn.dataset.previousLabel = label.textContent;
    label.textContent = '저장 중...';
  } else if (btn.dataset.previousLabel) {
    label.textContent = btn.dataset.previousLabel;
    delete btn.dataset.previousLabel;
  }
}

/** 서버가 보낸 오류를 해당 칸에 표시합니다. (코드로 어느 칸인지 알아냅니다) */
export function showServerError(error) {
  const byCode = {
    TITLE_REQUIRED: 'title',
    TEAM_SIZE_INVALID: 'teamSize',
    TEAM_SIZE_RANGE: 'teamSize',
    TITLE_TOO_LONG: 'title',
    ROLE_TOO_LONG: 'role',
    SUMMARY_TOO_LONG: 'summary',
    PERIOD_TOO_LONG: 'period',
    NOTES_TOO_LONG: 'notes'
  };

  const key = byCode[error.code];
  if (!key) return false;

  showFieldError(key, escapeHTML(error.message));
  focusField(key);
  return true;
}
