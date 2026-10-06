/**
 * reservation.html (방문 예약 페이지) 전용 스크립트
 *
 * visit.html 과 마찬가지로 메인 SPA(index.html)와 별개로 동작하는 독립 페이지라서
 * main.js 파이프라인을 타지 않고, 이 페이지에 필요한 것만 바로 처리합니다.
 *
 * 흐름: 캘린더·시간·입력폼 → [예약하기] → 확인 모달 → [예약 확정하기] → 서버 저장 + 이메일 알림
 */
import { portfolioApi } from './api/portfolio.api.js';
import { showToast } from './ui/toast.js';

/**
 * Formspree 폼 주소 — 예약 내용을 junho122009@naver.com 으로 메일 전달합니다.
 * (받는 이메일은 Formspree 쪽 폼 설정에 저장되어 있어 여기서는 바꿀 수 없습니다.
 *  주소를 바꾸려면 Formspree 대시보드에서 새 폼을 만들고 이 값만 교체하면 됩니다.)
 *
 * 예약 저장(backend/data/reservations.json)과는 별개의 보조 알림이라,
 * 이 요청이 실패해도 예약 자체는 이미 서버에 저장된 뒤라 방문자에게는 알리지 않고
 * 콘솔에만 남깁니다.
 */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xbgdllyy';

function notifyFormspree(payload) {
  // Formspree 이 폼은 JSON 본문은 거부하고(Bad form post request),
  // multipart/form-data 요청만 받아줍니다. FormData 를 쓰면 브라우저가
  // Content-Type(boundary 포함)을 알아서 채워주므로 직접 지정하지 않습니다.
  const body = new FormData();
  body.append('name', payload.name);
  body.append('email', payload.email); // Formspree가 이 필드를 회신 주소(Reply-To)로 자동 사용합니다.
  body.append('date', payload.date);
  body.append('time', payload.time);
  body.append('purpose', payload.purpose);
  body.append('_subject', `[포트폴리오 방문예약] ${payload.name}님 · ${payload.date} ${payload.time}`);

  fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body
  }).catch((err) => {
    console.error('[방문 예약] 이메일 알림 전송에 실패했습니다. (예약 자체는 저장되었습니다)', err);
  });
}

/**
 * 대한민국 공휴일 (2026년).
 * backend/src/utils/holidaysKr.js 의 같은 이름 목록과 값을 맞춰야 합니다.
 * (화면에서 막아둔 날짜를 서버가 다시 한번 확인하는 구조라, 한쪽만 바꾸면
 * "화면에서는 막혔는데 서버는 통과시키는" 혹은 그 반대 상황이 생깁니다.)
 */
const KR_HOLIDAYS = new Set([
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18',
  '2026-03-02', '2026-05-05', '2026-05-25', '2026-06-03',
  '2026-06-06', '2026-08-15', '2026-08-17', '2026-09-24',
  '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-05',
  '2026-10-09', '2026-12-25'
]);

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 희망 시간 선택지: 13:00 ~ 18:00, 30분 단위 */
function buildTimeOptions() {
  const times = [];
  for (let minutes = 13 * 60; minutes <= 18 * 60; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    times.push(`${h}:${m}`);
  }
  return times;
}

const state = {
  viewYear: 0,
  viewMonth: 0, // 0-11
  selectedDate: null, // 'YYYY-MM-DD'
  selectedTime: ''
};

let els = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  initCalendar();
  initTimeSelect();
  initForm();
  initModal();
});

function cacheElements() {
  els = {
    calGrid: document.getElementById('reservation-calendar-grid'),
    calMonthLabel: document.getElementById('cal-month-label'),
    calPrev: document.getElementById('cal-prev-month'),
    calNext: document.getElementById('cal-next-month'),
    selectedDateBox: document.getElementById('reservation-selected-date'),
    timeSelect: document.getElementById('rsv-time'),
    name: document.getElementById('rsv-name'),
    email: document.getElementById('rsv-email'),
    emailError: document.getElementById('rsv-email-error'),
    purpose: document.getElementById('rsv-purpose'),
    consent: document.getElementById('rsv-consent'),
    submitBtn: document.getElementById('reservation-submit-btn'),
    form: document.getElementById('reservation-form'),
    modal: document.getElementById('reservation-review-modal'),
    confirmBtn: document.getElementById('reservation-confirm-btn')
  };
}

/* -------------------------------------------------------------------- 날짜 도우미 */

function toISODateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() {
  return toISODateLocal(new Date());
}

function formatSelectedDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const weekday = WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
  return `${y}년 ${m}월 ${d}일 (${weekday})`;
}

/* -------------------------------------------------------------------- 캘린더 */

function initCalendar() {
  const now = new Date();
  state.viewYear = now.getFullYear();
  state.viewMonth = now.getMonth();

  els.calPrev.addEventListener('click', () => changeMonth(-1));
  els.calNext.addEventListener('click', () => changeMonth(1));

  renderCalendar();
}

function changeMonth(delta) {
  state.viewMonth += delta;
  if (state.viewMonth < 0) {
    state.viewMonth = 11;
    state.viewYear -= 1;
  } else if (state.viewMonth > 11) {
    state.viewMonth = 0;
    state.viewYear += 1;
  }
  renderCalendar();
}

function renderCalendar() {
  const { viewYear, viewMonth } = state;

  els.calMonthLabel.textContent = `${viewYear}년 ${viewMonth + 1}월`;

  const now = new Date();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  els.calPrev.disabled = isCurrentMonth;

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = todayStr();

  els.calGrid.innerHTML = '';

  for (let i = 0; i < firstWeekday; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'cal-cell is-empty';
    els.calGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(viewYear, viewMonth, day);
    const dateStr = toISODateLocal(cellDate);
    const dayOfWeek = cellDate.getDay();

    const isPast = dateStr < today;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = KR_HOLIDAYS.has(dateStr);
    const disabled = isPast || isWeekend || isHoliday;

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-cell';
    cell.textContent = String(day);

    if (dateStr === today) cell.classList.add('is-today');
    if (dateStr === state.selectedDate) cell.classList.add('is-selected');

    if (disabled) {
      cell.classList.add('is-disabled');
      cell.disabled = true;
      cell.setAttribute('aria-disabled', 'true');
      cell.title = isHoliday ? '공휴일' : isWeekend ? '주말' : '지난 날짜';
    } else {
      cell.addEventListener('click', () => selectDate(dateStr));
    }

    els.calGrid.appendChild(cell);
  }
}

function selectDate(dateStr) {
  state.selectedDate = dateStr;
  els.selectedDateBox.textContent = formatSelectedDate(dateStr);
  renderCalendar();
  updateSubmitState();
}

/* -------------------------------------------------------------------- 시간 선택 */

function initTimeSelect() {
  buildTimeOptions().forEach((time) => {
    const opt = document.createElement('option');
    opt.value = time;
    opt.textContent = time;
    els.timeSelect.appendChild(opt);
  });

  els.timeSelect.addEventListener('change', () => {
    state.selectedTime = els.timeSelect.value;
    updateSubmitState();
  });
}

/* -------------------------------------------------------------------- 입력 폼 */

function initForm() {
  els.name.addEventListener('input', updateSubmitState);
  els.purpose.addEventListener('input', updateSubmitState);
  els.consent.addEventListener('change', updateSubmitState);
  els.email.addEventListener('input', () => {
    validateEmailField();
    updateSubmitState();
  });

  els.form.addEventListener('submit', handleFormSubmit);
  els.confirmBtn.addEventListener('click', handleConfirm);

  updateSubmitState();
}

function validateEmailField() {
  const value = els.email.value.trim();
  const isInvalid = value.length > 0 && !EMAIL_SHAPE.test(value);

  els.email.classList.toggle('is-invalid', isInvalid);
  els.emailError.hidden = !isInvalid;
  return !isInvalid;
}

function isEmailValid() {
  const value = els.email.value.trim();
  return value.length > 0 && EMAIL_SHAPE.test(value);
}

function updateSubmitState() {
  const ready =
    Boolean(state.selectedDate) &&
    Boolean(state.selectedTime) &&
    els.name.value.trim().length > 0 &&
    isEmailValid() &&
    els.purpose.value.trim().length > 0 &&
    els.consent.checked;

  els.submitBtn.disabled = !ready;
}

function handleFormSubmit(e) {
  e.preventDefault();
  if (els.submitBtn.disabled) return;

  document.getElementById('review-date').textContent = formatSelectedDate(state.selectedDate);
  document.getElementById('review-time').textContent = state.selectedTime;
  document.getElementById('review-name').textContent = els.name.value.trim();
  document.getElementById('review-email').textContent = els.email.value.trim();
  document.getElementById('review-purpose').textContent = els.purpose.value.trim();

  openModal();
}

/* -------------------------------------------------------------------- 확인 모달 */

function initModal() {
  els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal || e.target.closest('[data-modal-close]')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.modal.classList.contains('active')) closeModal();
  });
}

function openModal() {
  els.modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  els.modal.classList.remove('active');
  document.body.style.overflow = '';
}

async function handleConfirm() {
  const payload = {
    name: els.name.value.trim(),
    email: els.email.value.trim(),
    purpose: els.purpose.value.trim(),
    date: state.selectedDate,
    time: state.selectedTime
  };

  setConfirmBusy(true);

  try {
    const message = await portfolioApi.createReservation(payload);
    notifyFormspree(payload);
    showToast(message || '방문 예약 신청이 접수되었습니다.');
    closeModal();
    resetForm();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setConfirmBusy(false);
  }
}

function setConfirmBusy(busy) {
  els.confirmBtn.disabled = busy;
  els.confirmBtn.innerHTML = busy
    ? '<i class="fa-solid fa-circle-notch fa-spin"></i> 처리 중...'
    : '<i class="fa-solid fa-check"></i> 예약 확정하기';
}

function resetForm() {
  els.form.reset();
  state.selectedDate = null;
  state.selectedTime = '';
  els.selectedDateBox.textContent = '날짜를 선택해주세요';
  els.email.classList.remove('is-invalid');
  els.emailError.hidden = true;
  renderCalendar();
  updateSubmitState();
}
