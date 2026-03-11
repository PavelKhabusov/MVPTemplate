import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react'
import { Platform } from 'react-native'
import { XStack, Text, useTheme } from 'tamagui'
import { AnimatePresence, MotiView } from 'moti'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle2, AlertCircle, Info, X, type LucideIcon } from 'lucide-react-native'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const COLORS: Record<ToastType, string> = {
  success: '#22c55e',
  error: '#ef4444',
  info: '#3b82f6',
}

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++nextId
    setToasts((prev) => [...prev.slice(-2), { id, message, type }])
    const timer = setTimeout(() => removeToast(id), 3000)
    timers.current.set(id, timer)
  }, [removeToast])

  const success = useCallback((msg: string) => show(msg, 'success'), [show])
  const error = useCallback((msg: string) => show(msg, 'error'), [show])
  const info = useCallback((msg: string) => show(msg, 'info'), [show])

  const value = useMemo(() => ({ show, success, error, info }), [show, success, error, info])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastOverlay toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

function ToastOverlay({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const isWeb = Platform.OS === 'web'

  return (
    <MotiView
      style={{
        position: isWeb ? ('fixed' as any) : 'absolute',
        bottom: isWeb ? 20 : insets.bottom + 12,
        right: isWeb ? 20 : 16,
        left: isWeb ? undefined : 16,
        maxWidth: isWeb ? 380 : undefined,
        zIndex: 99999,
        gap: 8,
        pointerEvents: 'box-none',
      } as any}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <MotiView
            key={toast.id}
            from={{ opacity: 0, translateY: 20, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            exit={{ opacity: 0, translateY: 10, scale: 0.95 }}
            transition={{ type: 'timing', duration: 250 }}
          >
            <XStack
              backgroundColor={theme.cardBackground.val}
              borderRadius={Number(theme.radiusSm?.val) ?? 8}
              borderWidth={1}
              borderColor={COLORS[toast.type]}
              paddingHorizontal="$3"
              paddingVertical="$2.5"
              alignItems="center"
              gap="$2"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {(() => { const Icon = ICONS[toast.type]; return <Icon size={20} color={COLORS[toast.type]} /> })()}
              <Text color="$color" fontSize="$3" fontWeight="500" flex={1}>
                {toast.message}
              </Text>
              <XStack
                onPress={() => onDismiss(toast.id)}
                hitSlop={8}
                cursor="pointer"
              >
                <X size={16} color={theme.mutedText.val} />
              </XStack>
            </XStack>
          </MotiView>
        ))}
      </AnimatePresence>
    </MotiView>
  )
}
