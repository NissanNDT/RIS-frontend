# RIS - Frontend (React + Vite)

Este es el frontend de la plataforma **RIS** (Reporte de Incidentes y Seguridad), una aplicación web moderna diseñada para registrar, auditar e investigar incidentes de seguridad en el entorno laboral.

## Tecnologías y Librerías Utilizadas

- **Framework**: React 19 (utilizando Javascript y Vite como empaquetador ultrarrápido).
- **Enrutamiento**: React Router DOM (v7) para una experiencia de SPA (Single Page Application).
- **Librería HTTP**: Axios para realizar llamadas y transferencias de archivos con el backend.
- **Iconografía**: React Icons (`react-icons`).
- **Base de Datos Directa / Auth**: Supabase JS SDK (`@supabase/supabase-js`) para almacenamiento de recursos.
- **Procesamiento de Archivos**: `xlsx` y `xlsx-js-style` para la importación, exportación y formateo de plantillas de cálculo Excel en el lado del cliente.
- **Estilos**: CSS modular y diseño responsivo para diferentes dispositivos.

---

## Estructura del Proyecto

```text
frontend/
├── src/
│   ├── api/                   # Configuración del cliente HTTP (Axios)
│   ├── assets/                # Imágenes y recursos estáticos
│   ├── components/            # Componentes reutilizables de la interfaz de usuario (UI)
│   ├── config/                # Configuraciones globales y conexiones de Supabase
│   ├── pages/                 # Vistas principales del sistema (páginas completas)
│   │   ├── Login.jsx                 # Pantalla de inicio de sesión
│   │   ├── Homepage.jsx              # Panel principal o Dashboard
│   │   ├── Auditorias.jsx            # Gestión de auditorías
│   │   ├── DetalleAuditoria.jsx      # Detalle y carga de hallazgos por auditoría
│   │   ├── AdminHallazgos.jsx        # Panel de administración de hallazgos
│   │   ├── ReporteDeHallazgos.jsx    # Generación de reportes de hallazgos
│   │   ├── HallazgosQueReporte.jsx   # Listado personal de hallazgos reportados
│   │   ├── AdminIncidentes.jsx       # Panel de administración de incidentes
│   │   ├── LlenadoFormatoIncidente.jsx # Formulario detallado de investigación de incidente
│   │   └── ReporteDeIncidentes.jsx   # Listado y reportes de incidentes
│   ├── services/              # Abstracción de servicios de API (peticiones organizadas)
│   ├── styles/                # Estilos globales y específicos del diseño visual
│   ├── utils/                 # Funciones de utilidad común
│   ├── App.jsx                # Enrutador principal y estructura de rutas protegidas
│   └── main.jsx               # Punto de entrada de renderizado de React
├── index.html                 # Plantilla HTML base
├── vite.config.js             # Configuración del compilador Vite
├── .env.local                 # Variables de entorno locales
└── README.md                  # Este archivo
```

---

## Configuración del Entorno

Para conectar el frontend con la base de datos y la API REST, crea un archivo `.env.local` en la raíz de la carpeta `frontend` con el siguiente contenido:

```env
VITE_API_URL=https://tu-api-backend.com/api    # URL de tu API del backend (Express o FastAPI)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_publica_anonima_supabase
```

---

## Instalación y Ejecución

1. **Instalar Dependencias**:
   Asegúrate de estar dentro del directorio `frontend` y ejecuta:
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación se abrirá en [http://localhost:5173](http://localhost:5173) por defecto.

3. **Compilar para Producción**:
   ```bash
   npm run build
   ```
   Esto generará una carpeta `dist/` optimizada y lista para desplegarse en plataformas como Vercel o Netlify.

---

## Rutas y Control de Acceso

La aplicación cuenta con un sistema de rutas que diferencia entre usuarios invitados y usuarios autenticados:
- **Páginas Protegidas**: Requieren inicio de sesión. Si el usuario no tiene una sesión activa (administrada con JWT en cookies o localStorage), será redirigido automáticamente a `/login`.
- **Navegación Intuitiva**: El panel lateral de navegación (Sidebar) se adapta de acuerdo al rol del usuario, mostrando únicamente los módulos a los que tiene acceso permitido (incidentes, auditorías, administración, etc.).
