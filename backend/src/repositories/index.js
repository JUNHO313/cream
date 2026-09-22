/**
 * 8. 저장소 선택기  ★ DB를 붙일 때 고치는 곳은 여기 하나입니다 ★
 *
 * 서비스 코드는 항상 이 파일에서 저장소를 가져다 씁니다.
 * 따라서 아래 switch 에 새 구현체를 한 줄 추가하면 저장 방식이 통째로 바뀝니다.
 *
 * 예) MySQL 을 붙이는 순서
 *   1) src/repositories/mysql/ 폴더를 만들고
 *      guestbook.repo.js / contact.repo.js / content.repo.js 를 같은 함수 이름으로 작성
 *   2) 아래 switch 에 case 'mysql' 추가
 *   3) 서버 실행 시 DATA_DRIVER=mysql 환경변수만 지정
 *
 * 컨트롤러·서비스·프론트엔드는 전혀 손대지 않습니다.
 */
import { config } from '../config.js';

import { contentRepository as jsonContent } from './json/content.repo.js';
import { guestbookRepository as jsonGuestbook } from './json/guestbook.repo.js';
import { contactRepository as jsonContact } from './json/contact.repo.js';

function selectRepositories(driver) {
  switch (driver) {
    case 'json':
      return {
        content: jsonContent,
        guestbook: jsonGuestbook,
        contact: jsonContact
      };

    // case 'mysql':
    //   return { content: mysqlContent, guestbook: mysqlGuestbook, contact: mysqlContact };

    default:
      throw new Error(
        `알 수 없는 DATA_DRIVER 입니다: "${driver}" (사용 가능: json)`
      );
  }
}

const repositories = selectRepositories(config.dataDriver);

export const contentRepository = repositories.content;
export const guestbookRepository = repositories.guestbook;
export const contactRepository = repositories.contact;
