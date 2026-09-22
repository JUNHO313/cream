/**
 * 5. 토스트 알림
 *
 * 화면 구석에 잠깐 떴다 사라지는 안내 메시지입니다.
 * 성공/실패에 따라 아이콘과 색이 달라집니다.
 */
import { escapeHTML } from './dom.js';

const ICONS = {
  success: { icon: 'fa-circle-check', color: 'var(--primary-neon)' },
  error: { icon: 'fa-circle-exclamation', color: '#ef4444' },
  info: { icon: 'fa-circle-info', color: 'var(--primary-neon)' }
};

/**
 * @param {string} message 보여줄 메시지
 * @param {'success'|'error'|'info'} [type]
 */
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const { icon, color } = ICONS[type] || ICONS.success;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.innerHTML =
    `<i class="fa-solid ${icon}" style="color: ${color};"></i> ` +
    `<span>${escapeHTML(message)}</span>`;

  container.appendChild(toast);

  // 실패 메시지는 읽을 시간이 더 필요하므로 조금 더 오래 띄웁니다.
  const duration = type === 'error' ? 5000 : 3500;

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/** 클립보드 복사 (안 되는 브라우저를 위한 대체 방법 포함) */
export function copyText(text, successMsg) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast(successMsg || '클립보드에 복사되었습니다.'))
      .catch(() => fallbackCopy(text, successMsg));
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
  } catch {
    showToast('복사에 실패했습니다. 직접 복사해주세요.', 'error');
  }

  textArea.remove();
}
