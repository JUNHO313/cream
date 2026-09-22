/**
 * 1. 프론트엔드 설정
 *
 * 백엔드 주소를 정하는 곳입니다. 대부분의 경우 손댈 필요가 없습니다.
 *
 * 왜 필요한가 — 이 사이트는 두 가지 방식으로 열릴 수 있습니다.
 *   ① 백엔드가 프론트도 함께 내려주는 경우 (로컬 `npm start`, 또는 Render 단독 배포)
 *      → 주소가 같으니 그냥 '/api' 로 부르면 됩니다.
 *   ② 프론트와 백엔드가 서로 다른 곳에 배포된 경우 (프론트: Vercel, 백엔드: Render)
 *      → 백엔드의 실제 주소를 알려줘야 합니다.
 *
 * 직접 지정하고 싶다면 index.html 의 <head> 에 이 한 줄을 넣으면 항상 그 값이 우선합니다.
 *   <meta name="api-base" content="https://내백엔드주소.onrender.com/api">
 */

/**
 * Vercel(*.vercel.app 또는 연결해둔 커스텀 도메인)에서 열렸을 때 사용할 백엔드 주소.
 *
 * ★ Render 에서 배포를 마치면 실제로 부여된 주소로 이 값을 바꿔주세요.
 *   Render 새 서비스 이름을 "cream-backend" 로 만들면 아래 주소 그대로 맞습니다.
 *   다른 이름을 썼다면 https://<서비스이름>.onrender.com/api 형태로 고치면 됩니다.
 */
const VERCEL_FRONTEND_BACKEND_URL = 'https://cream-backend.onrender.com/api';

function resolveApiBase() {
  // 1순위 — index.html 에 적어둔 값이 있으면 무조건 그걸 따릅니다.
  const meta = document.querySelector('meta[name="api-base"]');
  if (meta?.content) return meta.content.replace(/\/$/, '');

  // 2순위 — 파일을 더블클릭해서 직접 연 경우(file://)에는 로컬 서버를 가리킵니다.
  if (window.location.protocol === 'file:') {
    return 'http://localhost:3000/api';
  }

  // 3순위 — Vercel에 올라간 프론트는 정적 파일만 서비스하므로,
  //         백엔드는 반드시 다른 주소(Render 등)에 따로 있습니다.
  if (window.location.hostname.endsWith('.vercel.app')) {
    return VERCEL_FRONTEND_BACKEND_URL;
  }

  // 기본 — 이 페이지를 내려준 서버가 곧 백엔드입니다. (로컬 개발, Render 단독 배포 등)
  return '/api';
}

export const API_BASE_URL = resolveApiBase();

/** 브라우저에만 저장하는 값들의 이름 (서버에 보내지 않는 개인 설정) */
export const STORAGE_KEYS = {
  theme: 'jh_portfolio_theme',
  avatar: 'jh_custom_avatar',
  likedGuestbook: 'jh_guestbook_liked'
};
