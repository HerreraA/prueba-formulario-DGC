/**
 * ==============================================================================
 * Portal de Radicación Virtual de Trámites - Secretaría Distrital de Movilidad
 * JavaScript Vanilla Modular con Gestión de Estado Reactivo
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// 1. ESTADO CENTRAL DE LA APLICACIÓN (STORE)
// ------------------------------------------------------------------------------
const Store = {
  citizen: {
    solicitanteTipo: 'ciudadano',
    documentoTipo: 'CC',
    documentoNumero: '',
    nombres: '',
    primerApellido: '',
    segundoApellido: '',
    razonSocial: '',
    telefono: '',
    correo: '',
    correoConfirmacion: '',
    dirVia: 'Calle',
    dirNum1: '',
    dirLetra1: '',
    dirNum2: '',
    dirNum3: '',
    dirComplemento: '',
    direccionCompleta: '',
    departamento: 'Bogotá D.C.',
    municipio: 'Bogotá D.C.'
  },
  tramite: {
    selected: null, // 'desembargo' | 'prescripcion'
    desembargo: {
      resolucion: '',
      entidad: '',
      cuentaBien: '',
      justificacion: '',
      archivo: null
    },
    prescripcion: {
      comparendo: '',
      fecha: '',
      placa: '',
      causal: '',
      archivo: null
    }
  },
  isModule1Valid: false,
  isCobroMenuOpen: false,
  lastRadicacion: null
};

// ------------------------------------------------------------------------------
// 2. UTILIDADES Y FORMATEADORES
// ------------------------------------------------------------------------------
const Utils = {
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getCurrentDateTimeString() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  },

  generateRadicadoNumber() {
    const randomSixDigits = Math.floor(100000 + Math.random() * 900000);
    return `SDM-2026-ER-${randomSixDigits}`;
  },

  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }
};

// ------------------------------------------------------------------------------
// 3. CONSTRUCTOR DE DIRECCIÓN COLOMBIANA
// ------------------------------------------------------------------------------
const AddressBuilder = {
  init() {
    const fields = ['dir_via', 'dir_num1', 'dir_letra1', 'dir_num2', 'dir_num3', 'dir_complemento'];
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.generate());
        el.addEventListener('change', () => this.generate());
      }
    });

    const syncBtn = document.getElementById('btn-sync-address');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.generate());
    }

    const dirCompletaInput = document.getElementById('direccion_completa');
    if (dirCompletaInput) {
      dirCompletaInput.addEventListener('input', (e) => {
        Store.citizen.direccionCompleta = e.target.value.trim();
        UIController.updateInheritedFields();
        Validators.validateModule1();
      });
    }
  },

  generate() {
    const via = document.getElementById('dir_via').value;
    const num1 = document.getElementById('dir_num1').value.trim();
    const letra1 = document.getElementById('dir_letra1').value.trim();
    const num2 = document.getElementById('dir_num2').value.trim();
    const num3 = document.getElementById('dir_num3').value.trim();
    const complemento = document.getElementById('dir_complemento').value.trim();

    Store.citizen.dirVia = via;
    Store.citizen.dirNum1 = num1;
    Store.citizen.dirLetra1 = letra1;
    Store.citizen.dirNum2 = num2;
    Store.citizen.dirNum3 = num3;
    Store.citizen.dirComplemento = complemento;

    let parts = [];
    if (via) parts.push(via);
    if (num1) parts.push(num1);
    if (letra1) parts.push(letra1);
    if (num2 || num3) {
      parts.push('#');
      if (num2) parts.push(num2);
      if (num3) parts.push(`- ${num3}`);
    }
    if (complemento) parts.push(complemento);

    const generated = parts.join(' ').trim();
    const inputDireccion = document.getElementById('direccion_completa');
    if (inputDireccion) {
      inputDireccion.value = generated;
      Store.citizen.direccionCompleta = generated;
    }

    UIController.updateInheritedFields();
    Validators.validateModule1();
  }
};

// ------------------------------------------------------------------------------
// 4. VALIDADORES REACTIVOS
// ------------------------------------------------------------------------------
const Validators = {
  validateModule1() {
    const c = Store.citizen;
    const errors = [];

    // Validar tipo de solicitante y nombres
    if (c.solicitanteTipo === 'empresa') {
      if (!c.razonSocial || c.razonSocial.trim().length < 3) {
        errors.push('Razón Social de la empresa');
      }
    } else if (c.solicitanteTipo === 'ciudadano') {
      if (!c.nombres || c.nombres.trim().length < 2) {
        errors.push('Nombres del solicitante');
      }
      if (!c.primerApellido || c.primerApellido.trim().length < 2) {
        errors.push('Primer Apellido');
      }
    } else {
      // Anónimo
      if (!c.nombres || c.nombres.trim().length < 2) {
        errors.push('Identificador del solicitante anónimo');
      }
    }

    // Documento
    if (!c.documentoNumero || c.documentoNumero.trim().length < 4) {
      errors.push('Número de Documento');
    }

    // Dirección
    if (!c.direccionCompleta || c.direccionCompleta.trim().length < 5) {
      errors.push('Dirección de correspondencia');
    }

    // Teléfono
    if (!c.telefono || c.telefono.trim().length < 7) {
      errors.push('Teléfono de contacto (mínimo 7 dígitos)');
    }

    // Correo y confirmación
    if (!c.correo || !Utils.isValidEmail(c.correo)) {
      errors.push('Correo electrónico válido');
    }
    if (!c.correoConfirmacion || c.correo.toLowerCase() !== c.correoConfirmacion.toLowerCase()) {
      errors.push('Confirmación exacta del correo electrónico');
    }

    const isValid = errors.length === 0;
    Store.isModule1Valid = isValid;

    UIController.updateModule1Status(isValid, errors);
    return isValid;
  },

  validateEmailMatch() {
    const correo = document.getElementById('correo_electronico').value.trim();
    const confirm = document.getElementById('correo_confirmacion').value.trim();
    const msgEl = document.getElementById('email-match-msg');
    const iconEl = document.getElementById('email-match-icon');
    const inputConfirm = document.getElementById('correo_confirmacion');

    if (!confirm) {
      msgEl.textContent = 'Debe coincidir exactamente con el correo';
      msgEl.className = 'text-[11px] text-slate-400 mt-0.5';
      iconEl.className = 'fa-solid fa-check-double';
      inputConfirm.classList.remove('border-red-500', 'border-emerald-500');
      return;
    }

    if (correo.toLowerCase() === confirm.toLowerCase()) {
      msgEl.textContent = '✓ Los correos electrónicos coinciden';
      msgEl.className = 'text-[11px] text-emerald-600 font-medium mt-0.5';
      iconEl.className = 'fa-solid fa-circle-check text-emerald-600';
      inputConfirm.classList.remove('border-red-500');
      inputConfirm.classList.add('border-emerald-500');
    } else {
      msgEl.textContent = '✗ Los correos no coinciden';
      msgEl.className = 'text-[11px] text-red-600 font-medium mt-0.5';
      iconEl.className = 'fa-solid fa-circle-xmark text-red-600';
      inputConfirm.classList.remove('border-emerald-500');
      inputConfirm.classList.add('border-red-500');
    }
  }
};

// ------------------------------------------------------------------------------
// 5. CONTROLADOR DE ARCHIVOS (DRAG AND DROP Y VALIDACIÓN ESTRICTA)
// ------------------------------------------------------------------------------
const FileController = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5 MB

  init() {
    this.setupDesembargoDropzone();
    this.setupPrescripcionDropzone();
  },

  setupDesembargoDropzone() {
    const dropzone = document.getElementById('dropzone-desembargo');
    const input = document.getElementById('file-input-desembargo');
    const removeBtn = document.getElementById('btn-remove-desembargo-file');

    if (!dropzone || !input) return;

    dropzone.addEventListener('click', () => input.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleDesembargoFile(files[0]);
      }
    });

    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleDesembargoFile(e.target.files[0]);
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        Store.tramite.desembargo.archivo = null;
        input.value = '';
        document.getElementById('desembargo-file-preview').classList.add('hidden');
        dropzone.classList.remove('hidden');
      });
    }
  },

  handleDesembargoFile(file) {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const fileName = file.name.toLowerCase();
    const isValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExt) {
      alert(`El archivo "${file.name}" no es permitido.\nPara Desembargos únicamente se admiten formatos PDF, JPG o PNG.`);
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      alert(`El archivo supera el límite permitido de 5 MB.\nTamaño actual: ${Utils.formatFileSize(file.size)}.`);
      return;
    }

    Store.tramite.desembargo.archivo = file;

    // Actualizar UI de previsualización
    const preview = document.getElementById('desembargo-file-preview');
    const dropzone = document.getElementById('dropzone-desembargo');
    document.getElementById('desembargo-file-name').textContent = file.name;
    document.getElementById('desembargo-file-size').textContent = Utils.formatFileSize(file.size);

    const iconContainer = document.getElementById('desembargo-file-icon');
    if (fileName.endsWith('.pdf')) {
      iconContainer.className = 'w-8 h-8 rounded bg-red-100 text-red-700 flex items-center justify-center text-base flex-shrink-0';
      iconContainer.innerHTML = '<i class="fa-solid fa-file-pdf"></i>';
    } else {
      iconContainer.className = 'w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-base flex-shrink-0';
      iconContainer.innerHTML = '<i class="fa-solid fa-file-image"></i>';
    }

    dropzone.classList.add('hidden');
    preview.classList.remove('hidden');
  },

  setupPrescripcionDropzone() {
    const dropzone = document.getElementById('dropzone-prescripcion');
    const input = document.getElementById('file-input-prescripcion');
    const removeBtn = document.getElementById('btn-remove-prescripcion-file');

    if (!dropzone || !input) return;

    dropzone.addEventListener('click', () => input.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handlePrescripcionFile(files[0]);
      }
    });

    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handlePrescripcionFile(e.target.files[0]);
      }
    });

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        Store.tramite.prescripcion.archivo = null;
        input.value = '';
        document.getElementById('prescripcion-file-preview').classList.add('hidden');
        dropzone.classList.remove('hidden');
      });
    }
  },

  handlePrescripcionFile(file) {
    const fileName = file.name.toLowerCase();

    // Restricción estricta de ley: Solo PDF
    if (!fileName.endsWith('.pdf')) {
      alert(`Restricción legal estricta:\nPara el trámite de Prescripciones únicamente se admiten expedientes y pruebas en formato PDF.\nEl archivo "${file.name}" fue rechazado.`);
      return;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      alert(`El archivo supera el límite permitido de 5 MB.\nTamaño actual: ${Utils.formatFileSize(file.size)}.`);
      return;
    }

    Store.tramite.prescripcion.archivo = file;

    const preview = document.getElementById('prescripcion-file-preview');
    const dropzone = document.getElementById('dropzone-prescripcion');
    document.getElementById('prescripcion-file-name').textContent = file.name;
    document.getElementById('prescripcion-file-size').textContent = Utils.formatFileSize(file.size);

    dropzone.classList.add('hidden');
    preview.classList.remove('hidden');
  }
};

// ------------------------------------------------------------------------------
// 6. CONTROLADOR DE INTERFAZ DE USUARIO (UI CONTROLLER)
// ------------------------------------------------------------------------------
const UIController = {
  init() {
    this.bindModule1Inputs();
    this.bindCobroSelector();
    this.bindTramiteCards();
    this.bindRadicacionActions();
    this.bindModalActions();
    this.bindQuickFill();
    this.startClock();
  },

  startClock() {
    const update = () => {
      const el = document.getElementById('current-datetime');
      if (el) el.textContent = Utils.getCurrentDateTimeString();
    };
    update();
    setInterval(update, 1000);
  },

  bindModule1Inputs() {
    const tipoSol = document.getElementById('solicitante_tipo');
    tipoSol.addEventListener('change', (e) => {
      Store.citizen.solicitanteTipo = e.target.value;
      const naturalDiv = document.getElementById('persona-natural-fields');
      const juridicaDiv = document.getElementById('persona-juridica-fields');
      if (e.target.value === 'empresa') {
        naturalDiv.classList.add('hidden');
        juridicaDiv.classList.remove('hidden');
      } else {
        naturalDiv.classList.remove('hidden');
        juridicaDiv.classList.add('hidden');
      }
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const docTipo = document.getElementById('documento_tipo');
    docTipo.addEventListener('change', (e) => {
      Store.citizen.documentoTipo = e.target.value;
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const docNum = document.getElementById('documento_numero');
    docNum.addEventListener('input', (e) => {
      Store.citizen.documentoNumero = e.target.value.trim();
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const nombres = document.getElementById('nombres');
    nombres.addEventListener('input', (e) => {
      Store.citizen.nombres = e.target.value.trim();
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const ap1 = document.getElementById('primer_apellido');
    ap1.addEventListener('input', (e) => {
      Store.citizen.primerApellido = e.target.value.trim();
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const ap2 = document.getElementById('segundo_apellido');
    ap2.addEventListener('input', (e) => {
      Store.citizen.segundoApellido = e.target.value.trim();
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const razon = document.getElementById('razon_social');
    razon.addEventListener('input', (e) => {
      Store.citizen.razonSocial = e.target.value.trim();
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const tel = document.getElementById('telefono_contacto');
    tel.addEventListener('input', (e) => {
      Store.citizen.telefono = e.target.value.trim();
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const correo = document.getElementById('correo_electronico');
    correo.addEventListener('input', (e) => {
      Store.citizen.correo = e.target.value.trim();
      Validators.validateEmailMatch();
      this.updateInheritedFields();
      Validators.validateModule1();
    });

    const confirm = document.getElementById('correo_confirmacion');
    confirm.addEventListener('input', (e) => {
      Store.citizen.correoConfirmacion = e.target.value.trim();
      Validators.validateEmailMatch();
      Validators.validateModule1();
    });

    const depto = document.getElementById('ubicacion_depto');
    depto.addEventListener('change', (e) => {
      Store.citizen.departamento = e.target.value;
      this.updateInheritedFields();
    });

    const mun = document.getElementById('ubicacion_municipio');
    mun.addEventListener('input', (e) => {
      Store.citizen.municipio = e.target.value.trim();
      this.updateInheritedFields();
    });
  },

  updateInheritedFields() {
    const c = Store.citizen;

    // Nombre completo o razón social
    let displayName = '-';
    if (c.solicitanteTipo === 'empresa') {
      displayName = c.razonSocial || '(Empresa sin razón social)';
    } else if (c.solicitanteTipo === 'anonimo') {
      displayName = c.nombres ? `Anónimo - ${c.nombres}` : 'Solicitud Anónima';
    } else {
      displayName = [c.nombres, c.primerApellido, c.segundoApellido].filter(Boolean).join(' ') || '(Sin nombre)';
    }
    const nomEl = document.getElementById('heredado-nombre');
    if (nomEl) nomEl.value = displayName;

    // Documento
    const docEl = document.getElementById('heredado-documento');
    if (docEl) docEl.value = `${c.documentoTipo}: ${c.documentoNumero || 'Pendiente'}`;

    // Correo
    const mailEl = document.getElementById('heredado-correo');
    if (mailEl) mailEl.value = c.correo || 'Pendiente';

    // Teléfono
    const telEl = document.getElementById('heredado-telefono');
    if (telEl) telEl.value = c.telefono || 'Pendiente';

    // Dirección
    const dirEl = document.getElementById('heredado-direccion');
    if (dirEl) {
      const loc = `${c.municipio || 'Bogotá'}, ${c.departamento || 'Cundinamarca'}`;
      dirEl.value = c.direccionCompleta ? `${c.direccionCompleta} (${loc})` : `(${loc})`;
    }
  },

  updateModule1Status(isValid, errors) {
    const badgeStatus = document.getElementById('module-1-badge-status');
    const statusText = document.getElementById('m1-status-text');
    const statusIcon = document.getElementById('m1-status-icon');
    const btnCobro = document.getElementById('btn-cobro-comparendos');
    const cobroHelper = document.getElementById('cobro-disabled-helper');

    // Stepper
    const step1Badge = document.getElementById('step-badge-1');
    const step1Status = document.getElementById('step-status-1');
    const step2Indicator = document.getElementById('step-indicator-2');
    const step2Badge = document.getElementById('step-badge-2');
    const step2Status = document.getElementById('step-status-2');

    if (isValid) {
      badgeStatus.innerHTML = `
        <span class="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded border border-emerald-300 flex items-center gap-1.5">
          <i class="fa-solid fa-circle-check text-emerald-600"></i>
          Datos completos y verificados
        </span>
      `;
      statusText.innerHTML = '<strong class="text-emerald-700">Módulo 1 verificado con éxito.</strong> Ya puede desplegar la sección "Cobro / Comparendos".';
      statusIcon.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600"></i>';

      // Habilitar botón Cobro / Comparendos
      btnCobro.disabled = false;
      btnCobro.className = 'btn-sdm-accent px-6 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer';
      cobroHelper.className = 'text-xs text-emerald-600 mt-2 flex items-center gap-1.5';
      cobroHelper.innerHTML = '<i class="fa-solid fa-lock-open text-emerald-600"></i><span>Módulo habilitado. Haga clic en el botón para desplegar las opciones de trámite.</span>';

      // Stepper updates
      step1Badge.innerHTML = '<i class="fa-solid fa-check"></i>';
      step1Badge.className = 'w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold';
      step1Status.textContent = 'Completado';

      step2Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-blue-50 border-l-4 border-[#005C8A] transition-all';
      step2Badge.className = 'w-7 h-7 rounded-full bg-[#005C8A] text-white flex items-center justify-center text-xs font-bold';
      step2Status.textContent = 'Disponible para selección';
    } else {
      badgeStatus.innerHTML = `
        <span class="bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded border border-amber-300 flex items-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation text-amber-600"></i>
          Campos obligatorios pendientes (${errors.length})
        </span>
      `;
      statusText.textContent = `Pendientes por diligenciar: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}.`;
      statusIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation text-amber-500"></i>';

      // Bloquear botón Cobro / Comparendos
      btnCobro.disabled = true;
      btnCobro.className = 'px-6 py-3.5 rounded-xl font-bold text-sm text-slate-400 bg-slate-200 cursor-not-allowed shadow-sm flex items-center justify-center gap-2.5 transition-all';
      cobroHelper.className = 'text-xs text-amber-600 mt-2 flex items-center gap-1.5';
      cobroHelper.innerHTML = '<i class="fa-solid fa-lock"></i><span>Debe completar satisfactoriamente todos los campos obligatorios del Módulo 1 para desbloquear este selector.</span>';

      // Stepper updates
      step1Badge.textContent = '1';
      step1Badge.className = 'w-7 h-7 rounded-full bg-[#005C8A] text-white flex items-center justify-center text-xs font-bold';
      step1Status.textContent = 'En diligenciamiento';

      step2Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-slate-50 border-l-4 border-slate-300 opacity-70 transition-all';
      step2Badge.className = 'w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold';
      step2Status.textContent = 'Bloqueado';
    }
  },

  bindCobroSelector() {
    const btn = document.getElementById('btn-cobro-comparendos');
    const container = document.getElementById('selector-tramites-container');
    const arrow = document.getElementById('btn-cobro-arrow');

    btn.addEventListener('click', () => {
      if (!Store.isModule1Valid) return;

      Store.isCobroMenuOpen = !Store.isCobroMenuOpen;
      if (Store.isCobroMenuOpen) {
        container.classList.remove('hidden');
        arrow.classList.add('rotate-180');
      } else {
        container.classList.add('hidden');
        arrow.classList.remove('rotate-180');
      }
    });
  },

  bindTramiteCards() {
    const cardDesembargo = document.getElementById('card-tramite-desembargo');
    const cardPrescripcion = document.getElementById('card-tramite-prescripcion');
    const module3 = document.getElementById('module-3-section');
    const formDesembargos = document.getElementById('formulario-desembargos');
    const formPrescripciones = document.getElementById('formulario-prescripciones');
    const formTitle = document.getElementById('form-especifico-title');
    const pill = document.getElementById('tramite-active-pill');

    const step3Indicator = document.getElementById('step-indicator-3');
    const step3Badge = document.getElementById('step-badge-3');
    const step3Status = document.getElementById('step-status-3');

    // Desembargos click
    cardDesembargo.addEventListener('click', () => {
      Store.tramite.selected = 'desembargo';
      cardDesembargo.classList.add('selected');
      cardPrescripcion.classList.remove('selected');

      module3.classList.remove('hidden');
      formDesembargos.classList.remove('hidden');
      formPrescripciones.classList.add('hidden');

      formTitle.textContent = 'Módulo 3: Solicitud Específica de Desembargo de Cuentas / Bienes';
      pill.innerHTML = `
        <span class="bg-blue-100 text-[#002855] text-xs font-bold px-3 py-1 rounded-full border border-blue-300 flex items-center gap-1.5">
          <i class="fa-solid fa-building-columns text-[#005C8A]"></i>
          Trámite: Desembargos
        </span>
      `;

      step3Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-blue-50 border-l-4 border-[#005C8A] transition-all';
      step3Badge.className = 'w-7 h-7 rounded-full bg-[#005C8A] text-white flex items-center justify-center text-xs font-bold';
      step3Status.textContent = 'Diligenciando Desembargo';

      this.updateInheritedFields();
      module3.scrollIntoView({ behavior: 'smooth' });
    });

    // Prescripciones click
    cardPrescripcion.addEventListener('click', () => {
      Store.tramite.selected = 'prescripcion';
      cardPrescripcion.classList.add('selected');
      cardDesembargo.classList.remove('selected');

      module3.classList.remove('hidden');
      formPrescripciones.classList.remove('hidden');
      formDesembargos.classList.add('hidden');

      formTitle.textContent = 'Módulo 3: Declaratoria Específica de Prescripción de Comparendos';
      pill.innerHTML = `
        <span class="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
          <i class="fa-solid fa-scale-balanced text-amber-700"></i>
          Trámite: Prescripciones
        </span>
      `;

      step3Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-amber-50 border-l-4 border-amber-600 transition-all';
      step3Badge.className = 'w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold';
      step3Status.textContent = 'Diligenciando Prescripción';

      this.updateInheritedFields();
      module3.scrollIntoView({ behavior: 'smooth' });
    });

    // Contador de caracteres para justificación de desembargo
    const justInput = document.getElementById('desembargo_justificacion');
    const charCount = document.getElementById('desembargo-char-count');
    if (justInput && charCount) {
      justInput.addEventListener('input', (e) => {
        const len = e.target.value.length;
        charCount.textContent = `${len} / 600 caracteres`;
        Store.tramite.desembargo.justificacion = e.target.value;
      });
    }

    // Listener de fecha de infracción con cálculo de antigüedad
    const fechaInput = document.getElementById('prescripcion_fecha');
    const antiguedadMsg = document.getElementById('prescripcion-antiguedad-msg');
    if (fechaInput && antiguedadMsg) {
      // Poner como max la fecha de hoy
      const today = new Date().toISOString().split('T')[0];
      fechaInput.setAttribute('max', today);

      fechaInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        const now = new Date();
        const diffYears = (now - selectedDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (diffYears >= 3) {
          antiguedadMsg.innerHTML = `<span class="text-emerald-700 font-semibold">✓ Antigüedad: ${diffYears.toFixed(1)} años. (Cumple término superior a 3 años de la Ley 769/2002).</span>`;
        } else {
          antiguedadMsg.innerHTML = `<span class="text-amber-700 font-semibold">! Antigüedad: ${diffYears.toFixed(1)} años. (Nota: El Art. 159 CNT exige transcurso de al menos 3 años).</span>`;
        }
        Store.tramite.prescripcion.fecha = e.target.value;
      });
    }

    // Sincronización de inputs de Desembargo
    ['desembargo_resolucion', 'desembargo_entidad', 'desembargo_cuenta_bien'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          const key = id.replace('desembargo_', '');
          if (key === 'resolucion') Store.tramite.desembargo.resolucion = e.target.value.trim();
          if (key === 'cuenta_bien') Store.tramite.desembargo.cuentaBien = e.target.value.trim();
        });
        el.addEventListener('change', (e) => {
          if (id === 'desembargo_entidad') Store.tramite.desembargo.entidad = e.target.value;
        });
      }
    });

    // Sincronización de inputs de Prescripción
    ['prescripcion_comparendo', 'prescripcion_placa', 'prescripcion_causal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          if (id === 'prescripcion_comparendo') Store.tramite.prescripcion.comparendo = e.target.value.trim();
          if (id === 'prescripcion_placa') Store.tramite.prescripcion.placa = e.target.value.trim().toUpperCase();
        });
        el.addEventListener('change', (e) => {
          if (id === 'prescripcion_causal') Store.tramite.prescripcion.causal = e.target.value;
        });
      }
    });
  },

  bindRadicacionActions() {
    const btnRadicar = document.getElementById('btn-generar-radicacion');
    btnRadicar.addEventListener('click', () => {
      if (!Store.isModule1Valid) {
        alert('Por favor complete todos los datos obligatorios del Módulo 1.');
        document.getElementById('module-1-section').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (!Store.tramite.selected) {
        alert('Por favor seleccione un tipo de trámite especializado (Desembargos o Prescripciones).');
        document.getElementById('module-2-section').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (Store.tramite.selected === 'desembargo') {
        const res = document.getElementById('desembargo_resolucion').value.trim();
        const ent = document.getElementById('desembargo_entidad').value;
        const cta = document.getElementById('desembargo_cuenta_bien').value.trim();
        const just = document.getElementById('desembargo_justificacion').value.trim();
        const file = Store.tramite.desembargo.archivo;

        if (!res || !ent || !cta || !just || !file) {
          alert('Por favor complete todos los campos obligatorios de Desembargo y adjunte el soporte documental (PDF/JPG/PNG).');
          return;
        }

        Store.tramite.desembargo.resolucion = res;
        Store.tramite.desembargo.entidad = ent;
        Store.tramite.desembargo.cuentaBien = cta;
        Store.tramite.desembargo.justificacion = just;
      }

      if (Store.tramite.selected === 'prescripcion') {
        const comp = document.getElementById('prescripcion_comparendo').value.trim();
        const fec = document.getElementById('prescripcion_fecha').value;
        const plc = document.getElementById('prescripcion_placa').value.trim();
        const cau = document.getElementById('prescripcion_causal').value;
        const file = Store.tramite.prescripcion.archivo;

        if (!comp || !fec || !plc || !cau || !file) {
          alert('Por favor complete todos los campos obligatorios de Prescripción y adjunte el documento de identidad y pruebas en formato PDF.');
          return;
        }

        Store.tramite.prescripcion.comparendo = comp;
        Store.tramite.prescripcion.fecha = fec;
        Store.tramite.prescripcion.placa = plc;
        Store.tramite.prescripcion.causal = cau;
      }

      // Animación de radicación institucional
      btnRadicar.disabled = true;
      btnRadicar.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-base"></i> Conectando con el Sistema de Gestión Documental...';

      setTimeout(() => {
        btnRadicar.disabled = false;
        btnRadicar.innerHTML = '<i class="fa-solid fa-paper-plane text-base"></i> <span>Generar Radicación</span>';
        this.openRadicacionModal();
      }, 750);
    });
  },

  openRadicacionModal() {
    const radicado = Utils.generateRadicadoNumber();
    const timestamp = Utils.getCurrentDateTimeString();
    Store.lastRadicacion = { radicado, timestamp };

    // Actualizar Encabezado del Modal
    document.getElementById('modal-radicado-code').textContent = radicado;
    document.getElementById('modal-timestamp').textContent = timestamp;

    // Actualizar Solicitante
    const c = Store.citizen;
    let nombreCompleto = c.solicitanteTipo === 'empresa'
      ? c.razonSocial
      : [c.nombres, c.primerApellido, c.segundoApellido].filter(Boolean).join(' ');

    document.getElementById('modal-resumen-nombre').textContent = nombreCompleto || 'N/A';
    document.getElementById('modal-resumen-documento').textContent = `${c.documentoTipo} - ${c.documentoNumero}`;
    document.getElementById('modal-resumen-correo').textContent = c.correo;
    document.getElementById('modal-resumen-telefono').textContent = c.telefono;
    document.getElementById('modal-resumen-direccion').textContent = `${c.direccionCompleta}, ${c.municipio} - ${c.departamento}`;

    // Actualizar Trámite
    const container = document.getElementById('modal-resumen-tramite-container');
    const anexosContainer = document.getElementById('modal-resumen-anexos-container');
    const printTbody = document.getElementById('print-tramite-tbody');
    const printAnexosTd = document.getElementById('print-anexos-td');

    if (Store.tramite.selected === 'desembargo') {
      const d = Store.tramite.desembargo;
      container.innerHTML = `
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Tipo de Solicitud:</span>
          <span class="col-span-2 font-bold text-blue-900">Desembargo de Cuentas y Bienes</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Resolución / Cautelar:</span>
          <span class="col-span-2 font-mono font-semibold text-slate-900">${d.resolucion}</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Entidad Afectada:</span>
          <span class="col-span-2 text-slate-900">${d.entidad}</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Cuenta o Bien:</span>
          <span class="col-span-2 text-slate-900">${d.cuentaBien}</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Justificación:</span>
          <span class="col-span-2 text-slate-700 italic">"${d.justificacion}"</span>
        </div>
      `;

      anexosContainer.innerHTML = `
        <div class="flex items-center gap-3 p-2 rounded bg-slate-50 border border-slate-200">
          <i class="fa-solid fa-file-pdf text-red-600 text-lg"></i>
          <div class="flex-1 truncate">
            <p class="font-semibold text-slate-800 text-xs truncate">${d.archivo.name}</p>
            <p class="text-[10px] text-slate-500">${Utils.formatFileSize(d.archivo.size)} • Soporte de Desembargo</p>
          </div>
          <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Cargado y validado</span>
        </div>
      `;

      // Para impresión
      printTbody.innerHTML = `
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold; width: 35%;">Tipo de Solicitud:</td><td style="border: 1px solid #ccc; padding: 6px;">Desembargo de Cuentas y Bienes</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">N° de Resolución / Cautelar:</td><td style="border: 1px solid #ccc; padding: 6px; font-family: monospace;">${d.resolucion}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Entidad Financiera Afectada:</td><td style="border: 1px solid #ccc; padding: 6px;">${d.entidad}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Cuenta o Bien Embargado:</td><td style="border: 1px solid #ccc; padding: 6px;">${d.cuentaBien}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Justificación de Solicitud:</td><td style="border: 1px solid #ccc; padding: 6px;">${d.justificacion}</td></tr>
      `;
      printAnexosTd.innerHTML = `• ${d.archivo.name} (${Utils.formatFileSize(d.archivo.size)}) - Certificación Bancaria / Soporte de Embargo.`;

    } else {
      const p = Store.tramite.prescripcion;
      container.innerHTML = `
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Tipo de Solicitud:</span>
          <span class="col-span-2 font-bold text-amber-900">Declaratoria de Prescripción de Sanción (Ley 769/2002)</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">N° de Comparendo:</span>
          <span class="col-span-2 font-mono font-semibold text-slate-900">${p.comparendo}</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Fecha de Infracción:</span>
          <span class="col-span-2 text-slate-900">${p.fecha}</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Placa Asociada:</span>
          <span class="col-span-2 font-mono font-bold text-slate-900">${p.placa}</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Causal Alegada:</span>
          <span class="col-span-2 text-slate-700 italic">${p.causal}</span>
        </div>
      `;

      anexosContainer.innerHTML = `
        <div class="flex items-center gap-3 p-2 rounded bg-slate-50 border border-slate-200">
          <i class="fa-solid fa-file-pdf text-red-600 text-lg"></i>
          <div class="flex-1 truncate">
            <p class="font-semibold text-slate-800 text-xs truncate">${p.archivo.name}</p>
            <p class="text-[10px] text-slate-500">${Utils.formatFileSize(p.archivo.size)} • Documento de Identidad y Pruebas (PDF)</p>
          </div>
          <span class="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Cargado y validado</span>
        </div>
      `;

      // Para impresión
      printTbody.innerHTML = `
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold; width: 35%;">Tipo de Solicitud:</td><td style="border: 1px solid #ccc; padding: 6px;">Declaratoria de Prescripción (Ley 769/2002)</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">N° de Comparendo:</td><td style="border: 1px solid #ccc; padding: 6px; font-family: monospace;">${p.comparendo}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Fecha Estimada:</td><td style="border: 1px solid #ccc; padding: 6px;">${p.fecha}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Placa del Vehículo:</td><td style="border: 1px solid #ccc; padding: 6px; font-family: monospace;">${p.placa}</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Causal de Prescripción:</td><td style="border: 1px solid #ccc; padding: 6px;">${p.causal}</td></tr>
      `;
      printAnexosTd.innerHTML = `• ${p.archivo.name} (${Utils.formatFileSize(p.archivo.size)}) - Documento de Identidad y Pruebas Documentales Oficiales.`;
    }

    // Actualizar contenedor de impresión datos ciudadano
    document.getElementById('print-radicado-code').textContent = radicado;
    document.getElementById('print-nombre').textContent = nombreCompleto;
    document.getElementById('print-documento').textContent = `${c.documentoTipo} ${c.documentoNumero}`;
    document.getElementById('print-correo').textContent = c.correo;
    document.getElementById('print-telefono').textContent = c.telefono;
    document.getElementById('print-direccion').textContent = `${c.direccionCompleta}, ${c.municipio} - ${c.departamento}`;

    // Actualizar Stepper Paso 4
    const step4Badge = document.getElementById('step-badge-4');
    const step4Indicator = document.getElementById('step-indicator-4');
    step4Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border-l-4 border-emerald-600 transition-all';
    step4Badge.className = 'w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold';
    step4Badge.innerHTML = '<i class="fa-solid fa-check"></i>';

    // Mostrar modal
    document.getElementById('modal-radicacion').classList.remove('hidden');
  },

  bindModalActions() {
    const modal = document.getElementById('modal-radicacion');
    const closeTop = document.getElementById('btn-modal-close');
    const closeBottom = document.getElementById('btn-modal-close-action');
    const copyBtn = document.getElementById('btn-copy-radicado');
    const printBtn = document.getElementById('btn-print-certificate');
    const newBtn = document.getElementById('btn-nuevo-tramite');

    const closeModal = () => modal.classList.add('hidden');
    closeTop.addEventListener('click', closeModal);
    closeBottom.addEventListener('click', closeModal);

    copyBtn.addEventListener('click', () => {
      const code = Store.lastRadicacion?.radicado;
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          const textEl = document.getElementById('copy-btn-text');
          textEl.textContent = '¡Copiado!';
          setTimeout(() => {
            textEl.textContent = 'Copiar Radicado';
          }, 2000);
        });
      }
    });

    printBtn.addEventListener('click', () => {
      window.print();
    });

    newBtn.addEventListener('click', () => {
      if (confirm('¿Desea iniciar un nuevo trámite? Se reiniciarán los datos del formulario.')) {
        window.location.reload();
      }
    });
  },

  bindQuickFill() {
    const btn = document.getElementById('btn-quick-fill-demo');
    if (!btn) return;

    btn.addEventListener('click', () => {
      document.getElementById('solicitante_tipo').value = 'ciudadano';
      Store.citizen.solicitanteTipo = 'ciudadano';

      document.getElementById('documento_tipo').value = 'CC';
      Store.citizen.documentoTipo = 'CC';

      document.getElementById('documento_numero').value = '1018452914';
      Store.citizen.documentoNumero = '1018452914';

      document.getElementById('nombres').value = 'María Fernanda';
      Store.citizen.nombres = 'María Fernanda';

      document.getElementById('primer_apellido').value = 'Rodríguez';
      Store.citizen.primerApellido = 'Rodríguez';

      document.getElementById('segundo_apellido').value = 'Pantoja';
      Store.citizen.segundoApellido = 'Pantoja';

      document.getElementById('dir_via').value = 'Calle';
      document.getElementById('dir_num1').value = '26';
      document.getElementById('dir_letra1').value = 'Sur';
      document.getElementById('dir_num2').value = '13';
      document.getElementById('dir_num3').value = '35';
      document.getElementById('dir_complemento').value = 'Apto 402 Torre B';

      AddressBuilder.generate();

      document.getElementById('telefono_contacto').value = '3148927103';
      Store.citizen.telefono = '3148927103';

      document.getElementById('correo_electronico').value = 'maria.rodriguez@ejemplo.gov.co';
      Store.citizen.correo = 'maria.rodriguez@ejemplo.gov.co';

      document.getElementById('correo_confirmacion').value = 'maria.rodriguez@ejemplo.gov.co';
      Store.citizen.correoConfirmacion = 'maria.rodriguez@ejemplo.gov.co';

      Validators.validateEmailMatch();
      this.updateInheritedFields();
      Validators.validateModule1();
    });
  }
};

// ------------------------------------------------------------------------------
// INICIALIZACIÓN DE LA APLICACIÓN AL CARGAR EL DOM
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  AddressBuilder.init();
  FileController.init();
  UIController.init();
  Validators.validateModule1();
});
