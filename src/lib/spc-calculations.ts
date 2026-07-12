/**
 * SPC 통계 계산 유틸리티
 * Statistical Process Control calculations
 *
 * 이 앱의 SPC는 p-chart(불량률 관리도) 하나만 다룬다. np / X-mR / X-bar R
 * 계산기와 Cpk(공정능력) 체인도 한때 있었으나 어느 화면에서도 호출하지 않아
 * 제거했다. 다시 필요해지면 git 이력에서 되살릴 것.
 */

import type { PChartLimits, SPCViolation } from '@/types/spc'

// ============================================
// 1. p-chart 관리한계
// ============================================

/** 하루치 표본 */
export interface PChartSample {
  defect_count: number
  sample_size: number
}

/** 한 점의 관리한계 */
export interface PChartPointLimits {
  ucl: number
  lcl: number
  sigma: number
}

/**
 * 중심선 p-bar = 전체 불량 수 / 전체 검사 수
 *
 * 일별 불량률의 단순 평균이 아니다. 검사량이 적은 날과 많은 날의 불량률에
 * 같은 가중치를 주면 중심선이 왜곡된다.
 */
export function calculatePBar(samples: PChartSample[]): number {
  const totalDefects = samples.reduce((sum, s) => sum + s.defect_count, 0)
  const totalSamples = samples.reduce((sum, s) => sum + s.sample_size, 0)
  return totalSamples > 0 ? totalDefects / totalSamples : 0
}

/**
 * 한 점의 3-시그마 관리한계.
 *
 * p-chart의 시그마는 그 점의 표본 크기에 따라 달라진다:
 *   sigma_i = sqrt(p_bar * (1 - p_bar) / n_i)
 *
 * 따라서 관리한계는 수평선이 아니라 계단이다. 예전 구현은 평균 표본 크기로
 * 시그마를 한 번만 계산해 모든 점에 같은 한계를 적용했는데, 이는 검사량이
 * 많은 날에는 한계를 실제보다 헐겁게 만들어 진짜 이상을 놓치고, 적은 날에는
 * 지나치게 빡빡하게 만들어 없는 이상을 만들어냈다.
 */
export function calculatePChartPointLimits(
  pBar: number,
  sampleSize: number
): PChartPointLimits {
  // 표본이 없는 날은 신호를 낼 수 없다. 시그마를 0으로 두면 z도 0이 되어
  // 어떤 규칙에도 걸리지 않는다.
  if (sampleSize <= 0) {
    return { ucl: 1, lcl: 0, sigma: 0 }
  }

  const sigma = Math.sqrt((pBar * (1 - pBar)) / sampleSize)

  return {
    ucl: Math.min(1, pBar + 3 * sigma),
    lcl: Math.max(0, pBar - 3 * sigma), // 불량률은 음수가 될 수 없다
    sigma,
  }
}

/**
 * 표준화 값 z_i = (p_i - p_bar) / sigma_i
 *
 * 시그마가 0이면(불량이 전혀 없거나 표본이 없는 경우) 편차를 잴 척도가 없다.
 * 0을 돌려주어 중심선 위에 있는 것으로 취급한다.
 */
export function standardizePChartValue(
  defectRate: number,
  pBar: number,
  sigma: number
): number {
  if (sigma === 0) return 0
  return (defectRate - pBar) / sigma
}

/** 점별 한계의 최소/최대 — 축 스케일과 요약 표시용 */
export function summarizePChartLimits(
  pBar: number,
  pointLimits: PChartPointLimits[]
): PChartLimits {
  if (pointLimits.length === 0) {
    return { p_bar: pBar, centerLine: pBar, ucl_min: pBar, ucl_max: pBar, lcl_min: pBar, lcl_max: pBar }
  }

  const ucls = pointLimits.map(l => l.ucl)
  const lcls = pointLimits.map(l => l.lcl)

  return {
    p_bar: pBar,
    centerLine: pBar,
    ucl_min: Math.min(...ucls),
    ucl_max: Math.max(...ucls),
    lcl_min: Math.min(...lcls),
    lcl_max: Math.max(...lcls),
  }
}

// ============================================
// 2. Nelson Rules
// ============================================
//
// 규칙 8개는 모두 "중심선에서 시그마 몇 배" 단위로 서술되어 있어 시그마가
// 일정하다고 가정한다. p-chart는 표본 크기가 변하면 시그마도 변하므로, 규칙을
// 원래 불량률에 그대로 적용할 수 없다. 대신 표준화 계열 z 위에서 돌린다:
// 그러면 중심선은 0, 3-시그마 한계는 ±3으로 모든 점에서 동일해진다.

/** Rule 1: 한 점이 관리한계 밖 */
function checkRule1OutOfLimits(points: number[], ucl: number, lcl: number): SPCViolation[] {
  const violations: SPCViolation[] = []

  points.forEach((value, index) => {
    if (value > ucl) {
      violations.push({
        index,
        point_value: value,
        type: 'ucl_exceeded',
        severity: 'critical',
        description: `Point ${index + 1}: Value ${value.toFixed(4)} exceeds UCL (${ucl.toFixed(4)})`,
        rule_code: 'R1',
      })
    } else if (value < lcl) {
      violations.push({
        index,
        point_value: value,
        type: 'lcl_exceeded',
        severity: 'critical',
        description: `Point ${index + 1}: Value ${value.toFixed(4)} below LCL (${lcl.toFixed(4)})`,
        rule_code: 'R1',
      })
    }
  })

  return violations
}

/** Rule 2: 연속 N점이 중심선 한쪽 (기본 7점) */
function checkRule2Run(points: number[], cl: number, consecutiveCount = 7): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < consecutiveCount) return violations

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)
    const allAbove = segment.every(p => p > cl)
    const allBelow = segment.every(p => p < cl)

    if (allAbove) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_above',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points above center line`,
        rule_code: 'R2',
      })
    } else if (allBelow) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_below',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points below center line`,
        rule_code: 'R2',
      })
    }
  }

  return violations
}

/** Rule 3: 연속 N점 증가 또는 감소 (기본 6점) */
function checkRule3Trend(points: number[], consecutiveCount = 6): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < consecutiveCount) return violations

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    let allIncreasing = true
    let allDecreasing = true

    for (let j = 1; j < segment.length; j++) {
      if (segment[j] <= segment[j - 1]) allIncreasing = false
      if (segment[j] >= segment[j - 1]) allDecreasing = false
    }

    if (allIncreasing) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'trend_up',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points increasing`,
        rule_code: 'R3',
      })
    } else if (allDecreasing) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'trend_down',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points decreasing`,
        rule_code: 'R3',
      })
    }
  }

  return violations
}

/** Rule 4: 연속 14점 교대로 증감 */
function checkRule4Alternating(points: number[]): SPCViolation[] {
  const violations: SPCViolation[] = []
  const consecutiveCount = 14

  if (points.length < consecutiveCount) return violations

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    let isAlternating = true
    for (let j = 1; j < segment.length; j++) {
      const prevDirection = j >= 2 ? (segment[j - 1] > segment[j - 2] ? 1 : -1) : 0
      const currDirection = segment[j] > segment[j - 1] ? 1 : -1

      if (j >= 2 && prevDirection === currDirection) {
        isAlternating = false
        break
      }
    }

    if (isAlternating) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'mixture',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: 14 consecutive alternating points`,
        rule_code: 'R4',
      })
    }
  }

  return violations
}

/** Rule 5: 3점 중 2점이 2시그마 밖 (같은 방향) */
function checkRule5TwoOfThree(points: number[], cl: number, sigma: number): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < 3) return violations

  const twoSigmaAbove = cl + 2 * sigma
  const twoSigmaBelow = cl - 2 * sigma

  for (let i = 2; i < points.length; i++) {
    const segment = points.slice(i - 2, i + 1)

    const aboveCount = segment.filter(p => p > twoSigmaAbove).length
    const belowCount = segment.filter(p => p < twoSigmaBelow).length

    if (aboveCount >= 2) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'two_thirds',
        severity: 'warning',
        description: `Points ${i - 1} to ${i + 1}: 2 of 3 points beyond 2-sigma (above)`,
        rule_code: 'R5',
      })
    } else if (belowCount >= 2) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'two_thirds',
        severity: 'warning',
        description: `Points ${i - 1} to ${i + 1}: 2 of 3 points beyond 2-sigma (below)`,
        rule_code: 'R5',
      })
    }
  }

  return violations
}

/** Rule 6: 5점 중 4점이 1시그마 밖 (같은 방향) */
function checkRule6FourOfFive(points: number[], cl: number, sigma: number): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < 5) return violations

  const oneSigmaAbove = cl + sigma
  const oneSigmaBelow = cl - sigma

  for (let i = 4; i < points.length; i++) {
    const segment = points.slice(i - 4, i + 1)

    const aboveCount = segment.filter(p => p > oneSigmaAbove).length
    const belowCount = segment.filter(p => p < oneSigmaBelow).length

    if (aboveCount >= 4) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_above',
        severity: 'warning',
        description: `Points ${i - 3} to ${i + 1}: 4 of 5 points beyond 1-sigma (above)`,
        rule_code: 'R6',
      })
    } else if (belowCount >= 4) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_below',
        severity: 'warning',
        description: `Points ${i - 3} to ${i + 1}: 4 of 5 points beyond 1-sigma (below)`,
        rule_code: 'R6',
      })
    }
  }

  return violations
}

/** Rule 7: 연속 15점이 1시그마 내 (Stratification) */
function checkRule7Stratification(points: number[], cl: number, sigma: number): SPCViolation[] {
  const violations: SPCViolation[] = []
  const consecutiveCount = 15

  if (points.length < consecutiveCount) return violations

  const oneSigmaAbove = cl + sigma
  const oneSigmaBelow = cl - sigma

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    const allWithinOneSigma = segment.every(p => p >= oneSigmaBelow && p <= oneSigmaAbove)

    if (allWithinOneSigma) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'stratification',
        severity: 'info',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: 15 consecutive points within 1-sigma (stratification)`,
        rule_code: 'R7',
      })
    }
  }

  return violations
}

/** Rule 8: 연속 8점이 1시그마 밖 (양쪽, Mixture) */
function checkRule8Mixture(points: number[], cl: number, sigma: number): SPCViolation[] {
  const violations: SPCViolation[] = []
  const consecutiveCount = 8

  if (points.length < consecutiveCount) return violations

  const oneSigmaAbove = cl + sigma
  const oneSigmaBelow = cl - sigma

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    const allOutsideOneSigma = segment.every(p => p > oneSigmaAbove || p < oneSigmaBelow)

    if (allOutsideOneSigma) {
      // 양쪽 모두에 점이 있어야 mixture다
      const hasAbove = segment.some(p => p > oneSigmaAbove)
      const hasBelow = segment.some(p => p < oneSigmaBelow)

      if (hasAbove && hasBelow) {
        violations.push({
          index: i,
          point_value: points[i],
          type: 'mixture',
          severity: 'warning',
          description: `Points ${i - consecutiveCount + 2} to ${i + 1}: 8 consecutive points outside 1-sigma (mixture)`,
          rule_code: 'R8',
        })
      }
    }
  }

  return violations
}

/** 표준화 계열에 Nelson Rules 1-8 전부 적용 */
function detectNelsonRuleViolations(
  points: number[],
  cl: number,
  ucl: number,
  lcl: number,
  sigma: number
): SPCViolation[] {
  const violations: SPCViolation[] = [
    ...checkRule1OutOfLimits(points, ucl, lcl),
    ...checkRule2Run(points, cl, 7),
    ...checkRule3Trend(points, 6),
    ...checkRule4Alternating(points),
    ...checkRule5TwoOfThree(points, cl, sigma),
    ...checkRule6FourOfFive(points, cl, sigma),
    ...checkRule7Stratification(points, cl, sigma),
    ...checkRule8Mixture(points, cl, sigma),
  ]

  // 중복 제거 (같은 인덱스의 같은 타입)
  const seen = new Set<string>()
  return violations.filter(v => {
    const key = `${v.index}-${v.type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** detectPChartViolations 입력 */
export interface PChartViolationInput {
  defect_rate: number
  ucl: number
  lcl: number
  z: number
}

/**
 * 표본 크기가 변하는 p-chart의 Nelson Rule 위반 감지.
 *
 * 표준화 계열 z 위에서 규칙을 돌린다 — z의 중심선은 0, 3-시그마 한계는 ±3으로
 * 모든 점에서 같으므로 상수 시그마를 가정하는 규칙들이 비로소 성립한다.
 * 결과는 다시 원래 불량률 단위로 바꿔 보고한다: 알림을 읽는 사람에게
 * z 점수는 의미가 없다.
 */
export function detectPChartViolations(points: PChartViolationInput[]): SPCViolation[] {
  const zValues = points.map(p => p.z)
  const violations = detectNelsonRuleViolations(zValues, 0, 3, -3, 1)

  return violations.map(v => {
    const point = points[v.index]

    // R1만 값과 한계를 문장에 담는다. 나머지 규칙의 문장은 "중심선 위로 연속
    // 7점" 같은 형태라 단위와 무관하므로 그대로 둔다.
    if (v.rule_code === 'R1' && point) {
      const limit = v.type === 'ucl_exceeded' ? point.ucl : point.lcl
      const boundary = v.type === 'ucl_exceeded' ? 'exceeds UCL' : 'below LCL'
      return {
        ...v,
        point_value: point.defect_rate,
        description: `Point ${v.index + 1}: Defect rate ${(point.defect_rate * 100).toFixed(2)}% ${boundary} (${(limit * 100).toFixed(2)}%)`,
      }
    }

    return {
      ...v,
      point_value: point ? point.defect_rate : v.point_value,
    }
  })
}
