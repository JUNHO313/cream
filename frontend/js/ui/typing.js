/**
 * 8. 히어로 섹션 타이핑 효과
 *
 * 보여줄 문장은 서버(content.json)의 프로필에서 만들어 넘겨받습니다.
 * 이름이나 전공이 바뀌어도 이 파일은 고칠 필요가 없습니다.
 */
const FALLBACK_PHRASES = ['포트폴리오를 불러오는 중입니다'];

export function initTypingEffect(phrases = FALLBACK_PHRASES) {
  const target = document.getElementById('typing-text');
  if (!target) return;

  const list = phrases.length ? phrases : FALLBACK_PHRASES;

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const current = list[phraseIndex];
    let delay;

    if (isDeleting) {
      charIndex -= 1;
      delay = 40;
    } else {
      charIndex += 1;
      delay = 85;
    }

    target.textContent = current.substring(0, charIndex);

    if (!isDeleting && charIndex === current.length) {
      delay = 1800; // 문장 완성 후 읽을 시간
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % list.length;
      delay = 350; // 다음 문장 시작 전 잠깐 멈춤
    }

    setTimeout(type, delay);
  }

  type();
}

/** 프로필 정보로 타이핑 문장을 만듭니다. */
export function buildPhrases(profile = {}) {
  const { department, studentId, name, location } = profile;

  return [
    [department, studentId, name].filter(Boolean).join(' '),
    `${location || ''} 기반 지속 가능한 스마트시티 엔지니어`.trim(),
    '도시 데이터 시각화 & IoT 대시보드 빌더',
    '미래 친환경 도시를 혁신하는 풀스택 개발자'
  ].filter((phrase) => phrase.length > 0);
}
