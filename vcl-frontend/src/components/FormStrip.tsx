import type { FormEntry } from '../types'

interface FormStripProps {
  form: FormEntry[]
  count?: number
}

export default function FormStrip({ form, count = 5 }: FormStripProps) {
  const recent = form.slice(0, count).reverse()

  return (
    <div className="flex gap-1 items-center">
      {recent.map((entry, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-sm ${
            entry.result === 'W'
              ? 'bg-primary shadow-[0_0_6px_rgba(161,255,194,0.4)]'
              : 'bg-error opacity-60'
          }`}
          title={`${entry.result === 'W' ? 'Win' : 'Loss'} vs ${entry.opponent} on ${entry.map} (${entry.score})`}
        />
      ))}
    </div>
  )
}
