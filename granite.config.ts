import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  // 콘솔(개발자센터) '앱 정보'의 appName과 정확히 일치해야 합니다.
  appName: 'watermelon-face',
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'node scripts/build-dist.mjs',
    },
  },
  permissions: [],
  outdir: 'dist',
  brand: {
    displayName: '얼굴 수박게임',
    // TODO: 콘솔에 600x600 로고 업로드 후 발급되는 static.toss.im URL로 교체
    icon: 'https://static.toss.im/appsintoss/placeholder.png',
    primaryColor: '#FF8C42',
    bridgeColorMode: 'basic',
  },
  webViewProps: { type: 'game' },
});
