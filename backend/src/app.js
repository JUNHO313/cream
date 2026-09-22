/**
 * 19. Express 앱 조립
 *
 * 여기서는 "무엇을 어떤 순서로 거치게 할지"만 정합니다.
 * 실제 포트를 여는 일은 server.js 가 합니다. (테스트할 때 앱만 따로 쓰기 쉬움)
 */
import express from 'express';
import cors from 'cors';
import path from 'node:path';

import { config } from './config.js';
import { apiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // 1) 다른 주소에서 띄운 프론트도 API를 부를 수 있게 허용
  //
  // 프론트와 백엔드를 서로 다른 도메인에 배포하면(예: 프론트는 Vercel, 백엔드는 Render),
  // 관리자 로그인 쿠키를 주고받으려면 브라우저에게 "이 출처는 믿을 수 있다"고
  // 정확히 알려줘야 합니다. 그래서 CORS_ORIGIN 을 특정 주소로 좁혔을 때만
  // credentials(쿠키 동반)를 허용합니다.
  //
  // ⚠ CORS_ORIGIN 을 '*'(전체 허용)로 둔 채 credentials 를 켜면,
  //   "아무 사이트에서나 만든 요청이 로그인 쿠키를 들고 API를 부를 수 있게" 됩니다.
  //   그래서 isWildcardOrigin 일 때는 자동으로 credentials 를 끕니다 — 이 조건을
  //   지우고 항상 true 로 두지 마세요.
  const isWildcardOrigin = config.corsOrigin === '*';

  app.use(
    cors({
      origin: isWildcardOrigin ? true : config.corsOrigin.split(',').map((s) => s.trim()),
      credentials: !isWildcardOrigin
    })
  );

  // 2) JSON 본문 해석 (요청 크기 제한을 두어 과도한 요청을 막습니다)
  app.use(express.json({ limit: '100kb' }));

  // 3) API
  app.use('/api', apiRouter);

  // 4) 프론트엔드 정적 파일
  //    서버만 켜면 http://localhost:3000 에서 사이트가 바로 열립니다.
  if (config.serveFrontend) {
    app.use(express.static(config.frontendDir));

    // 관리자 페이지 — /admin 으로 들어오면 frontend/admin/index.html 을 돌려줍니다.
    app.get(/^\/admin\/?$/, (req, res, next) => {
      res.sendFile(path.join(config.frontendDir, 'admin', 'index.html'), (err) => {
        if (err) next(err);
      });
    });

    // 주소창에 /about 같은 걸 직접 쳐도 index.html 을 돌려줍니다.
    // (단, /api 로 시작하는 요청은 위에서 이미 처리됐으므로 여기 오지 않습니다.)
    app.get(/^\/(?!api\/).*/, (req, res, next) => {
      res.sendFile(path.join(config.frontendDir, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  // 5) 위에서 아무도 처리하지 못한 요청
  app.use(notFoundHandler);

  // 6) 에러 처리 (반드시 맨 마지막)
  app.use(errorHandler);

  return app;
}
