/**
 * 7. 문의 저장소 (JSON 구현)
 *
 * 연락처 섹션에서 보낸 문의를 backend/data/contacts.json 에 쌓습니다.
 * 지금은 저장만 합니다. 나중에 메일 발송을 붙이려면 services/contact.service.js 를 고치세요.
 */
import { randomUUID } from 'node:crypto';
import { readJson, updateJson } from './jsonStore.js';

const FILE = 'contacts.json';
const EMPTY = [];

export const contactRepository = {
  async create({ name, email, subject, message }) {
    return updateJson(FILE, EMPTY, (rows) => {
      const entry = {
        id: randomUUID(),
        name,
        email,
        subject,
        message,
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
