import React, { useEffect, useState } from 'react';
import '../styles/RegistrosHistoricos.css';
import { useNavigate } from "react-router-dom"; 

const RegistroMovimientos = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [filteredMovimientos, setFilteredMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchText, setSearchText] = useState('');
    const [searchCriteria, setSearchCriteria] = useState('ingrediente');
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchMovimientos = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/registromovimientos/', {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al obtener movimientos.');
                }
                const data = await response.json();
                const movimientosData = Array.isArray(data) ? data : data.results;
                setMovimientos(movimientosData);
                setFilteredMovimientos(movimientosData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchMovimientos();
    }, []);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        let sortableMovimientos = [...movimientos];
        if (sortConfig.key !== null) {
            sortableMovimientos.sort((a, b) => {
                let aValue, bValue;

                switch (sortConfig.key) {
                    case 'id_registro':
                        aValue = a.id_registro;
                        bValue = b.id_registro;
                        break;
                    case 'ingrediente':
                        aValue = a.id_ingredientes.toLowerCase();
                        bValue = b.id_ingredientes.toLowerCase();
                        break;
                    case 'orden':
                        aValue = a.id_orden ? a.id_orden.toString() : '';
                        bValue = b.id_orden ? b.id_orden.toString() : '';
                        break;
                    case 'tipomovimiento':
                        aValue = a.tipomovimiento.toLowerCase();
                        bValue = b.tipomovimiento.toLowerCase();
                        break;
                    case 'cantidad':
                        aValue = a.cantidad;
                        bValue = b.cantidad;
                        break;
                    case 'fechamovimiento':
                        aValue = new Date(a.fechamovimiento);
                        bValue = new Date(b.fechamovimiento);
                        break;
                    case 'origen':
                        aValue = a.origen.toLowerCase();
                        bValue = b.origen.toLowerCase();
                        break;
                    default:
                        aValue = '';
                        bValue = '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        setFilteredMovimientos(sortableMovimientos);
    }, [sortConfig, movimientos]);

    const handleSearch = (e) => {
        const text = e.target.value;
        setSearchText(text);

        const filtered = movimientos.filter((movimiento) => {
            switch (searchCriteria) {
                case "habitacion":
                    return movimiento.numerohabitacion?.toString().includes(text);
                case "bar":
                    return movimiento.id_bar?.nombre.toLowerCase().includes(text.toLowerCase());
                case "empleado":
                    return movimiento.id_empleado?.nombre.toLowerCase().includes(text.toLowerCase());
                case "fecha":
                    return new Date(movimiento.fechamovimiento)
                        .toLocaleDateString()
                        .includes(text);
                case "ingrediente":
                default:
                    return movimiento.id_ingredientes.toLowerCase().includes(text.toLowerCase());
            }
        });

        setFilteredMovimientos(filtered);
    };

    const handleSearchCriteriaChange = (e) => {
        setSearchCriteria(e.target.value);
        setSearchText('');
        setFilteredMovimientos(movimientos);
    };

    if (loading) return <div className="hist-container"><p>Cargando movimientos...</p></div>;
    if (error) return <div className="hist-container"><p>Error: {error}</p></div>;

    return (
        <div className="hist-container">
            <h2>Registro de Movimientos</h2>
            <button onClick={() => navigate(-1)} className="registro-back-button">
                 Volver
            </button>
            <div className="registros-search-container">
                <select value={searchCriteria} onChange={handleSearchCriteriaChange} className="registros-search-select">
                    <option value="ingrediente">Ingrediente</option>
                    <option value="tipomovimiento">Tipo Movimiento</option>
                    <option value="cantidad">Cantidad</option>
                    <option value="fecha">Fecha</option>
                    <option value="origen">Origen</option>
                </select>
                <input
                    type="text"
                    value={searchText}
                    onChange={handleSearch}
                    placeholder={`Buscar por ${searchCriteria}`}
                    className="registros-search-bar"
                />
            </div>

            <table className="hist-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('id_registro')}>
                            ID Registro {sortConfig.key === 'id_registro' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('ingrediente')}>
                            Ingrediente {sortConfig.key === 'ingrediente' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('tipomovimiento')}>
                            Tipo Movimiento {sortConfig.key === 'tipomovimiento' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('cantidad')}>
                            Cantidad {sortConfig.key === 'cantidad' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('fechamovimiento')}>
                            Fecha Movimiento {sortConfig.key === 'fechamovimiento' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('origen')}>
                            Origen {sortConfig.key === 'origen' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredMovimientos.map((movimiento) => (
                        <tr key={movimiento.id_registro}>
                            <td>{movimiento.id_registro}</td>
                            <td>{movimiento.id_ingredientes}</td>
                            <td>{movimiento.tipomovimiento}</td>
                            <td>{movimiento.cantidad}</td>
                            <td>{new Date(movimiento.fechamovimiento).toLocaleString()}</td>
                            <td>{movimiento.origen}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

};

export default RegistroMovimientos;
