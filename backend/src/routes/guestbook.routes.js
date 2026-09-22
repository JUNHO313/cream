/**
 * 15. 방명록 라우터
 */
import { Router } from 'express';
import { guestbookController } from '../controllers/guestbook.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const guestbookRouter = Router();

guestbookRouter.get('/', asyncHandler(guestbookController.list));
guestbookRouter.post('/', asyncHandler(guestbookController.create));
guestbookRouter.post('/reset', asyncHandler(guestbookController.reset));
guestbookRouter.patch('/:id/like', asyncHandler(guestbookController.like));
guestbookRouter.delete('/:id', asyncHandler(guestbookController.remove));
