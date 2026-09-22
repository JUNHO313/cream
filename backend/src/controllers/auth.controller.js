/**
 * 25. 로그인 컨트롤러
 *
 * 세션 토큰은 응답 본문이 아니라 쿠키로 내려줍니다.
 * httpOnly 쿠키는 자바스크립트가 읽을 수 없어서,
 * 방명록 같은 곳에 악성 스크립트가 들어가도 토큰을 훔쳐갈 수 없습니다.
 */
import { config } from '../config.js';
import { authService } from '../services/auth.service.js';
import { readCookie } from '../middleware/requireAuth.js';

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.admin.secureCookie,
    maxAge: config.admin.sessionTtlMs,
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

    res.clearCookie(config.admin.cookieName, { path: '/' });
    res.json({ data: { loggedIn: false }, message: '로그아웃되었습니다.' });
  },

  /** 화면이 "지금 로그인 상태인가"를 확인할 때 부릅니다. */
  async status(req, res) {
    const token = readCookie(req, config.admin.cookieName);
    res.json({ data: { loggedIn: authService.isValidSession(token) } });
  }
};
