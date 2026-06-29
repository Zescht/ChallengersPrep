import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface FilterContextValue {
  playoffOnly: boolean
  clDataOnly: boolean
  setPlayoffOnly: (v: boolean) => void
  setClDataOnly: (v: boolean) => void
}

const FilterContext = createContext<FilterContextValue>({
  playoffOnly: false,
  clDataOnly: false,
  setPlayoffOnly: () => {},
  setClDataOnly: () => {},
})

export function FilterProvider({ children }: { children: ReactNode }) {
  const [playoffOnly, setPlayoffOnlyState] = useState(() => {
    try { return localStorage.getItem('vcl-playoff-mode') === 'true' } catch { return false }
  })
  const [clDataOnly, setClDataOnlyState] = useState(() => {
    try { return localStorage.getItem('vcl-cl-data-only') === 'true' } catch { return false }
  })

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem('vcl-playoff-mode', String(playoffOnly)) } catch { /* noop */ }
  }, [playoffOnly])

  useEffect(() => {
    try { localStorage.setItem('vcl-cl-data-only', String(clDataOnly)) } catch { /* noop */ }
  }, [clDataOnly])

  const setPlayoffOnly = (v: boolean) => {
    setPlayoffOnlyState(v)
  }

  const setClDataOnly = (v: boolean) => {
    setClDataOnlyState(v)
  }

  return (
    <FilterContext.Provider value={{ playoffOnly, clDataOnly, setPlayoffOnly, setClDataOnly }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFilter() {
  return useContext(FilterContext)
}
