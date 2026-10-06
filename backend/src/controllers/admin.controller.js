/**
 * 26. 관리자 프로젝트 컨트롤러
 */
import { projectService } from '../services/project.service.js';
import { reservationService } from '../services/reservation.service.js';

const STATUS_LABELS = {
  received: '접수',
  confirmed: '확정',
  change_requested: '변경 요청',
  cancelled: '취소'
};

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
  },

  /** 중복으로 보이는 두 프로젝트를 하나로 합칩니다. body: { keepId, removeId } */
  async mergeProjects(req, res) {
    const merged = await projectService.merge(req.body?.keepId, req.body?.removeId);
    res.json({ data: merged, message: '두 프로젝트를 하나로 합쳤습니다.' });
  },

  async listReservations(req, res) {
    res.json({ data: await reservationService.listForAdmin() });
  },

  async updateReservationStatus(req, res) {
    const reservation = await reservationService.updateStatus(req.params.id, req.body?.status);
    res.json({
      data: reservation,
      message: `처리 상태를 "${STATUS_LABELS[reservation.status]}"(으)로 바꿨습니다.`
    });
  }
};
