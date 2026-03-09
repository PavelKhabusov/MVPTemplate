import { useState, useEffect } from 'react'

export default function CallTimer({ active }: { active: boolean }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active) { setSeconds(0); return }
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [active])

  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')

  return <span className="font-mono text-xl text-success font-medium">{m}:{s}</span>
}