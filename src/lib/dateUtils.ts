/**
 * Date Utilities for CNC QC KPI Application
 *
 * Business Day Definition:
 * - A "day" starts at 08:00 AM and ends at 07:59:59 AM the next calendar day
 * - Timezone: Vietnam (Asia/Ho_Chi_Minh, UTC+7)
 *
 * Example:
 * - 2025-12-25 08:00 ~ 2025-12-26 07:59 = Business Day 2025-12-25
 * - 2025-12-26 08:00 ~ 2025-12-27 07:59 = Business Day 2025-12-26
 */

// Vietnam timezone offset (UTC+7)
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'
export const VIETNAM_UTC_OFFSET = 7

// Business day start hour (08:00)
export const BUSINESS_DAY_START_HOUR = 8

/**
 * Get current time in Vietnam timezone
 */
export function getNowInVietnam(): Date {
  const now = new Date()
  // Convert to Vietnam time by adding the offset
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  return new Date(utc + (VIETNAM_UTC_OFFSET * 3600000))
}

/**
 * Convert any date to Vietnam timezone
 */
export function toVietnamTime(date: Date): Date {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000)
  return new Date(utc + (VIETNAM_UTC_OFFSET * 3600000))
}

/**
 * Get the business date for a given datetime
 * If time is before 08:00, it belongs to the previous business day
 *
 * @param date - The date to check (defaults to current Vietnam time)
 * @returns The business date (YYYY-MM-DD format)
 */
export function getBusinessDate(date?: Date): string {
  const vietnamDate = date ? toVietnamTime(date) : getNowInVietnam()
  const hour = vietnamDate.getHours()

  // If before 08:00, it belongs to the previous business day
  if (hour < BUSINESS_DAY_START_HOUR) {
    vietnamDate.setDate(vietnamDate.getDate() - 1)
  }

  return formatDateString(vietnamDate)
}

/**
 * Get the current business date (today's business day)
 */
export function getTodayBusinessDate(): string {
  return getBusinessDate()
}

/**
 * Get the start datetime of a business day (08:00 AM Vietnam time)
 *
 * @param businessDate - The business date (YYYY-MM-DD format)
 * @returns Date object representing the start of the business day
 */
export function getBusinessDayStart(businessDate: string): Date {
  const [year, month, day] = businessDate.split('-').map(Number)
  const date = new Date(year, month - 1, day, BUSINESS_DAY_START_HOUR, 0, 0, 0)
  // Adjust for Vietnam timezone
  return adjustToVietnamTimezone(date)
}

/**
 * Get the end datetime of a business day (07:59:59 AM next calendar day, Vietnam time)
 *
 * @param businessDate - The business date (YYYY-MM-DD format)
 * @returns Date object representing the end of the business day
 */
export function getBusinessDayEnd(businessDate: string): Date {
  const [year, month, day] = businessDate.split('-').map(Number)
  const nextDay = new Date(year, month - 1, day + 1, BUSINESS_DAY_START_HOUR - 1, 59, 59, 999)
  // Adjust for Vietnam timezone
  return adjustToVietnamTimezone(nextDay)
}

/**
 * Get the start and end datetime range for a business day
 *
 * @param businessDate - The business date (YYYY-MM-DD format, defaults to today)
 * @returns Object with start and end Date objects
 */
export function getBusinessDayRange(businessDate?: string): { start: Date; end: Date } {
  const date = businessDate || getTodayBusinessDate()
  return {
    start: getBusinessDayStart(date),
    end: getBusinessDayEnd(date)
  }
}

/**
 * Check if a given datetime falls within a specific business day
 *
 * @param datetime - The datetime to check
 * @param businessDate - The business date to compare against (defaults to today)
 */
export function isWithinBusinessDay(datetime: Date, businessDate?: string): boolean {
  const date = businessDate || getTodayBusinessDate()
  const { start, end } = getBusinessDayRange(date)
  return datetime >= start && datetime <= end
}

/**
 * Check if a given datetime is within today's business day
 */
export function isToday(datetime: Date): boolean {
  const todayBusinessDate = getTodayBusinessDate()
  const datetimeBusinessDate = getBusinessDate(datetime)
  return todayBusinessDate === datetimeBusinessDate
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format datetime for display in Vietnam timezone
 *
 * @param date - The date to format
 * @param options - Intl.DateTimeFormat options
 */
export function formatVietnamDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  }

  return new Intl.DateTimeFormat('ko-KR', defaultOptions).format(dateObj)
}

/**
 * Format date only for display in Vietnam timezone
 */
export function formatVietnamDate(date: Date | string): string {
  return formatVietnamDateTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: undefined,
    minute: undefined
  })
}

/**
 * Format time only for display in Vietnam timezone
 */
export function formatVietnamTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(dateObj)
}

/**
 * Get relative business day (e.g., -1 for yesterday, 1 for tomorrow)
 *
 * @param offset - Number of days from today (negative for past, positive for future)
 */
export function getRelativeBusinessDate(offset: number): string {
  const today = getTodayBusinessDate()
  const [year, month, day] = today.split('-').map(Number)
  const date = new Date(year, month - 1, day + offset)
  return formatDateString(date)
}

/**
 * Parse a date string and return the business date it belongs to
 *
 * @param dateString - ISO date string or YYYY-MM-DD format
 */
export function parseToBusinessDate(dateString: string): string {
  const date = new Date(dateString)
  return getBusinessDate(date)
}

/**
 * Get the business day description for display
 * Returns "Today" if it's today's business day, otherwise returns formatted date
 */
export function getBusinessDayLabel(businessDate: string, t?: (key: string) => string): string {
  const today = getTodayBusinessDate()

  if (businessDate === today) {
    return t ? t('common.today') : '금일'
  }

  const yesterday = getRelativeBusinessDate(-1)
  if (businessDate === yesterday) {
    return t ? t('common.yesterday') : '어제'
  }

  return formatVietnamDate(businessDate + 'T00:00:00')
}

/**
 * Internal helper to adjust a date to Vietnam timezone
 */
function adjustToVietnamTimezone(date: Date): Date {
  // Get the local timezone offset in minutes
  const localOffset = date.getTimezoneOffset()
  // Vietnam offset is +7 hours = -420 minutes (getTimezoneOffset returns opposite sign)
  const vietnamOffset = -VIETNAM_UTC_OFFSET * 60
  // Calculate the difference and adjust
  const diff = localOffset - vietnamOffset
  return new Date(date.getTime() - diff * 60000)
}

/**
 * Get business day information for debugging/display
 */
export function getBusinessDayInfo(): {
  currentTime: string
  businessDate: string
  businessDayStart: string
  businessDayEnd: string
} {
  const now = getNowInVietnam()
  const businessDate = getTodayBusinessDate()
  const { start, end } = getBusinessDayRange(businessDate)

  return {
    currentTime: formatVietnamDateTime(now),
    businessDate,
    businessDayStart: formatVietnamDateTime(start),
    businessDayEnd: formatVietnamDateTime(end)
  }
}

/**
 * Get business date range filter for Supabase queries
 * Converts calendar date range to business day range (08:00 ~ next day 07:59)
 *
 * @param fromDate - Start date (calendar date, will use 08:00 of this date)
 * @param toDate - End date (calendar date, will use 07:59:59 of next day)
 * @returns Object with gte and lte ISO strings for Supabase query
 */
export function getBusinessDateRangeFilter(
  fromDate: Date,
  toDate: Date
): { gte: string; lte: string } {
  // Get business date strings (YYYY-MM-DD)
  const fromBusinessDate = formatDateString(fromDate)
  const toBusinessDate = formatDateString(toDate)

  // Get actual datetime range
  const start = getBusinessDayStart(fromBusinessDate)
  const end = getBusinessDayEnd(toBusinessDate)

  return {
    gte: start.toISOString(),
    lte: end.toISOString()
  }
}

/**
 * Get recent business days range
 * Returns date range for the last N business days ending today
 *
 * @param days - Number of days to go back (e.g., 7 for last week, 30 for last month)
 * @returns Object with from and to Date objects
 */
export function getRecentBusinessDays(days: number): { from: Date; to: Date } {
  const todayBusinessDate = getTodayBusinessDate()
  const fromBusinessDate = getRelativeBusinessDate(-days)

  return {
    from: getBusinessDayStart(fromBusinessDate),
    to: getBusinessDayEnd(todayBusinessDate)
  }
}

/**
 * Get hour in Vietnam timezone from a date
 * Used for hourly distribution charts
 *
 * @param date - Date object or ISO string
 * @returns Hour (0-23) in Vietnam timezone
 */
export function getVietnamHour(date: Date | string): number {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const vietnamDate = toVietnamTime(dateObj)
  return vietnamDate.getHours()
}

/**
 * Get business date from ISO string or Date
 * Convenience wrapper for getBusinessDate
 *
 * @param dateInput - ISO date string or Date object
 * @returns Business date string (YYYY-MM-DD)
 */
export function parseBusinessDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return getBusinessDate(date)
}
