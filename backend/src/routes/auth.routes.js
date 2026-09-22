/**
 * 27. 로그인 라우터
 *
 *   POST /api/auth/login   비밀번호로 로그인
 *   POST /api/auth/logout  로그아웃
 *   GET  /api/auth/status  지금 로그인 상태인지 확인
 */
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/logout', asyncHandler(authController.logout));
authRouter.get('/status', asyncHandler(authController.status));
