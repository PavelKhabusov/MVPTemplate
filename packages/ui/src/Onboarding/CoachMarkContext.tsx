import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { View } from 'react-native'

export interface CoachMarkStep {
  id: string
  title: string
  description: string
}

export interface SpotlightRect {
  x: number
  y: number
  width: number
  height: number
}

interface CoachMarkState {
  steps: CoachMarkStep[]
  activeIndex: number | null
  spotlightRect: SpotlightRect | null
}

interface CoachMarkContextValue {
  startTour: (steps: CoachMarkStep[]) => void
  nextStep: () => void
  dismissTour: () => void
  registerRef: (id: string, ref: React.RefObject<View>) => void
  unregisterRef: (id: string) => void
  // Internal — used by CoachMarkOverlay rendered inside Provider
  _state: CoachMarkState
}

const CoachMarkContext = createContext<CoachMarkContextValue>({
  startTour: () => {},
  nextStep: () => {},
  dismissTour: () => {},
  registerRef: () => {},
  unregisterRef: () => {},
  _state: { steps: [], activeIndex: null, spotlightRect: null },
})

export function useCoachMark() {
  const { startTour, nextStep, dismissTour } = useContext(CoachMarkContext)
  return { startTour, nextStep, dismissTour }
}

export function useCoachMarkContext() {
  return useContext(CoachMarkContext)
}

interface CoachMarkProviderProps {
  children: React.ReactNode
}

export function CoachMarkProvider({ children }: CoachMarkProviderProps) {
  const refsMap = useRef(new Map<string, React.RefObject<View>>())
  const [state, setState] = useState<CoachMarkState>({
    steps: [],
    activeIndex: null,
    spotlightRect: null,
  })

  // Measure element when active step changes
  useEffect(() => {
    const { activeIndex, steps } = state
    if (activeIndex === null || !steps[activeIndex]) {
      setState((s) => (s.spotlightRect ? { ...s, spotlightRect: null } : s))
      return
    }

    const stepId = steps[activeIndex].id
    const ref = refsMap.current.get(stepId)

    if (!ref?.current) {
      setState((s) => (s.spotlightRect ? { ...s, spotlightRect: null } : s))
      return
    }

    // Wait one frame for layout to settle (important after screen transitions)
    const rafId = requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width === 0 && height === 0) {
          // Element not visible — advance to next
          setState((s) => {
            if (s.activeIndex === null) return s
            const next = s.activeIndex < s.steps.length - 1 ? s.activeIndex + 1 : null
            return { ...s, activeIndex: next, spotlightRect: null }
          })
          return
        }
        setState((s) => ({ ...s, spotlightRect: { x, y, width, height } }))
      })
    })

    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeIndex, state.steps])

  const startTour = useCallback((steps: CoachMarkStep[]) => {
    setState({ steps, activeIndex: 0, spotlightRect: null })
  }, [])

  const nextStep = useCallback(() => {
    setState((s) => {
      if (s.activeIndex === null) return s
      if (s.activeIndex >= s.steps.length - 1) {
        return { steps: [], activeIndex: null, spotlightRect: null }
      }
      return { ...s, activeIndex: s.activeIndex + 1, spotlightRect: null }
    })
  }, [])

  const dismissTour = useCallback(() => {
    setState({ steps: [], activeIndex: null, spotlightRect: null })
  }, [])

  const registerRef = useCallback((id: string, ref: React.RefObject<View>) => {
    refsMap.current.set(id, ref)
  }, [])

  const unregisterRef = useCallback((id: string) => {
    refsMap.current.delete(id)
  }, [])

  return (
    <CoachMarkContext.Provider
      value={{ startTour, nextStep, dismissTour, registerRef, unregisterRef, _state: state }}
    >
      {children}
    </CoachMarkContext.Provider>
  )
}
