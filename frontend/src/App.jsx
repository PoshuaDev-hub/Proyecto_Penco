import { useState, useEffect } from 'react';
import {
  IconHospital,
  IconBriefcase,
  IconUsers,
  IconGitBranch,
  IconSparkles,
  IconShield,
  IconUser,
  IconSearch,
  IconPlus,
  IconTrash,
  IconChevronRight,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconX,
  IconBars,
  IconLogout,
  IconSun,
  IconMoon,
  IconLock,
  IconFileText,
  IconAlertTriangle,
  IconKey,
} from './components/Icons';

const API_BASE = 'http://127.0.0.1:8000/api';

const ETAPAS_PROCESO = [
  { id: 'solicitud', nombre: '1. Solicitud de llamado', desc: 'Requerimiento de jefatura médica' },
  { id: 'perfil', nombre: '2. Preparación de perfil', desc: 'Competencias y requisitos normados' },
  { id: 'aviso', nombre: '3. Aviso de postulación', desc: 'Publicación en portal de empleos públicos' },
  { id: 'recepcion', nombre: '4. Recepción de expedientes', desc: 'Recepción digital de antecedentes' },
  { id: 'revision_curricular', nombre: '5. Revisión curricular', desc: 'Semáforo documental de comisión' },
  { id: 'entrevistas_tecnicas', nombre: '6. Entrevistas técnicas', desc: 'Evaluación técnica de especialidad' },
  { id: 'evaluacion_psicolaboral', nombre: '7. Evaluación psicolaboral', desc: 'Entrevista conductual adaptativa' },
  { id: 'informe_directora', nombre: '8. Informe a la Directora', desc: 'Elevación de terna final motivada' },
  { id: 'integracion', nombre: '9. Proceso de integración', desc: 'Examen de salud y resolución exenta' },
  { id: 'cerrado', nombre: '10. Cerrado', desc: 'Concurso culminado y archivado' },
];

const ROLES_INSTITUCIONALES = [
  {
    id: 'carolina',
    nombre: 'Carolina',
    nombreCompleto: 'Carolina Ruiz Parra',
    cargo: 'Jefa de Gestión y Desarrollo de las Personas',
    cargoCorto: 'Jefa de Gestión y Desa...',
    username: 'carolina.ruiz',
    passwordDefault: 'penco2026',
    initials: 'CR',
    desc: 'Dirección de concursos, validación de perfiles y tramitación de resoluciones de contratación.',
  },
  {
    id: 'psicologo',
    nombre: 'Psicólogo/a',
    nombreCompleto: 'Psicólogo/a Laboral RRHH',
    cargo: 'Especialista en Selección por Competencias',
    cargoCorto: 'Especialista en Selecc...',
    username: 'psicologia.rrhh',
    passwordDefault: 'penco2026',
    initials: 'PL',
    desc: 'Diseño del banco de preguntas adaptativas, rúbricas de incidentes críticos y entrevistas.',
  },
  {
    id: 'comision',
    nombre: 'Comisión',
    nombreCompleto: 'Comisión de Selección / Jefatura UCI',
    cargo: 'Comité Técnico y Evaluador Clínico',
    cargoCorto: 'Comité Técnico y Evalu...',
    username: 'comision.seleccion',
    passwordDefault: 'penco2026',
    initials: 'CE',
    desc: 'Revisión colegiada de antecedentes curriculares y entrevistas de especialidad médica.',
  },
  {
    id: 'admin',
    nombre: 'Administrador',
    nombreCompleto: 'Administrador General TI',
    cargo: 'Soporte y Auditoría Institucional',
    cargoCorto: 'Soporte y Auditoría In...',
    username: 'admin',
    passwordDefault: 'admin123',
    initials: 'TI',
    desc: 'Gestión de infraestructura, accesos por token y supervisión de la pista de auditoría inmutable.',
  },
];

export default function App() {
  // Estado de usuario y token de sesión
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('hospital_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de Login (coincidentes con el diseño de la foto)
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [selectedProfileId, setSelectedProfileId] = useState('admin');
  const [loginError, setLoginError] = useState('');

  // Estados de datos CRUD
  const [procesos, setProcesos] = useState([]);
  const [perfilesCargo, setPerfilesCargo] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [auditorias, setAuditorias] = useState([]);

  // Selecciones activas en cascada
  const [selectedProceso, setSelectedProceso] = useState(null);
  const [selectedPostulante, setSelectedPostulante] = useState(null);
  const [filtroConcursoId, setFiltroConcursoId] = useState('todos'); // Cascada Concurso -> Postulantes

  // Modales CRUD
  const [showModalProceso, setShowModalProceso] = useState(false);
  const [showModalPostulante, setShowModalPostulante] = useState(false);
  const [showModalPregunta, setShowModalPregunta] = useState(false);
  const [showModalPerfil, setShowModalPerfil] = useState(false);

  // Filtros y búsquedas
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreSimulador, setScoreSimulador] = useState(3.0);

  // Formularios de Creación (Formato Cascada)
  const [nuevoPerfilData, setNuevoPerfilData] = useState({
    nombre: '',
    area_usuaria: '',
    requisitos_minimos: '',
    requisitos_deseables: '',
    competencias_clave: '',
    funciones_principales: '',
  });

  const [nuevoProcesoData, setNuevoProcesoData] = useState({
    perfil_cargo: '',
    area_usuaria: '',
    fecha_cierre: '2026-11-15',
    observaciones: '',
  });

  const [nuevoPostulanteData, setNuevoPostulanteData] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    email: '',
    telefono: '',
    formacion_academica: '',
    experiencia: '',
    documentos_completos: true,
  });

  const [nuevaPreguntaData, setNuevaPreguntaData] = useState({
    texto: '',
    competencia: 'Manejo de Crisis y Presión',
    dificultad: 'media',
    es_hija: false,
    madre_id: '',
    condicion_activacion: 'si_puntaje_bajo',
  });

  // Headers con Token para asegurar todas las llamadas REST
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(currentUser?.token ? { Authorization: `Token ${currentUser.token}` } : {}),
  });

  // Carga inicial y chequeo de salud
  useEffect(() => {
    fetch(`${API_BASE}/health/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') setApiOnline(true);
      })
      .catch(() => setApiOnline(false));

    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resProc, resPerfiles, resPost, resPreg, resAudit] = await Promise.all([
        fetch(`${API_BASE}/procesos/`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/perfiles-cargo/`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/postulaciones/`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/preguntas/`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/auditoria/`).then((r) => r.json()).catch(() => []),
      ]);

      const procList = Array.isArray(resProc) ? resProc : (resProc.results || []);
      const perfList = Array.isArray(resPerfiles) ? resPerfiles : (resPerfiles.results || []);
      const postList = Array.isArray(resPost) ? resPost : (resPost.results || []);
      const pregList = Array.isArray(resPreg) ? resPreg : (resPreg.results || []);
      const auditList = Array.isArray(resAudit) ? resAudit : (resAudit.results || []);

      setProcesos(procList);
      setPerfilesCargo(perfList);
      setPostulaciones(postList);
      setPreguntas(pregList);
      setAuditorias(auditList);

      if (procList.length > 0 && !selectedProceso) {
        setSelectedProceso(procList[0]);
      }
      if (perfList.length > 0 && !nuevoProcesoData.perfil_cargo) {
        setNuevoProcesoData((prev) => ({
          ...prev,
          perfil_cargo: perfList[0].id,
          area_usuaria: perfList[0].area_usuaria || 'Unidad de Cuidados Intensivos',
        }));
      }
    } catch (err) {
      console.warn('Utilizando datos locales de contingencia:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manejador de Login con Token de Seguridad
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        const userObj = {
          id: data.user.id,
          nombre: data.user.nombre,
          username: data.user.username,
          rol: data.user.rol,
          email: data.user.email,
          token: data.token, // Token real emitido por Django rest_framework.authtoken
          initials: data.user.nombre.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() || 'TI',
        };
        setCurrentUser(userObj);
        localStorage.setItem('hospital_user', JSON.stringify(userObj));
        setActiveTab('dashboard');
        registrarAuditoria('INICIO_SESION', `Acceso seguro con Token: ${userObj.nombre} (${userObj.rol})`);
        return;
      }
    } catch {
      // Modo offline fallback
    }

    // Fallback de demostración institucional con token simulado
    const demo = ROLES_INSTITUCIONALES.find(
      (r) => r.username.toLowerCase() === loginUsername.toLowerCase()
    );
    if (demo) {
      const userObj = {
        id: 99,
        nombre: demo.nombreCompleto,
        username: demo.username,
        rol: demo.cargo,
        email: `${demo.username}@hospitalpenco.cl`,
        token: 'token_' + demo.id + '_' + Date.now().toString(36),
        initials: demo.initials,
      };
      setCurrentUser(userObj);
      localStorage.setItem('hospital_user', JSON.stringify(userObj));
      setActiveTab('dashboard');
      registrarAuditoria('INICIO_SESION', `Acceso institucional concedido a ${userObj.nombre}`);
    } else {
      setLoginError('Credenciales incorrectas. Seleccione un perfil de prueba o use admin/admin123');
    }
  };

  // Selección de perfil institucional de prueba (coincidente con la foto)
  const handleSelectProfileCard = (role) => {
    setSelectedProfileId(role.id);
    setLoginUsername(role.username);
    setLoginPassword(role.passwordDefault);
  };

  const handleLogout = () => {
    if (currentUser) {
      registrarAuditoria('CIERRE_SESION', `El usuario ${currentUser.nombre} cerró su sesión de forma segura.`);
    }
    setCurrentUser(null);
    localStorage.removeItem('hospital_user');
  };

  const registrarAuditoria = async (accion, detalle) => {
    const responsableNombre = currentUser ? currentUser.nombre : 'Usuario Institucional';
    const nuevaAuditoria = {
      id: Date.now(),
      fecha: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
      accion,
      usuario_nombre: responsableNombre,
      detalle,
    };
    setAuditorias((prev) => [nuevaAuditoria, ...prev]);

    try {
      await fetch(`${API_BASE}/auditoria/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          proceso: selectedProceso?.id || 1,
          accion,
          detalle,
        }),
      });
    } catch {
      // offline
    }
  };

  // ================= CRUD: PERFILES DE CARGO (CASCADA BASE) =================
  const handleCrearPerfilCargo = async (e) => {
    e.preventDefault();
    const payload = { ...nuevoPerfilData, activo: true };

    try {
      const res = await fetch(`${API_BASE}/perfiles-cargo/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setPerfilesCargo((prev) => [data, ...prev]);
    } catch {
      const nuevoLocal = { id: Date.now(), ...payload };
      setPerfilesCargo((prev) => [nuevoLocal, ...prev]);
    }

    registrarAuditoria('CREAR_PERFIL_CARGO', `Nuevo perfil de cargo incorporado al catálogo: ${payload.nombre}`);
    setShowModalPerfil(false);
    setNuevoPerfilData({
      nombre: '',
      area_usuaria: '',
      requisitos_minimos: '',
      requisitos_deseables: '',
      competencias_clave: '',
      funciones_principales: '',
    });
  };

  // ================= CRUD: PROCESOS (CASCADA CARGO -> PROCESO) =================
  const handleCrearProceso = async (e) => {
    e.preventDefault();
    const perfilObj = perfilesCargo.find((p) => p.id === parseInt(nuevoProcesoData.perfil_cargo, 10)) || {
      nombre: 'Cargo Clínico Especializado',
    };

    const payload = {
      perfil_cargo: parseInt(nuevoProcesoData.perfil_cargo, 10) || (perfilesCargo[0]?.id ?? 1),
      area_usuaria: nuevoProcesoData.area_usuaria || 'Área Clínica',
      estado: 'solicitud',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_cierre: nuevoProcesoData.fecha_cierre,
      observaciones: nuevoProcesoData.observaciones,
    };

    try {
      const res = await fetch(`${API_BASE}/procesos/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const nuevo = {
        ...data,
        perfil_cargo_nombre: perfilObj.nombre,
        estado_display: 'Solicitud de llamado',
      };
      setProcesos((prev) => [nuevo, ...prev]);
      setSelectedProceso(nuevo);
    } catch {
      const nuevoLocal = {
        id: Date.now(),
        ...payload,
        perfil_cargo_nombre: perfilObj.nombre,
        estado_display: 'Solicitud de llamado',
      };
      setProcesos((prev) => [nuevoLocal, ...prev]);
      setSelectedProceso(nuevoLocal);
    }

    registrarAuditoria('CREAR_PROCESO', `Apertura de concurso: ${perfilObj.nombre} (${payload.area_usuaria})`);
    setShowModalProceso(false);
  };

  const handleAvanzarEtapaProceso = async () => {
    if (!selectedProceso) return;
    const currentIndex = ETAPAS_PROCESO.findIndex((e) => e.id === selectedProceso.estado);
    if (currentIndex < ETAPAS_PROCESO.length - 1) {
      const siguiente = ETAPAS_PROCESO[currentIndex + 1].id;
      const updated = {
        ...selectedProceso,
        estado: siguiente,
        estado_display: ETAPAS_PROCESO[currentIndex + 1].nombre,
      };
      setSelectedProceso(updated);
      setProcesos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

      registrarAuditoria(
        'AVANCE_ETAPA',
        `Concurso "${selectedProceso.perfil_cargo_nombre}" avanzó a: ${ETAPAS_PROCESO[currentIndex + 1].nombre}`
      );

      try {
        await fetch(`${API_BASE}/procesos/${selectedProceso.id}/`, {
          method: 'PATCH',
          headers: getAuthHeaders(),
          body: JSON.stringify({ estado: siguiente }),
        });
      } catch {
        // offline
      }
    }
  };

  const handleEliminarProceso = async (id) => {
    if (!window.confirm('¿Desea archivar o dar de baja este proceso de selección?')) return;

    setProcesos((prev) => prev.filter((p) => p.id !== id));
    if (selectedProceso?.id === id) {
      setSelectedProceso(procesos.find((p) => p.id !== id) || null);
    }
    registrarAuditoria('ELIMINAR_PROCESO', `Concurso ID #${id} archivado/eliminado.`);

    try {
      await fetch(`${API_BASE}/procesos/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch {
      // offline
    }
  };

  // ================= CRUD: POSTULANTES =================
  const handleCrearPostulante = async (e) => {
    e.preventDefault();
    if (!selectedProceso) {
      alert('Debe existir un proceso de selección activo.');
      return;
    }

    const payloadPostulante = {
      nombres: nuevoPostulanteData.nombres,
      apellidos: nuevoPostulanteData.apellidos,
      rut: nuevoPostulanteData.rut,
      email: nuevoPostulanteData.email,
      telefono: nuevoPostulanteData.telefono,
      formacion_academica: nuevoPostulanteData.formacion_academica,
      experiencia: nuevoPostulanteData.experiencia,
    };

    let postulanteId = Date.now();
    try {
      const resPost = await fetch(`${API_BASE}/postulantes/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payloadPostulante),
      });
      const dataPost = await resPost.json();
      postulanteId = dataPost.id;
    } catch {
      // offline
    }

    const payloadPostulacion = {
      proceso: selectedProceso.id,
      postulante: postulanteId,
      estado: 'recibida',
      documentos_completos: nuevoPostulanteData.documentos_completos,
      observaciones: 'Expediente digital recepcionado conforme.',
    };

    let nuevaPostulacion = {
      id: Date.now(),
      proceso: selectedProceso.id,
      estado: 'recibida',
      estado_display: 'Recibida',
      documentos_completos: nuevoPostulanteData.documentos_completos,
      postulante_nombre: `${nuevoPostulanteData.nombres} ${nuevoPostulanteData.apellidos}`,
      postulante_rut: nuevoPostulanteData.rut,
      postulante_email: nuevoPostulanteData.email,
      postulante_telefono: nuevoPostulanteData.telefono,
      postulante_formacion: nuevoPostulanteData.formacion_academica,
      postulante_experiencia: nuevoPostulanteData.experiencia,
    };

    try {
      const res = await fetch(`${API_BASE}/postulaciones/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payloadPostulacion),
      });
      const data = await res.json();
      nuevaPostulacion = { ...nuevaPostulacion, id: data.id };
    } catch {
      // offline
    }

    setPostulaciones((prev) => [nuevaPostulacion, ...prev]);
    setSelectedPostulante(nuevaPostulacion);
    registrarAuditoria(
      'NUEVO_POSTULANTE',
      `Inscripción de ${nuevaPostulacion.postulante_nombre} (RUT: ${nuevaPostulacion.postulante_rut}) en concurso #${selectedProceso.id}`
    );

    setShowModalPostulante(false);
    setNuevoPostulanteData({
      nombres: '',
      apellidos: '',
      rut: '',
      email: '',
      telefono: '',
      formacion_academica: '',
      experiencia: '',
      documentos_completos: true,
    });
  };

  const handleCambiarEstadoPostulacion = async (postId, nuevoEstado) => {
    const estadoLabels = {
      preseleccionada: 'Preseleccionada',
      en_revision: 'En Revisión',
      descartada: 'Descartada por Bases',
      aprobada: 'Aprobada / Seleccionada',
    };

    setPostulaciones((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, estado: nuevoEstado, estado_display: estadoLabels[nuevoEstado] || nuevoEstado } : p
      )
    );

    if (selectedPostulante?.id === postId) {
      setSelectedPostulante((prev) => ({
        ...prev,
        estado: nuevoEstado,
        estado_display: estadoLabels[nuevoEstado] || nuevoEstado,
      }));
    }

    registrarAuditoria(
      'ACUERDO_COMISION',
      `Resolución de comité sobre postulante #${postId}: asignado a "${estadoLabels[nuevoEstado] || nuevoEstado}".`
    );

    try {
      await fetch(`${API_BASE}/postulaciones/${postId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch (err) {
      console.warn('Error al persistir estado:', err);
    }
  };

  const handleEliminarPostulacion = async (postId) => {
    if (!window.confirm('¿Está seguro de eliminar esta postulación del concurso?')) return;

    setPostulaciones((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPostulante?.id === postId) setSelectedPostulante(null);
    registrarAuditoria('ELIMINAR_POSTULACION', `Postulación #${postId} retirada del concurso.`);

    try {
      await fetch(`${API_BASE}/postulaciones/${postId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch {
      // offline
    }
  };

  // ================= CRUD: PREGUNTAS =================
  const handleCrearPregunta = async (e) => {
    e.preventDefault();

    const payload = {
      texto: nuevaPreguntaData.texto,
      competencia: nuevaPreguntaData.competencia,
      dificultad: nuevaPreguntaData.dificultad,
      madre: nuevaPreguntaData.es_hija && nuevaPreguntaData.madre_id ? parseInt(nuevaPreguntaData.madre_id, 10) : null,
      activa: true,
    };

    let nueva = {
      id: Date.now(),
      ...payload,
      dificultad_display: nuevaPreguntaData.dificultad.toUpperCase(),
      hijas_count: 0,
    };

    try {
      const res = await fetch(`${API_BASE}/preguntas/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      nueva = { ...nueva, id: data.id };
    } catch {
      // offline
    }

    setPreguntas((prev) => [nueva, ...prev]);
    registrarAuditoria('NUEVA_PREGUNTA', `Pregunta por competencia creada: "${nueva.texto.substring(0, 45)}..."`);

    setShowModalPregunta(false);
    setNuevaPreguntaData({
      texto: '',
      competencia: 'Manejo de Crisis y Presión',
      dificultad: 'media',
      es_hija: false,
      madre_id: '',
      condicion_activacion: 'si_puntaje_bajo',
    });
  };

  const handleEliminarPregunta = async (pregId) => {
    if (!window.confirm('¿Eliminar esta pregunta del banco adaptativo?')) return;

    setPreguntas((prev) => prev.filter((p) => p.id !== pregId));
    registrarAuditoria('ELIMINAR_PREGUNTA', `Pregunta ID #${pregId} eliminada del banco.`);

    try {
      await fetch(`${API_BASE}/preguntas/${pregId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch {
      // offline
    }
  };

  // Filtrado en Cascada de postulaciones (Concurso -> Estado -> Término de búsqueda)
  const postulacionesFiltradas = postulaciones.filter((p) => {
    const matchConcurso = filtroConcursoId === 'todos' || p.proceso === parseInt(filtroConcursoId, 10);
    const matchEstado = filtroStatus === 'todos' || p.estado === filtroStatus;
    const matchBusqueda =
      searchTerm === '' ||
      (p.postulante_nombre && p.postulante_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.postulante_rut && p.postulante_rut.includes(searchTerm));
    return matchConcurso && matchEstado && matchBusqueda;
  });

  // ================= RENDER: LOGIN FORM (EXACTO AL DE LA FOTO DEL USUARIO) =================
  if (!currentUser) {
    return (
      <div className={dark ? 'app dark' : 'app'}>
        <div className="login-page">
          <div className="login-box">
            {/* Encabezado Institucional Servicio de Salud Talcahuano */}
            <div className="login-logo">
              <div className="login-institution-badge">
                <IconHospital size={16} />
                <span>SERVICIO DE SALUD TALCAHUANO &bull; HOSPITAL PENCO LIRQUÉN</span>
              </div>
              <h1>
                <b>Hospital Penco</b> <span>ERP</span>
              </h1>
              <p>Subdirección de Gestión y Desarrollo de las Personas &bull; Ley 18.834</p>
            </div>

            <div className="card-login">
              <div className="login-card-body">
                {loginError && (
                  <div
                    style={{
                      background: '#fee2e2',
                      border: '1px solid #fca5a5',
                      color: '#991b1b',
                      padding: '10px 14px',
                      borderRadius: 6,
                      marginBottom: 16,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <IconAlertTriangle size={18} />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit}>
                  {/* Input 1: Usuario con icono a la derecha */}
                  <div className="erp-input-box">
                    <input
                      type="text"
                      className="erp-input-field"
                      placeholder="Usuario institucional"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      required
                    />
                    <div className="erp-input-icon">
                      <IconUser size={18} />
                    </div>
                  </div>

                  {/* Input 2: Contraseña con icono a la derecha */}
                  <div className="erp-input-box">
                    <input
                      type="password"
                      className="erp-input-field"
                      placeholder="Contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <div className="erp-input-icon">
                      <IconLock size={18} />
                    </div>
                  </div>

                  {/* Botón azul exacto al de la foto */}
                  <button type="submit" className="btn-login-submit">
                    <IconCheck size={18} />
                    <span>Ingresar al Sistema ERP</span>
                  </button>
                </form>

                {/* Sección de Perfiles Institucionales de Prueba (Idéntico a la foto) */}
                <div className="login-quick-section">
                  <div className="login-quick-title">
                    <IconShield size={16} />
                    <span>PERFILES INSTITUCIONALES DE PRUEBA:</span>
                  </div>

                  <div className="role-cards-grid">
                    {ROLES_INSTITUCIONALES.map((rol) => {
                      const isSelected = selectedProfileId === rol.id;
                      return (
                        <div
                          key={rol.id}
                          className={`role-card-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => handleSelectProfileCard(rol)}
                        >
                          <div className="role-avatar-circle">{rol.initials}</div>
                          <div className="role-card-info">
                            <span className="role-card-name">{rol.nombre}</span>
                            <span className="role-card-title">{rol.cargoCorto}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Aclaración formal del dominio (Sin Pacientes Clínicos) */}
                <div className="domain-alert-banner">
                  <strong>Aviso de Dominio Hospitalario:</strong> Uso interno exclusivo para la{' '}
                  <strong>Subdirección de Gestión y Desarrollo de las Personas</strong>. Todos los usuarios son{' '}
                  <strong>profesionales de salud o evaluadores</strong>; no administra pacientes ni fichas clínicas.
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--erp-text-muted)' }}>
              Hospital Penco Lirquén &bull; Sistema ERP de Selección de Personas &bull; 2026
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= RENDER: DASHBOARD Y MANTENEDORES (ERP INTERNO) =================
  return (
    <div className={dark ? 'app dark' : 'app'}>
      <div className="erp-wrapper">
        {/* ================= SIDEBAR LATERAL ================= */}
        <aside className={`erp-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <IconHospital size={20} />
            </div>
            <div className="brand-text">
              <span className="brand-text-title">HOSPITAL PENCO</span>
              <span className="brand-text-subtitle">Gestión Personas ERP</span>
            </div>
          </div>

          {/* Usuario Conectado con Iniciales y Token */}
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{currentUser.initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{currentUser.nombre}</span>
              <span className="sidebar-user-role">{currentUser.rol}</span>
            </div>
          </div>

          {/* Menú de Mantenedores */}
          <nav className="sidebar-nav">
            <div className="nav-header">Módulos de Gestión</div>

            <button
              className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <div className="sidebar-icon"><IconBriefcase size={18} /></div>
              <span className="nav-text">Panel General</span>
            </button>

            <button
              className={`sidebar-link ${activeTab === 'perfiles' ? 'active' : ''}`}
              onClick={() => setActiveTab('perfiles')}
            >
              <div className="sidebar-icon"><IconFileText size={18} /></div>
              <span className="nav-text">Perfiles de Cargo</span>
              <span className="badge-counter">{perfilesCargo.length}</span>
            </button>

            <button
              className={`sidebar-link ${activeTab === 'procesos' ? 'active' : ''}`}
              onClick={() => setActiveTab('procesos')}
            >
              <div className="sidebar-icon"><IconBriefcase size={18} /></div>
              <span className="nav-text">Concursos Ley 18.834</span>
              <span className="badge-counter">{procesos.length}</span>
            </button>

            <button
              className={`sidebar-link ${activeTab === 'filtro' ? 'active' : ''}`}
              onClick={() => setActiveTab('filtro')}
            >
              <div className="sidebar-icon"><IconUsers size={18} /></div>
              <span className="nav-text">Mesa de Postulantes</span>
              <span className="badge-counter">{postulaciones.length}</span>
            </button>

            <button
              className={`sidebar-link ${activeTab === 'pautas' ? 'active' : ''}`}
              onClick={() => setActiveTab('pautas')}
            >
              <div className="sidebar-icon"><IconGitBranch size={18} /></div>
              <span className="nav-text">Banco Adaptativo</span>
              <span className="badge-counter">{preguntas.length}</span>
            </button>

            <div className="nav-header">Inteligencia & Auditoría</div>

            <button
              className={`sidebar-link ${activeTab === 'ia' ? 'active' : ''}`}
              onClick={() => setActiveTab('ia')}
            >
              <div className="sidebar-icon"><IconSparkles size={18} /></div>
              <span className="nav-text">Asistente IA (RAG)</span>
            </button>

            <button
              className={`sidebar-link ${activeTab === 'auditoria' ? 'active' : ''}`}
              onClick={() => setActiveTab('auditoria')}
            >
              <div className="sidebar-icon"><IconShield size={18} /></div>
              <span className="nav-text">Pista de Auditoría</span>
              <span className="badge-counter">{auditorias.length}</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="btn-sidebar-logout" onClick={handleLogout}>
              <IconLogout size={16} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* ================= CONTENEDOR PRINCIPAL ================= */}
        <div className={`erp-content-wrapper ${sidebarCollapsed ? 'full-width' : ''}`}>
          {/* Top Navbar */}
          <header className="erp-navbar">
            <div className="navbar-left">
              <button
                className="btn-toggle-sidebar"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title="Colapsar / expandir menú"
              >
                <IconBars size={20} />
              </button>

              <div className="navbar-breadcrumb">
                <span>Servicio de Salud Talcahuano</span>
                <span>/</span>
                <span>Hospital Penco Lirquén</span>
                <span>/</span>
                <span className="active">
                  {activeTab === 'dashboard' && 'Panel General'}
                  {activeTab === 'perfiles' && 'Mantenedor de Perfiles de Cargo'}
                  {activeTab === 'procesos' && 'Mantenedor de Concursos (Ley 18.834)'}
                  {activeTab === 'filtro' && 'Mesa de Postulantes & Expedientes'}
                  {activeTab === 'pautas' && 'Banco de Preguntas Adaptativas'}
                  {activeTab === 'ia' && 'Asistente IA (RAG)'}
                  {activeTab === 'auditoria' && 'Pista de Auditoría y Trazabilidad'}
                </span>
              </div>
            </div>

            <div className="navbar-right">
              {currentUser?.token && (
                <div className="token-badge-erp" title="Token de sesión institucional DRF">
                  <IconKey size={13} />
                  <span>Token: {currentUser.token.substring(0, 10)}...</span>
                </div>
              )}

              <span className={`status-pill ${apiOnline ? 'online' : 'offline'}`}>
                <span className="status-dot" />
                <span>{apiOnline ? 'API Conectada' : 'Modo Autónomo'}</span>
              </span>

              <a
                href="http://127.0.0.1:8000/admin/"
                target="_blank"
                rel="noreferrer"
                className="btn-erp btn-erp-sm btn-erp-secondary"
                title="Consola Django Admin"
              >
                <IconShield size={14} />
                <span>Admin Django</span>
              </a>

              <button
                className="btn-toggle-sidebar"
                onClick={() => setDark(!dark)}
                title="Alternar tema claro/oscuro"
              >
                {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </button>
            </div>
          </header>

          {/* Content Header */}
          <div className="content-header">
            <div>
              <h1 className="content-title">
                {activeTab === 'dashboard' && 'Panel General de Selección y Concursos'}
                {activeTab === 'perfiles' && 'Mantenedor de Perfiles de Cargo (Catálogo Base)'}
                {activeTab === 'procesos' && 'Mantenedor de Concursos (Ley 18.834)'}
                {activeTab === 'filtro' && 'Mesa de Revisión Curricular & Postulantes'}
                {activeTab === 'pautas' && 'Banco de Preguntas Adaptativas & Pautas'}
                {activeTab === 'ia' && 'Módulo de Inteligencia Artificial (Proyección RAG)'}
                {activeTab === 'auditoria' && 'Pista de Auditoría y Trazabilidad Pública'}
              </h1>
              <p className="content-subtitle">
                Subdirección de Gestión y Desarrollo de las Personas &bull; Servicio de Salud Talcahuano
              </p>
            </div>

            <div className="card-tools">
              {activeTab === 'perfiles' && (
                <button className="btn-erp btn-erp-primary" onClick={() => setShowModalPerfil(true)}>
                  <IconPlus size={16} />
                  <span>Nuevo Perfil de Cargo</span>
                </button>
              )}
              {activeTab === 'procesos' && (
                <button className="btn-erp btn-erp-primary" onClick={() => setShowModalProceso(true)}>
                  <IconPlus size={16} />
                  <span>Aperturar Concurso</span>
                </button>
              )}
              {activeTab === 'filtro' && (
                <button className="btn-erp btn-erp-primary" onClick={() => setShowModalPostulante(true)}>
                  <IconPlus size={16} />
                  <span>Inscribir Postulante</span>
                </button>
              )}
              {activeTab === 'pautas' && (
                <button className="btn-erp btn-erp-primary" onClick={() => setShowModalPregunta(true)}>
                  <IconPlus size={16} />
                  <span>Nueva Pregunta</span>
                </button>
              )}
            </div>
          </div>

          {/* Content Body */}
          <main className="content-body">
            {/* Banner de Atribución Institucional */}
            <div className="erp-alert-banner">
              <div className="erp-alert-content">
                <div className="erp-alert-icon">
                  <IconCheckCircle size={20} />
                </div>
                <div className="erp-alert-text">
                  Sesión activa de <strong>{currentUser.nombre}</strong> &bull; Rol funcionario habilitado:{' '}
                  <em>{currentUser.rol}</em>.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="cascade-indicator">
                  <IconGitBranch size={13} />
                  <span>Flujo en Cascada Activo</span>
                </span>
              </div>
            </div>

            {/* ================= TAB 1: DASHBOARD GENERAL ================= */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="stats-grid">
                  <div className="small-box bg-info">
                    <div className="inner">
                      <h3>{procesos.length}</h3>
                      <p>Concursos Activos en Red</p>
                    </div>
                    <div className="icon">
                      <IconBriefcase size={50} />
                    </div>
                    <div className="small-box-footer" onClick={() => setActiveTab('procesos')} style={{ cursor: 'pointer' }}>
                      <span>Gestionar Procesos</span>
                      <IconChevronRight size={14} />
                    </div>
                  </div>

                  <div className="small-box bg-warning">
                    <div className="inner">
                      <h3>{postulaciones.filter((p) => p.estado === 'en_revision' || p.estado === 'recibida').length}</h3>
                      <p>En Revisión Curricular</p>
                    </div>
                    <div className="icon">
                      <IconClock size={50} />
                    </div>
                    <div className="small-box-footer" onClick={() => setActiveTab('filtro')} style={{ cursor: 'pointer' }}>
                      <span>Revisar Expedientes</span>
                      <IconChevronRight size={14} />
                    </div>
                  </div>

                  <div className="small-box bg-success">
                    <div className="inner">
                      <h3>{postulaciones.filter((p) => p.estado === 'preseleccionada' || p.estado === 'aprobada').length}</h3>
                      <p>Preseleccionados / Aptos</p>
                    </div>
                    <div className="icon">
                      <IconCheckCircle size={50} />
                    </div>
                    <div className="small-box-footer" onClick={() => setActiveTab('filtro')} style={{ cursor: 'pointer' }}>
                      <span>Ver Seleccionados</span>
                      <IconChevronRight size={14} />
                    </div>
                  </div>

                  <div className="small-box bg-danger">
                    <div className="inner">
                      <h3>{postulaciones.filter((p) => p.estado === 'descartada').length}</h3>
                      <p>Descartados por Bases</p>
                    </div>
                    <div className="icon">
                      <IconX size={50} />
                    </div>
                    <div className="small-box-footer" onClick={() => setActiveTab('filtro')} style={{ cursor: 'pointer' }}>
                      <span>Ver Resoluciones</span>
                      <IconChevronRight size={14} />
                    </div>
                  </div>
                </div>

                {selectedProceso && (
                  <div className="card-erp card-outline-primary">
                    <div className="card-header-erp">
                      <h3 className="card-title-erp">
                        <IconBriefcase size={18} />
                        <span>Concurso Prioritario: {selectedProceso.perfil_cargo_nombre || 'Enfermero/a UCI'}</span>
                      </h3>
                      <div className="card-tools">
                        <span className="badge-erp badge-erp-primary">
                          {selectedProceso.area_usuaria || 'Área Clínica'}
                        </span>
                        <button className="btn-erp btn-erp-sm btn-erp-primary" onClick={handleAvanzarEtapaProceso}>
                          <span>Avanzar Etapa</span>
                          <IconChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="card-body-erp">
                      <p style={{ color: 'var(--erp-text-muted)', marginBottom: 14 }}>
                        {selectedProceso.observaciones || 'Concurso abreviado para reemplazos prolongados.'}
                      </p>

                      <div className="pipeline-card">
                        <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Ciclo Normado de 10 Fases:
                        </strong>
                        <div className="pipeline-stepper">
                          {ETAPAS_PROCESO.map((etapa, idx) => {
                            const currentIdx = ETAPAS_PROCESO.findIndex((e) => e.id === selectedProceso.estado);
                            const isCompleted = idx < currentIdx;
                            const isCurrent = idx === currentIdx;
                            return (
                              <div
                                key={etapa.id}
                                className={`pipeline-step-box ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                              >
                                <div className="step-num-badge">
                                  {isCompleted ? <IconCheck size={12} /> : idx + 1}
                                </div>
                                <div className="step-title">{etapa.nombre}</div>
                                <div className="step-desc">{etapa.desc}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: MANTENEDOR DE PERFILES DE CARGO (CASCADA BASE) ================= */}
            {activeTab === 'perfiles' && (
              <div className="card-erp card-outline-primary">
                <div className="card-header-erp">
                  <h3 className="card-title-erp">
                    <IconFileText size={18} />
                    <span>Catálogo Maestro de Perfiles de Cargo ({perfilesCargo.length})</span>
                  </h3>
                  <div className="card-tools">
                    <button className="btn-erp btn-erp-primary" onClick={() => setShowModalPerfil(true)}>
                      <IconPlus size={16} />
                      <span>Nuevo Perfil</span>
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table-erp table-erp-striped table-erp-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre del Cargo</th>
                        <th>Área Usuaria</th>
                        <th>Requisitos Mínimos</th>
                        <th>Competencias Clave</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfilesCargo.map((perf) => (
                        <tr key={perf.id}>
                          <td>#{perf.id}</td>
                          <td><strong>{perf.nombre}</strong></td>
                          <td><span className="badge-erp badge-erp-primary">{perf.area_usuaria}</span></td>
                          <td style={{ maxWidth: 280, fontSize: 12 }}>{perf.requisitos_minimos || 'Título legal reconocido'}</td>
                          <td style={{ maxWidth: 280, fontSize: 12 }}>{perf.competencias_clave || 'Resolución clínica'}</td>
                          <td>
                            <span className="badge-erp badge-erp-success">Vigente</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= TAB 3: MANTENEDOR DE CONCURSOS (CASCADA CARGO -> PROCESO) ================= */}
            {activeTab === 'procesos' && (
              <div className="card-erp card-outline-primary">
                <div className="card-header-erp">
                  <h3 className="card-title-erp">
                    <IconBriefcase size={18} />
                    <span>Concursos Abreviados en Ejecución</span>
                  </h3>
                  <div className="card-tools">
                    {procesos.length > 0 && (
                      <select
                        className="form-control-erp"
                        style={{ maxWidth: 360 }}
                        value={selectedProceso?.id || ''}
                        onChange={(e) => {
                          const found = procesos.find((p) => p.id === parseInt(e.target.value, 10));
                          if (found) setSelectedProceso(found);
                        }}
                      >
                        {procesos.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} - {p.perfil_cargo_nombre || 'Cargo Clínico'} ({p.area_usuaria})
                          </option>
                        ))}
                      </select>
                    )}
                    <button className="btn-erp btn-erp-primary" onClick={() => setShowModalProceso(true)}>
                      <IconPlus size={16} />
                      <span>Aperturar Concurso</span>
                    </button>
                  </div>
                </div>

                <div className="card-body-erp">
                  {selectedProceso ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                        <div>
                          <span className="badge-erp badge-erp-primary" style={{ marginBottom: 6 }}>
                            {selectedProceso.area_usuaria}
                          </span>
                          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '4px 0' }}>
                            {selectedProceso.perfil_cargo_nombre || 'Cargo Clínico Especializado'}
                          </h2>
                          <p style={{ color: 'var(--erp-text-muted)', fontSize: 14 }}>
                            {selectedProceso.observaciones || 'Concurso institucional bajo normas del Estatuto Administrativo.'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <button className="btn-erp btn-erp-primary" onClick={handleAvanzarEtapaProceso}>
                            <span>Avanzar a Siguiente Etapa</span>
                            <IconChevronRight size={15} />
                          </button>
                          <button
                            className="btn-erp btn-erp-outline-danger"
                            onClick={() => handleEliminarProceso(selectedProceso.id)}
                          >
                            <IconTrash size={15} />
                            <span>Archivar</span>
                          </button>
                        </div>
                      </div>

                      <div className="pipeline-card">
                        <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Avance Normativo del Proceso:
                        </strong>
                        <div className="pipeline-stepper">
                          {ETAPAS_PROCESO.map((etapa, idx) => {
                            const currentIdx = ETAPAS_PROCESO.findIndex((e) => e.id === selectedProceso.estado);
                            const isCompleted = idx < currentIdx;
                            const isCurrent = idx === currentIdx;
                            return (
                              <div
                                key={etapa.id}
                                className={`pipeline-step-box ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                              >
                                <div className="step-num-badge">
                                  {isCompleted ? <IconCheck size={12} /> : idx + 1}
                                </div>
                                <div className="step-title">{etapa.nombre}</div>
                                <div className="step-desc">{etapa.desc}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--erp-text-muted)' }}>No hay concursos activos actualmente.</p>
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 4: MESA DE POSTULANTES (CASCADA CONCURSO -> CANDIDATOS) ================= */}
            {activeTab === 'filtro' && (
              <div>
                <div className="table-toolbar-erp">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                    {/* Filtro en Cascada por Concurso */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--erp-text-muted)' }}>CONCURSO:</span>
                      <select
                        className="form-control-erp"
                        style={{ maxWidth: 260 }}
                        value={filtroConcursoId}
                        onChange={(e) => setFiltroConcursoId(e.target.value)}
                      >
                        <option value="todos">Todos los Concursos ({postulaciones.length})</option>
                        {procesos.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} - {p.perfil_cargo_nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro en Cascada por Estado */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--erp-text-muted)' }}>ESTADO:</span>
                      <select
                        className="form-control-erp"
                        style={{ width: 180 }}
                        value={filtroStatus}
                        onChange={(e) => setFiltroStatus(e.target.value)}
                      >
                        <option value="todos">Todos los Estados</option>
                        <option value="recibida">Recibida</option>
                        <option value="en_revision">En Revisión</option>
                        <option value="preseleccionada">Preseleccionada</option>
                        <option value="descartada">Descartada</option>
                        <option value="aprobada">Aprobada</option>
                      </select>
                    </div>

                    <div style={{ flex: 1, minWidth: 200 }}>
                      <input
                        type="text"
                        className="form-control-erp"
                        placeholder="Buscar por RUT o Nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <button className="btn-erp btn-erp-primary" onClick={() => setShowModalPostulante(true)}>
                    <IconPlus size={16} />
                    <span>Inscribir Postulante</span>
                  </button>
                </div>

                <div className="layout-split-erp">
                  {/* Lista de Postulantes */}
                  <div>
                    {postulacionesFiltradas.length === 0 ? (
                      <div className="card-erp" style={{ padding: 24, textAlign: 'center', color: 'var(--erp-text-muted)' }}>
                        No se registraron postulantes en este concurso con los filtros seleccionados.
                      </div>
                    ) : (
                      postulacionesFiltradas.map((post) => {
                        const isSelected = selectedPostulante?.id === post.id;
                        return (
                          <div
                            key={post.id}
                            className={`candidate-card-erp ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedPostulante(post)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                              <div>
                                <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
                                  {post.postulante_nombre || `Postulante #${post.id}`}
                                </h4>
                                <span style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>
                                  RUT: {post.postulante_rut || 'Sin registro'}
                                </span>
                              </div>
                              <span className={`badge-erp ${post.estado === 'preseleccionada' || post.estado === 'aprobada' ? 'badge-erp-success' : post.estado === 'descartada' ? 'badge-erp-danger' : 'badge-erp-warning'}`}>
                                {post.estado_display || post.estado}
                              </span>
                            </div>

                            <p style={{ fontSize: 13, color: 'var(--erp-text-muted)', margin: '6px 0' }}>
                              {post.postulante_formacion || 'Profesional de la Salud'}
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                              <span className={`doc-status-pill ${post.documentos_completos ? 'ok' : 'pending'}`}>
                                {post.documentos_completos ? <IconCheck size={12} /> : <IconX size={12} />}
                                <span>{post.documentos_completos ? 'Expediente SIS Verificado' : 'Documentación Incompleta'}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Panel Detalle de Expediente y Votación */}
                  <div>
                    {selectedPostulante ? (
                      <div className="card-erp card-outline-primary">
                        <div className="card-header-erp">
                          <div>
                            <h3 className="card-title-erp">
                              <IconUser size={18} />
                              <span>Expediente de Candidatura</span>
                            </h3>
                            <span style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>
                              RUT: {selectedPostulante.postulante_rut}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className={`badge-erp ${selectedPostulante.estado === 'preseleccionada' || selectedPostulante.estado === 'aprobada' ? 'badge-erp-success' : selectedPostulante.estado === 'descartada' ? 'badge-erp-danger' : 'badge-erp-warning'}`}>
                              {selectedPostulante.estado_display || selectedPostulante.estado}
                            </span>
                            <button
                              className="btn-erp btn-erp-sm btn-erp-outline-danger"
                              onClick={() => handleEliminarPostulacion(selectedPostulante.id)}
                              title="Retirar postulación"
                            >
                              <IconTrash size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="card-body-erp">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                            <div>
                              <strong style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>NOMBRE:</strong>
                              <p style={{ fontWeight: 600, fontSize: 14 }}>{selectedPostulante.postulante_nombre}</p>
                            </div>
                            <div>
                              <strong style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>EMAIL:</strong>
                              <p style={{ fontSize: 13 }}>{selectedPostulante.postulante_email || 'contacto@redsalud.gob.cl'}</p>
                            </div>
                            <div>
                              <strong style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>TELÉFONO:</strong>
                              <p style={{ fontSize: 13 }}>{selectedPostulante.postulante_telefono || '+56 9 8452 9812'}</p>
                            </div>
                            <div>
                              <strong style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>CONCURSO:</strong>
                              <p style={{ fontSize: 13 }}>#{selectedPostulante.proceso} - {selectedProceso?.perfil_cargo_nombre || 'Enfermero/a UCI'}</p>
                            </div>
                          </div>

                          <div style={{ marginBottom: 14 }}>
                            <strong style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>FORMACIÓN Y ESPECIALIZACIÓN:</strong>
                            <p style={{ fontSize: 13, marginTop: 2 }}>{selectedPostulante.postulante_formacion || 'Sin registro detallado.'}</p>
                          </div>

                          <div style={{ marginBottom: 16 }}>
                            <strong style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>EXPERIENCIA ACREDITADA:</strong>
                            <p style={{ fontSize: 13, marginTop: 2 }}>{selectedPostulante.postulante_experiencia || 'Experiencia en servicios de salud.'}</p>
                          </div>

                          <div style={{ background: 'var(--erp-bg-body)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                            <strong style={{ fontSize: 12, color: 'var(--erp-text-muted)', textTransform: 'uppercase' }}>
                              Semáforo Documental de Comité:
                            </strong>
                            <ul style={{ listStyle: 'none', padding: 0, marginTop: 8, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconCheckCircle size={15} style={{ color: 'var(--erp-success)' }} />
                                <span>Curriculum Vitae Firmado y Recepcionado</span>
                              </li>
                              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {selectedPostulante.documentos_completos ? (
                                  <IconCheckCircle size={15} style={{ color: 'var(--erp-success)' }} />
                                ) : (
                                  <IconAlertTriangle size={15} style={{ color: 'var(--erp-danger)' }} />
                                )}
                                <span>
                                  Certificado SIS:{' '}
                                  {selectedPostulante.documentos_completos ? (
                                    <strong style={{ color: 'var(--erp-success)' }}>Acreditado y Vigente</strong>
                                  ) : (
                                    <strong style={{ color: 'var(--erp-danger)' }}>Pendiente de Presentación</strong>
                                  )}
                                </span>
                              </li>
                              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <IconCheckCircle size={15} style={{ color: 'var(--erp-success)' }} />
                                <span>Certificado Inhabilidades Ley 20.584 Conforme</span>
                              </li>
                            </ul>
                          </div>

                          <hr style={{ border: 'none', borderTop: '1px solid var(--erp-border)', margin: '16px 0' }} />

                          <strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Resolución Colegiada de Comisión:
                          </strong>
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                            <button
                              className="btn-erp btn-erp-success"
                              onClick={() => handleCambiarEstadoPostulacion(selectedPostulante.id, 'preseleccionada')}
                            >
                              <IconCheck size={15} />
                              <span>Preseleccionar</span>
                            </button>
                            <button
                              className="btn-erp btn-erp-warning"
                              onClick={() => handleCambiarEstadoPostulacion(selectedPostulante.id, 'en_revision')}
                            >
                              <IconClock size={15} />
                              <span>Dejar en Revisión</span>
                            </button>
                            <button
                              className="btn-erp btn-erp-danger"
                              onClick={() => handleCambiarEstadoPostulacion(selectedPostulante.id, 'descartada')}
                            >
                              <IconX size={15} />
                              <span>Descartar por Bases</span>
                            </button>
                            <button
                              className="btn-erp btn-erp-primary"
                              onClick={() => handleCambiarEstadoPostulacion(selectedPostulante.id, 'aprobada')}
                            >
                              <IconCheckCircle size={15} />
                              <span>Aprobar Selección</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card-erp" style={{ padding: 32, textAlign: 'center', color: 'var(--erp-text-muted)' }}>
                        Seleccione un postulante de la lista izquierda para auditar su expediente.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 5: BANCO DE PREGUNTAS (CASCADA MADRE -> HIJAS) ================= */}
            {activeTab === 'pautas' && (
              <div>
                <div className="card-erp card-outline-primary">
                  <div className="card-header-erp">
                    <h3 className="card-title-erp">
                      <IconGitBranch size={18} />
                      <span>Árbol Adaptativo en Cascada por Competencias (UCI Paciente Crítico)</span>
                    </h3>
                    <div className="card-tools">
                      <button className="btn-erp btn-erp-primary" onClick={() => setShowModalPregunta(true)}>
                        <IconPlus size={16} />
                        <span>Nueva Pregunta</span>
                      </button>
                    </div>
                  </div>

                  <div className="card-body-erp">
                    <div className="tree-container-erp">
                      {/* Nodo Madre */}
                      <div className="tree-node-erp root-node-erp">
                        <div className="node-header-erp">
                          <span className="node-level-tag">PREGUNTA MADRE (NIVEL 1)</span>
                          <span className="node-competence-erp">Competencia: Manejo de Crisis y Presión</span>
                        </div>
                        <div className="node-text-erp">
                          "Relate una situación crítica en UCI donde un paciente se despeñó rápidamente y cómo coordinó
                          las primeras acciones de rescate."
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--erp-text-muted)' }}>Dificultad: Media &bull; Rúbrica: Escala 1 al 5</span>
                      </div>

                      <div className="tree-connector-erp">
                        <div className="tree-line-v" />
                        <span>Cascada Condicional por Desempeño Observado</span>
                        <div className="tree-line-v" />
                      </div>

                      {/* Nodos Hijos en Cascada */}
                      <div className="tree-children-grid-erp">
                        <div className="tree-child-node-erp branch-low">
                          <div className="node-header-erp">
                            <span className="badge-erp badge-erp-warning">CASCADA: SI PUNTAJE &lt; 3.0</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                            Competencia: Autocuidado y Contención
                          </div>
                          <p style={{ fontSize: 13, fontStyle: 'italic', margin: '4px 0' }}>
                            "En caso de verse sobrepasado/a emocionalmente por el fallecimiento de un paciente o la reacción
                            agresiva de un familiar, ¿qué mecanismos personales de contención activa?"
                          </p>
                          <span style={{ fontSize: 11, color: 'var(--erp-text-muted)' }}>
                            <strong>Propósito:</strong> Detectar riesgo de desborde y capacidad reflexiva.
                          </span>
                        </div>

                        <div className="tree-child-node-erp branch-high">
                          <div className="node-header-erp">
                            <span className="badge-erp badge-erp-success">CASCADA: SI PUNTAJE &gt;= 4.0</span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                            Competencia: Liderazgo y Negociación Ética
                          </div>
                          <p style={{ fontSize: 13, fontStyle: 'italic', margin: '4px 0' }}>
                            "¿Cómo aborda un desacuerdo técnico o ético con el médico de turno respecto al tratamiento de
                            un paciente terminal?"
                          </p>
                          <span style={{ fontSize: 11, color: 'var(--erp-text-muted)' }}>
                            <strong>Propósito:</strong> Profundizar juicio clínico superior y asertividad.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simulador Interactivo */}
                    <div className="simulator-box-erp">
                      <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                        Simulador de Transición Adaptativa en Cascada
                      </h4>
                      <p style={{ fontSize: 13, color: 'var(--erp-text-muted)' }}>
                        Deslice el puntaje asignado a la pregunta madre para observar la transición adaptativa en vivo:
                      </p>

                      <div className="slider-group-erp">
                        <div className="slider-header-erp">
                          <span>Calificación de Respuesta:</span>
                          <span className="score-badge-large">{scoreSimulador} / 5.0</span>
                        </div>
                        <input
                          type="range"
                          min="1.0"
                          max="5.0"
                          step="0.5"
                          value={scoreSimulador}
                          onChange={(e) => setScoreSimulador(parseFloat(e.target.value))}
                          className="slider-range-erp"
                        />
                      </div>

                      {scoreSimulador < 3.0 ? (
                        <div style={{ background: 'var(--erp-warning-light)', border: '1px solid var(--erp-warning)', padding: '10px 14px', borderRadius: 4, color: '#92400e', fontSize: 13 }}>
                          <strong>Transición en Cascada:</strong> Activar pregunta de <strong>Autocuidado y Contención</strong> debido a que la calificación ({scoreSimulador}) está bajo el umbral crítico para UCI.
                        </div>
                      ) : (
                        <div style={{ background: 'var(--erp-success-light)', border: '1px solid var(--erp-success)', padding: '10px 14px', borderRadius: 4, color: '#166534', fontSize: 13 }}>
                          <strong>Transición en Cascada:</strong> Activar pregunta avanzada de <strong>Liderazgo y Negociación Ética</strong> dado que el candidato acreditó solidez resolutiva ({scoreSimulador}).
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card-erp">
                  <div className="card-header-erp">
                    <h3 className="card-title-erp">
                      <IconFileText size={18} />
                      <span>Banco de Preguntas Registradas ({preguntas.length})</span>
                    </h3>
                  </div>
                  <div className="table-responsive">
                    <table className="table-erp table-erp-striped table-erp-hover">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Pregunta de Incidente Crítico</th>
                          <th>Competencia Evaluada</th>
                          <th>Dificultad</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preguntas.map((p) => (
                          <tr key={p.id}>
                            <td>#{p.id}</td>
                            <td><strong>{p.texto}</strong></td>
                            <td><span className="badge-erp badge-erp-primary">{p.competencia}</span></td>
                            <td>
                              <span className={`badge-erp ${p.dificultad === 'alta' ? 'badge-erp-danger' : 'badge-erp-warning'}`}>
                                {p.dificultad_display || p.dificultad}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-erp btn-erp-sm btn-erp-outline-danger"
                                onClick={() => handleEliminarPregunta(p.id)}
                                title="Eliminar del banco"
                              >
                                <IconTrash size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 6: ASISTENTE IA (RAG) ================= */}
            {activeTab === 'ia' && (
              <div className="ai-module-card">
                <span className="ai-header-badge">
                  <IconSparkles size={14} />
                  <span>Proyección Técnica &bull; Arquitectura RAG</span>
                </span>

                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0' }}>
                  Algoritmo Seleccionado: RAG (Retrieval-Augmented Generation) con Embeddings Semánticos
                </h2>
                <p style={{ color: 'var(--erp-text-muted)', fontSize: 14 }}>
                  Referencia de laboratorio institucional: <code>docs-labs/Lab1_RAG_Desde_Cero.ipynb</code>
                </p>

                <div className="algo-info-card">
                  <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    Fundamentos de Ingeniería de Software Hospitalaria:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                    <div style={{ background: 'var(--erp-bg-card)', padding: 14, borderRadius: 6, border: '1px solid var(--erp-border)' }}>
                      <strong>1. Recuperación Contextual (Retrieval):</strong>
                      <p style={{ fontSize: 13, color: 'var(--erp-text-muted)', marginTop: 4 }}>
                        Indexa descriptores oficiales del MINSAL y Estatuto Administrativo, asegurando que las preguntas
                        no inventen perfiles ajenos al sector público.
                      </p>
                    </div>

                    <div style={{ background: 'var(--erp-bg-card)', padding: 14, borderRadius: 6, border: '1px solid var(--erp-border)' }}>
                      <strong>2. Similitud Coseno Vectorial:</strong>
                      <p style={{ fontSize: 13, color: 'var(--erp-text-muted)', marginTop: 4 }}>
                        Calcula la distancia angular entre competencias exigidas y el banco histórico de incidentes críticos
                        validados por la psicóloga.
                      </p>
                    </div>

                    <div style={{ background: 'var(--erp-bg-card)', padding: 14, borderRadius: 6, border: '1px solid var(--erp-border)' }}>
                      <strong>3. Supervisión Humana Obligatoria:</strong>
                      <p style={{ fontSize: 13, color: 'var(--erp-text-muted)', marginTop: 4 }}>
                        Toda sugerencia de pregunta generada queda en borrador y requiere aprobación expresa de Carolina Ruiz Parra
                        antes de integrarse al concurso.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 7: PISTA DE AUDITORÍA (SEGURIDAD CON TOKEN) ================= */}
            {activeTab === 'auditoria' && (
              <div className="card-erp">
                <div className="card-header-erp">
                  <div>
                    <h3 className="card-title-erp">
                      <IconShield size={18} />
                      <span>Registro Inmutable de Probidad y Trazabilidad Pública ({auditorias.length})</span>
                    </h3>
                    <span style={{ fontSize: 12, color: 'var(--erp-text-muted)' }}>
                      Conforme a requerimientos de Contraloría General de la República &bull; Seguridad DRF Token
                    </span>
                  </div>
                  {currentUser?.token && (
                    <div className="token-badge-erp">
                      <IconKey size={14} />
                      <span>Token Funcionario: {currentUser.token}</span>
                    </div>
                  )}
                </div>

                <div className="table-responsive">
                  <table className="table-erp table-erp-striped table-erp-hover">
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Acción Auditada</th>
                        <th>Funcionario Responsable</th>
                        <th>Detalle de la Transacción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditorias.map((a) => (
                        <tr key={a.id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                            {a.fecha ? (typeof a.fecha === 'string' && a.fecha.includes('T') ? new Date(a.fecha).toLocaleString('es-CL') : a.fecha) : '19/10/2026'}
                          </td>
                          <td>
                            <span className={`badge-erp ${a.accion?.includes('PRESELECCION') || a.accion?.includes('INICIO') ? 'badge-erp-success' : a.accion?.includes('ELIMINAR') || a.accion?.includes('DESCARTADA') ? 'badge-erp-danger' : 'badge-erp-primary'}`}>
                              {a.accion}
                            </span>
                          </td>
                          <td>
                            <strong>{a.usuario_nombre || 'Sistema Central'}</strong>
                          </td>
                          <td style={{ color: 'var(--erp-text-main)' }}>{a.detalle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>

          <footer className="erp-footer">
            <div>
              Hospital Penco Lirquén &bull; Subdirección de Gestión y Desarrollo de las Personas &bull; Servicio de Salud Talcahuano
            </div>
            <div>
              Sistema ERP de Selección &bull; Django 5 + React 18 &bull; Ley 18.834
            </div>
          </footer>
        </div>
      </div>

      {/* ================= MODAL: NUEVO PERFIL DE CARGO (CASCADA BASE) ================= */}
      {showModalPerfil && (
        <div className="modal-overlay-erp">
          <div className="modal-dialog-erp">
            <div className="modal-header-erp">
              <h3 className="modal-title-erp">
                <IconFileText size={18} />
                <span>Nuevo Perfil de Cargo (Catálogo Maestro)</span>
              </h3>
              <button className="modal-close-erp" onClick={() => setShowModalPerfil(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCrearPerfilCargo}>
              <div className="modal-body-erp">
                <div className="form-group-erp">
                  <label className="form-label-erp">Nombre del Cargo Clínico / Administrativo:</label>
                  <input
                    type="text"
                    className="form-control-erp"
                    value={nuevoPerfilData.nombre}
                    onChange={(e) => setNuevoPerfilData({ ...nuevoPerfilData, nombre: e.target.value })}
                    placeholder="Ej: Kinesiólogo/a UPC - Paciente Crítico"
                    required
                  />
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">Área Usuaria / Servicio Clínico:</label>
                  <input
                    type="text"
                    className="form-control-erp"
                    value={nuevoPerfilData.area_usuaria}
                    onChange={(e) => setNuevoPerfilData({ ...nuevoPerfilData, area_usuaria: e.target.value })}
                    placeholder="Ej: Unidad de Paciente Crítico (UPC)"
                    required
                  />
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">Requisitos Mínimos Legales (Ley 18.834):</label>
                  <textarea
                    className="textarea-control-erp"
                    rows="2"
                    value={nuevoPerfilData.requisitos_minimos}
                    onChange={(e) => setNuevoPerfilData({ ...nuevoPerfilData, requisitos_minimos: e.target.value })}
                    placeholder="Título profesional universitario reconocido por la Superintendencia de Salud (SIS). Al menos 1 año en UPC."
                    required
                  />
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">Competencias Clave del Descriptor:</label>
                  <textarea
                    className="textarea-control-erp"
                    rows="2"
                    value={nuevoPerfilData.competencias_clave}
                    onChange={(e) => setNuevoPerfilData({ ...nuevoPerfilData, competencias_clave: e.target.value })}
                    placeholder="Manejo de ventilación mecánica, Trabajo bajo presión, Ética clínica."
                  />
                </div>
              </div>

              <div className="modal-footer-erp">
                <button type="button" className="btn-erp btn-erp-secondary" onClick={() => setShowModalPerfil(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-erp btn-erp-primary">
                  <IconCheck size={16} />
                  <span>Guardar en Catálogo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUEVO CONCURSO (CASCADA CARGO -> PROCESO) ================= */}
      {showModalProceso && (
        <div className="modal-overlay-erp">
          <div className="modal-dialog-erp">
            <div className="modal-header-erp">
              <h3 className="modal-title-erp">
                <IconBriefcase size={18} />
                <span>Aperturar Nuevo Concurso (Formato Cascada)</span>
              </h3>
              <button className="modal-close-erp" onClick={() => setShowModalProceso(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCrearProceso}>
              <div className="modal-body-erp">
                {/* Cascada: Al seleccionar Perfil, se completan Área y Requisitos */}
                <div className="form-group-erp">
                  <label className="form-label-erp">
                    1. Seleccione Perfil de Cargo (Origen en Cascada):
                  </label>
                  <select
                    className="form-control-erp"
                    value={nuevoProcesoData.perfil_cargo}
                    onChange={(e) => {
                      const perfId = e.target.value;
                      const perfObj = perfilesCargo.find((p) => p.id === parseInt(perfId, 10));
                      setNuevoProcesoData((prev) => ({
                        ...prev,
                        perfil_cargo: perfId,
                        area_usuaria: perfObj?.area_usuaria || prev.area_usuaria,
                        observaciones: perfObj
                          ? `Concurso abreviado para ${perfObj.nombre}. Requisitos: ${perfObj.requisitos_minimos}`
                          : prev.observaciones,
                      }));
                    }}
                    required
                  >
                    {perfilesCargo.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.area_usuaria})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">2. Área Usuaria (Autocompletado en Cascada):</label>
                  <input
                    type="text"
                    className="form-control-erp"
                    value={nuevoProcesoData.area_usuaria}
                    onChange={(e) => setNuevoProcesoData({ ...nuevoProcesoData, area_usuaria: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">3. Fecha Límite de Recepción de Expedientes:</label>
                  <input
                    type="date"
                    className="form-control-erp"
                    value={nuevoProcesoData.fecha_cierre}
                    onChange={(e) => setNuevoProcesoData({ ...nuevoProcesoData, fecha_cierre: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">4. Observaciones Normadas:</label>
                  <textarea
                    className="textarea-control-erp"
                    rows="3"
                    value={nuevoProcesoData.observaciones}
                    onChange={(e) => setNuevoProcesoData({ ...nuevoProcesoData, observaciones: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer-erp">
                <button type="button" className="btn-erp btn-erp-secondary" onClick={() => setShowModalProceso(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-erp btn-erp-primary">
                  <IconCheck size={16} />
                  <span>Aperturar Concurso</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUEVO POSTULANTE ================= */}
      {showModalPostulante && (
        <div className="modal-overlay-erp">
          <div className="modal-dialog-erp">
            <div className="modal-header-erp">
              <h3 className="modal-title-erp">
                <IconUser size={18} />
                <span>Inscribir Postulante en Mesa de Selección</span>
              </h3>
              <button className="modal-close-erp" onClick={() => setShowModalPostulante(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCrearPostulante}>
              <div className="modal-body-erp">
                <div className="form-grid-2">
                  <div className="form-group-erp">
                    <label className="form-label-erp">Nombres:</label>
                    <input
                      type="text"
                      className="form-control-erp"
                      value={nuevoPostulanteData.nombres}
                      onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, nombres: e.target.value })}
                      placeholder="Ej: Marcelo Ignacio"
                      required
                    />
                  </div>
                  <div className="form-group-erp">
                    <label className="form-label-erp">Apellidos:</label>
                    <input
                      type="text"
                      className="form-control-erp"
                      value={nuevoPostulanteData.apellidos}
                      onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, apellidos: e.target.value })}
                      placeholder="Ej: Contreras Vidal"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-erp">
                    <label className="form-label-erp">RUT:</label>
                    <input
                      type="text"
                      className="form-control-erp"
                      value={nuevoPostulanteData.rut}
                      onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, rut: e.target.value })}
                      placeholder="18.345.678-9"
                      required
                    />
                  </div>
                  <div className="form-group-erp">
                    <label className="form-label-erp">Teléfono de Contacto:</label>
                    <input
                      type="text"
                      className="form-control-erp"
                      value={nuevoPostulanteData.telefono}
                      onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, telefono: e.target.value })}
                      placeholder="+56 9 8765 4321"
                    />
                  </div>
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">Email:</label>
                  <input
                    type="email"
                    className="form-control-erp"
                    value={nuevoPostulanteData.email}
                    onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, email: e.target.value })}
                    placeholder="candidato@saludbiobio.cl"
                  />
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">Título Profesional y Formación:</label>
                  <input
                    type="text"
                    className="form-control-erp"
                    value={nuevoPostulanteData.formacion_academica}
                    onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, formacion_academica: e.target.value })}
                    placeholder="Ej: Enfermero Universitario UdeC &bull; Diplomado Paciente Crítico"
                    required
                  />
                </div>

                <div className="form-group-erp">
                  <label className="form-label-erp">Trayectoria y Experiencia Acreditada:</label>
                  <textarea
                    className="textarea-control-erp"
                    rows="2"
                    value={nuevoPostulanteData.experiencia}
                    onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, experiencia: e.target.value })}
                    placeholder="3 años en servicios de paciente crítico y unidades de urgencia hospitalaria."
                  />
                </div>

                <label className="checkbox-label-erp">
                  <input
                    type="checkbox"
                    checked={nuevoPostulanteData.documentos_completos}
                    onChange={(e) => setNuevoPostulanteData({ ...nuevoPostulanteData, documentos_completos: e.target.checked })}
                  />
                  <span>Expediente documental completo (Certificado SIS, CV y Ley 20.584 verificados)</span>
                </label>
              </div>

              <div className="modal-footer-erp">
                <button type="button" className="btn-erp btn-erp-secondary" onClick={() => setShowModalPostulante(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-erp btn-erp-primary">
                  <IconCheck size={16} />
                  <span>Registrar Postulante</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NUEVA PREGUNTA (CASCADA MADRE -> HIJAS) ================= */}
      {showModalPregunta && (
        <div className="modal-overlay-erp">
          <div className="modal-dialog-erp">
            <div className="modal-header-erp">
              <h3 className="modal-title-erp">
                <IconGitBranch size={18} />
                <span>Agregar Pregunta al Banco Adaptativo</span>
              </h3>
              <button className="modal-close-erp" onClick={() => setShowModalPregunta(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleCrearPregunta}>
              <div className="modal-body-erp">
                <div className="form-group-erp">
                  <label className="form-label-erp">Pregunta de Incidente Crítico:</label>
                  <textarea
                    className="textarea-control-erp"
                    rows="3"
                    value={nuevaPreguntaData.texto}
                    onChange={(e) => setNuevaPreguntaData({ ...nuevaPreguntaData, texto: e.target.value })}
                    placeholder="Ej: Describa una situación en UCI donde un desacuerdo entre el equipo de turno amenazó la atención del paciente y cómo intervino."
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-erp">
                    <label className="form-label-erp">Competencia Evaluada:</label>
                    <select
                      className="form-control-erp"
                      value={nuevaPreguntaData.competencia}
                      onChange={(e) => setNuevaPreguntaData({ ...nuevaPreguntaData, competencia: e.target.value })}
                    >
                      <option value="Manejo de Crisis y Presión">Manejo de Crisis y Presión</option>
                      <option value="Autocuidado y Contención">Autocuidado y Contención</option>
                      <option value="Liderazgo y Negociación Ética">Liderazgo y Negociación Ética</option>
                      <option value="Trabajo en Equipo Clínico">Trabajo en Equipo Clínico</option>
                      <option value="Comunicación Asertiva">Comunicación Asertiva</option>
                    </select>
                  </div>

                  <div className="form-group-erp">
                    <label className="form-label-erp">Dificultad de la Pauta:</label>
                    <select
                      className="form-control-erp"
                      value={nuevaPreguntaData.dificultad}
                      onChange={(e) => setNuevaPreguntaData({ ...nuevaPreguntaData, dificultad: e.target.value })}
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <label className="checkbox-label-erp">
                  <input
                    type="checkbox"
                    checked={nuevaPreguntaData.es_hija}
                    onChange={(e) => setNuevaPreguntaData({ ...nuevaPreguntaData, es_hija: e.target.checked })}
                  />
                  <span>Pregunta hija en cascada (depende de una pregunta madre)</span>
                </label>

                {nuevaPreguntaData.es_hija && (
                  <div className="form-grid-2" style={{ marginTop: 8 }}>
                    <div className="form-group-erp">
                      <label className="form-label-erp">Pregunta Madre Asociada:</label>
                      <select
                        className="form-control-erp"
                        value={nuevaPreguntaData.madre_id}
                        onChange={(e) => setNuevaPreguntaData({ ...nuevaPreguntaData, madre_id: e.target.value })}
                      >
                        <option value="">Seleccione Pregunta Madre...</option>
                        {preguntas.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.id} - {p.texto.substring(0, 40)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group-erp">
                      <label className="form-label-erp">Condición de Activación en Cascada:</label>
                      <select
                        className="form-control-erp"
                        value={nuevaPreguntaData.condicion_activacion}
                        onChange={(e) => setNuevaPreguntaData({ ...nuevaPreguntaData, condicion_activacion: e.target.value })}
                      >
                        <option value="si_puntaje_bajo">Si Puntaje Bajo (&lt; 3.0)</option>
                        <option value="si_puntaje_alto">Si Puntaje Alto (&gt;= 4.0)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer-erp">
                <button type="button" className="btn-erp btn-erp-secondary" onClick={() => setShowModalPregunta(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-erp btn-erp-primary">
                  <IconCheck size={16} />
                  <span>Guardar Pregunta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
