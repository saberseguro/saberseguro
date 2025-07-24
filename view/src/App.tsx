import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="bottom-right"
        reverseOrder={true}
      />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
