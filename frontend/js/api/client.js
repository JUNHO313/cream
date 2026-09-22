/**
 * 2. API 통신 담당
 *
 * fetch 를 직접 쓰지 않고 이 파일을 거치게 해서,
 * 주소 조합 · JSON 변환 · 에러 메시지 처리를 한 곳에서만 하도록 했습니다.
 *
 * 서버가 꺼져 있을 때도 화면이 "그냥 멈춘 것처럼" 보이지 않도록,
 * 실패 원인을 사람이 읽을 수 있는 한국어 메시지로 바꿔 던집니다.
 */
import { API_BASE_URL } from '../config.js';

/** 서버가 돌려준 에러를 담는 전용 에러 타입 */
export class ApiRequestError extends Error {
  constructor(message, { status = 0, code = null } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }

  /** 서버에 아예 닿지 못한 경우 (서버가 꺼져 있거나 네트워크 문제) */
  get isOffline() {
    return this.status === 0;
  }
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const url = `${API_BASE_URL}${path}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      // 관리자 로그인 쿠키를 함께 보냅니다. (같은 주소에서 열었을 때의 기본값과 동일)
      credentials: 'same-origin',
      signal
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiRequestError(
      '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.',
      { status: 0, code: 'NETWORK_ERROR' }
    );
  }

  // 본문이 없는 응답(204 등)도 있으므로 방어적으로 읽습니다.
  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    throw new ApiRequestError(
      payload?.error?.message || `요청에 실패했습니다. (HTTP ${response.status})`,
      { status: response.status, code: payload?.error?.code || null }
    );
  }

  return payload;
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' })
};
