/**
 * 26. 관리자 프로젝트 컨트롤러
 */
import { projectService } from '../services/project.service.js';

export const adminController = {
  async listProjects(req, res) {
    res.json({ data: await projectService.listForAdmin() });
  },

  async getProject(req, res) {
    res.json({ data: await projectService.getOne(req.params.id) });
  },

  async createProject(req, res) {
    const project = await projectService.create(req.body);
    res.status(201).json({
      data: project,
      message:
        project.status === 'published'
          ? '프로젝트를 저장하고 사이트에 공개했습니다.'
          : '초안으로 저장했습니다. 아직 사이트에는 보이지 않습니다.'
    });
  },

  async updateProject(req, res) {
    const project = await projectService.update(req.params.id, req.body);
    res.json({
      data: project,
      message:
        project.status === 'published'
          ? '수정한 내용을 사이트에 반영했습니다.'
          : '초안으로 저장했습니다. 아직 사이트에는 보이지 않습니다.'
    });
  },

  async deleteProject(req, res) {
    await projectService.remove(req.params.id);
    res.json({ message: '프로젝트를 삭제했습니다.' });
  }
};
