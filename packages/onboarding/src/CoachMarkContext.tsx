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

export interface CoachMarkLabels {
  skip?: string
  next?: string
  done?: string
}

interface CoachMarkState {
  steps: CoachMarkStep[]
  activeIndex: number | null
  spotlightRect: SpotlightRect | null
  labels: CoachMarkLabels
}

interface CoachMarkContextValue {
  startTour: (steps: CoachMarkStep[], labels?: CoachMarkLabels) => void
  nextStep: () => void
  dismissTour: () => void
  registerRef: (id: string, ref: React.RefObject<View | null>) => void
  unregisterRef: (id: string) => void
  registerScrollTo: (id: string, fn: () => void) => void
  unregisterScrollTo: (id: string) => void
  // Internal — used by CoachMarkOverlay rendered inside Provider
  _state: CoachMarkState
}

const CoachMarkContext = createContext<CoachMarkContextValue>({
  startTour: () => {},
  nextStep: () => {},
  dismissTour: () => {},
  registerRef: () => {},
  unregisterRef: () => {},
  registerScrollTo: () => {},
  unregisterScrollTo: () => {},
  _state: { steps: [], activeIndex: null, spotlightRect: null, labels: {} },
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
  const refsMap = useRef(new Map<string, React.RefObject<View | null>>())
  const scrollersMap = useRef(new Map<string, () => void>())
  const [state, setState] = useState<CoachMarkState>({
    steps: [],
    activeIndex: null,
    spotlightRect: null,
    labels: {},
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

    const measure = () => {
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
    }

    // If this step has a registered scroll handler, call it first and wait for the
    // scroll animation to complete before measuring the element's screen position.
    const scroller = scrollersMap.current.get(stepId)
    if (scroller) {
      scroller()
      const tid = setTimeout(() => { measure() }, 400)
      return () => clearTimeout(tid)
    }

    // Wait one frame for layout to settle (important after screen transitions)
    const rafId = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(rafId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeIndex, state.steps])

  const startTour = useCallback((steps: CoachMarkStep[], labels: CoachMarkLabels = {}) => {
    setState({ steps, activeIndex: 0, spotlightRect: null, labels })
  }, [])

  const nextStep = useCallback(() => {
    setState((s) => {
      if (s.activeIndex === null) return s
      if (s.activeIndex >= s.steps.length - 1) {
        return { steps: [], activeIndex: null, spotlightRect: null, labels: {} }
      }
      return { ...s, activeIndex: s.activeIndex + 1, spotlightRect: null }
    })
  }, [])

  const dismissTour = useCallback(() => {
    setState({ steps: [], activeIndex: null, spotlightRect: null, labels: {} })
  }, [])

  const registerRef = useCallback((id: string, ref: React.RefObject<View | null>) => {
    refsMap.current.set(id, ref)
  }, [])

  const unregisterRef = useCallback((id: string) => {
    refsMap.current.delete(id)
  }, [])

  const registerScrollTo = useCallback((id: string, fn: () => void) => {
    scrollersMap.current.set(id, fn)
  }, [])

  const unregisterScrollTo = useCallback((id: string) => {
    scrollersMap.current.delete(id)
  }, [])

  return (
    <CoachMarkContext.Provider
      value={{ startTour, nextStep, dismissTour, registerRef, unregisterRef, registerScrollTo, unregisterScrollTo, _state: state }}
    >
      {children}
    </CoachMarkContext.Provider>
  )
}
