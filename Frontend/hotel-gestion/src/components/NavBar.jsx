import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "../styles/NavBar.css";
 
function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user?.isAdmin;
  const isGestor = user?.isGestor;

  const handleNavigateHome = () => {
    if (user) {
      if (isAdmin) {
        navigate("/admin/home");
      } else if (isGestor) {
        navigate("/gestion/home");
      } else {
        navigate("/home", {
          state: {
            bar: user?.bar,
            empleado: {
              id_empleado: user.id_empleado,
              nombre: user.nombre,
              puesto: user.puesto,
            },
          },
        });
      }
    } else {
      navigate("/eleccion"); 
    }
  };  

  return (
    <div className="navbar">
      <div className="navbar-header">
        <button className="navbar-header-button" onClick={handleNavigateHome}>
          Inicio
        </button>
      </div>

      <div className="nav-segments">
        {!isAdmin && !isGestor && user && (
          <>
            <div className="segment">
              <NavLink
                to="/huespedes"
                state={{
                  bar: user.bar,
                  empleado: {
                    id_empleado: user.id_empleado,
                    nombre: user.nombre,
                    puesto: user.puesto,
                  },
                }}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Huéspedes
              </NavLink>
            </div>
            <div className="segment">
              <NavLink
                to="/ordenes"
                state={{
                  bar: user.bar,
                  empleado: {
                    id_empleado: user.id_empleado,
                    nombre: user.nombre,
                    puesto: user.puesto,
                  },
                }}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Órdenes
              </NavLink>
            </div>
            <div className="segment">
              <NavLink
                to="/nueva-orden"
                state={{
                  bar: user.bar,
                  empleado: {
                    id_empleado: user.id_empleado,
                    nombre: user.nombre,
                    puesto: user.puesto,
                  },
                }}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Nueva Orden
              </NavLink>
            </div>
          </>
        )}

        {isAdmin && (
          <>
          <div className="segment">
            <NavLink to="/admin/bebidas" className="nav-link">
              Bebidas
            </NavLink>
          </div>
          <div className="segment">
            <NavLink to="/huespedes" className="nav-link">
              Huéspedes
            </NavLink>
          </div>
          <div className="segment">
            <NavLink to="/admin/ordenes" className="nav-link">
              Órdenes
            </NavLink>
          </div>
          <div className="segment">
            <NavLink to="/admin/reportes" className="nav-link">
              Reportes
            </NavLink>
          </div>
          <div className="segment">
            <NavLink to="/admin/bares" className="nav-link">
              Bares
            </NavLink>
          </div>
          <div className="segment">
            <NavLink to="/admin/empleados" className="nav-link">
              Empleados
            </NavLink>
          </div>
          </>
        )}

        {isGestor && (
          <>
            <div className="segment">
              <NavLink to="/gestion/habitaciones" className="nav-link">
                Habitaciones
              </NavLink>
            </div>
            <div className="segment">
              <NavLink to="/gestion/huespedes" className="nav-link">
                Huéspedes
              </NavLink>
            </div>
          </>
        )}
      </div>

      {user && (
        <div className="logout-segment">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default NavBar;
