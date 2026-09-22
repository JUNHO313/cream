/**
 * 10. 문의 서비스
 *
 * 연락처 폼으로 들어온 문의를 검사하고 저장합니다.
 *
 * 지금은 "저장"까지만 합니다. 메일 발송이나 알림을 붙이고 싶다면
 * receive() 안의 표시된 자리에 한 줄 추가하면 됩니다. (프론트는 안 고쳐도 됩니다.)
 */
import { contactRepository } from '../repositories/index.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config.js';

/** 아주 단순한 형식 검사입니다. 정확한 확인은 메일 발송 단계에서 이뤄집니다. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const contactService = {
  async receive(body) {
    const name = requireField(
      trimString(body?.name), '이름', 'NAME_REQUIRED', config.limits.contactNameMaxLength
    );
    const email = requireField(trimString(body?.email), '이메일', 'EMAIL_REQUIRED');
    const subject = requireField(
      trimString(body?.subject), '제목', 'SUBJECT_REQUIRED', config.limits.contactSubjectMaxLength
    );
    const message = requireField(
      trimString(body?.message), '내용', 'MESSAGE_REQUIRED', config.limits.contactMessageMaxLength
    );

    if (!EMAIL_SHAPE.test(email)) {
      throw ApiError.badRequest('이메일 형식이 올바르지 않습니다.', 'EMAIL_INVALID');
    }

    const saved = await contactRepository.create({ name, email, subject, message });

    // ── 나중에 메일 발송을 붙일 자리 ──────────────────────────────
    // await mailer.send({ to: config.ownerEmail, subject, text: message });
    // ─────────────────────────────────────────────────────────

    // 보낸 사람의 이메일 주소는 응답에 다시 싣지 않습니다. (필요 없는 정보는 돌려주지 않기)
    return { id: saved.id, name: saved.name, createdAt: saved.createdAt };
  }
};
