/**
 * 4. DOM 도우미
 *
 * 여러 화면 모듈이 공통으로 쓰는 작은 함수들입니다.
 */

/**
 * 사용자가 입력한 글자를 HTML 에 그대로 넣기 전에 반드시 통과시킵니다.
 * 이걸 빼먹으면 방명록에 <script> 를 적어 넣는 공격이 가능해집니다.
 */
export function escapeHTML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** 저장된 ISO 시각을 화면 표기(2026.09.22)로 바꿉니다. */
export function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

/** 로딩 중임을 알리는 자리 표시 */
export function renderLoading(container, message = '불러오는 중입니다...') {
  if (!container) return;
  container.innerHTML = `
    <div class="state-message state-loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>${escapeHTML(message)}</span>
    </div>
  `;
}

/**
 * 불러오기에 실패했을 때 보여줄 안내.
 * 무엇이 잘못됐고 무엇을 하면 되는지까지 적어 둡니다.
 */
export function renderError(container, message, { onRetry } = {}) {
  if (!container) return;
  container.innerHTML = `
    <div class="state-message state-error">
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>${escapeHTML(message)}</span>
      ${onRetry ? '<button type="button" class="btn-text-sm state-retry">다시 시도</button>' : ''}
    </div>
  `;

  if (onRetry) {
    container.querySelector('.state-retry')?.addEventListener('click', onRetry);
  }
}

/**
 * 로컬 저장소 읽기/쓰기 (사용 불가 환경에서도 화면이 죽지 않도록 감쌉니다)
 *
 * get/set    : 배열·객체를 저장할 때 (JSON 으로 변환)
 * getRaw/setRaw : 문자열 하나를 그대로 저장할 때 (테마 이름, 이미지 주소 등)
 */
export const storage = {
  getRaw(key, fallback = null) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  },
  setRaw(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* 저장 공간이 꽉 찼거나 막힌 경우 — 화면 동작은 계속되게 둡니다. */
    }
  },
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* 사생활 보호 모드 등에서 저장이 막혀도 그냥 넘어갑니다. */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 무시 */
    }
  }
};
