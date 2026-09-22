/**
 * 23. 로그인 확인 미들웨어
 *
 * 관리자 API 앞에 붙여서, 로그인하지 않은 요청을 막습니다.
 * 쿠키 파싱은 줄 하나면 되므로 별도 라이브러리를 쓰지 않았습니다.
 */
import { config } from '../config.js';
import { authService } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';

/** "a=1; b=2" 형태의 쿠키 문자열에서 원하는 값을 꺼냅니다. */
export function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;

    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return null;
}

export function requireAuth(req, res, next) {
  const token = readCookie(req, config.admin.cookieName);

  if (!authService.isValidSession(token)) {
    return next(
      new ApiError(401, '로그인이 필요합니다. 다시 로그인해주세요.', 'UNAUTHORIZED')
    );
  }

  req.adminToken = token;
  next();
}
