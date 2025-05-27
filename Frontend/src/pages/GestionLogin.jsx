import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../styles/Login.css";

function GestionLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (password === "gestion123") {
      login({ 
        nombre: "Gestión", 
        puesto: "Gestor",
        isAdmin: false, 
        isGestor: true,
      });
      navigate("/gestion/home"); 
    } else {
      setError("Contraseña de gestión incorrecta");
    }
};
  

  return (
    <div className="login-container">
      <h1 className="login-header">Inicio de Sesión Gestión de Huéspedes</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

export default GestionLogin;
