/**
 * 3. 비동기 라우터 감싸개
 *
 * async 컨트롤러 안에서 에러가 나면 그냥 두면 응답이 멈춘 채로 남습니다.
 * 이 함수로 감싸면 에러가 next() 로 넘어가 errorHandler 가 처리합니다.
 *
 * 사용법:  router.get('/x', asyncHandler(controller.x))
 */
export function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
