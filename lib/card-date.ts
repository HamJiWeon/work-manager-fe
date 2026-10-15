export const MIN_CARD_DATE = '0001-01-01'
export const MAX_CARD_DATE = '9999-12-31'
export const CARD_DATE_RANGE_ERROR = '1~9999년 범위의 올바른 날짜를 입력해 주세요.'

/** 미지정 날짜를 허용하고, 입력한 날짜의 네 자리 연도 범위와 실제 달력 날짜를 UTC 기준으로 검증한다. */
export function isCardDateInRange(value: string): boolean {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < MIN_CARD_DATE || value > MAX_CARD_DATE) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, MIN_CARD_DATE.length) === value
}
