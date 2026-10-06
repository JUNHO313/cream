/**
 * 0-2. 관리자 "예약 관리" 페이지 진입점
 *
 * index.html(프로젝트 관리)과 같은 로그인 방식을 그대로 씁니다.
 * 다만 화면이 "목록 + 폼"이 아니라 "표 하나"라서 별도 페이지로 뺐습니다.
 */
import { adminApi } from './admin.api.js';
import { showToast } from '../../js/ui/toast.js';
import { escapeHTML } from '../../js/ui/dom.js';

const STATUS_LABELS = {
  received: '접수',
  confirmed: '확정',
  change_requested: '변경 요청',
  cancelled: '취소'
};

const STATUS_BADGE_CLASS = {
  received: 'badge-received',
  confirmed: 'badge-confirmed',
  change_requested: 'badge-change',
  cancelled: 'badge-cancelled'
};

const STATUS_ICON = {
  received: 'fa-inbox',
  confirmed: 'fa-circle-check',
  change_requested: 'fa-rotate',
  cancelled: 'fa-circle-xmark'
};

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

let items = [];

/* -------------------------------------------------------------- 화면 전환 */

function showLogin() {
  document.getElementById('login-screen').hidden = false;
  document.getElementById('workspace').hidden = true;
  document.getElementById('login-password').focus();
}

function showWorkspace() {
  document.getElementById('login-screen').hidden = true;
  document.getElementById('workspace').hidden = false;
}

/* ------------------------------------------------------------------ 시작 */

document.addEventListener('DOMContentLoaded', async () => {
  bindLogin();
  bindWorkspace();

  try {
    if (await adminApi.isLoggedIn()) {
      showWorkspace();
      await loadReservations();
    } else {
      showLogin();
    }
  } catch (err) {
    showLogin();
    showToast(err.message, 'error');
  }
});

/* ---------------------------------------------------------------- 로그인 */

function bindLogin() {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    errorEl.hidden = true;
    submitBtn.disabled = true;

    try {
      const message = await adminApi.login(input.value);
      input.value = '';

      showWorkspace();
      await loadReservations();
      showToast(message);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      input.select();
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function bindWorkspace() {
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-refresh').addEventListener('click', loadReservations);

  document.getElementById('reservation-table-body').addEventListener('change', (e) => {
    const select = e.target.closest('[data-status-select]');
    if (select) handleStatusChange(select.dataset.statusSelect, select.value);
  });
}

async function handleLogout() {
  try {
    const message = await adminApi.logout();
    items = [];
    showLogin();
    showToast(message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* -------------------------------------------------------------- 목록 불러오기 */

async function loadReservations() {
  try {
    const result = await adminApi.listReservations();
    items = result.items || [];
    renderTable();
  } catch (err) {
    handleAuthError(err);
  }
}

async function handleStatusChange(id, status) {
  try {
    const { reservation, message } = await adminApi.updateReservationStatus(id, status);

    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) items[index] = reservation;

    renderTable();
    showToast(message);
  } catch (err) {
    handleAuthError(err);
    await loadReservations(); // 실패했다면 화면을 원래 상태로 되돌립니다.
  }
}

/* ------------------------------------------------------------------ 렌더링 */

function renderTable() {
  const body = document.getElementById('reservation-table-body');
  const empty = document.getElementById('reservation-empty');
  const count = document.getElementById('reservation-count');

  count.textContent = String(items.length);

  if (items.length === 0) {
    body.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  body.innerHTML = items.map(rowTemplate).join('');
}

function rowTemplate(item) {
  const status = STATUS_LABELS[item.status] ? item.status : 'received';

  return `
    <tr>
      <td class="reservation-code">${escapeHTML(item.code)}</td>
      <td>
        <div>${escapeHTML(item.name)}</div>
        <div class="reservation-sub">${escapeHTML(item.email)}</div>
      </td>
      <td>${formatVisitTime(item.date, item.time)}</td>
      <td class="col-purpose">${escapeHTML(item.purpose)}</td>
      <td>${statusBadgeTemplate(status)}</td>
      <td>${statusSelectTemplate(item.id, status)}</td>
    </tr>
  `;
}

function statusBadgeTemplate(status) {
  return `
    <span class="badge ${STATUS_BADGE_CLASS[status]}">
      <i class="fa-solid ${STATUS_ICON[status]}"></i> ${STATUS_LABELS[status]}
    </span>
  `;
}

function statusSelectTemplate(id, currentStatus) {
  const options = Object.entries(STATUS_LABELS)
    .map(
      ([value, label]) =>
        `<option value="${value}" ${value === currentStatus ? 'selected' : ''}>${label}</option>`
    )
    .join('');

  return `
    <select class="reservation-status-select" data-status-select="${escapeHTML(id)}">
      ${options}
    </select>
  `;
}

function formatVisitTime(dateStr, timeStr) {
  const [y, m, d] = (dateStr || '').split('-').map(Number);
  if (!y || !m || !d) return `${escapeHTML(dateStr)} ${escapeHTML(timeStr)}`;

  const weekday = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
  return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}(${weekday}) ${escapeHTML(timeStr)}`;
}

/**
 * 로그인이 풀린 경우(세션 만료, 서버 재시작)에는 로그인 화면으로 돌려보냅니다.
 * 그 외의 오류는 그냥 메시지만 보여줍니다.
 */
function handleAuthError(err) {
  if (err.status === 401) {
    showLogin();
    showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'error');
    return;
  }
  showToast(err.message, 'error');
}
