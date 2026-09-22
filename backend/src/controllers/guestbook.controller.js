/**
 * 12. 방명록 컨트롤러
 */
import { guestbookService } from '../services/guestbook.service.js';

export const guestbookController = {
  async list(req, res) {
    res.json({ data: await guestbookService.list() });
  },

  async create(req, res) {
    const entry = await guestbookService.add(req.body);
    res.status(201).json({
      data: entry,
      message: '🎉 방명록이 성공적으로 등록되었습니다! 감사합니다.'
    });
  },

  async like(req, res) {
    // body.liked 가 true 면 +1, false 면 -1
    const updated = await guestbookService.like(req.params.id, req.body?.liked !== false);
    res.json({ data: updated });
  },

  async remove(req, res) {
    await guestbookService.remove(req.params.id);
    res.json({ message: '메시지가 삭제되었습니다.' });
  },

  async reset(req, res) {
    const result = await guestbookService.resetToSample();
    res.json({ data: result, message: '방명록이 샘플 데이터로 복원되었습니다.' });
  }
};
