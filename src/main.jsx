import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import SSOHandler from "./SSOHandler"; // Importamos el nuevo componente
import { WhatsAppProvider } from "./features/setter-ai/context/WhatsAppContext";
import { AuthProvider } from "./context/AuthContext"; // Import AuthProvider
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider> {/* Wrap with AuthProvider */}
      <WhatsAppProvider>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sso" element={<SSOHandler />} />
    </Routes>
      </WhatsAppProvider>
    </AuthProvider> {/* Close AuthProvider */}
  </BrowserRouter>
);