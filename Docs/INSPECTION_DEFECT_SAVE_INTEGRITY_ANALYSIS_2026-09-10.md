# 검사 저장 정합성 분석 — 불량 기록 누락과 검사 중복의 원인

- 작성일: 2026-09-10
- 선행 문서: `Docs/MONITOR_ANALYTICS_DEFECT_MISMATCH_ANALYSIS_2026-09-10.md` 5절 "별도 후속 작업: 저장 정합성"
- 코드 기준: 브랜치 `claude-monitor/defect-quantity-unify` (`6272bc6`)
- 확인 대상: Supabase `CNC_QC_KPI` 운영 DB (읽기 전용 SELECT), Supabase 요청 로그(최근 24시간), git 이력
- 수행하지 않은 것: 앱 코드 수정, DB 데이터 변경, 마이그레이션, 배포

## 1. 결론

**불량 기록 누락은 서버 거부나 삭제가 아니라, 앱이 "검사 저장"과 "불량 기록 저장"을 두 번의 요청으로 나눠 보내는 사이에 멈춘 결과다.** 요청 로그에서 9월 9일 23:36:37(베트남) 누락 건은 검사 INSERT가 서버에 201로 기록됐고, 그 뒤에 와야 할 불량 INSERT 요청이 **서버에 도착한 적이 없다.** 같은 24시간 창에 불량 DELETE 요청도 없다.

**같은 결함이 검사 중복까지 만든다.** 앱은 멈춘 업로드를 다음 실행 때 다시 시도하는데, 재시도는 검사 행을 **새로** INSERT한다. 9월 9일 누락 건은 206분 뒤(9월 10일 03:02, 그 검사자의 그날 첫 입력) 기계·모델·공정·수량·유형이 완전히 같은 검사가 다시 저장됐고 이번엔 불량 기록이 붙었다. 최근 32일 기준 이런 쌍이 15건이며, 검사 수량 5,998개·불량 수량 78개가 두 번 집계되고 있다.

확신 수준:
- 저장이 두 요청으로 나뉘어 있고 재시도가 검사를 재INSERT한다: **코드로 확인, 높음**
- 9월 9일 건이 "클라이언트 중단 → 재시도 중복" 경로다: **로그와 DB 쌍둥이로 확인, 높음**
- 나머지 63건도 같은 경로다: **정황상 일치하나 24시간 로그 밖이라 미확인**
- 클라이언트가 왜 멈췄는가(화면 이탈, 기기 잠금, 네트워크): **미확인**

## 2. 운영 DB 검증 결과

최근 32일, 불량 수량이 양수인 검사 8,534건 중 **불량 기록이 없는 검사 78건**(ALT 75, ALV 3). 전체 기간으로는 250건, 683개이며 첫 발생은 2026-01-30이다.

| 항목 | 값 | 의미 |
|---|---:|---|
| 누락 78건 중 불량 유형이 있는 건 | 78 | "유형을 안 골라서 기록이 없는" 경우가 아니다 |
| 누락 78건 중 사진 있는 건 | 78 | 정상 건도 8,444/8,456이 사진 있음 → 사진은 원인 아님 |
| 검사자 역할 | 7명 전원 inspector | 관리자 삭제 경로와 무관 |
| 권한 변경 이력(40일) | 0건 | RLS 권한은 7월 11일 이후 그대로 |
| 검사 1건에 불량 기록 2개 이상 | 0건(전체 DB) | 중복은 검사 행 쪽에서 생긴다 |
| 24시간 내 동일 내용 쌍둥이 검사 | 15건(14건은 불량 기록 있음) | 재시도 재INSERT 서명 |
| 쌍둥이로 두 번 집계된 수량 | 검사 5,998개 / 불량 78개 | 분석·모니터 모두 과대 집계 |
| 쌍둥이 없는 누락 | 63건 / 188개 | 기기 큐에 남아 있거나 큐가 지워진 것으로 추정, 미확인 |

시간 분포에서 두 패턴이 보인다.

- **세션의 마지막 입력 1건만 누락**: 9월 9일 23:28~23:36 연속 17건 중 마지막 1건, 9월 10일 06:38~06:44 연속 8건 중 마지막 1건. 검사자가 마지막 저장 직후 화면을 떠나는 상황과 일치한다.
- **연속 입력 전부 누락**: 8월 20일 18:26~18:40에 검사자 2명이 30~60초 간격으로 입력한 21건이 모두 누락, 그 사이에 정상 건이 없다. 9월 3일 06:34~06:41 9건도 같다. 이 21건은 쌍둥이도 없다. 수동 삭제라면 하루에 흩어져야 하므로 삭제 가설과 맞지 않고, 당시 기기 상태(네트워크·앱 중단)가 원인일 가능성이 높으나 로그 보관 기간 밖이라 확정하지 못했다.

## 3. 코드 근거

| 경로 | 근거 |
|---|---|
| `src/pages/InspectionPage.tsx:60-121` | 온라인·오프라인 구분 없이 **모든 저장이 로컬 큐(IndexedDB)에 먼저 들어간 뒤** 백그라운드 동기화로 서버에 전송된다. 성공 스낵바는 동기화 결과와 무관하게 즉시 뜨고 화면이 초기화된다 |
| `src/services/inspectionService.ts:477-509` | `createInspectionRecord`: 검사 INSERT → 불량 INSERT를 **별개 요청**으로 순차 실행. 트랜잭션이 아니다 |
| `src/services/offlineSyncService.ts:154-223` | 항목마다 사진 업로드 → 검사 INSERT → 불량 INSERT 후에야 `synced`. 도중에 예외가 나면 `error`로 표시하고 `retry_count < 3`이면 다음 동기화에서 **처음부터 다시 실행**한다. 서버에 이미 들어간 검사 행은 모른다 |
| `src/services/offlineSyncService.ts:127-142` | 탭이 닫혀 `syncing`에 멈춘 행을 다음 실행 때 `pending`으로 되돌려 재시도한다. 검사 INSERT까지 끝난 뒤 멈췄으면 **검사가 중복**된다 |
| `src/services/offlineSyncService.ts:44-58` | 로컬 큐 ID(`offline_...`)를 만들지만 서버 검사 행의 PK로 쓰지 않는다. 같은 항목을 두 번 보내도 서버가 구분할 수 없다 |
| `supabase` `defects_inspection_id_fkey` | `ON DELETE CASCADE`. 검사가 지워지면 불량도 지워지므로 "검사만 남는" 경우는 삭제로 생기지 않는다. 불량만 지우는 경로(`DefectsList.tsx:217`)는 있으나 로그에 DELETE 요청이 없다 |
| git 이력 | `createInspectionRecord`·`createDefect`의 저장 구조는 2025-12-25 이후 동일. 번들 버전에 관계없이 같은 결함이 있다 |

## 4. 요청 로그 근거 (2026-09-09 16:25Z ~ 2026-09-10 00:00Z)

정상 건은 `POST /rest/v1/inspections` 201 직후 150~250ms 안에 `POST /rest/v1/defects` 201이 따라온다. 누락 건은 다음과 같다.

| UTC | 요청 | 응답 | 해석 |
|---|---|---|---|
| 16:36:12.644 | POST inspections | 201 | 정상 (직후 defects 201) |
| 16:36:37.617 | POST inspections | 201 | **누락 건 — 이후 defects 요청 없음** |
| 17:03:39.926 | POST inspections | 201 | 다음 요청은 27분 뒤, 다른 세션 |
| 20:02:31.961 | POST inspections + defects | 201/201 | **쌍둥이** — 같은 검사자의 새 세션 첫 요청 |

창 안에 `DELETE /rest/v1/defects` 요청은 없다.

## 5. 검토한 뒤 기각한 가설

| 가설 | 결과 |
|---|---|
| 불량 INSERT가 RLS 권한에 막혔다 | 로그에 4xx 응답이 없고 요청 자체가 없음. 권한 변경 이력 0건 |
| 불량 관리 화면에서 삭제했다 | DELETE 요청 없음. 21건 연속 누락은 삭제 패턴과 불일치 |
| 사진 업로드가 원인이다 | 정상 건도 99.9% 사진 있음 |
| 불량 유형을 안 골랐다 | 누락 78건 전부 유형 있음 |
| 옛 앱 번들만의 문제다 | 사진 경로·저장 구조가 2025년 12월부터 동일해 구분 불가. 번들과 무관하게 결함 존재 |

## 6. 수정 방향 (제안, 미구현)

1. **서버 원자 저장**: 검사·검사 결과·불량 기록을 한 번에 INSERT하는 RPC(예: `submit_inspection_record`)를 만들고 앱은 이 함수 하나만 호출한다. 실패하면 아무것도 남지 않는다.
2. **멱등성**: 로컬 큐 ID를 서버 검사 행의 PK(또는 `client_ref` 유니크 컬럼)로 보내 재시도가 같은 행을 가리키게 한다. 재시도로 검사가 두 번 생기는 일이 사라진다.
3. **UI 순서**: 성공 스낵바는 동기화 완료 후에 띄우거나, "저장 대기 중" 상태를 구분해 보여준다.
4. **기존 데이터 정리**(승인 필요): 쌍둥이 15쌍은 검사 수량 5,998개가 이중 집계된 상태다. 어느 쪽을 남길지, 63건 무쌍둥이 누락에 불량 기록을 만들지는 현장 확인 후 결정한다. 기록 부재만으로 자동 생성하지 않는다.

## 7. 재현용 읽기 전용 SQL

```sql
-- 최근 32일: 불량 수량은 있으나 불량 기록이 없는 검사와, 24시간 내 동일 내용 쌍둥이
WITH unlinked AS (
  SELECT i.* FROM public.inspections i
  WHERE i.defect_quantity > 0 AND i.created_at >= now() - interval '32 days'
    AND NOT EXISTS (SELECT 1 FROM public.defects d WHERE d.inspection_id = i.id)
)
SELECT u.id, u.user_id, u.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS vn_time,
       u.defect_quantity,
       (SELECT j.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' FROM public.inspections j
        WHERE j.id <> u.id AND j.user_id = u.user_id AND j.model_id = u.model_id
          AND j.machine_id IS NOT DISTINCT FROM u.machine_id
          AND j.inspection_process = u.inspection_process
          AND j.inspection_quantity = u.inspection_quantity
          AND j.defect_quantity = u.defect_quantity
          AND j.defect_type IS NOT DISTINCT FROM u.defect_type
          AND j.created_at > u.created_at AND j.created_at < u.created_at + interval '24 hours'
        ORDER BY j.created_at LIMIT 1) AS twin_at
FROM unlinked u ORDER BY u.created_at;
```

```sql
-- Supabase 요청 로그 (ClickHouse, 24시간 창): 검사 INSERT 뒤 불량 INSERT가 따라오는지
select timestamp, log_attributes['request.method'] as method,
       log_attributes['request.path'] as path, log_attributes['response.status_code'] as status
from logs
where source = 'edge_logs'
  and (log_attributes['request.path'] like '%/rest/v1/defects%'
    or log_attributes['request.path'] like '%/rest/v1/inspections%')
  and log_attributes['request.method'] in ('POST','DELETE')
order by timestamp
```

## 8. 한계

요청 로그는 24시간만 조회할 수 있어 9월 9일 밤~10일 새벽 건만 직접 대조했다. 8월 20일 21건은 DB 패턴으로만 추정했다. 기기 쪽 큐(IndexedDB)에 아직 `syncing`이나 `error`로 남아 있는 항목이 있는지는 기기를 직접 열어야 알 수 있다.
