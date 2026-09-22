/**
 * 17. API 라우터 모음
 *
 * 주소 앞에 /api 가 붙습니다. (app.js 에서 지정)
 *   GET    /api/health
 *   GET    /api/content/bootstrap   ← 첫 화면용 통합 조회
 *   GET    /api/content/profile | skills | projects | projects/:id | timeline
 *   GET    /api/guestbook
 *   POST   /api/guestbook
 *   POST   /api/guestbook/reset
 *   PATCH  /api/guestbook/:id/like
 *   DELETE /api/guestbook/:id
 *   POST   /api/contact
 *
 *   -- 관리자 --
 *   POST   /api/auth/login | logout        로그인 / 로그아웃
 *   GET    /api/auth/status                로그인 상태 확인
 *   GET    /api/admin/projects             전체 목록 (초안 포함, 로그인 필요)
 *   POST   /api/admin/projects             새로 저장
 *   PUT    /api/admin/projects/:id         수정
 *   DELETE /api/admin/projects/:id         삭제
 */
import { Router } from 'express';
import { contentRouter } from './content.routes.js';
import { guestbookRouter } from './guestbook.routes.js';
import { contactRouter } from './contact.routes.js';
import { authRouter } from './auth.routes.js';
import { adminRouter } from './admin.routes.js';
import { config } from '../config.js';

export const apiRouter = Router();

/** 서버가 살아있는지 확인하는 용도 (배포 점검에 씁니다) */
apiRouter.get('/health', (req, res) => {
  res.json({
    data: {
      status: 'ok',
      dataDriver: config.dataDriver,
      time: new Date().toISOString()
    }
  });
});

apiRouter.use('/content', contentRouter);
apiRouter.use('/guestbook', guestbookRouter);
apiRouter.use('/contact', contactRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin', adminRouter);
