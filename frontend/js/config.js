/**
 * 1. 프론트엔드 설정
 *
 * 백엔드 주소를 정하는 곳입니다. 보통은 그대로 두면 됩니다.
 *
 * 주소를 직접 지정하고 싶다면 index.html 의 <head> 에 이 한 줄을 넣으세요.
 *   <meta name="api-base" content="http://localhost:3000/api">
 */

function resolveApiBase() {
  // 1순위 — index.html 에 적어둔 값
  const meta = document.querySelector('meta[name="api-base"]');
  if (meta?.content) return meta.content.replace(/\/$/, '');

  // 2순위 — 파일을 직접 연 경우(file://)에는 로컬 서버를 가리킵니다.
  if (window.location.protocol === 'file:') {
    return 'http://localhost:3000/api';
  }

  // 기본 — 이 페이지를 준 서버가 곧 백엔드입니다.
  return '/api';
}

export const API_BASE_URL = resolveApiBase();

/** 브라우저에만 저장하는 값들의 이름 (서버에 보내지 않는 개인 설정) */
export const STORAGE_KEYS = {
  theme: 'jh_portfolio_theme',
  avatar: 'jh_custom_avatar',
  likedGuestbook: 'jh_guestbook_liked'
};
