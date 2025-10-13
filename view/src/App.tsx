import { AuthProvider } from './contexts/AuthContext';
import { CertificadosProvider } from './contexts/CertificadosContext';
import AppRoutes from './routes';

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <CertificadosProvider>
        <Toaster
          position="bottom-right"
          reverseOrder={true}
        />
        <AppRoutes />
      </CertificadosProvider>
    </AuthProvider>
  );
}

export default App;
