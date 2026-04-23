import { createRoot } from 'react-dom/client'
import App from './App.tsx'

import { AuthProvider } from './Context/UserContext/AuthContext.tsx'
import { PrimeReactProvider } from 'primereact/api'


import 'primereact/resources/themes/saga-blue/theme.css'
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'bootstrap/dist/css/bootstrap.min.css'

import './App.css'

const value = {
  ripple: true,
};

createRoot(document.getElementById('root')!).render(
  <PrimeReactProvider value={value}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </PrimeReactProvider>
)
