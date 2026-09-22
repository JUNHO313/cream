/**
 * 29. 글자 겹침 비율 계산
 *
 * "두 글이 얼마나 비슷한가"를 아주 단순하게 잽니다.
 * AI나 외부 라이브러리 없이, 낱말 집합이 얼마나 겹치는지만 봅니다. (자카드 유사도)
 *
 *   "CityPulse 스마트시티 대시보드"
 *   "CityPulse 실시간 스마트시티 관제 대시보드"
 *   → 겹치는 낱말이 많으므로 비슷하다고 판단
 *
 * 값은 0(전혀 안 겹침) ~ 1(완전히 같음) 사이입니다.
 */

/** 문장부호를 공백으로 바꾸고, 대소문자를 통일합니다. */
function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // 글자·숫자가 아닌 것(-, /, &, 괄호 등)은 공백 처리
    .replace(/\s+/g, ' ')
    .trim();
}

/** 문장을 낱말 배열로 쪼갭니다. */
export function tokenize(text) {
  const normalized = normalize(text);
  return normalized ? normalized.split(' ') : [];
}

/** 두 낱말 배열이 얼마나 겹치는지 계산합니다. (겹치는 낱말 수 ÷ 전체 낱말 수) */
export function jaccardSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let overlap = 0;
  for (const token of setA) {
    if (setB.has(token)) overlap += 1;
  }

  const union = setA.size + setB.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

/** 두 문장을 바로 비교합니다. (tokenize + jaccardSimilarity 를 한 번에) */
export function textSimilarity(textA, textB) {
  return jaccardSimilarity(tokenize(textA), tokenize(textB));
}
