import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'
import { useCoachMarkContext } from './CoachMarkContext'

interface CoachMarkProps {
  stepId: string
  children: React.ReactNode
}

/**
 * Wrap any element to make it a spotlight target in the coach mark tour.
 *
 * @example
 * <CoachMark stepId="home-stats">
 *   <StatsCard />
 * </CoachMark>
 */
export function CoachMark({ stepId, children }: CoachMarkProps) {
  const ref = useRef<View>(null)
  const { registerRef, unregisterRef } = useCoachMarkContext()

  useEffect(() => {
    registerRef(stepId, ref)
    return () => {
      unregisterRef(stepId)
    }
  }, [stepId, registerRef, unregisterRef])

  return (
    // collapsable={false} prevents Android from optimizing away the View,
    // which would break measureInWindow()
    <View ref={ref} collapsable={false}>
      {children}
    </View>
  )
}
