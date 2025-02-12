import React, { useState } from "react";

export default function IngredienteForm({ ingrediente, onSave, onCancel }) {
  const [precioPorUnidad, setPrecioPorUnidad] = useState(ingrediente.precioporunidad);
  const [litrosPorUnidad, setLitrosPorUnidad] = useState(ingrediente.litrosporunidad);
  const [activo, setActivo] = useState(ingrediente.activo);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/ingredientes/${ingrediente.id_ingredientes}/update/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            precioporunidad: precioPorUnidad,
            litrosporunidad: litrosPorUnidad,
            activo: activo,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Error al actualizar el ingrediente");
      }
      const data = await response.json();
      onSave(data.data); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-form-container">
      <div>
        <label>Precio por unidad:</label>
        <input
          type="number"
          value={precioPorUnidad}
          onChange={(e) => setPrecioPorUnidad(e.target.value)}
        />
      </div>
      <div>
        <label>Litros por unidad:</label>
        <input
          type="number"
          step="0.01"
          value={litrosPorUnidad}
          onChange={(e) => setLitrosPorUnidad(e.target.value)}
        />
      </div>
      <div>
        <label>Activo:</label>
        <input
          type="checkbox"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
        />
      </div>
      <button onClick={handleSave} disabled={loading}>
        {loading ? "Guardando..." : "Guardar"}
      </button>
      <button onClick={onCancel}>Cancelar</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
