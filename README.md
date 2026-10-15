# Work Manager

## 실행

```bash
npm ci
npm run dev
```

## 검사

```bash
npm run test -- --run
npm run lint
npm run typecheck
npm run build
```

`npm run test`는 변경을 감지하며 테스트를 반복 실행합니다. 한 번만 검사하려면 `-- --run`을 붙입니다.

- `package.json`: 실행 명령어와 의존성
- `eslint.config.mjs`: Next.js, React, TypeScript 코드 검사 규칙
- `vitest.config.mts`: 테스트 환경과 경로 별칭
- `tests/setup.ts`: DOM 검증 도구와 테스트 후 정리
- `tests/*.test.tsx`: 화면 동작 테스트

기존 GitHub Actions CI에서도 위 검사 명령어를 실행합니다.

## 테스트 커버리지

```bash
npm run test:coverage
```
## 소셜 로그인

기본 주소 `/`는 `/login`으로 이동합니다. 로그인 화면은 가입·로그인 공통 진입점입니다.
`/workspace`는 인증 복원 및 `/users/me` 확인이 끝난 후에만 표시됩니다.
클라이언트의 화면 제어와 별개로 모든 보호 API는 백엔드에서 인증·권한을 검증해야 합니다.
현재 프로젝트·보드·카드는 예시 데이터를 사용하며 사용자별 API 연결은 별도 작업입니다.

### 같은 출처 프록시와 OAuth 설정

프런트엔드는 `/backend/:path`를 `BACKEND_URL/:path`로 프록시합니다.
`BACKEND_URL`은 Next 서버에서 접근할 백엔드 주소이며 기본값은 `http://localhost:8080`입니다.
브라우저에서 소셜 인증 시작과 콜백, 인증 API를 모두 프런트엔드 출처로 통일해 HttpOnly 쿠키를 전달합니다.
변경한 서버 환경 변수는 Next 서버 재시작/재빌드 후 반영됩니다.

로컬에서 Google·GitHub 앱의 승인된 콜백 URL과 백엔드의 redirect-uri를 아래 주소로 일치시켜야 합니다.
기존 백엔드 도메인의 콜백을 유지하면 별도 도메인 배포 시 프런트엔드가 인증 쿠키를 받을 수 없습니다.

| 설정 | 로컬 값 |
| --- | --- |
| Google 승인된 리디렉션 URI | `http://localhost:3000/backend/login/oauth2/code/google` |
| GitHub Authorization callback URL | `http://localhost:3000/backend/login/oauth2/code/github` |
| 백엔드 `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_REDIRECT_URI` | `http://localhost:3000/backend/login/oauth2/code/google` |
| 백엔드 `SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GITHUB_REDIRECT_URI` | `http://localhost:3000/backend/login/oauth2/code/github` |
| 백엔드 `LOGIN_SUCCESS_URL` | `http://localhost:3000/oauth/callback` |

배포 시 localhost 대신 실제 프런트엔드 HTTPS 출처를 사용합니다. 쿠키는 프런트엔드 호스트에 저장될 수 있도록 Domain을 생략하고 Path=/로 발급해야 합니다.
로컬 HTTP에서는 백엔드의 secure-cookie=false 설정이 필요합니다. 실제 자격 증명 파일은 읽거나 변경하지 않았습니다.

### 기존 회원 인증

`GET /auth/csrf`의 `headerName`과 `token`을 받아 `POST /auth/refresh`와 `POST /auth/logout`에 전달합니다.
액세스 토큰은 메모리에만 보관하며 localStorage/sessionStorage에 저장하지 않습니다.
새로고침 시 HttpOnly 갱신 쿠키로 복원하고 `/users/me`로 로그인 사용자를 확인합니다.
보호 API는 `lib/auth.ts`의 `authenticatedRequest`를 사용합니다. 401이면 한 번 토큰을 갱신해 재요청합니다.
워크스페이스에는 사용자 이름·이메일과 로그아웃을 표시합니다. 인증 만료는 로그인으로 이동하고, 네트워크 오류는 재시도를 제공합니다.

### 신규 가입: 백엔드 구현이 필요한 계약

현재 백엔드는 첫 소셜 인증에서 즉시 가입합니다. 이번 작업에서는 백엔드를 변경하지 않았습니다.
따라서 **동의 후 가입 및 동의 이력 DB 저장은 다음 백엔드 계약이 구현되어야 실제로 작동합니다.**

신규 사용자의 OAuth 인증 성공 시 정식 회원/로그인 쿠키 대신 짧은 수명의 HttpOnly 임시 가입 쿠키를 발급하고 `/oauth/callback`으로 이동해야 합니다.
기존 회원은 기존 방식대로 로그인 쿠키를 발급하고 동일한 콜백으로 이동합니다. 임시 가입 쿠키로 보호 API를 사용할 수 없어야 합니다.

| API | 응답 및 동작 |
| --- | --- |
| `GET /auth/registration` | 임시 가입 시 아래 JSON. 기존 회원은 204. 만료된 임시 가입은 401 |
| `POST /auth/registration` | 아래 동의 목록과 CSRF 헤더를 수신. 서버가 약관 ID·버전·필수 동의를 검증하고 사용자·소셜 계정·동의 이력을 원자적으로 저장. 로그인 쿠키 발급 후 204 |

GET 응답 예시(내용은 실제 확정된 약관을 제공):

```json
{
  "name": "사용자",
  "provider": "GOOGLE",
  "terms": [
    { "id": "terms", "title": "이용약관", "version": "v1", "content": "확정된 이용약관 전문", "required": true },
    { "id": "privacy", "title": "개인정보 수집·이용", "version": "v1", "content": "확정된 개인정보 안내 전문", "required": true }
  ]
}
```

POST 요청 예시:

```json
{
  "consents": [
    { "id": "terms", "version": "v1", "agreed": true },
    { "id": "privacy", "version": "v1", "agreed": true }
  ]
}
```

약관 내용은 HTML로 실행하지 않고 텍스트로 표시합니다. 필수 동의 전에는 제출할 수 없으며 선택 동의는 기본 해제입니다.
약관이 없거나 필수 약관이 없는 응답은 가입을 차단합니다. 가입 요청 실패 시 동의 선택을 유지해 재시도를 지원합니다.
가입 저장 후 인증 복원 실패는 가입을 다시 제출하지 않고 인증 콜백에서 재시도합니다.
백엔드는 임시 가입 쿠키를 가입 완료 시 폐기하고, 재전송·동시 가입을 안전하게 처리해야 합니다.
`POST /auth/registration`도 CSRF 보호 대상에 추가해야 합니다.

구버전 백엔드의 GET 404는 기존 로그인 복원으로 이어집니다. 이는 신규 가입·동의 완료로 처리하는 동작이 아닙니다.
백엔드 변경 전에는 소셜 첫 인증의 즉시 가입 동작이 유지됩니다. 프런트엔드만으로 이를 막거나 DB 저장 시점을 변경할 수 없습니다.
