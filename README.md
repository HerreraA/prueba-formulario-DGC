# Secretaría Distrital de Movilidad de Bogotá - Prototipo SPA (DGC)

Prototipo funcional de Aplicación Web de Página Única (SPA) para la **Secretaría Distrital de Movilidad de Bogotá (SDM)**, orientado a la radicación virtual de trámites de **Cobro Coactivo y Comparendos** (Desembargos y Prescripciones).

Diseñado con una estética institucional moderna, limpia y responsiva que adopta la paleta oficial de la **Alcaldía Mayor de Bogotá** y lineamientos de Gobierno Digital (Gov.co).

---

## 🏛️ Características Principales

### 1. Módulo 1: Datos Generales del Ciudadano (Formulario Base)
- **Tipos de Solicitante:** Soporta Persona Natural (Ciudadano), Persona Jurídica (Empresa con Razón Social) y Solicitud Anónima.
- **Asistente de Nomenclatura Urbana:** Constructor estructurado de direcciones (Vía Principal, Número, Letra, Generador, Placa y Complemento) con previsualización y sincronización automática.
- **Validación Reactiva de Correo:** Validación de coincidencia en tiempo real entre el correo y su confirmación con feedback visual inmediato (verde/rojo).
- **Ubicación Geográfica:** Configuración por defecto de Bogotá D.C. (América, Colombia, Bogotá D.C.).
- **Botón de Autollenado:** Incluye la función *"Autollenar datos de prueba"* para agilizar revisiones funcionales.

### 2. Módulo 2: Selector de Trámite Especializado
- **Barrera de Validación:** Permanece bloqueado mientras los campos obligatorios del Módulo 1 no estén completos, mostrando un resumen dinámico de los datos faltantes.
- **Activación:** Al completar los datos base, se habilita el botón destacado **"Cobro / Comparendos"**, desplegando un menú con dos opciones:
  1. **Desembargos** (Cuentas bancarias y vehículos afectados por medidas cautelares).
  2. **Prescripciones** (Sanciones y comparendos conforme a la Ley 769 de 2002).

### 3. Módulo 3: Formularios Específicos con Autollenado Reactivo
- **Sincronización en Tiempo Real (`Dato heredado`):** Banner superior que refleja de forma instantánea el nombre, documento, correo, teléfono y dirección del solicitante con el badge institucional `Dato heredado del Módulo 1`.
- **Desembargos:**
  - Número de resolución o medida cautelar.
  - Catálogo de entidades bancarias en Colombia.
  - Número de cuenta o placa del bien embargado.
  - Justificación breve con contador dinámico de caracteres (0 a 600).
  - Zona Dropzone con soporte de arrastrar y soltar para **Certificación Bancaria** (PDF, JPG, PNG; máx 5 MB).
- **Prescripciones:**
  - Número de comparendo / sanción.
  - Selector de fecha con cálculo dinámico de antigüedad en años respecto a los 3 años mínimos exigidos por el Art. 159 del CNT.
  - Placa del vehículo asociada.
  - Causales normativas de prescripción (Ley 769 / CPACA).
  - Zona Dropzone con restricción estricta de ley: **Únicamente formato PDF** (máx 5 MB).

### 4. Módulo 4: Radicación Oficial y Constancia Imprimible
- **Validación Estricta de Archivos:** Rechazo automático y alertas descriptivas ante extensiones no autorizadas o archivos que superen los 5 MB.
- **Generación de Radicado Oficial:** Código simulado con estándar institucional: `SDM-2026-ER-[6 dígitos]`.
- **Modal de Confirmación Institucional:** Resumen consolidado del ciudadano, detalle del trámite y listado de anexos recibidos.
- **Soporte de Impresión Oficial (`@media print`):** Botón *"Descargar / Imprimir Constancia"* que genera una certificación membretada con sello digital y sello de tiempo lista para guardar como PDF.

---

## 💻 Pila Tecnológica

- **HTML5** Semántico y accesible (WAI-ARIA).
- **Tailwind CSS** (vía CDN) con paleta personalizada:
  - Azul Institucional SDM: `#002855`
  - Azul Secundario: `#005C8A`
  - Amarillo Bogotá: `#FDC300`
  - Rojo Bogotá: `#DA291C`
- **FontAwesome 6** (vía CDN) para iconografía institucional.
- **JavaScript Vanilla Modular:** Gestión de estado centralizada (`Store`), sin frameworks pesados ni dependencias complejas.
- **Yarn:** Gestor de paquetes y ejecutor del servidor local (`serve`).

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) (v16 o superior).
- [Yarn](https://yarnpkg.com/) (v1.22+).

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/HerreraA/prueba-formulario-DGC.git
   cd prueba-formulario-DGC
   ```

2. **Instalar dependencias:**
   ```bash
   yarn install
   ```

3. **Iniciar el servidor local:**
   ```bash
   yarn start
   # o alternativamente:
   yarn serve
   ```

4. **Abrir en el navegador:**
   Accede a [http://localhost:8000](http://localhost:8000).

---

## 📂 Estructura del Proyecto

```text
prueba-formulario-DGC/
├── .gitignore          # Exclusión de node_modules y logs
├── README.md           # Documentación general del proyecto
├── package.json        # Configuración de dependencias y scripts de Yarn
├── yarn.lock           # Lockfile de dependencias
├── index.html          # Vista principal semántica y accesible
├── styles.css          # Estilos institucionales, animaciones y @media print
└── app.js              # Controlador reactivo en JavaScript Vanilla
```

---

## 📜 Licencia y Uso
Prototipo desarrollado con fines demostrativos y de evaluación para la **Secretaría Distrital de Movilidad de Bogotá (SDM)**.
Distribuido bajo la Licencia MIT.
