import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../styles/Login.css";
import "../styles/Popup.css";

function AdminLogin() {
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (adminPassword === "admin123") {
      login({ 
        nombre: "Administrador", 
        puesto: "Admin",
        isAdmin: true, 
      });
      navigate("/admin/home");
    } else {
      setError("Contraseña de administrador incorrecta");
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-header">Inicio de Sesión Administrador</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label htmlFor="adminPassword">Contraseña Admin</label>
          <input
            type="password"
            id="adminPassword"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="login-error">{error}</p>}
        <div className="button-container">
          <button type="button" className="login-button back"
            onClick={() => navigate("/")}>
            Volver
          </button>
          <button type="submit" className="login-button continue">
            Continuar
          </button>
        </div>      
      </form>
    </div>
  );
} 

export default AdminLogin;
