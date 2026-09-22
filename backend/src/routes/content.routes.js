/**
 * 14. 콘텐츠 라우터 — 포트폴리오 내용 읽기 (GET 전용)
 */
import { Router } from 'express';
import { contentController } from '../controllers/content.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const contentRouter = Router();

contentRouter.get('/bootstrap', asyncHandler(contentController.getBootstrap));
contentRouter.get('/profile', asyncHandler(contentController.getProfile));
contentRouter.get('/skills', asyncHandler(contentController.getSkills));
contentRouter.get('/projects', asyncHandler(contentController.getProjects));
contentRouter.get('/projects/:id', asyncHandler(contentController.getProjectById));
contentRouter.get('/timeline', asyncHandler(contentController.getTimeline));
contentRouter.get('/guestbook-options', asyncHandler(contentController.getGuestbookOptions));
