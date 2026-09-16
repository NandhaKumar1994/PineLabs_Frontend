import { useState } from 'react'
import MerchantList from './MerchantList'
import MerchantSop from './MerchantSop'
import { merchants as initialMerchants } from '../../data/sopData'

export default function SopDashboard() {
  const [selected, setSelected] = useState(null)
  const [initialKey, setInitialKey] = useState(null)
  const [merchantData, setMerchantData] = useState(() => [...initialMerchants])

  const handleSelect = (merchant, subsheetKey = null) => {
    const live = merchantData.find((m) => m.id === merchant.id) || merchant
    setSelected(live)
    setInitialKey(subsheetKey)
  }

  return selected ? (
    <MerchantSop
      merchant={selected}
      initialKey={initialKey}
      onBack={() => setSelected(null)}
      onMerchantChange={(next) => {
        setMerchantData((prev) => prev.map((m) => (m.id === next.id ? next : m)))
        setSelected(next)
      }}
    />
  ) : (
    <MerchantList
      merchants={merchantData}
      onMerchantsChange={setMerchantData}
      onSelect={handleSelect}
    />
  )
}
