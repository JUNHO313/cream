/**
 * 13-2. 방문 예약 컨트롤러
 */
import { reservationService } from '../services/reservation.service.js';

export const reservationController = {
  async create(req, res) {
    const saved = await reservationService.submit(req.body);
    res.status(201).json({
      data: saved,
      message: '방문 예약 신청이 접수되었습니다. 확인 후 회신 드리겠습니다.'
    });
  }
};
