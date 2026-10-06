/**
 * 7-2. 방문 예약 저장소 (JSON 구현)
 *
 * 방문 예약 페이지에서 보낸 내용을 backend/data/reservations.json 에 쌓습니다.
 * 관리자 페이지의 "예약 관리" 탭이 이 목록을 불러오고, 처리 상태(접수/확정/
 * 변경 요청/취소)를 바꿉니다.
 */
import { randomUUID } from 'node:crypto';
import { readJson, updateJson, NO_CHANGE } from './jsonStore.js';

const FILE = 'reservations.json';
const EMPTY = [];

export const reservationRepository = {
  async create({ name, email, purpose, date, time }) {
    return updateJson(FILE, EMPTY, (rows) => {
      const entry = {
        id: randomUUID(),
        name,
        email,
        purpose,
        date,
        time,
        status: 'received',
        createdAt: new Date().toISOString()
      };
      rows.push(entry);
      return entry;
    });
  },

  async findAll() {
    const rows = await readJson(FILE, EMPTY);
    return (Array.isArray(rows) ? [...rows] : []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  async updateStatus(id, status) {
    return updateJson(FILE, EMPTY, (rows) => {
      const index = rows.findIndex((row) => row.id === id);
      if (index === -1) return NO_CHANGE;

      rows[index] = { ...rows[index], status, updatedAt: new Date().toISOString() };
      return rows[index];
    });
  }
};
