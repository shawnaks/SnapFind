import { useEffect, useState } from 'react'

type TypingTextProps = {
  text: string
  /** milliseconds per character */
  speed?: number
  /** delay before typing starts (ms) */
  startDelay?: number
  className?: string
}

export default function TypingText({ text, speed = 40, startDelay = 0, className }: TypingTextProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let isCancelled = false
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setCount((c) => {
          if (isCancelled) return c
          const next = c + 1
          if (next >= text.length) {
            clearInterval(interval)
          }
          return next
        })
      }, speed)
    }, startDelay)

    return () => {
      isCancelled = true
      clearTimeout(startTimer)
    }
  }, [speed, startDelay, text.length])

  const visible = text.slice(0, count)

  return (
    <span className={className} aria-label={text}>
      {visible}
      <span className="typing-caret" aria-hidden>
        
      </span>
    </span>
  )
}
