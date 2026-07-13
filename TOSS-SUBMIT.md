# 앱인토스 출품 가이드 (바이브코딩 챌린지)

> ⏰ **챌린지 마감: 2026년 7월 29일** — 이날까지 콘솔에 **첫 번들 등록**을 마쳐야 합니다.
> 참가 3단계: ① 미니앱 개발(완료) ② 신청폼 제출 ③ 7/29까지 콘솔에 번들 등록

## 지금 상태 (이미 완료된 것)
- ✅ 게임 완성 + 외부 CDN 스크립트 제거(전부 로컬 번들 — 앱인토스 보안 요건)
- ✅ `@apps-in-toss/web-framework` 설정 (`granite.config.ts`)
- ✅ `.ait` 번들 빌드 성공: `npm run build` → `watermelon-face.ait`
- ✅ 체크리스트 대응: 음소거 버튼, 사용자 식별자·최고점수 저장(localStorage), 클라이언트 렌더링 온리

## 당신이 직접 해야 할 일 (계정/심사 관련)

### 1. 토스 비즈니스 계정 + 콘솔 앱 등록
1. https://developers-apps-in-toss.toss.im/ → 토스 비즈니스 계정 가입 (만 19세 이상, 개인 가능)
2. 워크스페이스 생성 → 앱 생성
   - 앱 이름(한국어): 예) `얼굴 수박게임`
   - **appName**: `watermelon-face` ← `granite.config.ts`와 반드시 일치 (등록 후 수정 불가!)
     - 다른 이름을 쓰고 싶으면 등록 전에 `granite.config.ts`의 `appName`도 같이 바꿔달라고 하면 됨
   - 앱 유형: 게임 (⚠️ 아래 "게임 카테고리 주의" 참고)
3. 로고 600×600 PNG(배경색 필수), 썸네일 1932×828 PNG 업로드
   - 업로드 후 발급되는 `static.toss.im` 이미지 URL을 알려주면 `granite.config.ts`의 `brand.icon`에 반영해줄게요

### 2. 콘솔 API 키 발급 → 배포
```
npm run build                        # watermelon-face.ait 생성
npm run deploy -- --api-key {API키}   # 콘솔에 업로드
```
(또는 콘솔 '앱 출시' 메뉴에서 `.ait` 파일 직접 업로드)

### 3. 샌드박스 테스트 (실기기)
- 개발자센터에서 샌드박스 앱 설치 (Android APK / iOS)
- PC에서 `npm run dev` 실행 → 같은 네트워크에서 `intoss://watermelon-face` 접속
- 문서: https://developers-apps-in-toss.toss.im/development/test/sandbox.html

### 4. 신청폼 제출
- 챌린지 공지 페이지의 신청폼: https://toss.im/apps-in-toss/blog/2607_vibecoding_challenge
- 콘솔 appName과 폼의 appName이 정확히 일치해야 함

### 5. 검토 요청 → 출시
- 토스 실앱 테스트 1회 이상 완료해야 '검토 요청' 버튼 활성화
- 검토 소요: 영업일 2~3일 → 승인 후 '출시하기'

## ⚠️ 게임 카테고리 주의사항 (중요)
게임으로 출시하려면 두 가지 법적 요건이 있습니다:
1. **게임 등급분류**: GRAC 직접 신청(10~15일, 유료) 또는 구글플레이 등 오픈마켓 자체등급분류(무료, 단 해당 스토어에 먼저 출시돼 있어야 함). 등급을 게임 화면에 표시해야 함.
2. **게임제작업 등록**: 개인이라도 정부24에서 게임제작업 등록 필요 (영업일 3일, 등록면허세 있음)

→ 일정상 부담되면 **비게임 카테고리(엔터테인먼트 등)로 등록 가능한지 콘솔/문의로 확인**해보는 것을 추천.
등급분류 안내: https://toss.im/apps-in-toss/blog/game_rating_classification

## 남은 기술 작업 (내가 할 일)
- [ ] 여름 해수욕장 배경 적용 (당신이 원하는 시점에 — 잊지 않게 리마인드 예정)
- [ ] 과일 이미지 9개: `image/tier1.png` ~ `image/tier9.png` 이름으로 넣어주면 자동 적용됨 (흰 배경 자동 제거)
- [ ] 콘솔 로고 URL 받으면 `brand.icon` 교체
- [ ] (선택) 토스 WebView에서 `<input type="file">` 동작 확인 — 안 되면 SDK 앨범 API로 교체 필요

## 참고 문서
- 개발자센터: https://developers-apps-in-toss.toss.im/
- 게임 출시 체크리스트: https://developers-apps-in-toss.toss.im/checklist/app-game.html
- 배포: https://developers-apps-in-toss.toss.im/development/deploy.html
