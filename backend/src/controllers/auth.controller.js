/**
 * 25. 로그인 컨트롤러
 *
 * 세션 토큰은 응답 본문이 아니라 쿠키로 내려줍니다.
 * httpOnly 쿠키는 자바스크립트가 읽을 수 없어서,
 * 방명록 같은 곳에 악성 스크립트가 들어가도 토큰을 훔쳐갈 수 없습니다.
 *
 * ★ 이 쿠키에는 일부러 maxAge(유효기간)를 주지 않습니다.
 *   유효기간이 없는 쿠키는 "세션 쿠키"가 되어 브라우저 디스크에 저장되지 않고,
 *   브라우저를 완전히 종료하면 함께 사라집니다. (탭 하나만 닫는 것으로는 안 사라지고,
 *   같은 브라우저의 다른 창들도 함께 닫아야 사라집니다 — 브라우저의 표준 동작입니다.
 *   단, "이전 세션 복원" 설정을 켜둔 브라우저는 재시작 후에도 세션 쿠키를 되살릴 수 있습니다.)
 *
 *   서버 쪽에서도 12시간이 지나면 세션을 무효화합니다(services/auth.service.js).
 *   이건 브라우저를 계속 안 끄고 켜둔 채로 방치했을 때를 대비한 이중 안전장치입니다.
 *
 * ★ 프론트와 백엔드가 서로 다른 도메인일 때(예: Vercel + Render) 쿠키 속성이 달라집니다.
 *   브라우저는 SameSite=Lax 쿠키를 "다른 도메인으로 가는" fetch 요청에는 절대 실어주지
 *   않습니다. 그래서 CORS_ORIGIN 이 특정 주소로 좁혀져 있으면(=다른 도메인 배포로 판단)
 *   SameSite=None 으로 바꿉니다. 단, SameSite=None 은 Secure(HTTPS 전용)가 반드시
 *   같이 있어야 브라우저가 받아줍니다(HTTPS가 아니면 아예 쿠키가 저장되지 않습니다) —
 *   Render·Vercel 모두 기본으로 HTTPS 이므로 실제 배포에서는 문제없습니다.
 */
import { config } from '../config.js';
import { authService } from '../services/auth.service.js';
import { readCookie } from '../middleware/requireAuth.js';

function sessionCookieOptions() {
  // app.js 의 CORS 판단과 같은 기준을 씁니다: 출처를 좁혔다 = 다른 도메인 배포.
  const isCrossSiteDeploy = config.corsOrigin !== '*';

  return {
    httpOnly: true,
    sameSite: isCrossSiteDeploy ? 'none' : 'lax',
    // SameSite=None 은 Secure 없이는 브라우저가 거부하므로 강제로 켭니다.
    secure: isCrossSiteDeploy ? true : config.admin.secureCookie,
    // maxAge 를 주지 않음 = 세션 쿠키. 절대 여기에 유효기간을 추가하지 마세요.
    path: '/'
  };
}

export const authController = {
  async login(req, res) {
    // 접속지 구분용. 프록시 뒤라면 실제 주소가 아닐 수 있지만, 무차별 대입을 늦추는 용도로 충분합니다.
    const clientKey = req.ip || 'unknown';
    const token = authService.login(req.body?.password, clientKey);

    res.cookie(config.admin.cookieName, token, sessionCookieOptions());
    res.json({ data: { loggedIn: true }, message: '로그인되었습니다.' });
  },

  async logout(req, res) {
    authService.logout(readCookie(req, config.admin.cookieName));

    // 지울 때도 만들 때와 같은 속성(sameSite, secure)을 줍니다.
    // 브라우저에 따라 속성이 다르면 같은 쿠키로 안 보고 지우지 못하는 경우가 있어서입니다.
    res.clearCookie(config.admin.cookieName, sessionCookieOptions());
    res.json({ data: { loggedIn: false }, message: '로그아웃되었습니다.' });
  },

  /** 화면이 "지금 로그인 상태인가"를 확인할 때 부릅니다. */
  async status(req, res) {
    const token = readCookie(req, config.admin.cookieName);
    res.json({ data: { loggedIn: authService.isValidSession(token) } });
  }
};
