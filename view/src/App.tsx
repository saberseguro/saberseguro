import { AuthProvider } from './contexts/AuthContext';
import { CertificadosProvider } from './contexts/CertificadosContext';
import { CompanyProvider } from './contexts/CompanyContext';
import AppRoutes from './routes';

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <CertificadosProvider>
        <CompanyProvider>
          <Toaster
            position="bottom-right"
            reverseOrder={true}
          />
          <AppRoutes />
        </CompanyProvider>
      </CertificadosProvider>
    </AuthProvider>
  );
}

export default App;
