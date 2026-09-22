/**
 * 1. 서버 설정
 *
 * 환경변수로 바꿀 수 있는 값을 여기 한 곳에 모읍니다.
 * 값을 바꾸고 싶으면 .env.example 을 참고해 환경변수로 넘기면 됩니다.
 * (환경변수를 주지 않아도 아래 기본값으로 바로 동작합니다.)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** backend/ 폴더 절대경로 */
export const BACKEND_ROOT = path.resolve(here, '..');

/** 프로젝트 최상위 폴더 절대경로 */
export const PROJECT_ROOT = path.resolve(BACKEND_ROOT, '..');

export const config = {
  /** 서버 포트 */
  port: Number(process.env.PORT) || 3000,

  /**
   * 데이터 저장 방식.
   * 'json'  : backend/data/*.json 파일에 저장 (현재 기본값, DB 불필요)
   * 'mysql' : 나중에 DB를 붙일 때 추가할 값
   *
   * 이 값을 바꾸면 src/repositories/index.js 가 다른 구현체를 골라 씁니다.
   * 즉, DB를 붙일 때 고쳐야 할 파일은 repositories 폴더 안쪽뿐입니다.
   */
  dataDriver: process.env.DATA_DRIVER || 'json',

  /** JSON 저장 방식일 때 데이터 파일이 있는 폴더 */
  dataDir: process.env.DATA_DIR || path.join(BACKEND_ROOT, 'data'),

  /**
   * 프론트엔드 정적 파일 폴더.
   * 서버가 이 폴더를 그대로 서비스하므로, 서버만 켜면 사이트가 열립니다.
   * 프론트를 따로 배포한다면 SERVE_FRONTEND=false 로 끌 수 있습니다.
   */
  frontendDir: process.env.FRONTEND_DIR || path.join(PROJECT_ROOT, 'frontend'),
  serveFrontend: process.env.SERVE_FRONTEND !== 'false',

  /**
   * CORS 허용 출처.
   * 프론트를 다른 주소(예: Live Server의 5500 포트)에서 띄울 때 필요합니다.
   * 쉼표로 여러 개를 적을 수 있고, '*' 는 전부 허용입니다.
   */
  corsOrigin: process.env.CORS_ORIGIN || '*',

  /**
   * 관리자 페이지 설정.
   *
   * ★ 비밀번호는 이 파일에도, 다른 어떤 코드에도 적혀 있지 않습니다.
   *
   * 정해지는 방법은 두 가지입니다.
   *   1) 환경변수 ADMIN_PASSWORD 를 지정하면 그 값을 씁니다. (권장)
   *   2) 지정하지 않으면 서버가 임의로 만들어 터미널에 한 번만 보여줍니다.
   *      그 뒤로는 되돌릴 수 없는 해시만 credentialsFile 에 남습니다.
   *
   * 자세한 처리는 services/auth.service.js 의 initAdminAuth() 를 보세요.
   */
  admin: {
    /** 환경변수로 받은 비밀번호. 없으면 null (서버가 임의로 만듭니다) */
    password: process.env.ADMIN_PASSWORD || null,

    /**
     * 임의로 만든 비밀번호의 해시를 두는 파일.
     * 원문은 들어가지 않으며, .gitignore 에 걸려 있어 Git 에 올라가지 않습니다.
     * 비밀번호를 잊었다면 이 파일을 지우고 서버를 다시 켜면 새로 만들어집니다.
     */
    credentialsFile: 'admin-credentials.json',

    /** 로그인 유지 시간 (기본 12시간) */
    sessionTtlMs: Number(process.env.ADMIN_SESSION_HOURS || 12) * 60 * 60 * 1000,

    /** 로그인 상태를 담는 쿠키 이름 */
    cookieName: 'jh_admin_session',

    /**
     * HTTPS 에서만 쿠키를 주고받을지 여부.
     * 실제 도메인에 배포하면 true 로 켜세요. (로컬 http 에서는 false)
     */
    secureCookie: process.env.ADMIN_SECURE_COOKIE === 'true',

    /** 비밀번호를 몇 번 틀리면 얼마 동안 막을지 */
    maxLoginAttempts: 5,
    lockoutMs: 10 * 60 * 1000
  },

  /**
   * 입력 길이 제한.
   * 화면(index.html)의 maxlength 와 같은 값으로 맞춰두었습니다.
   * 한쪽만 바꾸면 "화면에서는 써지는데 서버가 거부하는" 상황이 생기니 함께 고치세요.
   */
  limits: {
    authorMaxLength: 15,
    contentMaxLength: 200,
    contactNameMaxLength: 50,
    contactSubjectMaxLength: 100,
    contactMessageMaxLength: 2000
  }
};
