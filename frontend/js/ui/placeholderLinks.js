/**
 * 18. 주소가 아직 없는 링크 처리
 *
 * GitHub·데모·블로그처럼 공개 주소가 아직 정해지지 않은 링크가 있습니다.
 * 이런 링크에는 href 대신 data-note 에 안내 문구를 적어둡니다.
 *
 *   주소 없음 → 눌러도 이동하지 않고 안내 메시지만 표시
 *   주소 있음 → 평범한 링크로 동작 (이 파일이 끼어들지 않음)
 *
 * 나중에 실제 주소가 생기면 href 만 채우면 됩니다.
 * 문서 전체에서 한 번만 감지하므로, 나중에 그려지는 카드에도 그대로 적용됩니다.
 */
import { showToast } from './toast.js';

export function initPlaceholderLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-note]');
    if (!link) return;

    // 진짜 주소가 있으면 그대로 이동하게 둡니다.
    const href = link.getAttribute('href');
    if (href && href !== '#') return;

    e.preventDefault();
    showToast(link.getAttribute('data-note'), 'info');
  });
}
