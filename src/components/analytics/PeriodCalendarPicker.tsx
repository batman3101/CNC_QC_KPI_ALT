import { useState } from 'react'
import { format, isSameDay, subMonths } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { useTranslation } from 'react-i18next'
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material'
import { CalendarMonth } from '@mui/icons-material'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface PeriodCalendarPickerProps {
  /** The committed period, or undefined while a preset (e.g. last 30 days) is in use. */
  value: { from: Date; to: Date } | undefined
  onApply: (range: { from: Date; to: Date }) => void
}

function formatPeriod(range: { from: Date; to?: Date }): string {
  const from = format(range.from, 'yyyy-MM-dd')
  if (!range.to || isSameDay(range.from, range.to)) return from
  return `${from} ~ ${format(range.to, 'yyyy-MM-dd')}`
}

/**
 * Picks either one day or a span of days. The choice is held as a draft until
 * Apply is pressed, because one click alone cannot say whether the user wants
 * that single day or is about to click the end of a range.
 *
 * The draft starts empty on every open. react-day-picker extends an existing
 * range on click instead of starting over, so reopening on the last range would
 * make "now look at just the 12th" impossible without first clearing it.
 */
export function PeriodCalendarPicker({ value, onApply }: PeriodCalendarPickerProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const monthCount = isMobile ? 1 : 2
  const today = new Date()

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(undefined)

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(undefined)
    setOpen(next)
  }

  const handleApply = () => {
    if (!draft?.from) return
    onApply({ from: draft.from, to: draft.to ?? draft.from })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={value ? 'contained' : 'outlined'}
          size="small"
          startIcon={<CalendarMonth />}
          sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          {value ? formatPeriod(value) : t('machineAnalysis.customPeriod')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          // With two months shown, open on last month + this month. Opening on this
          // month would put next month beside it - a whole grid of unpickable days.
          defaultMonth={value?.from ?? subMonths(today, monthCount - 1)}
          numberOfMonths={monthCount}
          // Nothing is inspected in the future, so those days are never worth picking.
          disabled={{ after: today }}
          endMonth={today}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            px: 2,
            pb: 2,
            // Width 0 + min 100%: the footer takes the calendar's width instead of
            // setting it. Otherwise the hint text stretches the popover past a
            // phone screen and pushes the Apply button off the edge.
            width: 0,
            minWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {draft?.from ? formatPeriod({ from: draft.from, to: draft.to }) : t('machineAnalysis.calendarHint')}
          </Typography>
          <Button variant="contained" size="small" disabled={!draft?.from} onClick={handleApply}>
            {t('machineAnalysis.apply')}
          </Button>
        </Box>
      </PopoverContent>
    </Popover>
  )
}
