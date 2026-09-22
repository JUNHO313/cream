/**
 * 9. 방명록 서비스
 *
 * "무엇이 올바른 입력인가", "무엇을 돌려줄 것인가" 같은 규칙만 담당합니다.
 * 저장 방식(JSON이냐 DB냐)은 전혀 모릅니다. repositories 가 알아서 합니다.
 */
import { guestbookRepository, contentRepository } from '../repositories/index.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config.js';

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 입력값을 검사하고, 저장 가능한 형태로 정리해서 돌려줍니다.
 * 허용 목록은 화면 폼과 같은 출처(content.json)에서 읽으므로,
 * 선택지를 늘려도 서버 코드를 고칠 필요가 없습니다.
 */
async function validateEntry(body) {
  const options = await contentRepository.getGuestbookOptions();
  const allowedBadges = (options?.badges || []).map((b) => b.value);
  const allowedAvatars = options?.avatars || [];

  const author = trimString(body?.author);
  const content = trimString(body?.content);
  const badge = trimString(body?.badge) || allowedBadges[0] || '방문자';
  const avatar = trimString(body?.avatar) || allowedAvatars[0] || '🌱';

  if (!author) {
    throw ApiError.badRequest('작성자를 입력해주세요.', 'AUTHOR_REQUIRED');
  }
  if (author.length > config.limits.authorMaxLength) {
    throw ApiError.badRequest(
      `작성자는 ${config.limits.authorMaxLength}자 이내로 입력해주세요.`,
      'AUTHOR_TOO_LONG'
    );
  }
  if (!content) {
    throw ApiError.badRequest('내용을 입력해주세요.', 'CONTENT_REQUIRED');
  }
  if (content.length > config.limits.contentMaxLength) {
    throw ApiError.badRequest(
      `내용은 ${config.limits.contentMaxLength}자 이내로 입력해주세요.`,
      'CONTENT_TOO_LONG'
    );
  }
  if (allowedBadges.length && !allowedBadges.includes(badge)) {
    throw ApiError.badRequest('선택할 수 없는 구분입니다.', 'BADGE_INVALID');
  }
  if (allowedAvatars.length && !allowedAvatars.includes(avatar)) {
    throw ApiError.badRequest('선택할 수 없는 아이콘입니다.', 'AVATAR_INVALID');
  }

  return { author, badge, avatar, content };
}

export const guestbookService = {
  async list() {
    const items = await guestbookRepository.findAll();
    return { items, total: items.length };
  },

  async add(body) {
    const entry = await validateEntry(body);
    return guestbookRepository.create(entry);
  },

  /**
   * 좋아요 / 좋아요 취소.
   * "누가 눌렀는지"는 로그인이 없으면 서버가 알 수 없습니다.
   * 그래서 서버는 개수만 세고, 눌렀는지 여부는 브라우저가 기억합니다.
   */
  async like(id, liked) {
    const updated = await guestbookRepository.changeLikes(id, liked ? 1 : -1);
    if (!updated) {
      throw ApiError.notFound('해당 방명록을 찾을 수 없습니다.', 'GUESTBOOK_NOT_FOUND');
    }
    return updated;
  },

  async remove(id) {
    const removed = await guestbookRepository.remove(id);
    if (!removed) {
      throw ApiError.notFound('해당 방명록을 찾을 수 없습니다.', 'GUESTBOOK_NOT_FOUND');
    }
  },

  async resetToSample() {
    const items = await guestbookRepository.resetToSeed();
    return { items, total: items.length };
  }
};
