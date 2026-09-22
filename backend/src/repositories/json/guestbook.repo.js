/**
 * 6. 방명록 저장소 (JSON 구현)
 *
 * 이 파일이 지켜야 할 약속(= 인터페이스)은 repositories/README.md 에 적어두었습니다.
 * DB를 붙일 때는 같은 함수 이름/같은 반환 형태로 mysql 버전을 새로 만들면 됩니다.
 * 서비스·컨트롤러 코드는 한 줄도 고칠 필요가 없습니다.
 *
 * 글을 고치는 함수는 모두 updateJson 을 씁니다.
 * "읽고 → 고치고 → 쓰는" 동안 다른 요청이 끼어들지 못하게 하기 위해서입니다.
 * (그냥 읽고 쓰면, 동시에 등록된 글이 서로를 덮어써 사라집니다.)
 */
import { randomUUID } from 'node:crypto';
import { readJson, writeJson, updateJson, NO_CHANGE } from './jsonStore.js';

const FILE = 'guestbook.json';
const SEED_FILE = 'guestbook.seed.json';
const EMPTY = [];

function sortNewestFirst(rows) {
  return [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export const guestbookRepository = {
  /** 최신 글이 위로 오도록 정렬해서 전부 돌려줍니다. */
  async findAll() {
    const rows = await readJson(FILE, EMPTY);
    return Array.isArray(rows) ? sortNewestFirst(rows) : [];
  },

  async findById(id) {
    const rows = await readJson(FILE, EMPTY);
    return (Array.isArray(rows) ? rows : []).find((row) => row.id === id) || null;
  },

  /** 새 글을 저장하고, 저장된 글을 그대로 돌려줍니다. */
  async create({ author, badge, avatar, content }) {
    return updateJson(FILE, EMPTY, (rows) => {
      const entry = {
        id: randomUUID(),
        author,
        badge,
        avatar,
        content,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      rows.push(entry);
      return entry;
    });
  },

  /**
   * 좋아요 수를 delta(+1 / -1)만큼 더합니다. 0 아래로는 내려가지 않습니다.
   * 글이 없으면 null 을 돌려줍니다.
   */
  async changeLikes(id, delta) {
    return updateJson(FILE, EMPTY, (rows) => {
      const target = rows.find((row) => row.id === id);
      if (!target) return NO_CHANGE;

      target.likes = Math.max(0, (target.likes || 0) + delta);
      return target;
    });
  },

  /** 삭제 성공 여부를 돌려줍니다. */
  async remove(id) {
    const result = await updateJson(FILE, EMPTY, (rows) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return NO_CHANGE;

      rows.splice(index, 1);
      return true;
    });
    return result === true;
  },

  /** 샘플 데이터로 되돌립니다. (화면의 '샘플 리셋' 버튼용) */
  async resetToSeed() {
    const seed = await readJson(SEED_FILE, EMPTY);
    await writeJson(FILE, seed);
    return sortNewestFirst(seed);
  }
};
