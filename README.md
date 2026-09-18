# Secretaría Distrital de Movilidad de Bogotá - Prototipo SPA (Jurisdicción Coactiva)

Prototipo funcional de Aplicación Web de Página Única (SPA) para la **Secretaría Distrital de Movilidad de Bogotá (SDM)**, adaptado estrictamente al formato oficial de la **Subdirección de Jurisdicción Coactiva** (Cra. 28A No. 17 A 20) para la radicación virtual de trámites de **Cobro Coactivo, Embargos, Depósitos Judiciales y Comparendos**.

Diseñado con una estética institucional moderna, limpia y responsiva que adopta la paleta oficial de la **Alcaldía Mayor de Bogotá**, lineamientos de Gobierno Digital (Gov.co) y componentes de prevención ciudadana contra el uso de tramitadores.

---

## 🏛️ Características Principales

### 1. Módulo 1: Datos Generales del Ciudadano (Formulario Base)
- **Tipos de Solicitante:** Soporta Persona Natural (Ciudadano), Persona Jurídica (Empresa con Razón Social) y Solicitud Anónima.
- **Asistente de Nomenclatura Urbana:** Constructor estructurado de direcciones (Vía Principal, Número, Letra, Generador, Placa y Complemento) con previsualización y sincronización automática.
- **Validación Reactiva de Correo:** Compara en tiempo real el correo principal y su confirmación con feedback visual instantáneo (verde/rojo).
- **Ubicación Geográfica:** Configuración por defecto de Bogotá D.C. (América, Colombia, Bogotá D.C.).
- **Botón de Autollenado:** Función *"Autollenar datos de prueba"* para validación y testing ágil de todo el flujo.

### 2. Módulo 2: Selector de Trámites Oficiales de Jurisdicción Coactiva
- **Control de Acceso y Barrera de Validación:** Permanece bloqueado hasta completar los campos obligatorios del Módulo 1.
- **Selección Múltiple Concurrente:** Selector interactivo que permite activar simultáneamente uno, dos o los tres trámites oficiales de Coactiva mediante casillas de verificación:
  1. `[✓] 1. Solicitud de Desembargo`
  2. `[✓] 2. Solicitud Entrega de Título de Depósito Judicial`
  3. `[✓] 3. Solicitud de Apropiación de Depósito Judicial`
- **Área Alternativa de Prescripciones:** Selección independiente para trámites de prescripción de comparendos (Ley 769 de 2002 / CNT).
- **Badges de Confianza:** Etiqueta `Trámite 100% gratuito y en línea` visible en todas las opciones.

### 3. Módulo 3: Formularios Específicos Basados en el Formato Oficial de Coactiva
- **Autollenado Reactivo (`Dato heredado`):** Banner superior que refleja en tiempo real nombre, documento, correo, teléfono y dirección del solicitante.
- **1. Solicitud de Desembargo:**
  - **Calidad del Solicitante:** Selector entre `Solicitante directo / Propietario` y `Apoderado` (despliega campo para nombre del poderdante y carga de poder autenticado en PDF).
  - **Declaración Formal Precargada:** Texto legal dinámico adaptado a la calidad del solicitante y su documento.
  - **Tabla Dinámica de Bienes Embargados:** Permite agregar o eliminar múltiples filas de bienes con tipo (`Vehículo`, `Inmueble`, `Cuenta bancaria`, `Salario / Honorarios`, `Otro`), identificación y ciudad de registro o entidad bancaria/empleador.
  - **Requisitos Específicos:** Carga obligatoria de fotocopia de la cédula del propietario y volante de pago cancelado (PDF/JPG/PNG, máx 5 MB).
  - **Nota de Términos:** Recordatorio oficial de consulta de estado a los 15 días hábiles en el portal web.
- **2. Solicitud Entrega de Título de Depósito Judicial:**
  - Declaración formal precargada de entrega de título.
  - Captura del número de depósito judicial y entidad bancaria o juzgado/cuenta origen.
  - Carga obligatoria del soporte del título o recibo de consignación (PDF).
- **3. Solicitud de Apropiación de Depósito Judicial:**
  - Declaración formal precargada de autorización de aplicación de fondos a la deuda distrital.
  - Obligación o número(s) de comparendo / proceso coactivo al que se aplicará el valor.
  - Carga obligatoria de autorización y soporte de consignación (PDF).

### 4. Módulo 4: Vista Previa del Oficio Formal y Radicación
- **Modal de Vista Previa del Oficio:**
  - Renderiza el documento formal en hoja membretada dirigido a:
    ```text
    Señores
    SUBDIRECCIÓN DE JURISDICCIÓN COACTIVA
    SECRETARÍA DISTRITAL DE MOVILIDAD - BOGOTÁ (Cra. 28A No. 17 A 20)
    Asunto: SOLICITUD ANTE JURISDICCIÓN COACTIVA
    Fecha: [Fecha actual en Bogotá]
    ```
  - Bloques dinámicos de los trámites activos con la tabla de bienes estructurada.
  - Alerta institucional de transparencia y trámite directo sin intermediarios.
  - Consolidado de datos del solicitante y espacio de **FIRMA** formal.
  - Soporte de impresión oficial y exportación a PDF vía `@media print`.
- **Radicación Oficial y Constancia Digital:**
  - Generación de radicado institucional simulado: `SDM-2026-ER-[6 dígitos]`.
  - Resumen consolidado con sello de tiempo y listado de anexos.
  - Opción de impresión de la constancia oficial de radicación.

---

## 🛡️ Campaña de Sensibilización: "Trámites Directos y Sin Intermediarios"

Con el fin de prevenir fraudes, cobros indebidos y proteger los datos personales del ciudadano, la aplicación integra:
- **Banner Institucional Destacado:** Visible al abrir la sección de Cobro / Coactiva y reforzado dentro del oficio formal con 4 pilares:
  1. **Cero costos de gestión:** Todos los trámites son 100% gratuitos.
  2. **No pague por agilizar:** Ningún tramitador externo puede acelerar las decisiones jurídicas de la Subdirección de Jurisdicción Coactiva.
  3. **Seguridad de datos:** Evita el riesgo de entregar información sensible a terceros.
  4. **Canal oficial de seguimiento:** Consulta gratuita a los 15 días hábiles en www.movilidadbogota.gov.co.
- **Declaración Ciudadana Obligatoria:** Casilla de confirmación en el modal de radicación:
  > *`[✓] Entiendo que este trámite es gratuito y que la radicación se realiza de manera directa ante la Secretaría Distrital de Movilidad, sin intervención de terceros cobradores o tramitadores.`*

---

## 💻 Pila Tecnológica

- **HTML5** Semántico y accesible (WAI-ARIA).
- **Tailwind CSS** (vía CDN) con paleta oficial de Bogotá (`#002855`, `#005C8A`, `#FDC300`, `#DA291C`).
- **FontAwesome 6** (vía CDN) para iconografía institucional y sellos de seguridad.
- **JavaScript Vanilla Modular:** Gestión reactiva con `Store` centralizado, sin dependencias pesadas ni compilación.
- **Yarn:** Gestor de paquetes y servidor local (`serve`).

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
├── README.md           # Documentación completa del proyecto
├── package.json        # Configuración de dependencias y scripts de Yarn
├── yarn.lock           # Lockfile determinista de dependencias
├── index.html          # Vista principal semántica, WAI-ARIA y modales
├── styles.css          # Estilos institucionales, animaciones, hoja de oficio y @media print
└── app.js              # Lógica reactiva en JavaScript Vanilla modular
```

---

## 📜 Licencia y Uso
Prototipo desarrollado con fines demostrativos y de evaluación para la **Secretaría Distrital de Movilidad de Bogotá (SDM)**.
Distribuido bajo la Licencia MIT.
