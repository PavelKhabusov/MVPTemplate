import { MotiView } from 'moti'

interface StaggerGroupProps {
  children: React.ReactNode
  index: number
  delay?: number
}

export function StaggerGroup({ children, index, delay = 80 }: StaggerGroupProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'spring',
        damping: 18,
        stiffness: 120,
        delay: index * delay,
      }}
    >
      {children}
    </MotiView>
  )
}
