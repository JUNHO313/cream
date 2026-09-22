/**
 * 16. 문의 라우터
 */
import { Router } from 'express';
import { contactController } from '../controllers/contact.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const contactRouter = Router();

contactRouter.post('/', asyncHandler(contactController.create));
