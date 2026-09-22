/**
 * 20. 서버 시작점
 *
 * 실행:  npm start        (backend 폴더에서)
 * 개발:  npm run dev      (파일을 고치면 자동으로 다시 시작)
 */
import { createApp } from './src/app.js';
import { config } from './src/config.js';
import { initAdminAuth } from './src/services/auth.service.js';

// 요청을 받기 전에 관리자 비밀번호를 먼저 준비합니다.
const auth = await initAdminAuth();

const app = createApp();

const server = app.listen(config.port, () => {
  console.log('');
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  포트폴리오 서버가 시작되었습니다            │');
  console.log('  └──────────────────────────────────────────────┘');
  console.log(`   사이트   http://localhost:${config.port}`);
  console.log(`   관리자   http://localhost:${config.port}/admin`);
  console.log(`   API      http://localhost:${config.port}/api/health`);
  console.log(`   저장방식 ${config.dataDriver}`);
  console.log('');

  printAdminPassword();

  console.log('   종료하려면 Ctrl+C');
  console.log('');
});

/**
 * 관리자 비밀번호 안내.
 * 임의로 만든 경우에만 원문을 보여줍니다. 이 순간이 지나면 다시 볼 수 없습니다.
 */
function printAdminPassword() {
  if (auth.source === 'env') {
    console.log('   관리자 비밀번호: 환경변수(ADMIN_PASSWORD)로 지정된 값을 씁니다.');
    console.log('');
    return;
  }

  if (auth.source === 'file') {
    console.log('   관리자 비밀번호: 처음 실행할 때 만든 비밀번호를 그대로 씁니다.');
    console.log('     잊으셨다면 아래 파일을 지우고 서버를 다시 켜세요. (새로 만들어집니다)');
    console.log(`     backend/data/${config.admin.credentialsFile}`);
    console.log('');
    return;
  }

  // 처음 실행 — 이때만 원문을 보여줍니다.
  console.log('  ┌──────────────────────────────────────────────┐');
  console.log('  │  관리자 비밀번호를 새로 만들었습니다         │');
  console.log('  └──────────────────────────────────────────────┘');
  console.log('');
  console.log(`        ${auth.password}`);
  console.log('');
  console.log('   이 비밀번호는 지금 한 번만 표시됩니다. 따로 적어두세요.');
  console.log('   (서버에는 되돌릴 수 없는 형태로만 저장되어 다시 볼 수 없습니다)');
  console.log('');
  console.log('   직접 정한 비밀번호를 쓰고 싶다면:');
  console.log('     ADMIN_PASSWORD=원하는비밀번호 npm start');
  console.log('');
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n  ${config.port}번 포트를 이미 다른 프로그램이 쓰고 있습니다.\n` +
        `  다른 포트로 실행하려면:  PORT=3001 npm start\n`
    );
    process.exit(1);
  }
  throw err;
});

// Ctrl+C 를 눌렀을 때 처리 중이던 요청을 마무리하고 깔끔하게 종료합니다.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log('\n  서버를 종료합니다...');
    server.close(() => process.exit(0));
  });
}
