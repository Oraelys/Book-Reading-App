import { useEffect, useState } from 'react'
import { formatNumber } from '../lib/format'
import { motionIsReduced } from '../state/settings'

/** Counts from 0 to `value` once, with an ease-out curve. Skips the animation for reduced-motion users. */
export function CountUp({ value, durationMs = 800 }: { value: number; durationMs?: number }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (motionIsReduced() || value === 0) {
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number): void => {
      const progress = Math.min(1, (now - start) / durationMs)
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, durationMs])

  return <>{formatNumber(shown)}</>
}
