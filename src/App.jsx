import { useState } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const [authed, setAuthed] = useState(false)

  return authed ? <Dashboard /> : <Login onSignIn={() => setAuthed(true)} />
}
