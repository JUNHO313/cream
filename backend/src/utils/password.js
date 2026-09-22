/**
 * 21. 비밀번호 만들기 · 확인하기
 *
 * 지키는 원칙
 *
 *  1) 비밀번호 원문을 코드·파일 어디에도 두지 않습니다.
 *     되돌릴 수 없는 해시(scrypt)만 남기므로, 파일이 유출돼도 비밀번호를 알 수 없습니다.
 *
 *  2) 비교할 때 === 를 쓰지 않습니다.
 *     문자열 비교는 앞부분이 맞을수록 오래 걸려서, 그 시간 차이로 한 글자씩 알아낼 수 있습니다.
 *     항상 같은 시간이 걸리는 timingSafeEqual 을 씁니다.
 */
import { randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * 헷갈리는 글자를 뺀 알파벳.
 * 0(영)과 O(오), 1(일)과 l(엘)/I(아이)를 섞어 적는 실수를 막습니다.
 */
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * 읽고 옮겨 적기 쉬운 임의의 비밀번호를 만듭니다.
 * 예) Kf3p-Rm9t-Xb7q  (12글자 + 구분용 하이픈)
 */
export function generatePassword() {
  const groups = [];

  for (let g = 0; g < 3; g += 1) {
    let group = '';
    for (let i = 0; i < 4; i += 1) {
      group += SAFE_CHARS[randomInt(SAFE_CHARS.length)];
    }
    groups.push(group);
  }

  return groups.join('-');
}

/**
 * 비밀번호를 해시로 바꿉니다.
 * @returns {{salt: string, hash: string}} 파일이나 메모리에 보관할 값
 */
export function hashPassword(password) {
  const salt = randomBytes(SALT_LENGTH);
  const hash = scryptSync(password, salt, KEY_LENGTH);

  return { salt: salt.toString('hex'), hash: hash.toString('hex') };
}

/**
 * 입력한 비밀번호가 보관 중인 해시와 맞는지 확인합니다.
 * @param {string} candidate 사용자가 입력한 비밀번호
 * @param {{salt: string, hash: string}} stored 보관 중인 값
 */
export function verifyPassword(candidate, stored) {
  if (typeof candidate !== 'string' || candidate.length === 0) return false;

  // 지나치게 긴 입력은 계산 자체가 부담이 되므로 먼저 막습니다.
  if (candidate.length > 200) return false;
  if (!stored?.salt || !stored?.hash) return false;

  const expected = Buffer.from(stored.hash, 'hex');
  const actual = scryptSync(candidate, Buffer.from(stored.salt, 'hex'), KEY_LENGTH);

  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}
