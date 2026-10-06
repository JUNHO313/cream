/**
 * 7-2. 방문 예약 저장소 (JSON 구현)
 *
 * 방문 예약 페이지에서 보낸 내용을 backend/data/reservations.json 에 쌓습니다.
 * 지금은 저장만 합니다. 나중에 메일 발송·캘린더 연동을 붙이려면
 * services/reservation.service.js 를 고치세요.
 */
import { randomUUID } from 'node:crypto';
import { readJson, updateJson } from './jsonStore.js';

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
  }
};
