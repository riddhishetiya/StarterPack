
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  const handleLogin = (credentials) => {
    console.log("Login:", credentials);
    // Backend integration comes next.
  };

  const handleSignup = (userData) => {
    console.log("Signup:", userData);
    // Backend integration comes next.
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />

        <Route
          path="/signup"
          element={<Signup onSignup={handleSignup} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
