import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom"; 
import '../styles/RegistrosHistoricos.css'; 

const RegistroOrdenes = () => {
    const [ordenes, setOrdenes] = useState([]);
    const [filteredOrdenes, setFilteredOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [searchText, setSearchText] = useState('');
    const [searchCriteria, setSearchCriteria] = useState('huesped');
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchOrdenes = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/registroordenes/', {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Error al obtener órdenes.');
                }
                const data = await response.json();
                const ordenesData = Array.isArray(data) ? data : data.results;
                setOrdenes(ordenesData);
                setFilteredOrdenes(ordenesData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchOrdenes();
    }, []);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        let sortableOrdenes = [...ordenes];
        if (sortConfig.key !== null) {
            sortableOrdenes.sort((a, b) => {
                let aValue, bValue;

                switch (sortConfig.key) {
                    case 'id_registro':
                        aValue = a.id_registro;
                        bValue = b.id_registro;
                        break;
                    case 'huesped':
                        aValue = a.id_huesped.nombre.toLowerCase();
                        bValue = b.id_huesped.nombre.toLowerCase();
                        break;
                    case 'habitacion':
                        aValue = a.numerohabitacion.numerohabitacion;
                        bValue = b.numerohabitacion.numerohabitacion;
                        break;
                    case 'orden':
                        aValue = a.id_orden ? a.id_orden.id_orden : 0;
                        bValue = b.id_orden ? b.id_orden.id_orden : 0;
                        break;
                    case 'bar':
                        aValue = a.id_bar.nombre.toLowerCase();
                        bValue = b.id_bar.nombre.toLowerCase();
                        break;
                    case 'empleado':
                        aValue = a.id_empleado.nombre.toLowerCase();
                        bValue = b.id_empleado.nombre.toLowerCase();
                        break;
                    case 'fechahora':
                        aValue = new Date(a.fechahora);
                        bValue = new Date(b.fechahora);
                        break;
                    case 'detalleorden':
                        aValue = a.detalleorden.toLowerCase();
                        bValue = b.detalleorden.toLowerCase();
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
        setFilteredOrdenes(sortableOrdenes);
    }, [sortConfig, ordenes]);

    const handleSearch = (e) => {
        const text = e.target.value;
        setSearchText(text);

        const filtered = ordenes.filter((orden) => {
            switch (searchCriteria) {
                case "habitacion":
                    return orden.numerohabitacion.numerohabitacion.toString().includes(text);
                case "bar":
                    return orden.id_bar.nombre.toLowerCase().includes(text.toLowerCase());
                case "empleado":
                    return orden.id_empleado.nombre.toLowerCase().includes(text.toLowerCase());
                case "fecha":
                    return new Date(orden.fechahora).toLocaleDateString().includes(text);
                case "huesped":
                default:
                    return orden.id_huesped.nombre.toLowerCase().includes(text.toLowerCase());
            }
        });

        setFilteredOrdenes(filtered);
    };

    const handleSearchCriteriaChange = (e) => {
        setSearchCriteria(e.target.value);
        setSearchText('');
        setFilteredOrdenes(ordenes);
    };

    if (loading) return <div className="hist-container"><p>Cargando órdenes...</p></div>;
    if (error) return <div className="hist-container"><p>Error: {error}</p></div>;

    return (
        <div className="hist-container">
            <h2>Registro de Órdenes</h2>
            <button onClick={() => navigate(-1)} className="registro-back-button">
                 Volver
            </button>

            <div className="registros-search-container">
                <select value={searchCriteria} onChange={handleSearchCriteriaChange} className="registros-search-select">
                    <option value="huesped">Huésped</option>
                    <option value="habitacion">Habitación</option>
                    <option value="bar">Bar</option>
                    <option value="empleado">Empleado</option>
                    <option value="fecha">Fecha</option>
                </select>
                <input
                    type="search-bar"
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
                        <th onClick={() => requestSort('huesped')}>
                            Huésped {sortConfig.key === 'huesped' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('habitacion')}>
                            Habitación {sortConfig.key === 'habitacion' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('orden')}>
                            Orden {sortConfig.key === 'orden' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('bar')}>
                            Bar {sortConfig.key === 'bar' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('empleado')}>
                            Empleado {sortConfig.key === 'empleado' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('fechahora')}>
                            Fecha Hora {sortConfig.key === 'fechahora' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => requestSort('detalleorden')}>
                            Detalle Orden {sortConfig.key === 'detalleorden' ? (sortConfig.direction === 'ascending' ? '↑' : '↓') : ''}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrdenes.map((orden) => (
                        <tr key={orden.id_registro}>
                            <td>{orden.id_registro}</td>
                            <td>
                                {orden.id_huesped.nombre} (ID: {orden.id_huesped.id_huesped})
                            </td>
                            <td>{orden.numerohabitacion.numerohabitacion}</td>
                            <td>
                                {orden.id_orden
                                    ? `Orden ID: ${orden.id_orden.id_orden}`
                                    : 'N/A'}
                            </td>
                            <td>{orden.id_bar.nombre}</td>
                            <td>{orden.id_empleado.nombre}</td>
                            <td>{new Date(orden.fechahora).toLocaleString()}</td>
                            <td>{orden.detalleorden}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RegistroOrdenes;
