export const MIN_CARD_DATE = '0001-01-01'
export const MAX_CARD_DATE = '9999-12-31'
export const CARD_DATE_RANGE_ERROR = '날짜의 연도는 1~9999년으로 입력해 주세요.'

/** 미지정 날짜를 허용하고, 입력한 날짜가 네 자리 연도 범위 안에 있는지 확인한다. */
export function isCardDateInRange(value: string): boolean {
  return !value || (/^\d{4}-\d{2}-\d{2}$/.test(value) && value >= MIN_CARD_DATE && value <= MAX_CARD_DATE)
}
