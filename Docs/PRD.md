# Product Requirements Document (PRD): CNC Quality Inspection KPI App

## 1. 개요 (Overview)
본 프로젝트는 기존의 수동적인 CNC 품질 검사 과정을 디지털화하여 데이터의 정확성을 높이고, 실시간 KPI 모니터링을 통해 생산 효율성과 제품 품질을 극대화하는 것을 목표로 합니다. React 기반의 웹 애플리케이션으로 개발되며, 모바일 환경(현장 태블릿/스마트폰) 사용을 최우선으로 고려합니다.

## 2. 목표 (Goals & Objectives)
* **수기 기록 제거:** 종이 기반 검사 시트의 디지털 전환을 통한 데이터 누락 및 오기입 방지.
* **실시간 KPI 시각화:** 불량률, 검사 시간, 가동률 등의 핵심 지표를 실시간 대시보드로 제공.
* **즉각적인 대응:** 불량 발생 시 즉시 알림 및 워크플로우 트리거.
* **데이터 자산화:** 모든 검사 이력을 DB화하여 추후 공정 개선을 위한 분석 데이터로 활용.

## 3. 타겟 유저 (User Personas)
* **현장 검사자 (Inspector):** 태블릿/모바일로 빠르고 정확하게 측정값을 입력하고 사진을 업로드해야 함. UI가 단순해야 함.
* **품질 관리자 (Manager):** 검사 기준(Master Data)을 설정하고, 대시보드를 통해 전반적인 현황을 모니터링하며 보고서를 생성함.
* **시스템 관리자 (Admin):** 사용자 권한 및 설비 정보를 관리함.

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 사용자 인증 및 권한 관리 (Auth & RBAC)
* **로그인/로그아웃:** 이메일/비밀번호 기반 로그인.
* **권한 분리:**
    * `Admin`: 모든 기능 접근 (사용자 관리 포함).
    * `Manager`: 마스터 데이터 관리, 대시보드 전체 보기, 보고서 출력.
    * `Inspector`: 검사 입력, 본인 실적 조회, 불량 등록.

### 4.2 마스터 데이터 관리 (Master Data Management)
* **설비 관리:** 설비 번호, 모델명, 도입일, 상태 등록/수정/삭제.
* **검사 항목 관리:**
    * 모델별 검사 항목(치수, 조도, 경도 등) 정의.
    * 항목별 스펙(Spec) 및 공차(Tolerance, 상한/하한) 설정.
    * 측정 단위 및 데이터 타입(수치형, OK/NG형) 설정.

### 4.3 검사 데이터 입력 (Inspection Execution)
* **검사 진입:** 설비 및 생산 모델 선택 (QR/바코드 스캔 지원 고려).
* **실시간 입력 폼:**
    * 측정값 입력 시 스펙 기준 자동 판정 (Pass/Fail 즉시 표시).
    * 비정상 값 입력 시 경고 문구(Validation) 표시.
* **증빙 자료:** 모바일 카메라를 연동한 검사 사진 업로드.
* **강제 중단/보류:** 검사 중 특이사항 발생 시 사유 입력 후 중단 기능.

### 4.4 불량 관리 (Defect Management)
* **불량 등록:** 검사 중 Fail 발생 시 자동으로 불량 등록 팝업/모드 전환.
* **상세 정보:** 불량 유형(코드), 발생 위치, 사진, 비고 입력.
* **처리 프로세스:** 불량 발생 -> 조치 대기 -> 조치 완료 상태 추적.

### 4.5 KPI 대시보드 (Dashboard)
* **필수 지표 위젯:**
    * 검사 건수 (금일/주간/월간).
    * 불량률 (Defect Rate) 및 추세 그래프.
    * 최초 합격률 (FPY).
    * 평균 검사 소요 시간.
* **시각화:**
    * 모델별/설비별 불량 파레토 차트.
    * 기간별 품질 추이 라인 차트.

### 4.6 보고서 및 알림 (Reporting & Alerts)
* **자동 리포팅:** 날짜 범위를 선택하여 PDF/Excel 형태의 검사 성적서 생성.
* **알림:** 연속 불량 발생 혹은 KPI 목표 미달 시 관리자에게 알림 (In-app Toast or Email).

## 5. 비기능 요구사항 (Non-Functional Requirements)
* **반응형 디자인 (Responsive):** 모바일(작업자용)과 데스크탑(관리자용) 뷰가 완벽하게 호환되어야 함.
* **성능 (Performance):** 데이터 입력 시 지연 시간이 1초 미만이어야 함 (Edge Network 활용).
* **데이터 무결성:** 입력된 데이터는 수정 이력이 남거나, 승인된 관리자만 수정 가능해야 함.

## 6. 데이터 모델링 (Supabase Schema Draft)
* `users`: id, email, role, name
* `machines`: id, name, model, status
* `product_models`: id, name, code
* `inspection_items`: id, model_id, name, standard_value, tolerance_min, tolerance_max
* `inspections`: id, user_id, machine_id, model_id, created_at, status (pass/fail)
* `inspection_results`: id, inspection_id, item_id, measured_value, result (pass/fail)
* `defects`: id, inspection_id, defect_type, description, photo_url, status