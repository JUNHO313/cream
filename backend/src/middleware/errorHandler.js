/**
 * 18. 에러 처리 미들웨어
 *
 * 라우터 어디에서 에러가 나든 마지막에 여기로 모입니다.
 * 응답 형태를 { error: { message, code } } 하나로 통일해서
 * 프론트가 항상 같은 방식으로 메시지를 꺼내 쓸 수 있게 합니다.
 */
import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: `요청하신 주소를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
}

// eslint-disable-next-line no-unused-vars -- Express 는 인자 4개짜리를 에러 핸들러로 인식합니다.
export function errorHandler(err, req, res, next) {
  const isKnown = err instanceof ApiError;
  const status = isKnown ? err.status : 500;

  // 예상하지 못한 에러는 원인을 찾을 수 있도록 서버 로그에 남깁니다.
  if (!isKnown) {
    console.error('[서버 오류]', err);
  }

  res.status(status).json({
    error: {
      message: isKnown
        ? err.message
        : '서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      code: isKnown ? err.code : 'INTERNAL_ERROR'
    }
  });
}
