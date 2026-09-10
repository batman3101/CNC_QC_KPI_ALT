# 재감사 대응 — R1·R2·R3 검증과 수정

- 작성일: 2026-09-10
- 대상: `Docs/MONITOR_ANALYTICS_REAUDIT_2026-09-10.md`의 발견 사항 R1(P1), R2(P2), R3(P2)
- 브랜치: `claude-monitor/defect-quantity-unify`
- 결론: **세 항목 모두 실제 결함으로 확인했고 모두 수정했다.** R3의 DB 제약과 함수 갱신은 2026-09-10 승인 후 운영 DB에 적용했고, 보강된 테스트를 운영 DB에서 롤백 트랜잭션으로 실행해 통과했다.

## R1 — 진행 중 동기화에 합류한 새 검사가 미전송인데 성공 표시 (확인, 수정)

**검증.** `offlineSyncService.ts`를 다시 읽어 확인했다. `inFlightSync`가 있으면 그 프라미스를 그대로 돌려주고, 처리 대상 목록은 실행 시작 때 한 번만 읽었다. 재감사가 서술한 순서 그대로 재현된다.

재감사와 같은 방식으로 실제 서비스 소스를 esbuild로 묶고 IndexedDB·Supabase 모듈만 메모리 스텁으로 바꿔 실행했다(`scripts/offline-sync-regression/`, `npm run test:sync`). **수정 전 코드**(`b8dcc5a`)에서는 새 항목이 `pending`으로 남고 성공이 표시됐다. 재감사의 재현 결과와 같다.

**수정.** 두 곳을 고쳤다.

1. `runSync`는 큐가 빌 때까지 목록을 **다시 읽으며** 돈다. 두 번째 회차부터는 `pending`만 읽어, 이번 실행에서 실패해 `error`가 된 항목이 같은 실행 안에서 세 번 연속 재시도되지 않게 했다.
2. `InspectionPage`는 `saveInspectionOffline`이 돌려준 큐 ID를 보관하고, 동기화가 끝난 뒤 **그 행의 상태**(`getQueuedInspectionStatus`)가 `synced`일 때만 성공을 알린다. 전체 결과의 `failed` 수는 로그로만 남긴다.

**회귀 테스트 결과(수정 후).**

| 시나리오 | 결과 |
|---|---|
| A. 옛 항목 전송 대기 중 새 항목 추가 → 두 호출이 같은 프라미스 공유 → 새 항목도 같은 실행에서 전송되고 `synced` | 통과 |
| B. 옛 항목 실패 + 새 항목 성공 → 전체 결과는 실패 1, 새 항목 행은 `synced`(페이지는 성공 표시) | 통과 |
| C. 실패한 항목은 같은 실행에서 한 번만 시도, `retry_count` 1, 상태 `error` | 통과 |

브라우저에서의 확인은 하지 않았다. 실제 저장이 운영 DB에 검사 데이터를 만들기 때문이다.

## R2 — 롤백 테스트가 첫 INSERT 실패만 검사 (확인, 수정)

**검증.** 맞다. `p_model_id = gen_random_uuid()`는 `inspections_model_id_fkey`에서 검사 INSERT 자체가 실패하므로 뒤 단계의 원자성을 증명하지 못했다.

**수정.** `supabase/tests/submit_inspection_record_verification.sql`에 다음을 넣었다.

- 유효한 검사 입력 + 존재하지 않는 `item_id`의 측정 결과 → 검사 INSERT 성공 후 `inspection_results_item_id_fkey`에서 실패 → 검사 행이 0건이어야 함.
- 유효한 검사 입력 + `result: 'bogus'`(enum 아님) → 결과 단계 캐스트 실패 → 검사 행 0건.
- 불량 INSERT 단계만 실패시키는 입력은 만들 수 없다. 불량 행의 모델·공장이 검사 행과 같은 값을 쓰기 때문이다. 코드 구조상 같은 트랜잭션이라는 점은 위 두 사례로 충분히 검증된다.
- 두 세션의 동시 재전송 검증은 단일 세션 SQL로는 불가능해 미수행이다. 함수는 `ON CONFLICT (client_ref) DO NOTHING` 뒤 기존 행을 재조회해 반환하도록 돼 있다.

이 테스트는 운영 DB에 함수가 갱신된 뒤 롤백 트랜잭션으로 실행한다.

## R3 — 불량 수량 ≤ 검사 수량 서버 검증 없음 (확인, 수정 준비)

**검증.** 맞다. 운영 `inspections`에 CHECK 제약이 없고 함수도 관계를 검사하지 않았다. 다만 운영 데이터에는 위반 행이 **0건**이다(`defect_quantity > inspection_quantity` 0, `inspection_quantity < 1` 0, `defect_quantity < 0` 0). 그래서 제약을 즉시 검증 상태로 걸 수 있다.

**수정.** `supabase/migrations/20260910_inspection_quantity_bounds.sql`:

- `inspections_defect_qty_within_inspection_qty` CHECK: `inspection_quantity >= 1 AND 0 <= defect_quantity <= inspection_quantity`. 다른 쓰기 경로도 보호한다.
- `submit_inspection_record`에 같은 관계 검사를 추가해 CHECK 위반(23514) 대신 읽을 수 있는 22023 오류를 돌려준다.
- 테스트에 10/10 허용, 10/11 거부(22023), 0/0 거부(22023), 직접 INSERT 10/11은 CHECK 위반을 추가했다.

## 재감사의 기타 지적

- 모니터 검증 파일의 "월 합계" 표현: 실제 범위(최근 7 업무일 + 오늘)로 주석을 고쳤다.
- 반개방 구간: 두 화면이 같은 `<= …59.999` 경계를 쓰므로 일치에는 영향이 없다. 분석 경로까지 함께 바꿔야 하므로 이번 범위에서 제외했다.
- 최근 목록의 의미 변경(불량 관리 기록 → 최근 불량 검사)과 옛 번들 단말 확인은 운영 안내 사항으로 남긴다.

## 검증 실행 내역

| 검증 | 결과 |
|---|---|
| `npx tsc --noEmit` | 통과 |
| `npm run lint` | 통과 |
| `npm run test:sync` (수정 후 코드) | 7개 검사 모두 통과 |
| 같은 스크립트, 수정 전 코드 | A 시나리오 실패(새 항목 `pending`) — 스크립트가 결함을 잡는 것 확인 |
| 운영 DB 수량 위반 행 조회 | 0건 |
| R3 마이그레이션 운영 적용 | 2026-09-10 승인 후 적용. CHECK 제약 `convalidated = true`, 위반 행 0 |
| R2·R3 보강 테스트 운영 실행 | 롤백 트랜잭션으로 실행, 전 항목 통과(원자 저장·재전송·결과 단계 실패 롤백·수량 상한·권한). 검증용 행 잔여 0 |
