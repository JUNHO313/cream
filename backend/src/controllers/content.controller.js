/**
 * 11. 콘텐츠 컨트롤러
 *
 * 요청을 받아 서비스/저장소를 부르고, 결과를 JSON 으로 돌려줍니다.
 * 응답 형태는 항상 { data: ... } 로 통일했습니다. (프론트가 처리하기 쉽도록)
 */
import { contentRepository } from '../repositories/index.js';
import { ApiError } from '../utils/ApiError.js';

export const contentController = {
  async getProfile(req, res) {
    res.json({ data: await contentRepository.getProfile() });
  },

  async getSkills(req, res) {
    res.json({ data: await contentRepository.getSkills() });
  },

  async getProjects(req, res) {
    res.json({ data: await contentRepository.getProjects() });
  },

  async getProjectById(req, res) {
    const project = await contentRepository.getProjectById(req.params.id);
    if (!project) {
      throw ApiError.notFound('해당 프로젝트를 찾을 수 없습니다.', 'PROJECT_NOT_FOUND');
    }
    res.json({ data: project });
  },

  async getTimeline(req, res) {
    res.json({ data: await contentRepository.getTimeline() });
  },

  async getGuestbookOptions(req, res) {
    res.json({ data: await contentRepository.getGuestbookOptions() });
  },

  /**
   * 첫 화면에 필요한 내용을 한 번에 돌려줍니다.
   * 요청을 5번 보내는 대신 1번만 보내면 되어 화면이 빨리 뜹니다.
   */
  async getBootstrap(req, res) {
    const [profile, skills, projects, timeline, guestbookOptions] = await Promise.all([
      contentRepository.getProfile(),
      contentRepository.getSkills(),
      contentRepository.getProjects(),
      contentRepository.getTimeline(),
      contentRepository.getGuestbookOptions()
    ]);

    res.json({ data: { profile, skills, projects, timeline, guestbookOptions } });
  }
};
