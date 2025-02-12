--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

-- Started on 2025-02-12 20:52:53

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 277 (class 1255 OID 77833)
-- Name: actualizar_estado_habitacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_estado_habitacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    huespedes_en_habitacion INT;
BEGIN
    -- Contar los huéspedes en la habitación con estado `EnHotel = TRUE`
    SELECT COUNT(*) INTO huespedes_en_habitacion
    FROM AsignacionesHuespedes
    WHERE NumeroHabitacion = COALESCE(NEW.NumeroHabitacion, OLD.NumeroHabitacion) 
      AND EnHotel = TRUE;

    -- Actualizar el estado de la habitación
    IF huespedes_en_habitacion = 0 THEN
        UPDATE Habitaciones 
        SET Ocupada = FALSE 
        WHERE NumeroHabitacion = COALESCE(NEW.NumeroHabitacion, OLD.NumeroHabitacion);
    ELSE
        UPDATE Habitaciones 
        SET Ocupada = TRUE 
        WHERE NumeroHabitacion = COALESCE(NEW.NumeroHabitacion, OLD.NumeroHabitacion);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_estado_habitacion() OWNER TO postgres;

--
-- TOC entry 284 (class 1255 OID 77827)
-- Name: actualizar_stock_ingredientes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_stock_ingredientes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Ignorar eliminaciones
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
	
    -- Asegurarse de que la cantidad sea válida solo en inserciones o actualizaciones
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.Cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad debe ser mayor que cero.';
        END IF;

    -- Ajustar el stock según el tipo de movimiento
    CASE NEW.TipoMovimiento
        WHEN 'Reabastecimiento' THEN
            UPDATE Ingredientes
            SET CantidadActual = ROUND(CantidadActual + NEW.Cantidad, 3)
            WHERE ID_Ingredientes = NEW.ID_Ingredientes;

        WHEN 'Consumo', 'Pérdida' THEN
            UPDATE Ingredientes
            SET CantidadActual = ROUND(CantidadActual - NEW.Cantidad, 3)
            WHERE ID_Ingredientes = NEW.ID_Ingredientes;

            -- Verificar que no se permita un stock negativo
            IF (SELECT CantidadActual FROM Ingredientes WHERE ID_Ingredientes = NEW.ID_Ingredientes) < 0 THEN
                RAISE EXCEPTION 'Stock insuficiente para el ingrediente %', NEW.ID_Ingredientes;
            
			END IF;

		WHEN 'Consumo (orden)', 'Cancelacion (orden)' THEN
			RETURN NEW;

        ELSE
            RAISE EXCEPTION 'Tipo de movimiento no válido: %', NEW.TipoMovimiento;
    END CASE;
	END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_stock_ingredientes() OWNER TO postgres;

--
-- TOC entry 262 (class 1255 OID 78179)
-- Name: actualizar_version_cocktail(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_version_cocktail() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    max_version INT;
BEGIN
    -- Obtener la versión más alta entre los ingredientes del cóctel
    SELECT COALESCE(MAX(Version), 1)
    INTO max_version
    FROM CocktailIngredientes
    WHERE ID_Cocktail = NEW.ID_Cocktail;

    -- Actualizar la versión del cóctel
    UPDATE Cocktail
    SET Version = max_version
    WHERE ID_Cocktail = NEW.ID_Cocktail;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_version_cocktail() OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 121175)
-- Name: actualizar_version_cocktail_en_orden(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_version_cocktail_en_orden() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar si el elemento es un cóctel
    IF NEW.EsCocktail THEN
        -- Obtener la versión actual del cóctel
        NEW.Version := (SELECT Version FROM Cocktail WHERE ID_Cocktail = NEW.ID_Cocktail);
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_version_cocktail_en_orden() OWNER TO postgres;

--
-- TOC entry 282 (class 1255 OID 77829)
-- Name: controlar_version_cocktailingredientes(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.controlar_version_cocktailingredientes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    cocktail_version INT;  -- Declaramos la variable
    original_primera_version INT; -- Variable para almacenar la primera versión original
BEGIN

	-- Obtener la versión actual del cóctel
    SELECT Version INTO cocktail_version 
    FROM Cocktail 
    WHERE ID_Cocktail = NEW.ID_Cocktail;
	
    IF TG_OP = 'UPDATE' THEN
        -- Bloquear cualquier actualización que no modifique únicamente los campos permitidos
        IF (NEW.Version IS DISTINCT FROM OLD.Version OR
		    NEW.Activo IS DISTINCT FROM OLD.Activo OR
            NEW.FechaModificacion IS DISTINCT FROM OLD.FechaModificacion) AND
            (NEW.cantidad IS DISTINCT FROM OLD.cantidad OR
             NEW.id_cocktail IS DISTINCT FROM OLD.id_cocktail OR
             NEW.id_ingredientes IS DISTINCT FROM OLD.id_ingredientes) THEN
            RAISE EXCEPTION 'Solo se permite actualizar los campos `Version`, `Activo` y `FechaModificacion` en CocktailIngredientes.';
        END IF;

    ELSIF TG_OP = 'INSERT' THEN
        -- Verificar si ya existe un registro activo para el mismo cóctel e ingrediente
        IF EXISTS (
            SELECT 1
            FROM CocktailIngredientes
            WHERE ID_Cocktail = NEW.ID_Cocktail
              AND ID_Ingredientes = NEW.ID_Ingredientes
              AND Activo = TRUE
        ) THEN
			-- Obtener la primera versión original del ingrediente
            SELECT PrimeraVersion INTO original_primera_version
            FROM CocktailIngredientes
            WHERE ID_Cocktail = NEW.ID_Cocktail
              AND ID_Ingredientes = NEW.ID_Ingredientes
              AND Activo = TRUE;
		
            -- Desactivar el registro anterior
            UPDATE CocktailIngredientes
            SET Activo = FALSE, FechaModificacion = CURRENT_TIMESTAMP
            WHERE ID_Cocktail = NEW.ID_Cocktail
              AND ID_Ingredientes = NEW.ID_Ingredientes
              AND Activo = TRUE;

            -- Asignar nueva versión
            NEW.Version := cocktail_version + 1;
			NEW.PrimeraVersion := original_primera_version;
			-- Actualizar la versión de todos los ingredientes activos
            UPDATE CocktailIngredientes
            SET Version = NEW.Version
            WHERE ID_Cocktail = NEW.ID_Cocktail
              AND Activo = TRUE;

        ELSE
			-- Si se inserta un nuevo ingrediente, usar la versión actual del cóctel
            IF cocktail_version > 1 THEN
                NEW.Version := cocktail_version + 1;
				NEW.PrimeraVersion := cocktail_version + 1;
				-- Actualizar la versión de todos los ingredientes activos
                UPDATE CocktailIngredientes
                SET Version = NEW.Version
                WHERE ID_Cocktail = NEW.ID_Cocktail
                  AND Activo = TRUE;
            ELSE	
				NEW.Version := 1;
				NEW.PrimeraVersion := 1;
			END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.controlar_version_cocktailingredientes() OWNER TO postgres;

--
-- TOC entry 283 (class 1255 OID 121228)
-- Name: evitar_modificacion_activa(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.evitar_modificacion_activa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar si el campo Activo está siendo modificado
    IF (NEW.Activo <> OLD.Activo) THEN
        -- Verificar si hay asignaciones activas para el huésped
        IF EXISTS (
            SELECT 1 
            FROM AsignacionesHuespedes
            WHERE ID_Huesped = NEW.ID_Huesped
              AND EnHotel = TRUE
        ) THEN
            RAISE EXCEPTION 'No se puede modificar el campo Activo porque el huésped tiene asignaciones activas.';
        END IF;
    END IF;
    
    -- Si no hay asignaciones activas, permitir la actualización
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.evitar_modificacion_activa() OWNER TO postgres;

--
-- TOC entry 264 (class 1255 OID 121216)
-- Name: validar_asignacion_activa(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_asignacion_activa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar que el Huesped esté activo
    IF NOT EXISTS (
        SELECT 1 FROM Huesped WHERE ID_Huesped = NEW.ID_Huesped AND Activo = TRUE
    ) THEN
        RAISE EXCEPTION 'No se puede asignar un huésped inactivo (ID_Huesped=%).', NEW.ID_Huesped;
    END IF;

    -- Verificar que la Habitación esté activa
    IF NOT EXISTS (
        SELECT 1 FROM Habitaciones WHERE NumeroHabitacion = NEW.NumeroHabitacion AND Activo = TRUE
    ) THEN
        RAISE EXCEPTION 'No se puede asignar una habitación inactiva (NumeroHabitacion=%).', NEW.NumeroHabitacion;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_asignacion_activa() OWNER TO postgres;

--
-- TOC entry 269 (class 1255 OID 121218)
-- Name: validar_orden_activa(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_orden_activa() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar que el Bar esté activo
    IF NOT EXISTS (
        SELECT 1 FROM Bares WHERE ID_Bar = NEW.ID_Bar AND Activo = TRUE
    ) THEN
        RAISE EXCEPTION 'No se puede crear una orden para un bar inactivo (ID_Bar=%).', NEW.ID_Bar;
    END IF;

    -- Verificar que el Empleado esté activo
    IF NOT EXISTS (
        SELECT 1 FROM Empleados WHERE ID_Empleado = NEW.ID_Empleado AND Activo = TRUE
    ) THEN
        RAISE EXCEPTION 'No se puede crear una orden con un empleado inactivo (ID_Empleado=%).', NEW.ID_Empleado;
    END IF;

    -- Verificar que la Asignacion esté activa
    IF NOT EXISTS (
        SELECT 1 FROM AsignacionesHuespedes WHERE ID_Asignacion = NEW.id_asignacion AND EnHotel = TRUE
    ) THEN
        RAISE EXCEPTION 'No se puede crear una orden para una asignación inactiva o no existente (ID_Asignacion=%).', NEW.id_asignacion;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_orden_activa() OWNER TO postgres;

--
-- TOC entry 280 (class 1255 OID 77831)
-- Name: validar_orden_elemento(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validar_orden_elemento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validar estado de la orden
    IF NOT EXISTS (SELECT 1 FROM Ordenes WHERE ID_Orden = NEW.ID_Orden AND Actividad = TRUE) THEN
        RAISE EXCEPTION 'La orden no está activa.';
    END IF;

    -- Validar ingredientes o cócteles
    IF NEW.EsCocktail THEN
        IF NOT EXISTS (
            SELECT 1
            FROM Cocktail
            WHERE ID_Cocktail = NEW.ID_Cocktail AND TieneReceta = TRUE
				AND Activo = TRUE
        ) THEN
            RAISE EXCEPTION 'El cóctel no está activo o no tiene receta.';
        END IF;

		-- Obtener versión activa del cóctel y asignarla al campo `Version`
        NEW.Version := (SELECT Version FROM Cocktail WHERE ID_Cocktail = NEW.ID_Cocktail);

    ELSE
        IF NOT EXISTS (
            SELECT 1
            FROM Ingredientes
            WHERE ID_Ingredientes = NEW.ID_Ingredientes AND Activo = TRUE
        ) THEN
            RAISE EXCEPTION 'El ingrediente no está activo.';
		
        END IF;
        -- Los ingredientes no tienen versiones, se puede dejar el campo Version como NULL
		NEW.Version := NULL;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.validar_orden_elemento() OWNER TO postgres;

--
-- TOC entry 261 (class 1255 OID 77825)
-- Name: verificar_dependencias_antes_de_desactivar(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_dependencias_antes_de_desactivar() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar si el ingrediente está en uso en cócteles activos
    IF EXISTS (
        SELECT 1
        FROM CocktailIngredientes ci
        JOIN Cocktail c ON ci.ID_Cocktail = c.ID_Cocktail
        WHERE ci.ID_Ingredientes = NEW.ID_Ingredientes AND c.Activo = TRUE
    ) THEN
        RAISE EXCEPTION 'No se puede desactivar el ingrediente porque está en uso por cócteles activos.';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_dependencias_antes_de_desactivar() OWNER TO postgres;

--
-- TOC entry 278 (class 1255 OID 77837)
-- Name: verificar_habitacion_ocupada(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_habitacion_ocupada() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Impedir modificar la capacidad de una habitación ocupada
    IF OLD.Ocupada = TRUE AND OLD.Capacidad IS DISTINCT FROM NEW.Capacidad THEN
        RAISE EXCEPTION 'No se puede modificar la capacidad de una habitación ocupada (Habitación: %).', NEW.NumeroHabitacion;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_habitacion_ocupada() OWNER TO postgres;

--
-- TOC entry 279 (class 1255 OID 77839)
-- Name: verificar_ocupacion_habitacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_ocupacion_habitacion() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    ocupacion_actual INT;
BEGIN
    -- Contar el número de huéspedes actualmente asignados en la habitación
    SELECT COUNT(*) INTO ocupacion_actual
    FROM AsignacionesHuespedes
    WHERE NumeroHabitacion = NEW.NumeroHabitacion AND EnHotel = TRUE;

    -- Verificar si la ocupación excede la capacidad
    IF ocupacion_actual >= (SELECT Capacidad FROM Habitaciones WHERE NumeroHabitacion = NEW.NumeroHabitacion) THEN
        RAISE EXCEPTION 'No se pueden añadir más huéspedes a la habitación %; capacidad máxima alcanzada.', NEW.NumeroHabitacion;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_ocupacion_habitacion() OWNER TO postgres;

--
-- TOC entry 281 (class 1255 OID 77835)
-- Name: verificar_receta_cocktail(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.verificar_receta_cocktail() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    ingredientes_count INT;
BEGIN
    -- Contar los ingredientes asociados al cóctel
    SELECT COUNT(*)
    INTO ingredientes_count
    FROM CocktailIngredientes
    WHERE ID_Cocktail = COALESCE(NEW.ID_Cocktail, OLD.ID_Cocktail)
		AND Activo = TRUE;

    -- Actualizar el estado de receta del cóctel
    UPDATE Cocktail
    SET TieneReceta = (ingredientes_count > 0)
    WHERE ID_Cocktail = COALESCE(NEW.ID_Cocktail, OLD.ID_Cocktail);

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.verificar_receta_cocktail() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 77602)
-- Name: asignacioneshuespedes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asignacioneshuespedes (
    id_asignacion integer NOT NULL,
    id_huesped integer NOT NULL,
    numerohabitacion integer NOT NULL,
    fechaasignacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    enhotel boolean DEFAULT true,
    pagorealizado boolean DEFAULT true,
    fechacheckout timestamp without time zone
);


ALTER TABLE public.asignacioneshuespedes OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 77601)
-- Name: asignacioneshuespedes_id_asignacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.asignacioneshuespedes_id_asignacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asignacioneshuespedes_id_asignacion_seq OWNER TO postgres;

--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 218
-- Name: asignacioneshuespedes_id_asignacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.asignacioneshuespedes_id_asignacion_seq OWNED BY public.asignacioneshuespedes.id_asignacion;


--
-- TOC entry 249 (class 1259 OID 77896)
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 77895)
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 251 (class 1259 OID 77904)
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 77903)
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 247 (class 1259 OID 77890)
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 77889)
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 253 (class 1259 OID 77910)
-- Name: auth_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 77918)
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 77917)
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 252 (class 1259 OID 77909)
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 257 (class 1259 OID 77924)
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 77923)
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 225 (class 1259 OID 77651)
-- Name: bares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bares (
    id_bar integer NOT NULL,
    nombre character varying(255) NOT NULL,
    ubicacion character varying(255),
    activo boolean DEFAULT true
);


ALTER TABLE public.bares OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 77650)
-- Name: bares_id_bar_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bares_id_bar_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bares_id_bar_seq OWNER TO postgres;

--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 224
-- Name: bares_id_bar_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bares_id_bar_seq OWNED BY public.bares.id_bar;


--
-- TOC entry 229 (class 1259 OID 77692)
-- Name: cocktail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cocktail (
    id_cocktail integer NOT NULL,
    nombre character varying(255) NOT NULL,
    precioporunidad numeric(10,2) NOT NULL,
    tienereceta boolean DEFAULT false,
    activo boolean DEFAULT true,
    version integer DEFAULT 1
);


ALTER TABLE public.cocktail OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 77691)
-- Name: cocktail_id_cocktail_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cocktail_id_cocktail_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cocktail_id_cocktail_seq OWNER TO postgres;

--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 228
-- Name: cocktail_id_cocktail_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cocktail_id_cocktail_seq OWNED BY public.cocktail.id_cocktail;


--
-- TOC entry 231 (class 1259 OID 77701)
-- Name: cocktailingredientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cocktailingredientes (
    id_registro integer NOT NULL,
    id_cocktail integer,
    id_ingredientes integer,
    cantidad numeric(10,3) NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    activo boolean DEFAULT true,
    fechamodificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    primeraversion integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.cocktailingredientes OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 77700)
-- Name: cocktailingredientes_id_registro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cocktailingredientes_id_registro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cocktailingredientes_id_registro_seq OWNER TO postgres;

--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 230
-- Name: cocktailingredientes_id_registro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cocktailingredientes_id_registro_seq OWNED BY public.cocktailingredientes.id_registro;


--
-- TOC entry 259 (class 1259 OID 77982)
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 77981)
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 245 (class 1259 OID 77882)
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 77881)
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 243 (class 1259 OID 77874)
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 77873)
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 260 (class 1259 OID 78010)
-- Name: django_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 77642)
-- Name: empleados; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empleados (
    id_empleado integer NOT NULL,
    nombre character varying(255) NOT NULL,
    puesto character varying(255) NOT NULL,
    password character(4) NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT empleados_password_check CHECK ((password ~ '^[0-9]{4}$'::text))
);


ALTER TABLE public.empleados OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 77641)
-- Name: empleados_id_empleado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empleados_id_empleado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empleados_id_empleado_seq OWNER TO postgres;

--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 222
-- Name: empleados_id_empleado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.empleados_id_empleado_seq OWNED BY public.empleados.id_empleado;


--
-- TOC entry 217 (class 1259 OID 77595)
-- Name: habitaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habitaciones (
    numerohabitacion integer NOT NULL,
    todoincluido boolean NOT NULL,
    ocupada boolean DEFAULT false NOT NULL,
    capacidad integer NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.habitaciones OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 77582)
-- Name: huesped; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.huesped (
    id_huesped integer NOT NULL,
    nombre character varying(255) NOT NULL,
    edad integer NOT NULL,
    nacionalidad character varying(255) NOT NULL,
    id_unico_huesped bigint NOT NULL,
    repetidor boolean DEFAULT false,
    activo boolean DEFAULT true,
    CONSTRAINT huesped_edad_check CHECK ((edad > 0)),
    CONSTRAINT huesped_id_unico_huesped_check CHECK (((id_unico_huesped >= 1000000) AND (id_unico_huesped <= 9999999)))
);


ALTER TABLE public.huesped OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 77581)
-- Name: huesped_id_huesped_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.huesped_id_huesped_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.huesped_id_huesped_seq OWNER TO postgres;

--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 215
-- Name: huesped_id_huesped_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.huesped_id_huesped_seq OWNED BY public.huesped.id_huesped;


--
-- TOC entry 227 (class 1259 OID 77681)
-- Name: ingredientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ingredientes (
    id_ingredientes integer NOT NULL,
    nombre character varying(255) NOT NULL,
    alcohol boolean NOT NULL,
    precioporunidad numeric(10,2) NOT NULL,
    litrosporunidad numeric(10,3) DEFAULT 1.0 NOT NULL,
    cantidadactual numeric(10,3) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT check_cantidad_actual_no_negativa CHECK ((cantidadactual >= (0)::numeric))
);


ALTER TABLE public.ingredientes OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 77680)
-- Name: ingredientes_id_ingredientes_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ingredientes_id_ingredientes_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ingredientes_id_ingredientes_seq OWNER TO postgres;

--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 226
-- Name: ingredientes_id_ingredientes_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ingredientes_id_ingredientes_seq OWNED BY public.ingredientes.id_ingredientes;


--
-- TOC entry 233 (class 1259 OID 77720)
-- Name: movimientosstock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientosstock (
    id_movimiento integer NOT NULL,
    id_ingredientes integer NOT NULL,
    tipomovimiento character varying(50) NOT NULL,
    cantidad numeric(15,6) NOT NULL,
    fechamovimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.movimientosstock OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 77719)
-- Name: movimientosstock_id_movimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientosstock_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientosstock_id_movimiento_seq OWNER TO postgres;

--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 232
-- Name: movimientosstock_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientosstock_id_movimiento_seq OWNED BY public.movimientosstock.id_movimiento;


--
-- TOC entry 241 (class 1259 OID 77801)
-- Name: ordenelementos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenelementos (
    id_elemento integer NOT NULL,
    id_orden integer NOT NULL,
    id_ingredientes integer,
    id_cocktail integer,
    escocktail boolean NOT NULL,
    cantidad integer NOT NULL,
    preciototal numeric(10,2) DEFAULT 0 NOT NULL,
    version integer,
    fechaorden timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_precio_total_no_negativo CHECK ((preciototal >= (0)::numeric)),
    CONSTRAINT check_un_solo_tipo CHECK ((((id_ingredientes IS NOT NULL) AND (id_cocktail IS NULL) AND (escocktail = false)) OR ((id_ingredientes IS NULL) AND (id_cocktail IS NOT NULL) AND (escocktail = true))))
);


ALTER TABLE public.ordenelementos OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 77800)
-- Name: ordenelementos_id_elemento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordenelementos_id_elemento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordenelementos_id_elemento_seq OWNER TO postgres;

--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 240
-- Name: ordenelementos_id_elemento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordenelementos_id_elemento_seq OWNED BY public.ordenelementos.id_elemento;


--
-- TOC entry 237 (class 1259 OID 77741)
-- Name: ordenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ordenes (
    id_orden integer NOT NULL,
    id_asignacion integer NOT NULL,
    preciototal numeric(10,2) DEFAULT 0 NOT NULL,
    id_bar integer NOT NULL,
    id_empleado integer NOT NULL,
    fechahora timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actividad boolean DEFAULT true,
    num_cocktails integer DEFAULT 0 NOT NULL,
    num_ingredientes integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.ordenes OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 77740)
-- Name: ordenes_id_orden_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ordenes_id_orden_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordenes_id_orden_seq OWNER TO postgres;

--
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 236
-- Name: ordenes_id_orden_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ordenes_id_orden_seq OWNED BY public.ordenes.id_orden;


--
-- TOC entry 221 (class 1259 OID 77622)
-- Name: registroestancias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registroestancias (
    id_registro integer NOT NULL,
    id_huesped integer NOT NULL,
    numerohabitacion integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    descripcion text NOT NULL
);


ALTER TABLE public.registroestancias OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 77621)
-- Name: registroestancias_id_registro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registroestancias_id_registro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registroestancias_id_registro_seq OWNER TO postgres;

--
-- TOC entry 5189 (class 0 OID 0)
-- Dependencies: 220
-- Name: registroestancias_id_registro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registroestancias_id_registro_seq OWNED BY public.registroestancias.id_registro;


--
-- TOC entry 235 (class 1259 OID 77733)
-- Name: registromovimientos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registromovimientos (
    id_registro integer NOT NULL,
    id_ingredientes integer,
    id_orden integer,
    tipomovimiento character varying(50) NOT NULL,
    cantidad numeric(10,3) NOT NULL,
    fechamovimiento timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    origen character varying(50)
);


ALTER TABLE public.registromovimientos OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 77732)
-- Name: registromovimientos_id_registro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registromovimientos_id_registro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registromovimientos_id_registro_seq OWNER TO postgres;

--
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 234
-- Name: registromovimientos_id_registro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registromovimientos_id_registro_seq OWNED BY public.registromovimientos.id_registro;


--
-- TOC entry 239 (class 1259 OID 77766)
-- Name: registroordenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.registroordenes (
    id_registro integer NOT NULL,
    id_huesped integer NOT NULL,
    numerohabitacion integer NOT NULL,
    id_orden integer NOT NULL,
    id_bar integer NOT NULL,
    id_empleado integer NOT NULL,
    fechahora timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    detalleorden text
);


ALTER TABLE public.registroordenes OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 77765)
-- Name: registroordenes_id_registro_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.registroordenes_id_registro_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.registroordenes_id_registro_seq OWNER TO postgres;

--
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 238
-- Name: registroordenes_id_registro_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.registroordenes_id_registro_seq OWNED BY public.registroordenes.id_registro;


--
-- TOC entry 4819 (class 2604 OID 77605)
-- Name: asignacioneshuespedes id_asignacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacioneshuespedes ALTER COLUMN id_asignacion SET DEFAULT nextval('public.asignacioneshuespedes_id_asignacion_seq'::regclass);


--
-- TOC entry 4827 (class 2604 OID 77654)
-- Name: bares id_bar; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bares ALTER COLUMN id_bar SET DEFAULT nextval('public.bares_id_bar_seq'::regclass);


--
-- TOC entry 4833 (class 2604 OID 77695)
-- Name: cocktail id_cocktail; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cocktail ALTER COLUMN id_cocktail SET DEFAULT nextval('public.cocktail_id_cocktail_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 77704)
-- Name: cocktailingredientes id_registro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cocktailingredientes ALTER COLUMN id_registro SET DEFAULT nextval('public.cocktailingredientes_id_registro_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 77645)
-- Name: empleados id_empleado; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados ALTER COLUMN id_empleado SET DEFAULT nextval('public.empleados_id_empleado_seq'::regclass);


--
-- TOC entry 4814 (class 2604 OID 77585)
-- Name: huesped id_huesped; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.huesped ALTER COLUMN id_huesped SET DEFAULT nextval('public.huesped_id_huesped_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 77684)
-- Name: ingredientes id_ingredientes; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes ALTER COLUMN id_ingredientes SET DEFAULT nextval('public.ingredientes_id_ingredientes_seq'::regclass);


--
-- TOC entry 4842 (class 2604 OID 77723)
-- Name: movimientosstock id_movimiento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientosstock ALTER COLUMN id_movimiento SET DEFAULT nextval('public.movimientosstock_id_movimiento_seq'::regclass);


--
-- TOC entry 4854 (class 2604 OID 77804)
-- Name: ordenelementos id_elemento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenelementos ALTER COLUMN id_elemento SET DEFAULT nextval('public.ordenelementos_id_elemento_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 77744)
-- Name: ordenes id_orden; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes ALTER COLUMN id_orden SET DEFAULT nextval('public.ordenes_id_orden_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 77625)
-- Name: registroestancias id_registro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroestancias ALTER COLUMN id_registro SET DEFAULT nextval('public.registroestancias_id_registro_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 77736)
-- Name: registromovimientos id_registro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registromovimientos ALTER COLUMN id_registro SET DEFAULT nextval('public.registromovimientos_id_registro_seq'::regclass);


--
-- TOC entry 4852 (class 2604 OID 77769)
-- Name: registroordenes id_registro; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroordenes ALTER COLUMN id_registro SET DEFAULT nextval('public.registroordenes_id_registro_seq'::regclass);


--
-- TOC entry 5132 (class 0 OID 77602)
-- Dependencies: 219
-- Data for Name: asignacioneshuespedes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asignacioneshuespedes (id_asignacion, id_huesped, numerohabitacion, fechaasignacion, enhotel, pagorealizado, fechacheckout) FROM stdin;
2	3	2	2025-02-10 17:06:05.798833	t	t	\N
1	1	1	2025-02-10 17:05:56.457553	t	f	\N
\.


--
-- TOC entry 5162 (class 0 OID 77896)
-- Dependencies: 249
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- TOC entry 5164 (class 0 OID 77904)
-- Dependencies: 251
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- TOC entry 5160 (class 0 OID 77890)
-- Dependencies: 247
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add user	4	add_user
14	Can change user	4	change_user
15	Can delete user	4	delete_user
16	Can view user	4	view_user
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add session	6	add_session
22	Can change session	6	change_session
23	Can delete session	6	delete_session
24	Can view session	6	view_session
25	Can add ordenes	7	add_ordenes
26	Can change ordenes	7	change_ordenes
27	Can delete ordenes	7	delete_ordenes
28	Can view ordenes	7	view_ordenes
29	Can add empleados	8	add_empleados
30	Can change empleados	8	change_empleados
31	Can delete empleados	8	delete_empleados
32	Can view empleados	8	view_empleados
33	Can add asignaciones empleados bar	9	add_asignacionesempleadosbar
34	Can change asignaciones empleados bar	9	change_asignacionesempleadosbar
35	Can delete asignaciones empleados bar	9	delete_asignacionesempleadosbar
36	Can view asignaciones empleados bar	9	view_asignacionesempleadosbar
37	Can add bares	10	add_bares
38	Can change bares	10	change_bares
39	Can delete bares	10	delete_bares
40	Can view bares	10	view_bares
41	Can add asignaciones huespedes	11	add_asignacioneshuespedes
42	Can change asignaciones huespedes	11	change_asignacioneshuespedes
43	Can delete asignaciones huespedes	11	delete_asignacioneshuespedes
44	Can view asignaciones huespedes	11	view_asignacioneshuespedes
45	Can add registro estancias	12	add_registroestancias
46	Can change registro estancias	12	change_registroestancias
47	Can delete registro estancias	12	delete_registroestancias
48	Can view registro estancias	12	view_registroestancias
49	Can add huesped	13	add_huesped
50	Can change huesped	13	change_huesped
51	Can delete huesped	13	delete_huesped
52	Can view huesped	13	view_huesped
53	Can add habitaciones	14	add_habitaciones
54	Can change habitaciones	14	change_habitaciones
55	Can delete habitaciones	14	delete_habitaciones
56	Can view habitaciones	14	view_habitaciones
57	Can add ingredientes	15	add_ingredientes
58	Can change ingredientes	15	change_ingredientes
59	Can delete ingredientes	15	delete_ingredientes
60	Can view ingredientes	15	view_ingredientes
61	Can add registro movimientos	16	add_registromovimientos
62	Can change registro movimientos	16	change_registromovimientos
63	Can delete registro movimientos	16	delete_registromovimientos
64	Can view registro movimientos	16	view_registromovimientos
65	Can add cocktail	17	add_cocktail
66	Can change cocktail	17	change_cocktail
67	Can delete cocktail	17	delete_cocktail
68	Can view cocktail	17	view_cocktail
69	Can add cocktail ingredientes	18	add_cocktailingredientes
70	Can change cocktail ingredientes	18	change_cocktailingredientes
71	Can delete cocktail ingredientes	18	delete_cocktailingredientes
72	Can view cocktail ingredientes	18	view_cocktailingredientes
73	Can add movimientos stock	19	add_movimientosstock
74	Can change movimientos stock	19	change_movimientosstock
75	Can delete movimientos stock	19	delete_movimientosstock
76	Can view movimientos stock	19	view_movimientosstock
77	Can add orden elementos	20	add_ordenelementos
78	Can change orden elementos	20	change_ordenelementos
79	Can delete orden elementos	20	delete_ordenelementos
80	Can view orden elementos	20	view_ordenelementos
81	Can add registro ordenes	21	add_registroordenes
82	Can change registro ordenes	21	change_registroordenes
83	Can delete registro ordenes	21	delete_registroordenes
84	Can view registro ordenes	21	view_registroordenes
\.


--
-- TOC entry 5166 (class 0 OID 77910)
-- Dependencies: 253
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
\.


--
-- TOC entry 5168 (class 0 OID 77918)
-- Dependencies: 255
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- TOC entry 5170 (class 0 OID 77924)
-- Dependencies: 257
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- TOC entry 5138 (class 0 OID 77651)
-- Dependencies: 225
-- Data for Name: bares; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bares (id_bar, nombre, ubicacion, activo) FROM stdin;
1	Pool Bar	Piscina principal	t
2	Lobby Bar	Planta Baja	t
\.


--
-- TOC entry 5142 (class 0 OID 77692)
-- Dependencies: 229
-- Data for Name: cocktail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cocktail (id_cocktail, nombre, precioporunidad, tienereceta, activo, version) FROM stdin;
1	Roncola	7.50	t	t	4
\.


--
-- TOC entry 5144 (class 0 OID 77701)
-- Dependencies: 231
-- Data for Name: cocktailingredientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cocktailingredientes (id_registro, id_cocktail, id_ingredientes, cantidad, version, activo, fechamodificacion, primeraversion) FROM stdin;
1	1	1	0.040	1	f	2025-02-10 17:11:25.145919	1
2	1	1	0.300	2	f	2025-02-10 17:11:37.646806	1
3	1	1	0.040	4	t	2025-02-10 17:11:37.646258	1
4	1	2	0.300	4	t	2025-02-10 17:11:43.341821	4
\.


--
-- TOC entry 5172 (class 0 OID 77982)
-- Dependencies: 259
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- TOC entry 5158 (class 0 OID 77882)
-- Dependencies: 245
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	auth	user
5	contenttypes	contenttype
6	sessions	session
7	gestion	ordenes
8	gestion	empleados
9	gestion	asignacionesempleadosbar
10	gestion	bares
11	gestion	asignacioneshuespedes
12	gestion	registroestancias
13	gestion	huesped
14	gestion	habitaciones
15	gestion	ingredientes
16	gestion	registromovimientos
17	gestion	cocktail
18	gestion	cocktailingredientes
19	gestion	movimientosstock
20	gestion	ordenelementos
21	gestion	registroordenes
\.


--
-- TOC entry 5156 (class 0 OID 77874)
-- Dependencies: 243
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2024-12-07 18:44:19.327074+02
2	auth	0001_initial	2024-12-07 18:44:19.391306+02
3	admin	0001_initial	2024-12-07 18:44:19.40736+02
4	admin	0002_logentry_remove_auto_add	2024-12-07 18:44:19.411382+02
5	admin	0003_logentry_add_action_flag_choices	2024-12-07 18:44:19.414366+02
6	contenttypes	0002_remove_content_type_name	2024-12-07 18:44:19.424639+02
7	auth	0002_alter_permission_name_max_length	2024-12-07 18:44:19.429294+02
8	auth	0003_alter_user_email_max_length	2024-12-07 18:44:19.434299+02
9	auth	0004_alter_user_username_opts	2024-12-07 18:44:19.445806+02
10	auth	0005_alter_user_last_login_null	2024-12-07 18:44:19.45181+02
11	auth	0006_require_contenttypes_0002	2024-12-07 18:44:19.45181+02
12	auth	0007_alter_validators_add_error_messages	2024-12-07 18:44:19.455812+02
13	auth	0008_alter_user_username_max_length	2024-12-07 18:44:19.463828+02
14	auth	0009_alter_user_last_name_max_length	2024-12-07 18:44:19.46781+02
15	auth	0010_alter_group_name_max_length	2024-12-07 18:44:19.472811+02
16	auth	0011_update_proxy_permissions	2024-12-07 18:44:19.475812+02
17	auth	0012_alter_user_first_name_max_length	2024-12-07 18:44:19.479812+02
18	sessions	0001_initial	2024-12-07 18:44:19.488811+02
19	gestion	0001_initial	2024-12-07 20:43:02.088879+02
20	gestion	0002_alter_asignacionesempleadosbar_options_and_more	2024-12-07 21:10:45.516796+02
21	gestion	0003_ordenelementos_registroordenes_and_more	2024-12-07 21:40:27.289261+02
22	gestion	0004_delete_asignacionesempleadosbar	2024-12-26 23:46:39.501073+02
\.


--
-- TOC entry 5173 (class 0 OID 78010)
-- Dependencies: 260
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
\.


--
-- TOC entry 5136 (class 0 OID 77642)
-- Dependencies: 223
-- Data for Name: empleados; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empleados (id_empleado, nombre, puesto, password, activo) FROM stdin;
1	Roberto García	Camarero de sala	0001	t
2	Esperanza Gracia	Camarero de barra	1111	t
\.


--
-- TOC entry 5130 (class 0 OID 77595)
-- Dependencies: 217
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habitaciones (numerohabitacion, todoincluido, ocupada, capacidad, activo) FROM stdin;
2	t	t	3	t
1	f	t	4	t
\.


--
-- TOC entry 5129 (class 0 OID 77582)
-- Dependencies: 216
-- Data for Name: huesped; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.huesped (id_huesped, nombre, edad, nacionalidad, id_unico_huesped, repetidor, activo) FROM stdin;
4	Lucía Valero	25	España	8745964	f	t
3	María Rodríguez	29	Brasil	8475219	f	t
1	Alberto González	30	España	1000520	f	t
\.


--
-- TOC entry 5140 (class 0 OID 77681)
-- Dependencies: 227
-- Data for Name: ingredientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ingredientes (id_ingredientes, nombre, alcohol, precioporunidad, litrosporunidad, cantidadactual, activo) FROM stdin;
1	Ron	t	7.00	0.040	49.800	t
2	Cocacola	f	2.50	0.330	48.500	t
\.


--
-- TOC entry 5146 (class 0 OID 77720)
-- Dependencies: 233
-- Data for Name: movimientosstock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientosstock (id_movimiento, id_ingredientes, tipomovimiento, cantidad, fechamovimiento) FROM stdin;
1	2	Reabastecimiento	50.000000	2025-02-10 17:21:15.396412
2	1	Reabastecimiento	50.000000	2025-02-10 17:21:19.369492
3	1	Consumo (orden)	0.200000	2025-02-10 17:21:38.140306
4	2	Consumo (orden)	1.500000	2025-02-10 17:21:38.144306
\.


--
-- TOC entry 5154 (class 0 OID 77801)
-- Dependencies: 241
-- Data for Name: ordenelementos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordenelementos (id_elemento, id_orden, id_ingredientes, id_cocktail, escocktail, cantidad, preciototal, version, fechaorden) FROM stdin;
3	2	\N	1	t	5	37.50	4	2025-02-10 17:21:38.125362
\.


--
-- TOC entry 5150 (class 0 OID 77741)
-- Dependencies: 237
-- Data for Name: ordenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ordenes (id_orden, id_asignacion, preciototal, id_bar, id_empleado, fechahora, actividad, num_cocktails, num_ingredientes) FROM stdin;
2	1	37.50	1	2	2025-02-10 17:21:38.115373	t	0	0
\.


--
-- TOC entry 5134 (class 0 OID 77622)
-- Dependencies: 221
-- Data for Name: registroestancias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registroestancias (id_registro, id_huesped, numerohabitacion, "timestamp", descripcion) FROM stdin;
1	1	1	2025-02-10 17:05:56.469825	Check-in - Huésped Alberto González en habitación 1
2	3	2	2025-02-10 17:06:05.801906	Check-in - Huésped María Rodríguez en habitación 2
\.


--
-- TOC entry 5148 (class 0 OID 77733)
-- Dependencies: 235
-- Data for Name: registromovimientos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registromovimientos (id_registro, id_ingredientes, id_orden, tipomovimiento, cantidad, fechamovimiento, origen) FROM stdin;
1	1	\N	Nuevo Ingrediente: Ron	0.000	2025-02-10 17:09:50.442116	Ingredientes
2	2	\N	Nuevo Ingrediente: Cocacola	0.000	2025-02-10 17:10:13.792852	Ingredientes
3	\N	\N	Nuevo Cocktail: Roncola	0.000	2025-02-10 17:10:28.092295	Cocktail
4	2	\N	Reabastecimiento	50.000	2025-02-10 17:21:15.401242	MovimientoStock
5	1	\N	Reabastecimiento	50.000	2025-02-10 17:21:19.371804	MovimientoStock
6	1	\N	Consumo (orden)	0.200	2025-02-10 17:21:38.141306	MovimientoStock
7	2	\N	Consumo (orden)	1.500	2025-02-10 17:21:38.145306	MovimientoStock
\.


--
-- TOC entry 5152 (class 0 OID 77766)
-- Dependencies: 239
-- Data for Name: registroordenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.registroordenes (id_registro, id_huesped, numerohabitacion, id_orden, id_bar, id_empleado, fechahora, detalleorden) FROM stdin;
3	1	1	2	1	2	2025-02-10 17:21:38.126673	Cóctel: Roncola | Cantidad: 5 | Precio Total: 37.50 €
\.


--
-- TOC entry 5192 (class 0 OID 0)
-- Dependencies: 218
-- Name: asignacioneshuespedes_id_asignacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.asignacioneshuespedes_id_asignacion_seq', 2, true);


--
-- TOC entry 5193 (class 0 OID 0)
-- Dependencies: 248
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- TOC entry 5194 (class 0 OID 0)
-- Dependencies: 250
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- TOC entry 5195 (class 0 OID 0)
-- Dependencies: 246
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 84, true);


--
-- TOC entry 5196 (class 0 OID 0)
-- Dependencies: 254
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- TOC entry 5197 (class 0 OID 0)
-- Dependencies: 252
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 1, false);


--
-- TOC entry 5198 (class 0 OID 0)
-- Dependencies: 256
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- TOC entry 5199 (class 0 OID 0)
-- Dependencies: 224
-- Name: bares_id_bar_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bares_id_bar_seq', 2, true);


--
-- TOC entry 5200 (class 0 OID 0)
-- Dependencies: 228
-- Name: cocktail_id_cocktail_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cocktail_id_cocktail_seq', 1, true);


--
-- TOC entry 5201 (class 0 OID 0)
-- Dependencies: 230
-- Name: cocktailingredientes_id_registro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cocktailingredientes_id_registro_seq', 4, true);


--
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 258
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 244
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 21, true);


--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 242
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 22, true);


--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 222
-- Name: empleados_id_empleado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empleados_id_empleado_seq', 2, true);


--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 215
-- Name: huesped_id_huesped_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.huesped_id_huesped_seq', 4, true);


--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 226
-- Name: ingredientes_id_ingredientes_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ingredientes_id_ingredientes_seq', 2, true);


--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 232
-- Name: movimientosstock_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientosstock_id_movimiento_seq', 4, true);


--
-- TOC entry 5209 (class 0 OID 0)
-- Dependencies: 240
-- Name: ordenelementos_id_elemento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordenelementos_id_elemento_seq', 3, true);


--
-- TOC entry 5210 (class 0 OID 0)
-- Dependencies: 236
-- Name: ordenes_id_orden_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ordenes_id_orden_seq', 2, true);


--
-- TOC entry 5211 (class 0 OID 0)
-- Dependencies: 220
-- Name: registroestancias_id_registro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registroestancias_id_registro_seq', 2, true);


--
-- TOC entry 5212 (class 0 OID 0)
-- Dependencies: 234
-- Name: registromovimientos_id_registro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registromovimientos_id_registro_seq', 7, true);


--
-- TOC entry 5213 (class 0 OID 0)
-- Dependencies: 238
-- Name: registroordenes_id_registro_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.registroordenes_id_registro_seq', 3, true);


--
-- TOC entry 4871 (class 2606 OID 77610)
-- Name: asignacioneshuespedes asignacioneshuespedes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacioneshuespedes
    ADD CONSTRAINT asignacioneshuespedes_pkey PRIMARY KEY (id_asignacion);


--
-- TOC entry 4909 (class 2606 OID 78008)
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- TOC entry 4914 (class 2606 OID 77939)
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- TOC entry 4917 (class 2606 OID 77908)
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4911 (class 2606 OID 77900)
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 77930)
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- TOC entry 4906 (class 2606 OID 77894)
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- TOC entry 4925 (class 2606 OID 77922)
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 4928 (class 2606 OID 77954)
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- TOC entry 4919 (class 2606 OID 77914)
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 77928)
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- TOC entry 4934 (class 2606 OID 77968)
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- TOC entry 4922 (class 2606 OID 78003)
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- TOC entry 4877 (class 2606 OID 77660)
-- Name: bares bares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bares
    ADD CONSTRAINT bares_pkey PRIMARY KEY (id_bar);


--
-- TOC entry 4883 (class 2606 OID 77699)
-- Name: cocktail cocktail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cocktail
    ADD CONSTRAINT cocktail_pkey PRIMARY KEY (id_cocktail);


--
-- TOC entry 4885 (class 2606 OID 77708)
-- Name: cocktailingredientes cocktailingredientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cocktailingredientes
    ADD CONSTRAINT cocktailingredientes_pkey PRIMARY KEY (id_registro);


--
-- TOC entry 4937 (class 2606 OID 77989)
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- TOC entry 4899 (class 2606 OID 77888)
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- TOC entry 4901 (class 2606 OID 77886)
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- TOC entry 4897 (class 2606 OID 77880)
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4941 (class 2606 OID 78016)
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- TOC entry 4875 (class 2606 OID 77649)
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id_empleado);


--
-- TOC entry 4869 (class 2606 OID 77600)
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (numerohabitacion);


--
-- TOC entry 4865 (class 2606 OID 77594)
-- Name: huesped huesped_id_unico_huesped_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.huesped
    ADD CONSTRAINT huesped_id_unico_huesped_key UNIQUE (id_unico_huesped);


--
-- TOC entry 4867 (class 2606 OID 77592)
-- Name: huesped huesped_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.huesped
    ADD CONSTRAINT huesped_pkey PRIMARY KEY (id_huesped);


--
-- TOC entry 4879 (class 2606 OID 77690)
-- Name: ingredientes ingredientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes
    ADD CONSTRAINT ingredientes_pkey PRIMARY KEY (id_ingredientes);


--
-- TOC entry 4887 (class 2606 OID 77726)
-- Name: movimientosstock movimientosstock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientosstock
    ADD CONSTRAINT movimientosstock_pkey PRIMARY KEY (id_movimiento);


--
-- TOC entry 4895 (class 2606 OID 77808)
-- Name: ordenelementos ordenelementos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenelementos
    ADD CONSTRAINT ordenelementos_pkey PRIMARY KEY (id_elemento);


--
-- TOC entry 4891 (class 2606 OID 77749)
-- Name: ordenes ordenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_pkey PRIMARY KEY (id_orden);


--
-- TOC entry 4873 (class 2606 OID 77630)
-- Name: registroestancias registroestancias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroestancias
    ADD CONSTRAINT registroestancias_pkey PRIMARY KEY (id_registro);


--
-- TOC entry 4889 (class 2606 OID 77739)
-- Name: registromovimientos registromovimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registromovimientos
    ADD CONSTRAINT registromovimientos_pkey PRIMARY KEY (id_registro);


--
-- TOC entry 4893 (class 2606 OID 77774)
-- Name: registroordenes registroordenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroordenes
    ADD CONSTRAINT registroordenes_pkey PRIMARY KEY (id_registro);


--
-- TOC entry 4881 (class 2606 OID 77858)
-- Name: ingredientes unique_nombre_ingrediente; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ingredientes
    ADD CONSTRAINT unique_nombre_ingrediente UNIQUE (nombre);


--
-- TOC entry 4907 (class 1259 OID 78009)
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- TOC entry 4912 (class 1259 OID 77950)
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- TOC entry 4915 (class 1259 OID 77951)
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- TOC entry 4902 (class 1259 OID 77936)
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- TOC entry 4923 (class 1259 OID 77966)
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- TOC entry 4926 (class 1259 OID 77965)
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- TOC entry 4929 (class 1259 OID 77980)
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- TOC entry 4932 (class 1259 OID 77979)
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- TOC entry 4920 (class 1259 OID 78004)
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- TOC entry 4935 (class 1259 OID 78000)
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- TOC entry 4938 (class 1259 OID 78001)
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- TOC entry 4939 (class 1259 OID 78018)
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- TOC entry 4942 (class 1259 OID 78017)
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- TOC entry 4974 (class 2620 OID 77834)
-- Name: asignacioneshuespedes trigger_actualizar_estado_habitacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_estado_habitacion AFTER INSERT OR UPDATE ON public.asignacioneshuespedes FOR EACH ROW EXECUTE FUNCTION public.actualizar_estado_habitacion();


--
-- TOC entry 4981 (class 2620 OID 77828)
-- Name: movimientosstock trigger_actualizar_stock_ingredientes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_stock_ingredientes AFTER INSERT ON public.movimientosstock FOR EACH ROW EXECUTE FUNCTION public.actualizar_stock_ingredientes();


--
-- TOC entry 4978 (class 2620 OID 78180)
-- Name: cocktailingredientes trigger_actualizar_version_cocktail; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_version_cocktail AFTER INSERT OR DELETE OR UPDATE ON public.cocktailingredientes FOR EACH ROW EXECUTE FUNCTION public.actualizar_version_cocktail();


--
-- TOC entry 4983 (class 2620 OID 121176)
-- Name: ordenelementos trigger_actualizar_version_cocktail_en_orden; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_actualizar_version_cocktail_en_orden BEFORE INSERT ON public.ordenelementos FOR EACH ROW EXECUTE FUNCTION public.actualizar_version_cocktail_en_orden();


--
-- TOC entry 4979 (class 2620 OID 77830)
-- Name: cocktailingredientes trigger_controlar_version_cocktailingredientes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_controlar_version_cocktailingredientes BEFORE INSERT OR UPDATE ON public.cocktailingredientes FOR EACH ROW EXECUTE FUNCTION public.controlar_version_cocktailingredientes();


--
-- TOC entry 4972 (class 2620 OID 121229)
-- Name: huesped trigger_evitar_modificacion_activa; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_evitar_modificacion_activa BEFORE UPDATE OF activo ON public.huesped FOR EACH ROW EXECUTE FUNCTION public.evitar_modificacion_activa();


--
-- TOC entry 4975 (class 2620 OID 121217)
-- Name: asignacioneshuespedes trigger_validar_asignacion_activa; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validar_asignacion_activa BEFORE INSERT OR UPDATE ON public.asignacioneshuespedes FOR EACH ROW EXECUTE FUNCTION public.validar_asignacion_activa();


--
-- TOC entry 4982 (class 2620 OID 121219)
-- Name: ordenes trigger_validar_orden_activa; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validar_orden_activa BEFORE INSERT OR UPDATE ON public.ordenes FOR EACH ROW EXECUTE FUNCTION public.validar_orden_activa();


--
-- TOC entry 4984 (class 2620 OID 77832)
-- Name: ordenelementos trigger_validar_orden_elemento; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_validar_orden_elemento BEFORE INSERT ON public.ordenelementos FOR EACH ROW EXECUTE FUNCTION public.validar_orden_elemento();


--
-- TOC entry 4977 (class 2620 OID 77826)
-- Name: ingredientes trigger_verificar_dependencias_antes_de_desactivar; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_verificar_dependencias_antes_de_desactivar BEFORE UPDATE ON public.ingredientes FOR EACH ROW WHEN (((new.activo = false) AND (old.activo = true))) EXECUTE FUNCTION public.verificar_dependencias_antes_de_desactivar();


--
-- TOC entry 4973 (class 2620 OID 77838)
-- Name: habitaciones trigger_verificar_habitacion_ocupada; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_verificar_habitacion_ocupada BEFORE UPDATE ON public.habitaciones FOR EACH ROW EXECUTE FUNCTION public.verificar_habitacion_ocupada();


--
-- TOC entry 4976 (class 2620 OID 77840)
-- Name: asignacioneshuespedes trigger_verificar_ocupacion_habitacion; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_verificar_ocupacion_habitacion BEFORE INSERT ON public.asignacioneshuespedes FOR EACH ROW EXECUTE FUNCTION public.verificar_ocupacion_habitacion();


--
-- TOC entry 4980 (class 2620 OID 77836)
-- Name: cocktailingredientes trigger_verificar_receta_cocktail; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_verificar_receta_cocktail AFTER INSERT OR DELETE OR UPDATE ON public.cocktailingredientes FOR EACH ROW EXECUTE FUNCTION public.verificar_receta_cocktail();


--
-- TOC entry 4943 (class 2606 OID 77611)
-- Name: asignacioneshuespedes asignacioneshuespedes_id_huesped_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacioneshuespedes
    ADD CONSTRAINT asignacioneshuespedes_id_huesped_fkey FOREIGN KEY (id_huesped) REFERENCES public.huesped(id_huesped) ON DELETE CASCADE;


--
-- TOC entry 4944 (class 2606 OID 77616)
-- Name: asignacioneshuespedes asignacioneshuespedes_numerohabitacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asignacioneshuespedes
    ADD CONSTRAINT asignacioneshuespedes_numerohabitacion_fkey FOREIGN KEY (numerohabitacion) REFERENCES public.habitaciones(numerohabitacion) ON DELETE CASCADE;


--
-- TOC entry 4964 (class 2606 OID 77945)
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4965 (class 2606 OID 77940)
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4963 (class 2606 OID 77931)
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4966 (class 2606 OID 77960)
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4967 (class 2606 OID 77955)
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4968 (class 2606 OID 77974)
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4969 (class 2606 OID 77969)
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4947 (class 2606 OID 77709)
-- Name: cocktailingredientes cocktailingredientes_id_cocktail_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cocktailingredientes
    ADD CONSTRAINT cocktailingredientes_id_cocktail_fkey FOREIGN KEY (id_cocktail) REFERENCES public.cocktail(id_cocktail);


--
-- TOC entry 4948 (class 2606 OID 77714)
-- Name: cocktailingredientes cocktailingredientes_id_ingredientes_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cocktailingredientes
    ADD CONSTRAINT cocktailingredientes_id_ingredientes_fkey FOREIGN KEY (id_ingredientes) REFERENCES public.ingredientes(id_ingredientes);


--
-- TOC entry 4970 (class 2606 OID 77990)
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4971 (class 2606 OID 77995)
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- TOC entry 4951 (class 2606 OID 77863)
-- Name: ordenes fk_huesped_orden; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT fk_huesped_orden FOREIGN KEY (id_asignacion) REFERENCES public.asignacioneshuespedes(id_asignacion) ON DELETE RESTRICT;


--
-- TOC entry 4950 (class 2606 OID 77868)
-- Name: registromovimientos fk_movimiento_orden; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registromovimientos
    ADD CONSTRAINT fk_movimiento_orden FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden) ON DELETE SET NULL;


--
-- TOC entry 4949 (class 2606 OID 77727)
-- Name: movimientosstock movimientosstock_id_ingrediente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientosstock
    ADD CONSTRAINT movimientosstock_id_ingrediente_fkey FOREIGN KEY (id_ingredientes) REFERENCES public.ingredientes(id_ingredientes) ON DELETE CASCADE;


--
-- TOC entry 4960 (class 2606 OID 77819)
-- Name: ordenelementos ordenelementos_id_cocktail_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenelementos
    ADD CONSTRAINT ordenelementos_id_cocktail_fkey FOREIGN KEY (id_cocktail) REFERENCES public.cocktail(id_cocktail) ON DELETE CASCADE;


--
-- TOC entry 4961 (class 2606 OID 77814)
-- Name: ordenelementos ordenelementos_id_ingrediente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenelementos
    ADD CONSTRAINT ordenelementos_id_ingrediente_fkey FOREIGN KEY (id_ingredientes) REFERENCES public.ingredientes(id_ingredientes) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 77809)
-- Name: ordenelementos ordenelementos_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenelementos
    ADD CONSTRAINT ordenelementos_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden) ON DELETE CASCADE;


--
-- TOC entry 4952 (class 2606 OID 77750)
-- Name: ordenes ordenes_id_asignacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_id_asignacion_fkey FOREIGN KEY (id_asignacion) REFERENCES public.asignacioneshuespedes(id_asignacion) ON DELETE CASCADE;


--
-- TOC entry 4953 (class 2606 OID 77755)
-- Name: ordenes ordenes_id_bar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_id_bar_fkey FOREIGN KEY (id_bar) REFERENCES public.bares(id_bar);


--
-- TOC entry 4954 (class 2606 OID 77760)
-- Name: ordenes ordenes_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ordenes
    ADD CONSTRAINT ordenes_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.empleados(id_empleado);


--
-- TOC entry 4945 (class 2606 OID 77631)
-- Name: registroestancias registroestancias_id_huesped_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroestancias
    ADD CONSTRAINT registroestancias_id_huesped_fkey FOREIGN KEY (id_huesped) REFERENCES public.huesped(id_huesped) ON DELETE CASCADE;


--
-- TOC entry 4946 (class 2606 OID 77636)
-- Name: registroestancias registroestancias_numerohabitacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroestancias
    ADD CONSTRAINT registroestancias_numerohabitacion_fkey FOREIGN KEY (numerohabitacion) REFERENCES public.habitaciones(numerohabitacion) ON DELETE CASCADE;


--
-- TOC entry 4955 (class 2606 OID 77790)
-- Name: registroordenes registroordenes_id_bar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroordenes
    ADD CONSTRAINT registroordenes_id_bar_fkey FOREIGN KEY (id_bar) REFERENCES public.bares(id_bar);


--
-- TOC entry 4956 (class 2606 OID 77795)
-- Name: registroordenes registroordenes_id_empleado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroordenes
    ADD CONSTRAINT registroordenes_id_empleado_fkey FOREIGN KEY (id_empleado) REFERENCES public.empleados(id_empleado);


--
-- TOC entry 4957 (class 2606 OID 77775)
-- Name: registroordenes registroordenes_id_huesped_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroordenes
    ADD CONSTRAINT registroordenes_id_huesped_fkey FOREIGN KEY (id_huesped) REFERENCES public.huesped(id_huesped);


--
-- TOC entry 4958 (class 2606 OID 77785)
-- Name: registroordenes registroordenes_id_orden_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroordenes
    ADD CONSTRAINT registroordenes_id_orden_fkey FOREIGN KEY (id_orden) REFERENCES public.ordenes(id_orden) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 77780)
-- Name: registroordenes registroordenes_numerohabitacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.registroordenes
    ADD CONSTRAINT registroordenes_numerohabitacion_fkey FOREIGN KEY (numerohabitacion) REFERENCES public.habitaciones(numerohabitacion);


-- Completed on 2025-02-12 20:52:53

--
-- PostgreSQL database dump complete
--

