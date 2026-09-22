/**
 * 28. 관리자 라우터 — 로그인해야만 쓸 수 있습니다.
 *
 *   GET    /api/admin/projects        전체 목록 (초안 포함, 각 항목에 중복 후보 포함)
 *   GET    /api/admin/projects/:id    한 건 불러오기 (수정 화면용)
 *   POST   /api/admin/projects        새로 저장
 *   PUT    /api/admin/projects/:id    수정
 *   DELETE /api/admin/projects/:id    삭제
 *   POST   /api/admin/projects/merge  중복된 두 프로젝트 통합 { keepId, removeId }
 */
import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminRouter = Router();

// 아래 모든 주소에 로그인 확인이 걸립니다.
adminRouter.use(requireAuth);

adminRouter.get('/projects', asyncHandler(adminController.listProjects));
// '/projects/merge' 는 '/projects/:id' 보다 먼저 와야 id 자리에 'merge' 가 끼어들지 않습니다.
adminRouter.post('/projects/merge', asyncHandler(adminController.mergeProjects));
adminRouter.get('/projects/:id', asyncHandler(adminController.getProject));
adminRouter.post('/projects', asyncHandler(adminController.createProject));
adminRouter.put('/projects/:id', asyncHandler(adminController.updateProject));
adminRouter.delete('/projects/:id', asyncHandler(adminController.deleteProject));
