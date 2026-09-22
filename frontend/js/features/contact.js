/**
 * 17. 연락처 문의 폼
 *
 * 예전에는 "접수되었습니다" 안내만 띄우고 실제로는 아무 일도 하지 않았습니다.
 * 이제는 서버로 보내 backend/data/contacts.json 에 저장됩니다.
 */
import { portfolioApi } from '../api/portfolio.api.js';
import { escapeHTML } from '../ui/dom.js';
import { showToast, copyText } from '../ui/toast.js';

export function initContactForm() {
  document.getElementById('contact-form')?.addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const submitBtn = form.querySelector('button[type="submit"]');

  const payload = {
    name: document.getElementById('c-name')?.value.trim(),
    email: document.getElementById('c-email')?.value.trim(),
    subject: document.getElementById('c-subject')?.value.trim(),
    message: document.getElementById('c-message')?.value.trim()
  };

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    showToast('모든 항목을 올바르게 입력해주세요.', 'error');
    return;
  }

  setBusy(submitBtn, true, '보내는 중...');

  try {
    const message = await portfolioApi.sendContact(payload);
    form.reset();
    showToast(message || '문의가 접수되었습니다.');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setBusy(submitBtn, false);
  }
}

/**
 * 이메일·학과·지역 복사 버튼.
 * 복사할 값은 서버에서 받은 프로필에서 만들어, 화면에 값을 중복해 적지 않습니다.
 */
export function initCopyButtons(profile = {}) {
  const targets = {
    'copy-email': {
      text: profile.email,
      message: `이메일 주소(${profile.email})가 복사되었습니다!`
    },
    'quick-copy-email': {
      text: profile.email,
      message: `이메일(${profile.email})이 복사되었습니다!`
    },
    'copy-affiliation': {
      text: [profile.department, profile.studentId, profile.name].filter(Boolean).join(' '),
      message: '학번/학과/이름이 복사되었습니다!'
    },
    'copy-location': {
      text: profile.location,
      message: '거주지가 복사되었습니다!'
    }
  };

  for (const [id, { text, message }] of Object.entries(targets)) {
    const el = document.getElementById(id);
    if (!el || !text) continue;

    el.addEventListener('click', (e) => {
      e.preventDefault();
      copyText(text, message);
    });
  }
}

function setBusy(button, busy, busyLabel) {
  if (!button) return;

  if (busy) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML =
      `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>${escapeHTML(busyLabel)}</span>`;
  } else {
    button.disabled = false;
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
      delete button.dataset.originalHtml;
    }
  }
}
