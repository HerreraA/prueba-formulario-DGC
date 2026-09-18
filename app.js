/**
 * ==============================================================================
 * Portal de Radicación Virtual de Trámites - Subdirección de Jurisdicción Coactiva
 * Secretaría Distrital de Movilidad de Bogotá (Cra. 28A No. 17 A 20)
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
  area: 'coactiva', // 'coactiva' | 'prescripcion'
  coactiva: {
    tramites: {
      desembargo: true,
      entregaTitulo: false,
      apropiacion: false
    },
    desembargo: {
      calidad: 'Solicitante directo / Propietario',
      poderdante: '',
      poderArchivo: null,
      bienes: [], // [{ id, tipo, identificacion, ciudadEmpresa }]
      cedulaArchivo: null,
      volanteArchivo: null
    },
    entrega: {
      numDeposito: '',
      entidadOrigen: '',
      soporteArchivo: null
    },
    apropiacion: {
      obligaciones: '',
      soporteArchivo: null
    }
  },
  prescripcion: {
    comparendo: '',
    fecha: '',
    placa: '',
    causal: '',
    archivo: null
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
    if (!bytes || bytes === 0) return '0 Bytes';
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

  getCurrentDateLongString() {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const now = new Date();
    return `${now.getDate()} de ${meses[now.getMonth()]} de ${now.getFullYear()}`;
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
// 4. CONTROLADOR DE LA TABLA DINÁMICA DE BIENES EMBARGADOS
// ------------------------------------------------------------------------------
const BienesTableController = {
  nextId: 1,

  init() {
    const addBtn = document.getElementById('btn-add-bien');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addRow());
    }
    // Agregar primera fila por defecto
    this.addRow({
      tipo: 'Vehículo',
      identificacion: '',
      ciudadEmpresa: 'Bogotá D.C.'
    });
  },

  addRow(data = null) {
    const id = this.nextId++;
    const defaultData = data || {
      tipo: 'Vehículo',
      identificacion: '',
      ciudadEmpresa: 'Bogotá D.C.'
    };

    Store.coactiva.desembargo.bienes.push({
      id,
      tipo: defaultData.tipo,
      identificacion: defaultData.identificacion,
      ciudadEmpresa: defaultData.ciudadEmpresa
    });

    const tbody = document.getElementById('bienes-table-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.id = `bien-row-${id}`;
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="px-3 py-2">
        <select class="w-full text-xs rounded border-slate-300 p-1.5 bg-white border" data-id="${id}" data-field="tipo">
          <option value="Vehículo" ${defaultData.tipo === 'Vehículo' ? 'selected' : ''}>Vehículo (Automotor / Moto)</option>
          <option value="Inmueble" ${defaultData.tipo === 'Inmueble' ? 'selected' : ''}>Inmueble (Casa / Apto / Lote)</option>
          <option value="Cuenta bancaria" ${defaultData.tipo === 'Cuenta bancaria' ? 'selected' : ''}>Cuenta bancaria (Ahorros / Corriente)</option>
          <option value="Salario / Honorarios" ${defaultData.tipo === 'Salario / Honorarios' ? 'selected' : ''}>Salario / Honorarios laborales</option>
          <option value="Otro" ${defaultData.tipo === 'Otro' ? 'selected' : ''}>Otro bien embargado</option>
        </select>
      </td>
      <td class="px-3 py-2">
        <input type="text" placeholder="Placa, matrícula inmobiliaria, # cuenta..." value="${defaultData.identificacion}" class="w-full text-xs rounded border-slate-300 p-1.5 border" data-id="${id}" data-field="identificacion">
      </td>
      <td class="px-3 py-2">
        <input type="text" placeholder="Ciudad o entidad bancaria/empleador..." value="${defaultData.ciudadEmpresa}" class="w-full text-xs rounded border-slate-300 p-1.5 border" data-id="${id}" data-field="ciudadEmpresa">
      </td>
      <td class="px-3 py-2 text-center">
        <button type="button" class="text-slate-400 hover:text-red-600 p-1 transition-colors btn-delete-bien" data-id="${id}" title="Eliminar este bien">
          <i class="fa-solid fa-trash-can text-xs"></i>
        </button>
      </td>
    `;

    // Vincular inputs
    const inputs = tr.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', (e) => this.updateBienData(e.target));
      input.addEventListener('change', (e) => this.updateBienData(e.target));
    });

    const deleteBtn = tr.querySelector('.btn-delete-bien');
    deleteBtn.addEventListener('click', () => this.removeRow(id));

    tbody.appendChild(tr);
  },

  updateBienData(target) {
    const id = parseInt(target.dataset.id, 10);
    const field = target.dataset.field;
    const item = Store.coactiva.desembargo.bienes.find(b => b.id === id);
    if (item) {
      item[field] = target.value.trim();
    }
  },

  removeRow(id) {
    if (Store.coactiva.desembargo.bienes.length <= 1) {
      alert('Debe relacionar al menos un bien embargado en la solicitud de desembargo.');
      return;
    }

    Store.coactiva.desembargo.bienes = Store.coactiva.desembargo.bienes.filter(b => b.id !== id);
    const row = document.getElementById(`bien-row-${id}`);
    if (row) row.remove();
  }
};

// ------------------------------------------------------------------------------
// 5. VALIDADORES REACTIVOS
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
  },

  validateCoactivaForms() {
    const errors = [];
    const t = Store.coactiva.tramites;

    if (!t.desembargo && !t.entregaTitulo && !t.apropiacion) {
      errors.push('Debe activar al menos un trámite de Jurisdicción Coactiva (Desembargo, Entrega o Apropiación).');
      return errors;
    }

    if (t.desembargo) {
      const d = Store.coactiva.desembargo;
      if (d.calidad === 'Apoderado') {
        const poderdante = document.getElementById('desembargo_poderdante').value.trim();
        if (!poderdante) errors.push('Desembargo: Nombre del poderdante requerido.');
        if (!d.poderArchivo) errors.push('Desembargo: Carga de poder especial autenticado requerida.');
      }

      // Validar bienes
      if (d.bienes.length === 0) {
        errors.push('Desembargo: Debe relacionar al menos un bien embargado.');
      } else {
        const hasEmpty = d.bienes.some(b => !b.identificacion || !b.ciudadEmpresa);
        if (hasEmpty) errors.push('Desembargo: Complete la identificación y ciudad/empresa de todos los bienes agregados.');
      }

      // Requisitos específicos obligatorios
      if (!d.cedulaArchivo) errors.push('Desembargo: Fotocopia de la cédula del propietario obligatoria.');
      if (!d.volanteArchivo) errors.push('Desembargo: Fotocopia del volante de pago cancelado obligatoria.');
    }

    if (t.entregaTitulo) {
      const ent = document.getElementById('entrega_entidad_origen').value.trim();
      if (!ent) errors.push('Entrega de Título: Entidad bancaria o juzgado / cuenta origen requerida.');
      if (!Store.coactiva.entrega.soporteArchivo) errors.push('Entrega de Título: Soporte del título o recibo de consignación requerido (PDF).');
    }

    if (t.apropiacion) {
      const ob = document.getElementById('apropiacion_obligaciones').value.trim();
      if (!ob) errors.push('Apropiación: Indique el número de comparendo o proceso coactivo a cancelar.');
      if (!Store.coactiva.apropiacion.soporteArchivo) errors.push('Apropiación: Autorización y soporte de consignación requerido (PDF).');
    }

    return errors;
  }
};

// ------------------------------------------------------------------------------
// 6. CONTROLADOR DE ARCHIVOS
// ------------------------------------------------------------------------------
const FileController = {
  MAX_SIZE: 5 * 1024 * 1024, // 5 MB

  init() {
    // 1. Poder autenticado
    this.bindFileInput('file-input-poder', ['.pdf'], 'poder-file-name', (file) => {
      Store.coactiva.desembargo.poderArchivo = file;
    });

    // 2. Cédula desembargo
    this.bindFileInput('file-input-desembargo-cedula', ['.pdf', '.jpg', '.jpeg', '.png'], 'cedula-file-preview', (file) => {
      Store.coactiva.desembargo.cedulaArchivo = file;
    });

    // 3. Volante pago desembargo
    this.bindFileInput('file-input-desembargo-volante', ['.pdf', '.jpg', '.jpeg', '.png'], 'volante-file-preview', (file) => {
      Store.coactiva.desembargo.volanteArchivo = file;
    });

    // 4. Soporte entrega título
    this.bindFileInput('file-input-entrega-soporte', ['.pdf'], 'entrega-file-preview', (file) => {
      Store.coactiva.entrega.soporteArchivo = file;
    });

    // 5. Soporte apropiación
    this.bindFileInput('file-input-apropiacion-soporte', ['.pdf'], 'apropiacion-file-preview', (file) => {
      Store.coactiva.apropiacion.soporteArchivo = file;
    });

    // 6. Soporte prescripción
    this.bindFileInput('file-input-prescripcion', ['.pdf'], 'prescripcion-file-preview', (file) => {
      Store.prescripcion.archivo = file;
    });
  },

  bindFileInput(inputId, allowedExts, previewId, callback) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input) return;

    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const name = file.name.toLowerCase();
        const validExt = allowedExts.some(ext => name.endsWith(ext));

        if (!validExt) {
          alert(`Formato no permitido para este requisito.\nPermitidos: ${allowedExts.join(', ')}.\nArchivo rechazado: ${file.name}`);
          input.value = '';
          if (preview) preview.classList.add('hidden');
          return;
        }

        if (file.size > this.MAX_SIZE) {
          alert(`El archivo supera el límite de 5 MB.\nTamaño actual: ${Utils.formatFileSize(file.size)}.`);
          input.value = '';
          if (preview) preview.classList.add('hidden');
          return;
        }

        callback(file);
        if (preview) {
          preview.classList.remove('hidden');
          preview.textContent = `✓ ${file.name} (${Utils.formatFileSize(file.size)})`;
        }
      }
    });
  }
};

// ------------------------------------------------------------------------------
// 7. CONTROLADOR DE INTERFAZ DE USUARIO (UI CONTROLLER)
// ------------------------------------------------------------------------------
const UIController = {
  init() {
    this.bindModule1Inputs();
    this.bindCobroSelector();
    this.bindAreaCards();
    this.bindCoactivaCheckboxes();
    this.bindCalidadSolicitante();
    this.bindPreviewModal();
    this.bindRadicacionActions();
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

    const docEl = document.getElementById('heredado-documento');
    if (docEl) docEl.value = `${c.documentoTipo}: ${c.documentoNumero || 'Pendiente'}`;

    const mailEl = document.getElementById('heredado-correo');
    if (mailEl) mailEl.value = c.correo || 'Pendiente';

    const telEl = document.getElementById('heredado-telefono');
    if (telEl) telEl.value = c.telefono || 'Pendiente';

    const dirEl = document.getElementById('heredado-direccion');
    if (dirEl) {
      const loc = `${c.municipio || 'Bogotá'}, ${c.departamento || 'Cundinamarca'}`;
      dirEl.value = c.direccionCompleta ? `${c.direccionCompleta} (${loc})` : `(${loc})`;
    }

    // Actualizar declaraciones formales legales en tiempo real
    const docText = c.documentoNumero ? `${c.documentoTipo} No. ${c.documentoNumero}` : '[Documento pendiente]';
    const docDesEl = document.getElementById('formal-txt-doc-desembargo');
    if (docDesEl) docDesEl.textContent = docText;

    const docEntEl = document.getElementById('formal-txt-doc-entrega');
    if (docEntEl) docEntEl.textContent = docText;

    const docAprEl = document.getElementById('formal-txt-doc-apropiacion');
    if (docAprEl) docAprEl.textContent = docText;
  },

  updateModule1Status(isValid, errors) {
    const badgeStatus = document.getElementById('module-1-badge-status');
    const statusText = document.getElementById('m1-status-text');
    const statusIcon = document.getElementById('m1-status-icon');
    const btnCobro = document.getElementById('btn-cobro-comparendos');
    const cobroHelper = document.getElementById('cobro-disabled-helper');

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
      statusText.innerHTML = '<strong class="text-emerald-700">Módulo 1 verificado con éxito.</strong> Ya puede habilitar el trámite en "Cobro / Comparendos".';
      statusIcon.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600"></i>';

      btnCobro.disabled = false;
      btnCobro.className = 'btn-sdm-accent px-6 py-3.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer';
      cobroHelper.className = 'text-xs text-emerald-600 mt-2 flex items-center gap-1.5';
      cobroHelper.innerHTML = '<i class="fa-solid fa-lock-open text-emerald-600"></i><span>Módulo habilitado. Haga clic para desplegar los trámites de Coactiva y Comparendos.</span>';

      step1Badge.innerHTML = '<i class="fa-solid fa-check"></i>';
      step1Badge.className = 'w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold';
      step1Status.textContent = 'Completado';

      step2Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-blue-50 border-l-4 border-[#005C8A] transition-all';
      step2Badge.className = 'w-7 h-7 rounded-full bg-[#005C8A] text-white flex items-center justify-center text-xs font-bold';
      step2Status.textContent = 'Disponible';
    } else {
      badgeStatus.innerHTML = `
        <span class="bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded border border-amber-300 flex items-center gap-1.5">
          <i class="fa-solid fa-triangle-exclamation text-amber-600"></i>
          Campos obligatorios pendientes (${errors.length})
        </span>
      `;
      statusText.textContent = `Pendientes por diligenciar: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}.`;
      statusIcon.innerHTML = '<i class="fa-solid fa-circle-exclamation text-amber-500"></i>';

      btnCobro.disabled = true;
      btnCobro.className = 'px-6 py-3.5 rounded-xl font-bold text-sm text-slate-400 bg-slate-200 cursor-not-allowed shadow-sm flex items-center justify-center gap-2.5 transition-all';
      cobroHelper.className = 'text-xs text-amber-600 mt-2 flex items-center gap-1.5';
      cobroHelper.innerHTML = '<i class="fa-solid fa-lock"></i><span>Debe completar satisfactoriamente todos los campos obligatorios del Módulo 1 para desbloquear este selector.</span>';

      step1Badge.textContent = '1';
      step1Badge.className = 'w-7 h-7 rounded-full bg-[#002855] text-white flex items-center justify-center text-xs font-bold';
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
        // Abrir Módulo 3 por defecto
        this.renderActiveArea();
      } else {
        container.classList.add('hidden');
        arrow.classList.remove('rotate-180');
      }
    });
  },

  bindAreaCards() {
    const cardCoactiva = document.getElementById('card-area-coactiva');
    const cardPrescripcion = document.getElementById('card-area-prescripcion');
    const coactivaSelector = document.getElementById('coactiva-subtramites-selector');

    cardCoactiva.addEventListener('click', () => {
      Store.area = 'coactiva';
      cardCoactiva.classList.add('selected', 'border-2', 'border-[#005C8A]', 'bg-blue-50/50');
      cardPrescripcion.classList.remove('selected', 'border-2', 'border-amber-600', 'bg-amber-50/50');
      cardPrescripcion.classList.add('border-slate-200', 'bg-white');

      coactivaSelector.classList.remove('hidden');
      this.renderActiveArea();
    });

    cardPrescripcion.addEventListener('click', () => {
      Store.area = 'prescripcion';
      cardPrescripcion.classList.add('selected', 'border-2', 'border-amber-600', 'bg-amber-50/50');
      cardCoactiva.classList.remove('selected', 'border-2', 'border-[#005C8A]', 'bg-blue-50/50');
      cardCoactiva.classList.add('border-slate-200', 'bg-white');

      coactivaSelector.classList.add('hidden');
      this.renderActiveArea();
    });
  },

  bindCoactivaCheckboxes() {
    const checkDes = document.getElementById('check-tramite-desembargo');
    const checkEnt = document.getElementById('check-tramite-entrega');
    const checkApr = document.getElementById('check-tramite-apropiacion');

    const labelDes = document.getElementById('label-check-desembargo');
    const labelEnt = document.getElementById('label-check-entrega');
    const labelApr = document.getElementById('label-check-apropiacion');

    const updateCheckState = () => {
      Store.coactiva.tramites.desembargo = checkDes.checked;
      Store.coactiva.tramites.entregaTitulo = checkEnt.checked;
      Store.coactiva.tramites.apropiacion = checkApr.checked;

      labelDes.classList.toggle('checked', checkDes.checked);
      labelEnt.classList.toggle('checked', checkEnt.checked);
      labelApr.classList.toggle('checked', checkApr.checked);

      // Bloques en Módulo 3
      document.getElementById('bloque-tramite-desembargo').classList.toggle('hidden', !checkDes.checked);
      document.getElementById('bloque-tramite-entrega').classList.toggle('hidden', !checkEnt.checked);
      document.getElementById('bloque-tramite-apropiacion').classList.toggle('hidden', !checkApr.checked);

      // Conteo
      const activeCount = [checkDes.checked, checkEnt.checked, checkApr.checked].filter(Boolean).length;
      document.getElementById('coactiva-active-count').textContent = `${activeCount} de 3`;

      // Badge pill en Módulo 3
      const pill = document.getElementById('tramite-active-pill');
      pill.innerHTML = `
        <span class="bg-[#002855] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-landmark text-[#FDC300]"></i>
          Coactiva (${activeCount} trámites seleccionados)
        </span>
      `;
    };

    checkDes.addEventListener('change', updateCheckState);
    checkEnt.addEventListener('change', updateCheckState);
    checkApr.addEventListener('change', updateCheckState);

    updateCheckState();
  },

  bindCalidadSolicitante() {
    const select = document.getElementById('desembargo_calidad');
    const poderdanteDiv = document.getElementById('apoderado-fields-container');
    const poderFileDiv = document.getElementById('apoderado-file-container');
    const formalCalidad = document.getElementById('formal-txt-calidad');

    select.addEventListener('change', (e) => {
      const val = e.target.value;
      Store.coactiva.desembargo.calidad = val;

      if (val === 'Apoderado') {
        poderdanteDiv.classList.remove('hidden');
        poderFileDiv.classList.remove('hidden');
        formalCalidad.textContent = 'Apoderado especial';
      } else {
        poderdanteDiv.classList.add('hidden');
        poderFileDiv.classList.add('hidden');
        formalCalidad.textContent = 'Solicitante directo / Propietario';
      }
    });

    const poderdanteInput = document.getElementById('desembargo_poderdante');
    if (poderdanteInput) {
      poderdanteInput.addEventListener('input', (e) => {
        Store.coactiva.desembargo.poderdante = e.target.value.trim();
      });
    }
  },

  renderActiveArea() {
    const module3 = document.getElementById('module-3-section');
    const coactivaContainer = document.getElementById('seccion-coactiva-container');
    const prescripcionContainer = document.getElementById('formulario-prescripciones');
    const formTitle = document.getElementById('form-especifico-title');
    const pill = document.getElementById('tramite-active-pill');

    const step3Indicator = document.getElementById('step-indicator-3');
    const step3Badge = document.getElementById('step-badge-3');
    const step3Status = document.getElementById('step-status-3');

    module3.classList.remove('hidden');
    this.updateInheritedFields();

    if (Store.area === 'coactiva') {
      coactivaContainer.classList.remove('hidden');
      prescripcionContainer.classList.add('hidden');

      formTitle.textContent = 'Módulo 3: Formato Oficial - Subdirección de Jurisdicción Coactiva';
      pill.innerHTML = `
        <span class="bg-[#002855] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <i class="fa-solid fa-landmark text-[#FDC300]"></i>
          Cra. 28A No. 17 A 20 (Jurisdicción Coactiva)
        </span>
      `;

      step3Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-blue-50 border-l-4 border-[#005C8A] transition-all';
      step3Badge.className = 'w-7 h-7 rounded-full bg-[#005C8A] text-white flex items-center justify-center text-xs font-bold';
      step3Status.textContent = 'Diligenciando Formato Coactivo';
    } else {
      coactivaContainer.classList.add('hidden');
      prescripcionContainer.classList.remove('hidden');

      formTitle.textContent = 'Módulo 3: Declaratoria de Prescripción de Sanción (Ley 769 de 2002)';
      pill.innerHTML = `
        <span class="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5">
          <i class="fa-solid fa-scale-balanced text-amber-700"></i>
          Trámite: Prescripciones
        </span>
      `;

      step3Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-amber-50 border-l-4 border-amber-600 transition-all';
      step3Badge.className = 'w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold';
      step3Status.textContent = 'Diligenciando Prescripción';
    }
  },

  // ----------------------------------------------------------------------------
  // VISTA PREVIA DEL OFICIO FORMAL DE COACTIVA
  // ----------------------------------------------------------------------------
  bindPreviewModal() {
    const btnOpen = document.getElementById('btn-vista-previa-oficio');
    const modal = document.getElementById('modal-vista-previa-oficio');
    const btnCloseTop = document.getElementById('btn-close-preview-top');
    const btnCloseBottom = document.getElementById('btn-close-preview-bottom');
    const btnPrint = document.getElementById('btn-print-oficio');
    const btnProceder = document.getElementById('btn-proceder-radicar-desde-preview');

    const closeModal = () => modal.classList.add('hidden');
    btnCloseTop.addEventListener('click', closeModal);
    btnCloseBottom.addEventListener('click', closeModal);

    btnOpen.addEventListener('click', () => {
      if (!Store.isModule1Valid) {
        alert('Por favor complete los datos obligatorios del solicitante (Módulo 1).');
        document.getElementById('module-1-section').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (Store.area === 'coactiva') {
        const errors = Validators.validateCoactivaForms();
        if (errors.length > 0) {
          alert('Por favor complete todos los requisitos antes de generar el oficio:\n\n• ' + errors.join('\n• '));
          return;
        }
      }

      this.renderOficioPreview();
      modal.classList.remove('hidden');
    });

    btnPrint.addEventListener('click', () => {
      document.body.classList.add('printing-oficio');
      // Inyectar en contenedor de impresión
      const printContainer = document.getElementById('print-oficio-container');
      const content = document.getElementById('oficio-render-content').innerHTML;
      printContainer.innerHTML = content;

      window.print();

      window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing-oficio');
      }, { once: true });
    });

    btnProceder.addEventListener('click', () => {
      closeModal();
      document.getElementById('btn-generar-radicacion').click();
    });
  },

  renderOficioPreview() {
    const c = Store.citizen;
    const t = Store.coactiva.tramites;
    const d = Store.coactiva.desembargo;

    // Fecha
    document.getElementById('preview-oficio-fecha').textContent = Utils.getCurrentDateLongString();

    // Asunto dinámico
    let asuntos = [];
    if (t.desembargo) asuntos.push('SOLICITUD DE DESEMBARGO');
    if (t.entregaTitulo) asuntos.push('ENTREGA DE TÍTULO DE DEPÓSITO JUDICIAL');
    if (t.apropiacion) asuntos.push('APROPIACIÓN DE DEPÓSITO JUDICIAL');
    document.getElementById('preview-oficio-asunto').textContent = asuntos.join(' / ') || 'SOLICITUD ANTE COACTIVA';

    // Solicitante
    const nombreCompleto = c.solicitanteTipo === 'empresa'
      ? c.razonSocial
      : [c.nombres, c.primerApellido, c.segundoApellido].filter(Boolean).join(' ');

    document.getElementById('preview-sol-nombre').textContent = nombreCompleto;
    document.getElementById('preview-sol-documento').textContent = `${c.documentoTipo} No. ${c.documentoNumero}`;
    document.getElementById('preview-sol-direccion').textContent = c.direccionCompleta || '-';
    document.getElementById('preview-sol-telefono').textContent = c.telefono || '-';
    document.getElementById('preview-sol-ubicacion').textContent = `${c.municipio}, ${c.departamento}`;
    document.getElementById('preview-sol-correo').textContent = c.correo || '-';

    // Firma
    document.getElementById('preview-firma-nombre').textContent = nombreCompleto.toUpperCase();
    document.getElementById('preview-firma-calidad').textContent = d.calidad;
    document.getElementById('preview-firma-doc').textContent = `${c.documentoTipo} No. ${c.documentoNumero}`;

    // Cuerpo Dinámico del Oficio
    const bodyContainer = document.getElementById('preview-oficio-body');
    let html = '';

    if (t.desembargo) {
      const calidadText = d.calidad === 'Apoderado'
        ? `obrando en mi calidad de apoderado especial del señor(a) <strong>${d.poderdante || 'PODERDANTE'}</strong>`
        : `obrando en mi calidad de <strong>${d.calidad}</strong>`;

      let bienesHtml = '';
      d.bienes.forEach((b, idx) => {
        bienesHtml += `
          <tr>
            <td style="border: 1px solid #94A3B8; padding: 6px; text-align: center;">${idx + 1}</td>
            <td style="border: 1px solid #94A3B8; padding: 6px;"><strong>${b.tipo}</strong></td>
            <td style="border: 1px solid #94A3B8; padding: 6px; font-family: monospace;">${b.identificacion || 'N/A'}</td>
            <td style="border: 1px solid #94A3B8; padding: 6px;">${b.ciudadEmpresa || 'Bogotá D.C.'}</td>
          </tr>
        `;
      });

      html += `
        <div class="space-y-3">
          <p class="font-bold text-[#002855] text-xs uppercase border-b border-slate-200 pb-1">1. SOLICITUD DE DESEMBARGO</p>
          <p>
            Mayor de edad, ${calidadText}, identificado con Cédula de Ciudadanía No. <strong>${c.documentoNumero}</strong>, con este escrito solicito a su Despacho el levantamiento de la medida cautelar que pesa sobre el(los) siguiente(s) bien(es):
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 8.5pt;">
            <thead style="background-color: #F1F5F9;">
              <tr>
                <th style="border: 1px solid #94A3B8; padding: 6px; width: 5%;">#</th>
                <th style="border: 1px solid #94A3B8; padding: 6px; width: 30%;">Bien Embargado</th>
                <th style="border: 1px solid #94A3B8; padding: 6px; width: 35%;">Identificación del Bien</th>
                <th style="border: 1px solid #94A3B8; padding: 6px; width: 30%;">Ciudad / Entidad</th>
              </tr>
            </thead>
            <tbody>
              ${bienesHtml}
            </tbody>
          </table>
          <p class="text-[10px] text-slate-500 italic">
            * Pasados 15 días hábiles de la presente solicitud, se consultará el estado del desembargo en la web oficial de la Secretaría Distrital de Movilidad con el número de documento registrado.
          </p>
        </div>
      `;
    }

    if (t.entregaTitulo) {
      const numDep = document.getElementById('entrega_num_deposito').value.trim() || 'No especificado / Por verificar';
      const entOrig = document.getElementById('entrega_entidad_origen').value.trim() || 'Despacho de Coactiva';

      html += `
        <div class="space-y-3 pt-2">
          <p class="font-bold text-[#002855] text-xs uppercase border-b border-slate-200 pb-1">2. SOLICITUD DE ENTREGA DE TÍTULO DE DEPÓSITO JUDICIAL</p>
          <p>
            Mayor de edad, identificado con Cédula de Ciudadanía No. <strong>${c.documentoNumero}</strong>, solicito por medio de este escrito la <strong>ENTREGA DEL TÍTULO DE DEPÓSITO JUDICIAL</strong> emitido a mi favor con cargo a la cuenta/entidad: <strong>${entOrig}</strong> (Título/Consignación N°: <code>${numDep}</code>).
          </p>
        </div>
      `;
    }

    if (t.apropiacion) {
      const obligaciones = document.getElementById('apropiacion_obligaciones').value.trim() || 'Comparendos pendientes';

      html += `
        <div class="space-y-3 pt-2">
          <p class="font-bold text-[#002855] text-xs uppercase border-b border-slate-200 pb-1">3. SOLICITUD DE APROPIACIÓN DE DEPÓSITO JUDICIAL</p>
          <p>
            Mayor de edad, identificado con Cédula de Ciudadanía No. <strong>${c.documentoNumero}</strong>, autorizo por medio de este escrito la <strong>APROPIACIÓN DEL DEPÓSITO JUDICIAL</strong> aportado al procedimiento de cobro, con el fin de satisfacer las obligaciones que adeudo a favor de la Secretaría Distrital de Movilidad correspondientes a: <strong>${obligaciones}</strong>.
          </p>
        </div>
      `;
    }

    bodyContainer.innerHTML = html;
  },

  // ----------------------------------------------------------------------------
  // RADICACIÓN OFICIAL
  // ----------------------------------------------------------------------------
  bindRadicacionActions() {
    const btnRadicar = document.getElementById('btn-generar-radicacion');
    const modal = document.getElementById('modal-radicacion');
    const closeTop = document.getElementById('btn-modal-close');
    const closeBottom = document.getElementById('btn-modal-close-action');
    const copyBtn = document.getElementById('btn-copy-radicado');
    const printBtn = document.getElementById('btn-print-certificate');
    const newBtn = document.getElementById('btn-nuevo-tramite');

    const closeModal = () => modal.classList.add('hidden');
    closeTop.addEventListener('click', closeModal);
    closeBottom.addEventListener('click', closeModal);

    btnRadicar.addEventListener('click', () => {
      if (!Store.isModule1Valid) {
        alert('Por favor complete los datos obligatorios del solicitante (Módulo 1).');
        document.getElementById('module-1-section').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (Store.area === 'coactiva') {
        const errors = Validators.validateCoactivaForms();
        if (errors.length > 0) {
          alert('Por favor complete todos los campos y soportes obligatorios:\n\n• ' + errors.join('\n• '));
          return;
        }
      } else {
        // Prescripción
        const comp = document.getElementById('prescripcion_comparendo').value.trim();
        const fec = document.getElementById('prescripcion_fecha').value;
        const plc = document.getElementById('prescripcion_placa').value.trim();
        const cau = document.getElementById('prescripcion_causal').value;
        const file = Store.prescripcion.archivo;

        if (!comp || !fec || !plc || !cau || !file) {
          alert('Por favor complete todos los campos de prescripción y adjunte el documento probatorio (PDF).');
          return;
        }

        Store.prescripcion.comparendo = comp;
        Store.prescripcion.fecha = fec;
        Store.prescripcion.placa = plc;
        Store.prescripcion.causal = cau;
      }

      // Animación de radicación institucional
      btnRadicar.disabled = true;
      btnRadicar.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm"></i> Conectando con Sistema de Gestión Documental...';

      setTimeout(() => {
        btnRadicar.disabled = false;
        btnRadicar.innerHTML = '<i class="fa-solid fa-paper-plane text-sm"></i> <span>Generar Radicación</span>';
        this.openRadicacionModal();
      }, 700);
    });

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

  openRadicacionModal() {
    const radicado = Utils.generateRadicadoNumber();
    const timestamp = Utils.getCurrentDateTimeString();
    Store.lastRadicacion = { radicado, timestamp };

    document.getElementById('modal-radicado-code').textContent = radicado;
    document.getElementById('modal-timestamp').textContent = timestamp;

    const c = Store.citizen;
    const nombreCompleto = c.solicitanteTipo === 'empresa'
      ? c.razonSocial
      : [c.nombres, c.primerApellido, c.segundoApellido].filter(Boolean).join(' ');

    document.getElementById('modal-resumen-nombre').textContent = nombreCompleto || 'N/A';
    document.getElementById('modal-resumen-documento').textContent = `${c.documentoTipo} - ${c.documentoNumero}`;
    document.getElementById('modal-resumen-correo').textContent = c.correo;
    document.getElementById('modal-resumen-telefono').textContent = c.telefono;
    document.getElementById('modal-resumen-direccion').textContent = `${c.direccionCompleta}, ${c.municipio} - ${c.departamento}`;

    const container = document.getElementById('modal-resumen-tramite-container');
    const anexosContainer = document.getElementById('modal-resumen-anexos-container');
    const printTbody = document.getElementById('print-tramite-tbody');
    const printAnexosTd = document.getElementById('print-anexos-td');

    let resumenHtml = '';
    let printTrs = '';
    let anexosHtml = '';
    let printAnexos = [];

    if (Store.area === 'coactiva') {
      const t = Store.coactiva.tramites;
      const d = Store.coactiva.desembargo;

      resumenHtml += `
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Sede de Radicación:</span>
          <span class="col-span-2 font-bold text-[#002855]">Subdirección de Jurisdicción Coactiva (Cra. 28A No. 17 A 20)</span>
        </div>
      `;
      printTrs += `
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold; width: 35%;">Dependencia Competente:</td><td style="border: 1px solid #ccc; padding: 6px;">Subdirección de Jurisdicción Coactiva (Cra. 28A No. 17 A 20)</td></tr>
      `;

      if (t.desembargo) {
        const bienesSummary = d.bienes.map(b => `${b.tipo}: ${b.identificacion} (${b.ciudadEmpresa})`).join(' | ');
        resumenHtml += `
          <div class="grid grid-cols-3 p-2">
            <span class="text-slate-500 font-medium">1. Solicitud Desembargo:</span>
            <span class="col-span-2 text-slate-800">Calidad: <strong>${d.calidad}</strong>. Bienes: ${bienesSummary}</span>
          </div>
        `;
        printTrs += `
          <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">1. Desembargo Solicitado:</td><td style="border: 1px solid #ccc; padding: 6px;">Calidad: ${d.calidad} - Bienes: ${bienesSummary}</td></tr>
        `;

        if (d.cedulaArchivo) {
          anexosHtml += `
            <div class="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200 mb-1">
              <i class="fa-solid fa-file-pdf text-red-600"></i>
              <span class="font-medium text-xs truncate">${d.cedulaArchivo.name} (${Utils.formatFileSize(d.cedulaArchivo.size)})</span>
              <span class="text-[10px] text-emerald-700 font-bold ml-auto">Cédula propietario</span>
            </div>
          `;
          printAnexos.push(`Fotocopia Cédula Propietario: ${d.cedulaArchivo.name}`);
        }

        if (d.volanteArchivo) {
          anexosHtml += `
            <div class="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200 mb-1">
              <i class="fa-solid fa-file-pdf text-red-600"></i>
              <span class="font-medium text-xs truncate">${d.volanteArchivo.name} (${Utils.formatFileSize(d.volanteArchivo.size)})</span>
              <span class="text-[10px] text-emerald-700 font-bold ml-auto">Volante cancelado</span>
            </div>
          `;
          printAnexos.push(`Volante Pago Cancelado: ${d.volanteArchivo.name}`);
        }

        if (d.poderArchivo) {
          anexosHtml += `
            <div class="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200 mb-1">
              <i class="fa-solid fa-file-contract text-amber-700"></i>
              <span class="font-medium text-xs truncate">${d.poderArchivo.name} (${Utils.formatFileSize(d.poderArchivo.size)})</span>
              <span class="text-[10px] text-amber-800 font-bold ml-auto">Poder autenticado</span>
            </div>
          `;
          printAnexos.push(`Poder Especial Autenticado: ${d.poderArchivo.name}`);
        }
      }

      if (t.entregaTitulo) {
        const ent = document.getElementById('entrega_entidad_origen').value.trim();
        const num = document.getElementById('entrega_num_deposito').value.trim() || 'N/A';
        resumenHtml += `
          <div class="grid grid-cols-3 p-2">
            <span class="text-slate-500 font-medium">2. Entrega de Título:</span>
            <span class="col-span-2 text-slate-800">Título N°: ${num} | Entidad/Juzgado: ${ent}</span>
          </div>
        `;
        printTrs += `
          <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">2. Entrega Título Depósito:</td><td style="border: 1px solid #ccc; padding: 6px;">Título: ${num} - Entidad: ${ent}</td></tr>
        `;

        if (Store.coactiva.entrega.soporteArchivo) {
          anexosHtml += `
            <div class="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200 mb-1">
              <i class="fa-solid fa-file-pdf text-red-600"></i>
              <span class="font-medium text-xs truncate">${Store.coactiva.entrega.soporteArchivo.name}</span>
              <span class="text-[10px] text-emerald-700 font-bold ml-auto">Soporte título</span>
            </div>
          `;
          printAnexos.push(`Soporte de Título Judicial: ${Store.coactiva.entrega.soporteArchivo.name}`);
        }
      }

      if (t.apropiacion) {
        const ob = document.getElementById('apropiacion_obligaciones').value.trim();
        resumenHtml += `
          <div class="grid grid-cols-3 p-2">
            <span class="text-slate-500 font-medium">3. Apropiación Depósito:</span>
            <span class="col-span-2 text-slate-800">Aplicación a: ${ob}</span>
          </div>
        `;
        printTrs += `
          <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">3. Apropiación Depósito:</td><td style="border: 1px solid #ccc; padding: 6px;">Obligaciones: ${ob}</td></tr>
        `;

        if (Store.coactiva.apropiacion.soporteArchivo) {
          anexosHtml += `
            <div class="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200 mb-1">
              <i class="fa-solid fa-file-pdf text-red-600"></i>
              <span class="font-medium text-xs truncate">${Store.coactiva.apropiacion.soporteArchivo.name}</span>
              <span class="text-[10px] text-emerald-700 font-bold ml-auto">Autorización y consignación</span>
            </div>
          `;
          printAnexos.push(`Autorización de Apropiación: ${Store.coactiva.apropiacion.soporteArchivo.name}`);
        }
      }

    } else {
      // Prescripción
      const p = Store.prescripcion;
      resumenHtml += `
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Trámite Radicado:</span>
          <span class="col-span-2 font-bold text-amber-900">Declaratoria de Prescripción (Ley 769 de 2002)</span>
        </div>
        <div class="grid grid-cols-3 p-2">
          <span class="text-slate-500 font-medium">Comparendo / Placa:</span>
          <span class="col-span-2 text-slate-800 font-mono">${p.comparendo} (${p.placa})</span>
        </div>
      `;
      printTrs += `
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Tipo de Trámite:</td><td style="border: 1px solid #ccc; padding: 6px;">Prescripción de Comparendos (Ley 769/2002)</td></tr>
        <tr><td style="border: 1px solid #ccc; padding: 6px; font-weight: bold;">Comparendo y Placa:</td><td style="border: 1px solid #ccc; padding: 6px;">${p.comparendo} - ${p.placa}</td></tr>
      `;

      if (p.archivo) {
        anexosHtml += `
          <div class="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-200 mb-1">
            <i class="fa-solid fa-file-pdf text-red-600"></i>
            <span class="font-medium text-xs truncate">${p.archivo.name}</span>
            <span class="text-[10px] text-emerald-700 font-bold ml-auto">Pruebas prescripción</span>
          </div>
        `;
        printAnexos.push(`Expediente / Pruebas: ${p.archivo.name}`);
      }
    }

    container.innerHTML = resumenHtml;
    anexosContainer.innerHTML = anexosHtml || '<p class="text-slate-400 text-xs italic">Sin anexos registrados</p>';

    // Impresión constancia
    printTbody.innerHTML = printTrs;
    printAnexosTd.innerHTML = printAnexos.length > 0
      ? printAnexos.map(a => `• ${a}`).join('<br>')
      : 'Sin anexos';

    document.getElementById('print-radicado-code').textContent = radicado;
    document.getElementById('print-nombre').textContent = nombreCompleto;
    document.getElementById('print-documento').textContent = `${c.documentoTipo} ${c.documentoNumero}`;
    document.getElementById('print-correo').textContent = c.correo;
    document.getElementById('print-telefono').textContent = c.telefono;
    document.getElementById('print-direccion').textContent = `${c.direccionCompleta}, ${c.municipio} - ${c.departamento}`;

    // Stepper Paso 4 completado
    const step4Badge = document.getElementById('step-badge-4');
    const step4Indicator = document.getElementById('step-indicator-4');
    step4Indicator.className = 'flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border-l-4 border-emerald-600 transition-all';
    step4Badge.className = 'w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold';
    step4Badge.innerHTML = '<i class="fa-solid fa-check"></i>';

    document.getElementById('modal-radicacion').classList.remove('hidden');
  },

  // ----------------------------------------------------------------------------
  // AUTOLLENADO RÁPIDO PARA TESTING
  // ----------------------------------------------------------------------------
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

      document.getElementById('correo_electronico').value = 'maria.rodriguez@movilidadbogota.gov.co';
      Store.citizen.correo = 'maria.rodriguez@movilidadbogota.gov.co';

      document.getElementById('correo_confirmacion').value = 'maria.rodriguez@movilidadbogota.gov.co';
      Store.citizen.correoConfirmacion = 'maria.rodriguez@movilidadbogota.gov.co';

      Validators.validateEmailMatch();
      this.updateInheritedFields();
      Validators.validateModule1();

      // Abrir Cobro
      Store.isCobroMenuOpen = true;
      document.getElementById('selector-tramites-container').classList.remove('hidden');
      document.getElementById('btn-cobro-arrow').classList.add('rotate-180');
      this.renderActiveArea();

      // Simular un bien completo en la tabla
      if (Store.coactiva.desembargo.bienes.length > 0) {
        Store.coactiva.desembargo.bienes[0].identificacion = 'ABC-123';
        Store.coactiva.desembargo.bienes[0].ciudadEmpresa = 'Bogotá D.C.';
        const firstRow = document.getElementById('bienes-table-tbody').firstElementChild;
        if (firstRow) {
          const idInput = firstRow.querySelector('input[data-field="identificacion"]');
          const cityInput = firstRow.querySelector('input[data-field="ciudadEmpresa"]');
          if (idInput) idInput.value = 'ABC-123';
          if (cityInput) cityInput.value = 'Bogotá D.C.';
        }
      }

      // Simular archivos mock para facilitar la prueba
      const mockFilePdf = new File(["dummy pdf content"], "cedula_propietario.pdf", { type: "application/pdf" });
      const mockFileVolante = new File(["dummy volante"], "volante_cancelado_banco.pdf", { type: "application/pdf" });

      Store.coactiva.desembargo.cedulaArchivo = mockFilePdf;
      Store.coactiva.desembargo.volanteArchivo = mockFileVolante;

      const cPreview = document.getElementById('cedula-file-preview');
      if (cPreview) {
        cPreview.classList.remove('hidden');
        cPreview.textContent = '✓ cedula_propietario.pdf (1.2 MB)';
      }
      const vPreview = document.getElementById('volante-file-preview');
      if (vPreview) {
        vPreview.classList.remove('hidden');
        vPreview.textContent = '✓ volante_cancelado_banco.pdf (850 KB)';
      }
    });
  }
};

// ------------------------------------------------------------------------------
// INICIALIZACIÓN AL CARGAR EL DOM
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  AddressBuilder.init();
  BienesTableController.init();
  FileController.init();
  UIController.init();
  Validators.validateModule1();
});
