# Monitor Page Redesign Plan

## 요약
현재 MonitorPage를 현장 TV 모니터 전용 다크 테마 품질 현황 대시보드로 전면 재설계.
- MUI → Tailwind CSS 다크 레이아웃
- TV 해상도(1920x1080) 최적화, 스크롤 없이 한 화면에 모든 정보 표시
- 2분마다 한국어↔베트남어 자동 언어 전환 + 데이터 갱신

## 참조 디자인
사용자가 제공한 스크린샷 이미지 (대화 내 첨부). 다크 네이비 배경, 6개 섹션 구성.

## 현재 상태
- `src/pages/MonitorPage.tsx`: MUI 기반, 4개 KPI 카드 + 검사 테이블 + 불량 목록
- 라우트: `/monitor` (인증 불필요)
- 데이터 소스: inspectionService (getInspections, getDefects), managementService (getMachines, getProductModels, getDefectTypes)
- 차트 라이브러리: Recharts (설치됨)
- 자동 새로고침: 2분 간격
- Factory 컨텍스트: `useFactoryStore`의 `activeFactoryId`

## TV 모니터 최적화 전략

### 화면 크기 최적화
- **타겟**: 1920x1080 (Full HD TV) - 스크롤 없이 전체 대시보드 표시
- **`h-screen` 기반 레이아웃**: 뷰포트 높이를 기준으로 각 섹션 비율 배분
  - 헤더: ~8% (약 86px)
  - KPI 카드: ~12% (약 130px)
  - 중간 영역 (차트+TOP5): ~42% (약 454px)
  - 하단 영역 (파이+모델+시스템): ~38% (약 410px)
- **폰트 크기**: TV 원거리 가독성을 위해 기본 폰트 크기 확대
  - KPI 값: `text-5xl` ~ `text-6xl`
  - 섹션 제목: `text-xl`
  - 차트 라벨/범례: `text-sm` ~ `text-base`
  - 시계: `text-4xl font-mono`
- **패딩/간격**: 넉넉한 간격 (`gap-4`, `p-4` ~ `p-6`)

### 2분 주기 자동 언어 전환 + 데이터 갱신
- **단일 타이머**: 2분(120초)마다 실행
- **동작 순서**:
  1. `i18n.changeLanguage(현재 === 'ko' ? 'vi' : 'ko')` — 언어 토글
  2. `queryClient.invalidateQueries()` — 데이터 갱신
  3. `setLastUpdated(new Date())` — 갱신 시간 기록
- **구현**: `useEffect` 내 `setInterval(AUTO_REFRESH_INTERVAL)` 하나로 통합
- **초기 언어**: `'ko'` (한국어로 시작, 2분 후 베트남어, 4분 후 한국어...)

## 대상 레이아웃

### Row 1: 헤더 (h-[8vh])
- 좌: 회사 로고 (`/A symbol BLUE-02.png`) + "ALMUS TECH 품질 현황 모니터링" + "ALMUS TECH / 품질 TEAM"
- 우: 실시간 시계 (HH:MM:SS 모노스페이스 `text-4xl`) + 날짜 (YYYY년 M월 D일 요일)
- 배경: 다크 (#0f172a)

### Row 2: KPI 카드 4개 (h-[12vh], 균등 4열 grid-cols-4)
각 카드: 다크 카드 배경 (#1e293b), rounded-xl, 좌상단 타이틀, 우상단 아이콘, 큰 값, 하단 부제
1. **총 불량 발생 (TOTAL)**: 값=`allDefects.length`, 색=#ef4444, 부제="누적 집계"
2. **금일 불량 (TODAY)**: 값=오늘 business day 불량 수, 색=#22c55e, 부제="오늘 08:00 이후"
3. **최다 불량 설비 (WORST)**: 값=최다 machine의 defect 수, 색=흰색, 부제="집중 관리 필요"
4. **주요 이슈 (TOP ISSUE)**: 값=최빈 defect_type 이름(resolved), 색=#a855f7, 부제="가장 빈번한 유형"

### Row 3: 중간 영역 (h-[42vh], grid 좌 65% / 우 35%)
- **좌: 일별 불량 발생 추이** (Recharts BarChart)
  - X축: 날짜 (MM.DD.), Y축: 불량 건수
  - 최근 14일 (business date 기준)
  - 바 색상: 산호색(#f97316), 각 바 위에 값 LabelList
  - 좌측 빨간 세로 accent 바
- **우: 불량 최다 발생 설비 TOP 5**
  - 순위 뱃지 (1=빨강, 2=주황, 3=노랑, 4=초록, 5=파랑)
  - machine name (bold) + 우측 불량 건수 ("N 건")
  - 프로그래스 바 (최대값 대비 비율)
  - 항목 아래 "최근 이슈: {defect_type name}" 텍스트

### Row 4: 하단 영역 (h-[38vh], grid 3등분 grid-cols-3)
- **좌: 불량 유형 분석** (PieChart)
  - defect_type ID 그룹핑 → getDefectTypeName() 이름 resolve
  - 우측 범례 (색 + 이름 + 퍼센트)
- **중: 모델별 불량 점유율** (BarChart horizontal)
  - model_id 그룹핑 → getModelCode() 코드 resolve
  - 수평 바 + 퍼센트 라벨
- **우: 시스템 연결 상태**
  - 연결 인디케이터 (초록 원), "✓ Supabase Connected"
  - "Last Synced:" + lastUpdated 시간
  - 최신 defect 로그 1건 (created_at, machine, defect_type)
  - "강제 새로고침" 버튼

## 구현 계획

### Step 1: MonitorPage.tsx 전면 재작성
- MUI import 전부 제거 → Tailwind CSS 직접 사용
- `h-screen w-screen bg-[#0f172a] overflow-hidden` — 스크롤 없는 전체 화면
- 테마/언어 수동 토글 버튼 제거 (자동 전환으로 대체)
- 기존 useQuery fetching 유지
- `activeFactoryId` 필터 유지

### Step 2: 자동 언어 전환 + 데이터 갱신 타이머
```typescript
const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000 // 2분

useEffect(() => {
  const interval = setInterval(() => {
    // 1. 언어 전환
    const newLang = i18n.language === 'ko' ? 'vi' : 'ko'
    i18n.changeLanguage(newLang)
    // 2. 데이터 갱신
    queryClient.invalidateQueries({ queryKey: ['monitor-inspections', activeFactoryId] })
    queryClient.invalidateQueries({ queryKey: ['monitor-defects', activeFactoryId] })
    // 3. 갱신 시간 업데이트
    setLastUpdated(new Date())
  }, AUTO_REFRESH_INTERVAL)
  return () => clearInterval(interval)
}, [i18n, queryClient, activeFactoryId])
```

### Step 3: 데이터 계산 로직 (useMemo)
모든 집계는 `allDefects` 배열 기반, ID→이름 변환은 display 시점:
- `totalDefects`: `allDefects.length`
- `todayDefects`: business date === today 필터
- `worstMachine`: machine_id 그룹핑 → 최다 → getMachineName() resolve
- `topIssue`: defect_type(ID) 그룹핑 → 최다 → getDefectTypeName() resolve
- `dailyDefectTrend`: 최근 14일 business date별 count
- `topMachines`: machine_id별 count TOP 5 + 각 최근 defect_type
- `defectTypeDistribution`: defect_type별 count/비율
- `modelDefectShare`: model_id별 count/비율

### Step 4: Recharts 차트 (인라인)
- `BarChart` + `Bar` + `LabelList`: 일별 추이 (세로 바)
- `PieChart` + `Pie` + `Cell`: 불량 유형
- `BarChart` (layout="vertical"): 모델별 점유율
- **ResponsiveContainer** 사용으로 부모 영역에 맞춰 자동 리사이즈
- 차트 색상: 축 라벨 흰색(#e2e8f0), 그리드 #334155

### Step 5: 실시간 시계
- `useState` + `useEffect` + `setInterval(1000)`
- 베트남 시간 기준 `toLocaleString` 포맷
- 시계는 언어 전환과 무관하게 항상 동일 포맷

### Step 6: i18n 번역 키

**한국어** (`src/locales/ko/translation.json`):
```json
{
  "monitor": {
    "title": "품질 현황 모니터링",
    "companyName": "ALMUS TECH",
    "teamName": "ALMUS TECH / 품질 TEAM",
    "lastUpdated": "마지막 업데이트",
    "totalDefects": "총 불량 발생 (TOTAL)",
    "totalDefectsDesc": "누적 집계",
    "todayDefects": "금일 불량 (TODAY)",
    "todayDefectsDesc": "오늘 08:00 이후",
    "worstMachine": "최다 불량 설비 (WORST)",
    "worstMachineDesc": "집중 관리 필요",
    "topIssue": "주요 이슈 (TOP ISSUE)",
    "topIssueDesc": "가장 빈번한 유형",
    "dailyDefectTrend": "일별 불량 발생 추이",
    "topMachines": "불량 최다 발생 설비 TOP 5",
    "recentIssue": "최근 이슈",
    "defectTypeAnalysis": "불량 유형 분석",
    "modelDefectShare": "모델별 불량 점유율",
    "systemStatus": "시스템 연결 상태",
    "connected": "Supabase Connected",
    "disconnected": "연결 끊김",
    "lastSynced": "Last Synced",
    "latestDataLog": "최신 데이터 수신 로그",
    "forceRefresh": "강제 새로고침",
    "machine": "설비",
    "issue": "Issue",
    "count": "건"
  }
}
```

**베트남어** (`src/locales/vi/translation.json`):
```json
{
  "monitor": {
    "title": "Giám sát tình trạng chất lượng",
    "companyName": "ALMUS TECH",
    "teamName": "ALMUS TECH / Đội Chất lượng",
    "lastUpdated": "Cập nhật lần cuối",
    "totalDefects": "Tổng lỗi phát sinh (TOTAL)",
    "totalDefectsDesc": "Tổng tích lũy",
    "todayDefects": "Lỗi hôm nay (TODAY)",
    "todayDefectsDesc": "Sau 08:00 hôm nay",
    "worstMachine": "Thiết bị lỗi nhiều nhất (WORST)",
    "worstMachineDesc": "Cần quản lý tập trung",
    "topIssue": "Vấn đề chính (TOP ISSUE)",
    "topIssueDesc": "Loại phổ biến nhất",
    "dailyDefectTrend": "Xu hướng lỗi theo ngày",
    "topMachines": "TOP 5 thiết bị lỗi nhiều nhất",
    "recentIssue": "Vấn đề gần đây",
    "defectTypeAnalysis": "Phân tích loại lỗi",
    "modelDefectShare": "Tỷ lệ lỗi theo model",
    "systemStatus": "Trạng thái kết nối hệ thống",
    "connected": "Supabase Đã kết nối",
    "disconnected": "Mất kết nối",
    "lastSynced": "Đồng bộ lần cuối",
    "latestDataLog": "Nhật ký dữ liệu mới nhất",
    "forceRefresh": "Làm mới",
    "machine": "Thiết bị",
    "issue": "Vấn đề",
    "count": "lỗi"
  }
}
```

### Step 7: 시스템 연결 상태 패널
- 연결 상태: queryClient 에러 없으면 초록, 있으면 빨강
- Last Synced: lastUpdated state
- 최신 로그: allDefects[0]의 created_at, machine_name, defect_type_name
- 강제 새로고침 버튼 → handleManualRefresh

### Step 8: 로딩/에러 상태
- 로딩: `animate-pulse` 스켈레톤 (bg-slate-700)
- 에러: 빨간 텍스트 메시지
- 빈 데이터: 회색 텍스트 "데이터 없음"

## 수정 파일 목록
1. `src/pages/MonitorPage.tsx` - 전면 재작성
2. `src/locales/ko/translation.json` - monitor 섹션 확장
3. `src/locales/vi/translation.json` - monitor 섹션 확장

## 리스크 및 완화
- **MUI → Tailwind**: 프로젝트에 Tailwind 이미 사용 중. MUI import 전부 제거.
- **useThemeMode 제거**: 다크 테마 강제, 수동 토글 불필요.
- **defect_type은 ID**: 항상 getDefectTypeName()으로 resolve.
- **Factory 컨텍스트**: activeFactoryId 유지. 미선택 시 전체 데이터.
- **TV 전용**: 1920x1080 기준, 모바일 불필요.
- **자동 언어 전환**: i18n.changeLanguage는 React 리렌더링 트리거. t() 호출 결과가 자동으로 변경되므로 추가 작업 불필요.
- **vh 단위 사용**: TV 브라우저에서 vh가 정확히 동작함 (키오스크 모드/전체화면 기준).

## 수용 기준
1. 이미지와 동일한 6섹션 레이아웃, **h-screen 기반 스크롤 없음**
2. 다크 배경 (#0f172a) 고정, 앱 테마와 독립
3. 실시간 시계 매초 업데이트 (베트남 시간)
4. **2분마다 한국어↔베트남어 자동 전환 + 데이터 갱신 동시 실행**
5. 수동 강제 새로고침 버튼 유지
6. Recharts 기반 3개 차트 (세로바, 파이, 수평바), ResponsiveContainer 사용
7. activeFactoryId 필터 유지
8. 로딩 스켈레톤, 에러/빈 데이터 메시지 표시
9. defect_type은 ID 그룹핑 → 이름 resolve
10. **1920x1080 TV에서 전체 내용이 스크롤 없이 표시됨**
