import { useState } from 'react'
import MerchantList from './MerchantList'
import MerchantSop from './MerchantSop'

export default function SopDashboard() {
  const [selected, setSelected] = useState(null)
  const [initialKey, setInitialKey] = useState(null)

  const handleSelect = (merchant, subsheetKey = null) => {
    setSelected(merchant)
    setInitialKey(subsheetKey)
  }

  return selected ? (
    <MerchantSop
      merchant={selected}
      initialKey={initialKey}
      onBack={() => setSelected(null)}
    />
  ) : (
    <MerchantList onSelect={handleSelect} />
  )
}
