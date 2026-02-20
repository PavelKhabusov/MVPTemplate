import { useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'

export function useRefreshOnFocus(refetch: () => void) {
  const isFirstFocus = useRef(true)

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false
        return
      }
      refetch()
    }, [refetch])
  )
}
