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