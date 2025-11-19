# UI Test Directory

이 디렉토리는 **프론트엔드 UI 테스트**를 위한 Mock 데이터와 서비스를 포함합니다.

## 목적

Supabase 백엔드 연결 전에 프론트엔드 UI를 테스트하기 위한 목적으로 사용됩니다.

## 구조

```
ui_test/
├── mockData/              # Mock 데이터
│   └── analyticsMockData.ts
├── mockServices/          # Mock 서비스 (실제 서비스와 동일한 인터페이스)
│   └── mockAnalyticsService.ts
└── README.md
```

## 사용 방법

프론트엔드 컴포넌트에서 다음과 같이 import 합니다:

```typescript
// UI 테스트용 (현재)
import * as analyticsService from '@/ui_test/mockServices/mockAnalyticsService'

// Supabase 연결 시 (나중에)
// import * as analyticsService from '@/services/analyticsService'
```

## Supabase 연결 시

1. **이 디렉토리 전체를 삭제**합니다:
   ```bash
   rm -rf src/ui_test
   ```

2. **Import 경로를 변경**합니다:
   ```typescript
   // Before (Mock)
   import * as analyticsService from '@/ui_test/mockServices/mockAnalyticsService'

   // After (Real Supabase)
   import * as analyticsService from '@/services/analyticsService'
   ```

3. 완료! 실제 Supabase 데이터가 연동됩니다.

## Mock 데이터 설명

### analyticsMockData.ts
- **mockKPISummary**: 전체 KPI 요약 데이터
- **mockDefectRateTrend**: 불량률 추이 (15일치)
- **mockModelDefectDistribution**: 모델별 불량 분포
- **mockMachinePerformance**: 설비별 성능
- **mockDefectTypeDistribution**: 불량 유형 분포
- **mockHourlyDistribution**: 시간대별 검사 분포
- **mockInspectorPerformance**: 검사자별 성능
- **mockMachines**: 필터용 설비 목록
- **mockProductModels**: 필터용 제품 모델 목록

## 주의사항

- 이 디렉토리의 파일들은 프로덕션 빌드에 포함되지 않도록 주의하세요
- Mock 데이터는 실제 데이터 구조와 동일하게 유지되어야 합니다
- 실제 서비스와 Mock 서비스의 함수 시그니처는 동일해야 합니다
