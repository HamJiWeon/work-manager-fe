import { describe, expect, it } from 'vitest'
import { isCardDateInRange } from '@/lib/card-date'

describe('card_date', () => {
  it.each(['', '0001-01-01', '0099-12-31', '9999-12-31', '2026-01-31', '2026-04-30', '2024-02-29', '2000-02-29'])('accept_valid_calendar_date_ok_%s', value => {
    // given / when / then
    expect(isCardDateInRange(value)).toBe(true)
  })

  it.each(['2026-02-31', '2026-99-99', '2026-02-29', '1900-02-29', '2100-02-29', '2026-04-31', '2026-00-15', '2026-01-00', '0000-01-01', '10000-01-01', '2026-2-01', 'not-a-date'])('reject_invalid_calendar_date_ko_%s', value => {
    // given / when / then
    expect(isCardDateInRange(value)).toBe(false)
  })
})
