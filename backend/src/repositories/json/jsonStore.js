/**
 * 4. JSON 파일 저장소 (공통)
 *
 * data/ 폴더의 .json 파일을 읽고 씁니다.
 * DB가 붙기 전까지 이 파일이 "데이터베이스" 역할을 합니다.
 *
 * 파일을 데이터베이스처럼 쓸 때 실제로 겪은 문제 두 가지와 그 해결:
 *
 *  1) 동시에 들어온 요청이 서로의 글을 지움
 *     "읽기 → 고치기 → 쓰기" 사이에 다른 요청이 끼어들면,
 *     둘 다 같은 옛날 내용을 읽어서 나중 것만 남습니다.
 *     → updateJson() 으로 이 세 단계 전체를 한 번에 하나씩만 실행합니다.
 *
 *  2) 파일 교체가 거부됨 (Windows EPERM)
 *     OneDrive·백신·검색 색인이 파일을 잠깐 붙잡고 있으면 교체가 실패합니다.
 *     → 아주 짧게 기다렸다가 몇 번 다시 시도합니다.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../../config.js';

/** 파일별 작업 대기열 — 앞 작업이 끝나야 다음 작업이 시작됩니다. */
const locks = new Map();

/** 잠깐 잡혀 있는 파일을 다시 시도할 때의 기다리는 시간(ms) */
const RETRY_DELAYS = [20, 50, 120, 250];

/** 일시적인 파일 잠금으로 판단할 오류 코드 */
const TRANSIENT_CODES = new Set(['EPERM', 'EBUSY', 'EACCES', 'EEXIST']);

function resolvePath(fileName) {
  return path.join(config.dataDir, fileName);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 같은 파일에 대한 작업을 들어온 순서대로 하나씩만 실행합니다.
 * (여러 서버로 늘리면 이 방식은 통하지 않습니다. 그때가 DB로 옮길 시점입니다.)
 */
function withLock(fileName, task) {
  const previous = locks.get(fileName) || Promise.resolve();
  const next = previous.catch(() => {}).then(task);

  locks.set(fileName, next);
  // 대기열이 계속 길어지지 않도록, 마지막 작업이 끝나면 비웁니다.
  next.catch(() => {}).then(() => {
    if (locks.get(fileName) === next) locks.delete(fileName);
  });

  return next;
}

async function readFileAsJson(fileName, fallback) {
  try {
    const raw = await fs.readFile(resolvePath(fileName), 'utf-8');
    return JSON.parse(stripBom(raw));
  } catch (err) {
    if (err.code === 'ENOENT') return structuredClone(fallback);
    // 파일은 있는데 내용이 깨진 경우 — 조용히 넘기면 원인을 찾기 어려우므로 알립니다.
    throw new Error(`데이터 파일을 읽지 못했습니다: ${fileName} (${err.message})`);
  }
}

/**
 * 파일 맨 앞의 보이지 않는 표식(BOM)을 떼어냅니다.
 *
 * 윈도우에서 메모장이나 PowerShell 로 JSON 을 저장하면 이 표식이 붙는데,
 * 눈에는 안 보이지만 JSON.parse 가 해석에 실패해 서버가 500 을 냅니다.
 * "분명 제대로 고쳤는데 사이트가 안 뜬다" 는 상황을 막기 위해 여기서 처리합니다.
 */
function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * 임시 파일에 먼저 쓴 뒤 바꿔치기합니다.
 * 이렇게 하면 쓰는 도중에 서버가 죽어도 원본이 깨지지 않습니다.
 */
async function atomicWrite(fileName, value) {
  const target = resolvePath(fileName);
  // 임시 이름을 매번 다르게 해서, 다른 작업의 임시 파일과 겹치지 않게 합니다.
  const temp = `${target}.${randomUUID().slice(0, 8)}.tmp`;

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(temp, JSON.stringify(value, null, 2) + '\n', 'utf-8');

  for (let attempt = 0; ; attempt += 1) {
    try {
      await fs.rename(temp, target);
      return;
    } catch (err) {
      const canRetry = TRANSIENT_CODES.has(err.code) && attempt < RETRY_DELAYS.length;
      if (!canRetry) {
        await fs.rm(temp, { force: true });
        throw err;
      }
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
}

/* ------------------------------------------------------------------ 공개 API */

/**
 * JSON 파일을 읽습니다. 파일이 없으면 fallback 을 돌려줍니다.
 * (읽기만 할 때 사용 — 고쳐서 저장할 거라면 updateJson 을 쓰세요.)
 */
export function readJson(fileName, fallback) {
  return withLock(fileName, () => readFileAsJson(fileName, fallback));
}

/** JSON 파일을 통째로 덮어씁니다. */
export function writeJson(fileName, value) {
  return withLock(fileName, () => atomicWrite(fileName, value));
}

/**
 * 고칠 것이 없을 때 mutator 가 돌려주는 값.
 * 이 값을 돌려주면 파일을 쓰지 않고 넘어갑니다. (예: 지우려는 글이 원래 없었던 경우)
 */
export const NO_CHANGE = Symbol('no-change');

/**
 * 읽기 → 고치기 → 쓰기를 하나의 작업으로 실행합니다.
 * 중간에 다른 요청이 끼어들 수 없으므로 글이 유실되지 않습니다.
 *
 * @param {string} fileName
 * @param {*} fallback 파일이 없을 때 시작값
 * @param {(data:*) => *} mutator 데이터를 고치고, 호출한 쪽에 돌려줄 값을 반환
 *                                (고칠 것이 없으면 NO_CHANGE 반환)
 * @returns mutator 가 돌려준 값. NO_CHANGE 였다면 null.
 *
 * 사용 예:
 *   const entry = await updateJson('guestbook.json', [], (rows) => {
 *     const row = { id: '1' };
 *     rows.push(row);
 *     return row;
 *   });
 */
export function updateJson(fileName, fallback, mutator) {
  return withLock(fileName, async () => {
    const data = await readFileAsJson(fileName, fallback);
    const result = await mutator(data);

    if (result === NO_CHANGE) return null;

    await atomicWrite(fileName, data);
    return result;
  });
}
