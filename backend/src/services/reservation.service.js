/**
 * 10-2. 방문 예약 서비스
 *
 * 방문 예약 페이지에서 들어온 내용을 검사하고 저장합니다.
 * 화면(js/reservationPage.js)에서 이미 날짜·시간·필수 입력을 막아두지만,
 * 요청을 직접 보내는 경우까지 대비해 서버에서도 같은 규칙을 다시 확인합니다.
 *
 * 지금은 "저장"까지만 합니다. 메일 발송이나 캘린더 연동을 붙이고 싶다면
 * submit() 안의 표시된 자리에 한 줄 추가하면 됩니다. (프론트는 안 고쳐도 됩니다.)
 */
import { reservationRepository } from '../repositories/index.js';
import { ApiError } from '../utils/ApiError.js';
import { isKrHoliday } from '../utils/holidaysKr.js';
import { config } from '../config.js';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/** 처리 상태 (관리자 페이지 "예약 관리"에서 바꿉니다) */
const STATUSES = ['received', 'confirmed', 'change_requested', 'cancelled'];

/** 13:00 ~ 18:00, 30분 단위 (화면의 시간 드롭다운과 같은 값이어야 합니다) */
const ALLOWED_TIMES = buildAllowedTimes();

function buildAllowedTimes() {
  const times = [];
  for (let minutes = 13 * 60; minutes <= 18 * 60; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    times.push(`${h}:${m}`);
  }
  return times;
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireField(value, label, code, maxLength) {
  if (!value) {
    throw ApiError.badRequest(`${label}을(를) 입력해주세요.`, code);
  }
  if (maxLength && value.length > maxLength) {
    throw ApiError.badRequest(
      `${label}은(는) ${maxLength}자 이내로 입력해주세요.`,
      `${code}_TOO_LONG`
    );
  }
  return value;
}

/** 오늘 날짜(한국 시간 기준)를 'YYYY-MM-DD' 형태로 돌려줍니다. */
function todayInKst() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

/** 토·일요일인지 확인합니다. (시간대와 무관하게 달력 날짜만 봅니다) */
function isWeekend(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 || day === 6;
}

function validateDate(dateStr) {
  requireField(dateStr, '방문 날짜', 'DATE_REQUIRED');

  if (!DATE_SHAPE.test(dateStr)) {
    throw ApiError.badRequest('날짜 형식이 올바르지 않습니다.', 'DATE_INVALID');
  }
  if (dateStr < todayInKst()) {
    throw ApiError.badRequest('지난 날짜는 예약할 수 없습니다.', 'DATE_PAST');
  }
  if (isWeekend(dateStr)) {
    throw ApiError.badRequest('주말에는 예약할 수 없습니다. 평일을 선택해주세요.', 'DATE_WEEKEND');
  }
  if (isKrHoliday(dateStr)) {
    throw ApiError.badRequest('공휴일에는 예약할 수 없습니다. 다른 날짜를 선택해주세요.', 'DATE_HOLIDAY');
  }
  return dateStr;
}

function validateTime(timeStr) {
  requireField(timeStr, '희망 시간', 'TIME_REQUIRED');

  if (!ALLOWED_TIMES.includes(timeStr)) {
    throw ApiError.badRequest(
      '희망 시간은 13:00 ~ 18:00 사이에서 30분 단위로 선택해주세요.',
      'TIME_INVALID'
    );
  }
  return timeStr;
}

/**
 * 예약 번호를 만듭니다. 같은 사람이 여러 번 방문 예약을 할 수 있어서,
 * 이름/이메일만으로는 구분이 안 됩니다 — 그래서 방문 날짜·시간까지 합쳐 만듭니다.
 * (저장하지 않고 그때그때 계산합니다. 이름/이메일/날짜/시간에서 그대로 다시 만들어낼 수 있기 때문입니다.)
 *
 * 예) 2026-10-13 14:00 / junho122009@naver.com → "20261013-1400-junho122009"
 */
function buildReservationCode({ email, date, time }) {
  const datePart = (date || '').replace(/-/g, '');
  const timePart = (time || '').replace(':', '');
  const emailLocal = (email || '')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10);

  return `${datePart}-${timePart}-${emailLocal}`;
}

function withCode(reservation) {
  return { ...reservation, code: buildReservationCode(reservation) };
}

export const reservationService = {
  async submit(body) {
    const name = requireField(
      trimString(body?.name), '이름', 'NAME_REQUIRED', config.limits.reservationNameMaxLength
    );
    const email = requireField(trimString(body?.email), '이메일', 'EMAIL_REQUIRED');
    const purpose = requireField(
      trimString(body?.purpose), '방문 목적', 'PURPOSE_REQUIRED', config.limits.reservationPurposeMaxLength
    );

    if (!EMAIL_SHAPE.test(email)) {
      throw ApiError.badRequest('이메일 형식이 올바르지 않습니다.', 'EMAIL_INVALID');
    }

    const date = validateDate(trimString(body?.date));
    const time = validateTime(trimString(body?.time));

    const saved = await reservationRepository.create({ name, email, purpose, date, time });

    // ── 나중에 메일 발송·캘린더 연동을 붙일 자리 ──────────────────────
    // await mailer.send({ to: config.ownerEmail, subject: '새 방문 예약', text: ... });
    // ─────────────────────────────────────────────────────────────

    return { id: saved.id, date: saved.date, time: saved.time, createdAt: saved.createdAt };
  },

  /** 관리자 페이지 "예약 관리" 목록 — 방문 날짜·시간이 가까운 순서. */
  async listForAdmin() {
    const rows = await reservationRepository.findAll();

    const items = rows
      .map(withCode)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    return { items, total: items.length };
  },

  /** 처리 상태를 바꿉니다. (접수 / 확정 / 변경 요청 / 취소) */
  async updateStatus(id, status) {
    if (!STATUSES.includes(status)) {
      throw ApiError.badRequest(
        '처리 상태는 접수/확정/변경 요청/취소 중에서만 선택할 수 있습니다.',
        'STATUS_INVALID'
      );
    }

    const updated = await reservationRepository.updateStatus(id, status);
    if (!updated) {
      throw ApiError.notFound('해당 예약을 찾을 수 없습니다.', 'RESERVATION_NOT_FOUND');
    }
    return withCode(updated);
  }
};
