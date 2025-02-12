import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Registro.css";

function Registro() {
  const [formData, setFormData] = useState({
    nombre: "",
    edad: "",
    nacionalidad: "",
    id_unico_huesped: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetch("http://127.0.0.1:8000/api/huespedes/nuevo/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setSuccess("Huésped registrado exitosamente.");
        setError(null);
        setLoading(false);
        navigate("/gestion/huespedes");
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        setSuccess(null);
      });
  };

  return (
    <div className="registrar-huesped-container">
      <h1 className="registrar-huesped-header">Registrar Huésped</h1>
      <form className="registrar-huesped-form" onSubmit={handleSubmit}>
        <label>Nombre:</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
        <label>Edad:</label>
        <input
          type="number"
          name="edad"
          value={formData.edad}
          onChange={handleChange}
          required
        />
        <label>Nacionalidad:</label>
        <input
          type="text"
          name="nacionalidad"
          value={formData.nacionalidad}
          onChange={handleChange}
          required
        />
        <label>ID Único:</label>
        <input
          type="text"
          name="id_unico_huesped"
          value={formData.id_unico_huesped}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrar"}
        </button>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </form>
    </div>
  );
}

export default Registro;
