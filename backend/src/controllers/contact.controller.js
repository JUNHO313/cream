/**
 * 13. 문의 컨트롤러
 */
import { contactService } from '../services/contact.service.js';

export const contactController = {
  async create(req, res) {
    const saved = await contactService.receive(req.body);
    res.status(201).json({
      data: saved,
      message: `📩 ${saved.name} 님의 문의가 접수되었습니다. 확인 후 회신 드립니다.`
    });
  }
};
