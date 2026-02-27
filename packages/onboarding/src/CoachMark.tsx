import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { useCoachMarkContext } from './CoachMarkContext'

interface CoachMarkProps {
  stepId: string
  children: React.ReactNode
  /**
   * Optional ref to the ScrollView that contains this element.
   * When provided, the coach mark tour will automatically scroll this view
   * to bring the element into the visible area before showing the spotlight.
   */
  scrollRef?: React.RefObject<any>
}

/**
 * Wrap any element to make it a spotlight target in the coach mark tour.
 *
 * @example
 * <CoachMark stepId="home-stats">
 *   <StatsCard />
 * </CoachMark>
 *
 * @example with scroll support
 * const scrollRef = useRef<ScrollView>(null)
 * <ScrollView ref={scrollRef}>
 *   <CoachMark stepId="home-notes" scrollRef={scrollRef}>
 *     <NotesSection />
 *   </CoachMark>
 * </ScrollView>
 */
export function CoachMark({ stepId, children, scrollRef }: CoachMarkProps) {
  const ref = useRef<View>(null)
  const { registerRef, unregisterRef, registerScrollTo, unregisterScrollTo } = useCoachMarkContext()

  useEffect(() => {
    registerRef(stepId, ref)
    return () => {
      unregisterRef(stepId)
    }
  }, [stepId, registerRef, unregisterRef])

  useEffect(() => {
    if (!scrollRef) return
    const scrollTo = () => {
      if (!ref.current || !scrollRef.current) return
      // measureLayout gives position relative to the scroll view content,
      // allowing us to scroll exactly to this element.
      ref.current.measureLayout(
        scrollRef.current as any,
        (_x: number, y: number) => {
          scrollRef.current!.scrollTo({ y: Math.max(0, y - 80), animated: true })
        },
        () => {},
      )
    }
    registerScrollTo(stepId, scrollTo)
    return () => {
      unregisterScrollTo(stepId)
    }
  }, [stepId, scrollRef, registerScrollTo, unregisterScrollTo])

  return (
    // collapsable={false} prevents Android from optimizing away the View,
    // which would break measureInWindow()
    <View ref={ref} collapsable={false}>
      {children}
    </View>
  )
}
