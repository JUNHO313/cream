/**
 * 16-2. 방문 예약 라우터
 */
import { Router } from 'express';
import { reservationController } from '../controllers/reservation.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reservationRouter = Router();

reservationRouter.post('/', asyncHandler(reservationController.create));
