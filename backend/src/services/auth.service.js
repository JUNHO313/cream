/**
 * 22. 관리자 로그인
 *
 * 로그인에 성공하면 임의의 긴 문자열(세션 토큰)을 만들어 쿠키로 내려줍니다.
 * 이후 요청은 그 쿠키를 가지고 오고, 서버는 보관 중인 토큰과 맞는지 확인합니다.
 *
 * 토큰은 서버 메모리에 둡니다.
 *  → 서버를 다시 켜면 로그아웃됩니다. (혼자 쓰는 관리자 화면이라 충분합니다)
 *  → 여러 대로 늘리거나 로그인 유지가 필요해지면 DB나 Redis 로 옮기면 됩니다.
 *
 * 비밀번호는 initAdminAuth() 에서 정해집니다. 코드에는 적혀 있지 않습니다.
 */
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { generatePassword, hashPassword, verifyPassword } from '../utils/password.js';
import { readJson, writeJson } from '../repositories/json/jsonStore.js';
import { ApiError } from '../utils/ApiError.js';

/** 보관 중인 비밀번호 해시 { salt, hash }. initAdminAuth() 가 채웁니다. */
let credentials = null;

/** 토큰 → 만료 시각 */
const sessions = new Map();

/** 접속지 → 로그인 실패 기록 */
const loginAttempts = new Map();

/* ------------------------------------------------------------- 비밀번호 준비 */

/**
 * 서버를 켤 때 한 번 부릅니다. 비밀번호를 정하고 해시만 보관합니다.
 *
 * @returns {{source: 'env'|'file'|'generated', password: string|null}}
 *   generated 일 때만 password 에 값이 들어옵니다. (터미널에 한 번 보여주기 위함)
 */
export async function initAdminAuth() {
  // 1) 환경변수로 받은 경우 — 파일에 아무것도 남기지 않습니다.
  if (config.admin.password) {
    credentials = hashPassword(config.admin.password);
    return { source: 'env', password: null };
  }

  // 2) 전에 만들어 둔 해시가 있으면 그대로 씁니다.
  const saved = await readJson(config.admin.credentialsFile, null);
  if (saved?.salt && saved?.hash) {
    credentials = { salt: saved.salt, hash: saved.hash };
    return { source: 'file', password: null };
  }

  // 3) 처음 실행 — 임의로 만들어 해시만 저장하고, 원문은 돌려주기만 합니다.
  const password = generatePassword();
  credentials = hashPassword(password);

  await writeJson(config.admin.credentialsFile, {
    ...credentials,
    createdAt: new Date().toISOString(),
    note: '관리자 비밀번호의 해시입니다. 원문은 들어있지 않습니다. 비밀번호를 잊었다면 이 파일을 지우고 서버를 다시 켜세요.'
  });

  return { source: 'generated', password };
}

/* --------------------------------------------------------------- 로그인 제한 */

function getAttempt(key) {
  const record = loginAttempts.get(key);
  if (!record) return null;

  // 잠금 시간이 지났으면 기록을 지웁니다.
  if (Date.now() - record.firstFailedAt > config.admin.lockoutMs) {
    loginAttempts.delete(key);
    return null;
  }
  return record;
}

function recordFailure(key) {
  const record = getAttempt(key) || { count: 0, firstFailedAt: Date.now() };
  record.count += 1;
  loginAttempts.set(key, record);
}

/* ------------------------------------------------------------------- 세션 */

function createSession() {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + config.admin.sessionTtlMs);
  cleanupExpired();
  return token;
}

function cleanupExpired() {
  const now = Date.now();
  for (const [token, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(token);
  }
}

/* ------------------------------------------------------------------ 공개 API */

export const authService = {
  /**
   * 비밀번호를 확인하고 세션 토큰을 돌려줍니다.
   * @param {string} password
   * @param {string} clientKey 접속지 구분용 (IP)
   */
  login(password, clientKey) {
    if (!credentials) {
      // 여기까지 오면 서버 시작 순서가 잘못된 것입니다. 조용히 통과시키면 안 됩니다.
      throw new ApiError(500, '서버 준비가 끝나지 않았습니다.', 'AUTH_NOT_READY');
    }

    const attempt = getAttempt(clientKey);

    if (attempt && attempt.count >= config.admin.maxLoginAttempts) {
      const leftMs = config.admin.lockoutMs - (Date.now() - attempt.firstFailedAt);
      const leftMin = Math.ceil(leftMs / 60000);
      throw new ApiError(
        429,
        `비밀번호를 여러 번 틀렸습니다. ${leftMin}분 후에 다시 시도해주세요.`,
        'TOO_MANY_ATTEMPTS'
      );
    }

    if (!verifyPassword(password, credentials)) {
      recordFailure(clientKey);
      const left = config.admin.maxLoginAttempts - (getAttempt(clientKey)?.count || 0);
      throw ApiError.badRequest(
        left > 0
          ? `비밀번호가 올바르지 않습니다. (${left}번 더 틀리면 잠깁니다)`
          : '비밀번호가 올바르지 않습니다.',
        'INVALID_PASSWORD'
      );
    }

    loginAttempts.delete(clientKey);
    return createSession();
  },

  /** 토큰이 아직 쓸 수 있는지 확인합니다. */
  isValidSession(token) {
    if (!token) return false;

    const expiresAt = sessions.get(token);
    if (!expiresAt) return false;

    if (expiresAt <= Date.now()) {
      sessions.delete(token);
      return false;
    }
    return true;
  },

  logout(token) {
    if (token) sessions.delete(token);
  }
};
