/**
 * 16. 방명록 (서버 저장)
 *
 * 예전에는 브라우저(localStorage)에 저장해서 방문자마다 내용이 달랐습니다.
 * 이제는 서버에 저장하므로 누가 접속해도 같은 글이 보입니다.
 *
 * 다만 "내가 좋아요를 눌렀는지"는 로그인이 없으면 서버가 알 수 없으므로,
 * 개수는 서버가 세고 눌렀는지 여부만 브라우저가 기억합니다.
 */
import { portfolioApi } from '../api/portfolio.api.js';
import { escapeHTML, formatDate, renderError, renderLoading, storage } from '../ui/dom.js';
import { showToast } from '../ui/toast.js';
import { STORAGE_KEYS } from '../config.js';

let selectedAvatar = '🌱';
let entries = [];

/** 내가 좋아요를 누른 글의 id 목록 */
function likedIds() {
  const saved = storage.get(STORAGE_KEYS.likedGuestbook, []);
  return new Set(Array.isArray(saved) ? saved : []);
}

function setLiked(id, liked) {
  const ids = likedIds();
  if (liked) ids.add(id);
  else ids.delete(id);
  storage.set(STORAGE_KEYS.likedGuestbook, [...ids]);
}

/* ------------------------------------------------------------------ 초기화 */

export function initGuestbook(options = {}) {
  renderFormOptions(options);
  bindForm();
  bindFeed();
  bindResetButton();

  return loadEntries();
}

/** 아바타 버튼과 관계/소속 선택지를 서버 데이터로 만듭니다. */
function renderFormOptions({ avatars = [], badges = [] } = {}) {
  const picker = document.getElementById('avatar-picker');
  if (picker && avatars.length) {
    selectedAvatar = avatars[0];
    picker.innerHTML = avatars
      .map(
        (emoji, i) =>
          `<button type="button" class="avatar-opt${i === 0 ? ' active' : ''}" ` +
          `data-avatar="${escapeHTML(emoji)}">${escapeHTML(emoji)}</button>`
      )
      .join('');

    picker.onclick = (e) => {
      const btn = e.target.closest('.avatar-opt');
      if (!btn) return;

      picker.querySelectorAll('.avatar-opt').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      selectedAvatar = btn.getAttribute('data-avatar');
    };
  }

  const select = document.getElementById('gb-badge');
  if (select && badges.length) {
    select.innerHTML = badges
      .map(
        (b) => `<option value="${escapeHTML(b.value)}">${escapeHTML(b.label)}</option>`
      )
      .join('');
  }
}

function bindForm() {
  const form = document.getElementById('guestbook-form');
  const textarea = document.getElementById('gb-content');
  const counter = document.getElementById('gb-char-count');

  textarea?.addEventListener('input', () => {
    if (counter) counter.textContent = textarea.value.length;
  });

  form?.addEventListener('submit', handleSubmit);
}

function bindResetButton() {
  document.getElementById('btn-guestbook-reset')?.addEventListener('click', handleReset);
}

/* -------------------------------------------------------------------- 목록 */

async function loadEntries() {
  const feed = document.getElementById('guestbook-feed');
  renderLoading(feed, '방명록을 불러오는 중입니다...');

  try {
    const { items } = await portfolioApi.fetchGuestbook();
    entries = items;
    renderFeed();
  } catch (err) {
    renderError(feed, err.message, { onRetry: loadEntries });
    setCount('-');
  }
}

function setCount(value) {
  const el = document.getElementById('guestbook-count');
  if (el) el.textContent = value;
}

function renderFeed() {
  const feed = document.getElementById('guestbook-feed');
  if (!feed) return;

  setCount(entries.length);

  if (entries.length === 0) {
    feed.innerHTML = `
      <div class="state-message state-empty">
        <i class="fa-regular fa-comment-dots"></i>
        <span>첫 번째 방명록을 남겨주세요!</span>
      </div>
    `;
    return;
  }

  const liked = likedIds();
  feed.innerHTML = entries.map((entry) => itemTemplate(entry, liked.has(entry.id))).join('');
}

function itemTemplate(entry, isLiked) {
  return `
    <div class="gb-item" data-id="${escapeHTML(entry.id)}">
      <div class="gb-item-header">
        <div class="gb-author-info">
          <span class="gb-avatar">${escapeHTML(entry.avatar)}</span>
          <span class="gb-author-name">${escapeHTML(entry.author)}</span>
          <span class="gb-badge-tag">${escapeHTML(entry.badge)}</span>
        </div>
        <span class="gb-date">${escapeHTML(formatDate(entry.createdAt))}</span>
      </div>
      <div class="gb-text">${escapeHTML(entry.content)}</div>
      <div class="gb-item-footer">
        <button type="button" class="btn-like${isLiked ? ' liked' : ''}" data-action="like"
                aria-pressed="${isLiked}">
          <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
          <span>좋아요 <strong>${Number(entry.likes)}</strong></span>
        </button>
        <button type="button" class="btn-delete-gb" data-action="delete" title="메시지 삭제">
          <i class="fa-regular fa-trash-can"></i> 삭제
        </button>
      </div>
    </div>
  `;
}

/**
 * 좋아요·삭제 버튼은 목록을 다시 그릴 때마다 새로 만들어집니다.
 * 그래서 버튼마다 이벤트를 달지 않고, 목록 상자에서 한 번만 감지합니다.
 */
function bindFeed() {
  const feed = document.getElementById('guestbook-feed');
  if (!feed || feed.dataset.bound === 'true') return;
  feed.dataset.bound = 'true';

  feed.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;

    const id = button.closest('.gb-item')?.dataset.id;
    if (!id) return;

    if (button.dataset.action === 'like') handleLike(id, button);
    if (button.dataset.action === 'delete') handleDelete(id);
  });
}

/* ------------------------------------------------------------------ 동작들 */

async function handleSubmit(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const submitBtn = form.querySelector('button[type="submit"]');
  const authorInput = document.getElementById('gb-author');
  const contentInput = document.getElementById('gb-content');

  const payload = {
    author: authorInput?.value.trim(),
    badge: document.getElementById('gb-badge')?.value,
    avatar: selectedAvatar,
    content: contentInput?.value.trim()
  };

  if (!payload.author || !payload.content) {
    showToast('작성자와 내용을 모두 입력해주세요.', 'error');
    return;
  }

  // 연속 클릭으로 같은 글이 두 번 등록되지 않도록 잠급니다.
  setBusy(submitBtn, true, '등록 중...');

  try {
    const { entry, message } = await portfolioApi.createGuestbookEntry(payload);

    entries.unshift(entry);
    renderFeed();

    form.reset();
    const counter = document.getElementById('gb-char-count');
    if (counter) counter.textContent = '0';

    showToast(message || '방명록이 등록되었습니다.');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setBusy(submitBtn, false);
  }
}

async function handleLike(id, button) {
  const entry = entries.find((item) => item.id === id);
  if (!entry || button.disabled) return;

  const nextLiked = !likedIds().has(id);
  button.disabled = true;

  try {
    const updated = await portfolioApi.likeGuestbookEntry(id, nextLiked);
    entry.likes = updated.likes;
    setLiked(id, nextLiked);
    renderFeed();
  } catch (err) {
    showToast(err.message, 'error');
    button.disabled = false;
  }
}

async function handleDelete(id) {
  if (!confirm('이 방명록 메시지를 삭제하시겠습니까?')) return;

  try {
    const message = await portfolioApi.deleteGuestbookEntry(id);
    entries = entries.filter((entry) => entry.id !== id);
    setLiked(id, false);
    renderFeed();
    showToast(message || '메시지가 삭제되었습니다.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleReset() {
  if (!confirm('기본 샘플 방명록 데이터로 초기화하시겠습니까?')) return;

  try {
    const { data, message } = await portfolioApi.resetGuestbook();
    entries = data.items;
    storage.remove(STORAGE_KEYS.likedGuestbook);
    renderFeed();
    showToast(message || '방명록이 복원되었습니다.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/** 버튼을 잠그고 문구를 바꿉니다. (요청이 끝나면 원래대로) */
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
