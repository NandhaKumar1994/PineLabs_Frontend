import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from './theme/ThemeContext.jsx'
import { RoleProvider } from './theme/RoleContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <RoleProvider>
      <App />
    </RoleProvider>
  </ThemeProvider>
)
