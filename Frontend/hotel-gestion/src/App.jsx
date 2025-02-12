import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { GlobalProvider } from "./GlobalState";
import { AuthProvider } from "./components/AuthContext";
import Navbar from "./components/NavBar";

import Home from "./pages/Home";
import Huespedes from "./pages/Huespedes";
import Ordenes from "./pages/Ordenes";
import NuevaOrden from "./pages/NuevaOrden";
import DetalleOrden from "./pages/DetalleOrden";
import Bar from "./pages/Bares";
import Login from "./pages/Login";
import Bebidas from "./pages/Bebidas";

import AdminLogin from "./pages/AdminLogin";
import AdminHome from "./pages/AdminHome";
import AdminBebidas from "./pages/AdminBebidas";     
import AdminOrdenes from "./pages/AdminOrdenes";  
import DetalleCocktail from "./pages/DetalleCocktail"; 
import Reportes from "./pages/Reportes";
import GestionBares from "./pages/GestionBares";
import GestionEmpleados from "./pages/GestionEmpleados"; 

import Eleccion from "./pages/Eleccion";
import GestionLogin from "./pages/GestionLogin"; 
import GestionHome from "./pages/GestionHome"; 
import HuespedesRegistrados from "./pages/HuespedesRegistrados";
import Habitaciones from "./pages/Habitaciones";
import DetalleHabitacion from "./pages/DetalleHabitacion"; 
import DetalleHuesped from "./pages/DetalleHuesped"; 

import Reabastecimiento from "./pages/Reabastecimiento"; 

import RegistroOrdenes from "./pages/RegistroOrdenes"; 
import RegistroMovimientos from "./pages/RegistroMovimientos"; 
import RegistroEstancias from "./pages/RegistroEstancias"; 


import "./styles/global.css";

function App() {
  return (
    <GlobalProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Navbar />
            <div className="content">
              <Routes>
                {/* Rutas normales */}
                <Route path="/" element={<Eleccion />} />
                <Route path="/bares" element={<Bar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/home" element={<Home />} />
                <Route path="/huespedes" element={<Huespedes />} />
                <Route path="/ordenes" element={<Ordenes />} />
                <Route path="/nueva-orden" element={<NuevaOrden />} />
                <Route path="/bebidas" element={<Bebidas />} />
                <Route path="/ordenes/:id_orden" element={<DetalleOrden />} />

                {/* Rutas de gestión */}
                <Route path="/eleccion" element={<Eleccion />} />
                <Route path="/gestion-login" element={<GestionLogin />} />
                <Route path="/gestion/home" element={<GestionHome />} />
                <Route path="/gestion/huespedes" element={<HuespedesRegistrados />} />
                <Route path="/gestion/habitaciones" element={<Habitaciones />} />
                <Route path="/gestion/detalle-habitacion/:numerohabitacion" element={<DetalleHabitacion />} /> 
                <Route path="/gestion/detalle-huesped/:id_huesped" element={<DetalleHuesped />} /> 
                <Route path="/gestion/registroestancias" element={<RegistroEstancias />} />

                {/* Rutas de administración */}
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/admin/home" element={<AdminHome />} />
                <Route path="/admin/bebidas" element={<AdminBebidas />} />
                <Route path="/detalle-cocktail/:id_cocktail" element={<DetalleCocktail />} />
                <Route path="/admin/ordenes" element={<AdminOrdenes />} />
                <Route path="/admin" element={<AdminHome />} />
                <Route path="/admin/bares" element={<GestionBares />} />
                <Route path="/admin/empleados" element={<GestionEmpleados />} />
                <Route path="/admin/reportes" element={<Reportes />} /> 
                <Route path="/admin/registroordenes" element={<RegistroOrdenes />} />
                <Route path="/admin/registromovimientos" element={<RegistroMovimientos />} />
               
                {/* Rutas de administración */}
                <Route path="/reabastecimiento" element={<Reabastecimiento />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AuthProvider>
    </GlobalProvider>
  );
}

export default App;
