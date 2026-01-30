# 삭제된 불량 데이터의 잔존 표시 문제 수정 계획

## 문제 분석

### 현상
1. **대시보드**: 삭제된 불량의 검사 기록이 "불합격"으로 표시, KPI 수치 왜곡 (불량 수량 1, 불량률 100%)
2. **분석 페이지**: 검사 건수 4건, 불량률 100%, 합격률 0% — orphan 검사 데이터 포함
3. **BEST 검사자**: UUID(`9c168739-e526-49af-b338-6b8b0ac753a9`)가 이름 대신 표시

### 근본 원인

#### 원인 1: inspections 테이블 잔존 데이터
`defects` 3건을 삭제했지만, 연관된 `inspections` 4건은 `status='fail'`, `defect_quantity>0`인 상태로 남아있음.

현재 DB 상태:
| inspection_id | status | defect_quantity | defect_type |
|---------------|--------|-----------------|-------------|
| 850a526c... | fail | 1 | null |
| 88fd47cd... | fail | 2 | null |
| 346f385f... | fail | 13 | null |
| de059c1d... | fail | 1 | null |

`defect_type`은 이미 null로 정리했지만, `status`와 `defect_quantity`가 그대로여서 모든 KPI 계산에 "불합격"으로 반영됨.

#### 원인 2: analyticsService.ts 검사자 이름 조회 누락
`src/services/analyticsService.ts:84`에서 `name: inspector.user_id`로 설정 — users 테이블에서 이름을 조회하지 않고 UUID를 그대로 사용.

## 수정 사항

### Task 1: DB orphan inspections 정리
**작업**: orphan inspection 3건 삭제 (defect_type이 null이고 연관 defect가 없는 레코드)

단, inspection `850a526c...`는 `defects` 테이블에 아직 1건의 defect(`e4e2a1f2...`, defect_type=`b09b2d64...`)가 연결되어 있으므로 유지. 이 defect의 defect_type UUID(`b09b2d64...`)도 현재 defect_types에 존재하는지 확인 필요.

SQL:
```sql
-- 연관 defect가 없는 orphan inspections 삭제
DELETE FROM inspections
WHERE id IN ('88fd47cd-4d06-41d0-a761-6cd323b816d4', '346f385f-a478-4ef4-a02c-82b6f7e2f6f8', 'de059c1d-b3df-4419-8a23-81c623eadcee')
```

`850a526c...` (1/30 검사)는 유지하되, defect_type이 null인 상태 확인.

### Task 2: analyticsService.ts 검사자 이름 조회 수정
**파일**: `src/services/analyticsService.ts` (78-107줄)
**문제**: `name: inspector.user_id` → UUID가 이름으로 표시

**수정**: users 테이블에서 이름을 조회하여 매핑

```typescript
// 기존 (84줄)
inspectorDefects[inspector.user_id] = { name: inspector.user_id, count: 0, defects: 0 }

// 변경: users에서 이름 조회 후 매핑
// inspectors 쿼리 후, user_id 목록으로 users 테이블 조회
const userIds = [...new Set(inspectors?.map((i: { user_id: string }) => i.user_id).filter(Boolean) || [])]
const { data: userProfiles } = await supabase
  .from('users')
  .select('id, name')
  .in('id', userIds)
const userNameMap = new Map(userProfiles?.map(u => [u.id, u.name]) || [])

// 그리고 name 할당 시:
inspectorDefects[inspector.user_id] = {
  name: userNameMap.get(inspector.user_id) || inspector.user_id,
  count: 0, defects: 0
}
```

### Task 3: 850a526c inspection의 defect 유효성 확인
**작업**: `defects` 테이블에 남아있는 1건의 `defect_type`(`b09b2d64...`)이 현재 `defect_types` 테이블에 존재하는지 확인.

- 존재하면: 정상, 그대로 유지
- 존재하지 않으면: orphan이므로 defect 삭제 + inspection의 defect_quantity/status 업데이트

## 수정 대상 파일 요약

| 파일 | 변경 |
|------|------|
| DB (inspections 테이블) | orphan 3건 삭제 |
| `src/services/analyticsService.ts` | 검사자 이름 조회 로직 추가 (78-107줄) |
| DB (defects 테이블) | 850a526c 연관 defect 유효성 확인 |

## 검증 계획

1. `npm run build` 성공
2. 대시보드: 유효한 검사만 표시, KPI 정확
3. 분석 페이지: 정확한 검사 건수, 합격률, 불량률
4. BEST 검사자: UUID 대신 사용자 이름 표시
5. 불량 관리: orphan 데이터 없음

## 수용 기준

- [ ] orphan inspections 3건 DB에서 삭제
- [ ] 분석 페이지 BEST 검사자에 이름 표시 (UUID 아님)
- [ ] 대시보드 KPI가 실제 데이터 반영
- [ ] 빌드 성공
