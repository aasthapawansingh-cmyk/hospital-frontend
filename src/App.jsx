import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import ProtectedRoute from "./components/ProtectedRoute";
import Splash from "./components/Splash";
import { AuthProvider } from "./auth/AuthContext";
import Users from "./pages/Users";

function App() {
  const [showSplash, setShowSplash] = useState(
    !sessionStorage.getItem("splashSeen")
  );

  function finishSplash() {
    sessionStorage.setItem("splashSeen", "1");
    setShowSplash(false);
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && <Splash onDone={finishSplash} />}
      </AnimatePresence>

      <BrowserRouter><AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <Patients />
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route path="/users" element={<ProtectedRoute roles={["ADMIN"]}><Users /></ProtectedRoute>} />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute roles={["ADMIN", "DOCTOR", "PATIENT"]}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider></BrowserRouter>
    </>
  );
}

export default App;
