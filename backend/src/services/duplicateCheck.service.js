/**
 * 30. 프로젝트 중복 검사
 *
 * 제목·설명이 서로 얼마나 겹치는지만 봅니다. (utils/textSimilarity.js)
 * 프로젝트 목록을 받아서, 각 프로젝트에 "비슷해 보이는 다른 프로젝트" 목록을 붙여줍니다.
 *
 * 판단 기준을 하나(겹치는 비율)로만 두어 로직을 단순하게 유지했습니다.
 * 프로젝트가 같은 제목이면 겹치는 비율이 1이 되어 자연히 최상위로 잡힙니다.
 */
import { textSimilarity } from '../utils/textSimilarity.js';

/**
 * 이 값 이상 겹치면 '비슷하다'고 봅니다.
 * 낮추면 더 많이 잡아내지만 실제로는 다른 프로젝트도 걸릴 수 있고,
 * 높이면 놓치는 대신 확실한 것만 잡습니다.
 */
export const DUPLICATE_THRESHOLD = 0.5;

function similarityOf(a, b) {
  // 제목만 비교했을 때와, 제목+설명을 합쳐 비교했을 때 중 더 높은 쪽을 씁니다.
  // (제목만 살짝 다르고 내용이 같은 경우도 잡기 위함)
  const titleScore = textSimilarity(a.title, b.title);
  const fullScore = textSimilarity(`${a.title} ${a.summary}`, `${b.title} ${b.summary}`);
  return Math.max(titleScore, fullScore);
}

/**
 * 프로젝트 목록에 possibleDuplicates 를 붙여 돌려줍니다.
 * 원본 배열은 건드리지 않습니다.
 *
 * @param {Array<{id:string, title:string, summary:string}>} projects
 * @returns 각 항목에 `possibleDuplicates: [{id, title, score}]` 가 추가된 배열
 */
export function attachDuplicateInfo(projects, threshold = DUPLICATE_THRESHOLD) {
  const result = projects.map((project) => ({ ...project, possibleDuplicates: [] }));

  for (let i = 0; i < result.length; i += 1) {
    for (let j = i + 1; j < result.length; j += 1) {
      const score = similarityOf(result[i], result[j]);
      if (score < threshold) continue;

      const rounded = Math.round(score * 100) / 100;
      result[i].possibleDuplicates.push({ id: result[j].id, title: result[j].title, score: rounded });
      result[j].possibleDuplicates.push({ id: result[i].id, title: result[i].title, score: rounded });
    }
  }

  // 가장 비슷한 것부터 보이도록 정렬합니다.
  result.forEach((project) => {
    project.possibleDuplicates.sort((a, b) => b.score - a.score);
  });

  return result;
}
