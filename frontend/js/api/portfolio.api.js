/**
 * 3. API 목록
 *
 * 서버의 어떤 주소를 부르는지 여기 한 곳에만 적혀 있습니다.
 * 나중에 주소가 바뀌어도 화면 코드는 건드리지 않고 이 파일만 고치면 됩니다.
 */
import { apiClient } from './client.js';

export const portfolioApi = {
  /** 첫 화면에 필요한 내용을 한 번에 받아옵니다. */
  async fetchBootstrap() {
    const res = await apiClient.get('/content/bootstrap');
    return res.data;
  },

  async fetchProject(id) {
    const res = await apiClient.get(`/content/projects/${encodeURIComponent(id)}`);
    return res.data;
  },

  /** 방명록 목록 → { items, total } */
  async fetchGuestbook() {
    const res = await apiClient.get('/guestbook');
    return res.data;
  },

  /** 방명록 등록 → { entry, message } */
  async createGuestbookEntry(entry) {
    const res = await apiClient.post('/guestbook', entry);
    return { entry: res.data, message: res.message };
  },

  /** 좋아요 켜기/끄기 → 갱신된 방명록 한 건 */
  async likeGuestbookEntry(id, liked) {
    const res = await apiClient.patch(
      `/guestbook/${encodeURIComponent(id)}/like`,
      { liked }
    );
    return res.data;
  },

  async deleteGuestbookEntry(id) {
    const res = await apiClient.delete(`/guestbook/${encodeURIComponent(id)}`);
    return res.message;
  },

  async resetGuestbook() {
    const res = await apiClient.post('/guestbook/reset');
    return { data: res.data, message: res.message };
  },

  /** 문의 보내기 → 안내 메시지 */
  async sendContact(form) {
    const res = await apiClient.post('/contact', form);
    return res.message;
  }
};
