import type { FormEntry } from '../types'

interface FormStripProps {
  form: FormEntry[]
  count?: number
}

export default function FormStrip({ form, count = 5 }: FormStripProps) {
  // Reverse so most recent is on the right (form array is newest-first)
  const recent = form.slice(0, count).reverse()

  return (
    <div className="flex gap-1 items-center">
      {recent.map((entry, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-sm ${
            entry.result === 'W' ? 'bg-success' : 'bg-danger'
          }`}
          title={`${entry.result === 'W' ? 'Win' : 'Loss'} vs ${entry.opponent} on ${entry.map} (${entry.score})`}
        />
      ))}
    </div>
  )
}
