/**
 * 1. 관리자 API
 *
 * 본 사이트와 같은 통신 모듈(client.js)을 그대로 씁니다.
 * 주소 조합·에러 메시지 처리를 두 벌 만들 이유가 없기 때문입니다.
 */
import { apiClient } from '../../js/api/client.js';

export const adminApi = {
  /* ---------------------------------------------------------------- 로그인 */

  async login(password) {
    const res = await apiClient.post('/auth/login', { password });
    return res.message;
  },

  async logout() {
    const res = await apiClient.post('/auth/logout');
    return res.message;
  },

  /** 지금 로그인 상태인지 확인합니다. */
  async isLoggedIn() {
    const res = await apiClient.get('/auth/status');
    return res.data.loggedIn === true;
  },

  /* ------------------------------------------------------------- 프로젝트 */

  /** 초안까지 전부 → { items, total } */
  async listProjects() {
    const res = await apiClient.get('/admin/projects');
    return res.data;
  },

  async getProject(id) {
    const res = await apiClient.get(`/admin/projects/${encodeURIComponent(id)}`);
    return res.data;
  },

  /** 새로 저장 → { project, message } */
  async createProject(fields) {
    const res = await apiClient.post('/admin/projects', fields);
    return { project: res.data, message: res.message };
  },

  /** 수정 → { project, message } */
  async updateProject(id, fields) {
    const res = await apiClient.put(`/admin/projects/${encodeURIComponent(id)}`, fields);
    return { project: res.data, message: res.message };
  },

  async deleteProject(id) {
    const res = await apiClient.delete(`/admin/projects/${encodeURIComponent(id)}`);
    return res.message;
  }
};
