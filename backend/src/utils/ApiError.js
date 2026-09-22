/**
 * 2. API 에러
 *
 * 서비스 코드에서 "잘못된 요청"이나 "없는 자원"을 알릴 때 이 에러를 던집니다.
 * 라우터가 아니라 errorHandler 미들웨어가 받아서 JSON 응답으로 바꿔줍니다.
 */
export class ApiError extends Error {
  /**
   * @param {number} status HTTP 상태 코드 (400, 404 ...)
   * @param {string} message 사용자에게 보여줄 메시지 (한국어)
   * @param {string} [code] 프론트에서 분기하기 좋은 짧은 코드
   */
  constructor(status, message, code) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || null;
  }

  static badRequest(message, code) {
    return new ApiError(400, message, code);
  }

  static notFound(message = '요청한 데이터를 찾을 수 없습니다.', code) {
    return new ApiError(404, message, code);
  }
}
