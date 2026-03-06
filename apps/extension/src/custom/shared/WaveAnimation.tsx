export default function WaveAnimation({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[3px] h-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            background: active ? '#6366f1' : '#d1d5db',
            height: active ? undefined : 8,
            animation: active ? `wave 1s ease-in-out ${i * 0.1}s infinite alternate` : 'none',
            minHeight: 4,
            maxHeight: 20,
          }}
        />
      ))}
    </div>
  )
}