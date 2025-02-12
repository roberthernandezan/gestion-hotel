import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../styles/Login.css";

function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { login, logout } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();
  const barSeleccionado = location.state?.bar;
  
  if (!barSeleccionado) {
    console.error("No se seleccionó un bar, redirigiendo a /bares");
    logout();
    navigate("/bares");
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      password,
      bar: barSeleccionado.id_bar,
    };

    fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "Error al obtener datos del empleado");
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Inicio de sesión exitoso:", data);
        const empleadoData = data.empleado;

        if (!empleadoData.id_empleado || !empleadoData.nombre || !empleadoData.puesto) {
          throw new Error("Datos del empleado incompletos.");
        }
      
        login({
          id_empleado: empleadoData.id_empleado,
          nombre: empleadoData.nombre,
          puesto: empleadoData.puesto,
          bar: barSeleccionado,
        });
      
        navigate("/home", {
          state: {
            empleado: {
              id_empleado: empleadoData.id_empleado,
              nombre: empleadoData.nombre,
              puesto: empleadoData.puesto,
            },
            bar: barSeleccionado,
          },
        });
      })      
      .catch((err) => {
        console.error("Error:", err);
        setError(err.message);
      });
  };

  return (
    <div className="login-container">
      <h1 className="login-header">Inicio de Sesión</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-field">
          <label htmlFor="password">Código de Empleado</label>
          <input
            type="text"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="login-error">{error}</p>}
        <div className="button-container">
          <button
            type="button"
            className="login-button back"
            onClick={() => navigate("/bares")}
          >
            Volver
          </button>
          <button type="submit" className="login-button continue">
            Continuar
          </button>
        </div>
      </form>
      <p className="login-bar">Bar seleccionado: {barSeleccionado.nombre}</p>
    </div>
  );
}

export default Login;
