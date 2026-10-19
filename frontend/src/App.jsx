import { useState, useEffect } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api';

const ETAPAS_PROCESO = [
  { id: 'solicitud', nombre: '1. Solicitud de llamado', desc: 'Requerimiento formal de jefatura clínica' },
  { id: 'perfil', nombre: '2. Preparación de perfil', desc: 'Definición de competencias y requisitos' },
  { id: 'aviso', nombre: '3. Aviso de postulación', desc: 'Publicación en portal de empleos públicos' },
  { id: 'recepcion', nombre: '4. Recepción de postulaciones', desc: 'Ingreso de antecedentes y expedientes' },
  { id: 'revision_curricular', nombre: '5. Revisión curricular', desc: 'Filtro documental de mesa de selección' },
  { id: 'entrevistas_tecnicas', nombre: '6. Entrevistas técnicas', desc: 'Evaluación por comisión y jefatura médica' },
  { id: 'evaluacion_psicolaboral', nombre: '7. Evaluación psicolaboral', desc: 'Entrevista por competencias adaptativa' },
  { id: 'informe_directora', nombre: '8. Informe a la Directora', desc: 'Propuesta de terna final motivada' },
  { id: 'integracion', nombre: '9. Proceso de integración', desc: 'Inducción y firma de resolución exenta' },
  { id: 'cerrado', nombre: '10. Cerrado', desc: 'Proceso culminado y archivado' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('procesos');
  const [dark, setDark] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados de datos
  const [procesos, setProcesos] = useState([]);
  const [postulantes, setPostulantes] = useState([]);
  const [postulaciones, setPostulaciones] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [selectedProceso, setSelectedProceso] = useState(null);
  const [selectedPostulante, setSelectedPostulante] = useState(null);

  // Simulador de entrevista psicolaboral
  const [scoreSimulador, setScoreSimulador] = useState(3.0);
  const [notaComite, setNotaComite] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  // Chequeo inicial y carga de API
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
      const [resProc, resPost, resPreg] = await Promise.all([
        fetch(`${API_BASE}/procesos/`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/postulaciones/`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/preguntas/`).then((r) => r.json()).catch(() => []),
      ]);

      const procList = Array.isArray(resProc) ? resProc : (resProc.results || []);
      const postList = Array.isArray(resPost) ? resPost : (resPost.results || []);
      const pregList = Array.isArray(resPreg) ? resPreg : (resPreg.results || []);

      setProcesos(procList);
      setPostulaciones(postList);
      setPreguntas(pregList);
      if (procList.length > 0) setSelectedProceso(procList[0]);
    } catch (err) {
      console.warn('Utilizando datos locales de contingencia:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstadoPostulacion = async (postId, nuevoEstado) => {
    // Actualizar estado local inmediato para agilidad visual
    setPostulaciones((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, estado: nuevoEstado } : p))
    );

    // Persistir si backend está online
    try {
      await fetch(`${API_BASE}/postulaciones/${postId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
    } catch (err) {
      console.error('Error al persistir estado:', err);
    }
  };

  const handleAvanzarEtapaProceso = async () => {
    if (!selectedProceso) return;
    const currentIndex = ETAPAS_PROCESO.findIndex((e) => e.id === selectedProceso.estado);
    if (currentIndex < ETAPAS_PROCESO.length - 1) {
      const siguiente = ETAPAS_PROCESO[currentIndex + 1].id;
      const updated = { ...selectedProceso, estado: siguiente };
      setSelectedProceso(updated);
      setProcesos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

      try {
        await fetch(`${API_BASE}/procesos/${selectedProceso.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: siguiente }),
        });
      } catch (e) {
        console.warn('Persistencia offline');
      }
    }
  };

  const postulacionesFiltradas = postulaciones.filter((p) => {
    if (filtroStatus === 'todos') return true;
    return p.estado === filtroStatus;
  });

  return (
    <div className={dark ? 'app dark' : 'app'}>
      {/* Barra superior de encabezado */}
      <header className="header">
        <div className="header-left">
          <div className="hospital-emblem">🏥</div>
          <div>
            <div className="brand-badge">HOSPITAL PENCO LIRQUÉN &bull; RRHH</div>
            <h1 className="header-title">Hospital_Penco_IA</h1>
            <p className="header-subtitle">
              Plataforma de Selección Psicolaboral Abreviada &bull; Servicio de Salud Talcahuano
            </p>
          </div>
        </div>
        <div className="header-actions">
          <span className={`status-pill ${apiOnline ? 'online' : 'offline'}`}>
            <span className="dot" /> {apiOnline ? 'API Conectada (Django)' : 'Modo Demostración / Offline'}
          </span>
          <a
            href="http://127.0.0.1:8000/admin/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            title="Abrir panel administrativo de Django"
          >
            🛡️ Admin Django
          </a>
          <button className="btn btn-icon" onClick={() => setDark(!dark)} title="Alternar tema">
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Navegación por pestañas */}
      <nav className="tab-nav">
        <div className="tab-container">
          <button
            className={`tab-btn ${activeTab === 'procesos' ? 'active' : ''}`}
            onClick={() => setActiveTab('procesos')}
          >
            📋 Procesos de Selección
          </button>
          <button
            className={`tab-btn ${activeTab === 'filtro' ? 'active' : ''}`}
            onClick={() => setActiveTab('filtro')}
          >
            👥 Mesa de Postulantes ({postulaciones.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'pautas' ? 'active' : ''}`}
            onClick={() => setActiveTab('pautas')}
          >
            🌳 Pautas & Preguntas Adaptativas
          </button>
          <button
            className={`tab-btn ${activeTab === 'ia' ? 'active' : ''}`}
            onClick={() => setActiveTab('ia')}
          >
            ✨ Asistente IA (Fase Futura)
          </button>
          <button
            className={`tab-btn ${activeTab === 'auditoria' ? 'active' : ''}`}
            onClick={() => setActiveTab('auditoria')}
          >
            📜 Auditoría & Trazabilidad
          </button>
        </div>
      </nav>

      <main className="main-content">
        {/* ================= PESTAÑA 1: PROCESOS ================= */}
        {activeTab === 'procesos' && (
          <div className="tab-pane">
            <div className="section-head">
              <div>
                <h2>Concursos y Procesos Activos</h2>
                <p className="text-muted">
                  Flujo reglamentario de 10 etapas para llamados abreviados de la Ley 18.834.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAvanzarEtapaProceso}
                disabled={!selectedProceso}
              >
                ⏭️ Avanzar a Siguiente Etapa
              </button>
            </div>

            {selectedProceso ? (
              <div className="card process-detail-card">
                <div className="process-header">
                  <div>
                    <span className="badge badge-primary">
                      {selectedProceso.area_usuaria || 'Área Clínica'}
                    </span>
                    <h3 className="process-title">
                      {selectedProceso.perfil_cargo_nombre || 'Enfermero/a UCI - Servicio Paciente Crítico'}
                    </h3>
                    <p className="text-muted">
                      {selectedProceso.observaciones || 'Concurso abreviado para reemplazos prolongados.'}
                    </p>
                  </div>
                  <div className="process-meta">
                    <div className="meta-item">
                      <span className="meta-label">Fecha Límite:</span>
                      <span className="meta-value">{selectedProceso.fecha_cierre || '30/10/2026'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Postulaciones:</span>
                      <span className="meta-value highlight">{postulaciones.length} Registradas</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline de 10 Fases */}
                <h4 className="pipeline-title">Pipeline de Avance Normativo</h4>
                <div className="pipeline-track">
                  {ETAPAS_PROCESO.map((etapa, idx) => {
                    const currentIdx = ETAPAS_PROCESO.findIndex((e) => e.id === selectedProceso.estado);
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div
                        key={etapa.id}
                        className={`pipeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        <div className="step-circle">{isCompleted ? '✔' : idx + 1}</div>
                        <div className="step-label">{etapa.nombre}</div>
                        <div className="step-desc">{etapa.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card empty-state">
                <p>Cargando información del concurso...</p>
              </div>
            )}

            {/* Cuadrícula de Métricas */}
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-icon">📑</span>
                <div>
                  <div className="metric-val">{postulaciones.length}</div>
                  <div className="metric-lbl">Postulaciones Totales</div>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-icon">⏳</span>
                <div>
                  <div className="metric-val">
                    {postulaciones.filter((p) => p.estado === 'en_revision' || p.estado === 'recibida').length}
                  </div>
                  <div className="metric-lbl">En Revisión Curricular</div>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-icon">✅</span>
                <div>
                  <div className="metric-val">
                    {postulaciones.filter((p) => p.estado === 'preseleccionada' || p.estado === 'aprobada').length}
                  </div>
                  <div className="metric-lbl">Preseleccionados / Aptos</div>
                </div>
              </div>
              <div className="metric-card">
                <span className="metric-icon">🚫</span>
                <div>
                  <div className="metric-val">
                    {postulaciones.filter((p) => p.estado === 'descartada').length}
                  </div>
                  <div className="metric-lbl">Descartados por Bases</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 2: FILTRO CURRICULAR ================= */}
        {activeTab === 'filtro' && (
          <div className="tab-pane">
            <div className="section-head">
              <div>
                <h2>Mesa Digital de Revisión Curricular</h2>
                <p className="text-muted">
                  Revisión transparente de expedientes, verificación de antecedentes y registro de decisiones colegiadas.
                </p>
              </div>
              <div className="filter-group">
                <span className="text-muted">Filtrar por: </span>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="select-input"
                >
                  <option value="todos">Todos los postulantes</option>
                  <option value="recibida">Recibida</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="preseleccionada">Preseleccionada</option>
                  <option value="descartada">Descartada</option>
                </select>
              </div>
            </div>

            <div className="layout-split">
              {/* Lista de postulantes */}
              <div className="candidates-list">
                {postulacionesFiltradas.map((post) => {
                  const isSelected = selectedPostulante?.id === post.id;
                  return (
                    <div
                      key={post.id}
                      className={`card candidate-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedPostulante(post)}
                    >
                      <div className="candidate-header">
                        <div>
                          <h4 className="candidate-name">{post.postulante_nombre || `Postulante #${post.id}`}</h4>
                          <span className="candidate-rut">RUT: {post.postulante_rut || '18.452.981-2'}</span>
                        </div>
                        <span className={`badge badge-${post.estado}`}>
                          {post.estado_display || post.estado}
                        </span>
                      </div>
                      <p className="candidate-exp">
                        <strong>Formación:</strong> {post.postulante_formacion || 'Enfermera Universitaria'}
                      </p>
                      <div className="doc-indicator">
                        <span className={`doc-tag ${post.documentos_completos ? 'ok' : 'pending'}`}>
                          {post.documentos_completos ? '✔ Expediente Completo' : '⚠ Docs Incompletos'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Panel de Detalle y Votación del Comité */}
              <div className="candidate-detail">
                {selectedPostulante ? (
                  <div className="card">
                    <div className="detail-top">
                      <h3>Expediente del Postulante</h3>
                      <span className={`badge badge-${selectedPostulante.estado}`}>
                        {selectedPostulante.estado_display || selectedPostulante.estado}
                      </span>
                    </div>

                    <div className="detail-grid">
                      <div>
                        <strong>Nombre Completo:</strong>
                        <p>{selectedPostulante.postulante_nombre}</p>
                      </div>
                      <div>
                        <strong>RUT:</strong>
                        <p>{selectedPostulante.postulante_rut}</p>
                      </div>
                      <div>
                        <strong>Email de Contacto:</strong>
                        <p>{selectedPostulante.postulante_email || 'contacto@redsalud.gob.cl'}</p>
                      </div>
                      <div>
                        <strong>Teléfono:</strong>
                        <p>{selectedPostulante.postulante_telefono || '+56 9 8452 9812'}</p>
                      </div>
                    </div>

                    <div className="detail-block">
                      <strong>Formación y Especializaciones:</strong>
                      <p>{selectedPostulante.postulante_formacion || 'Sin registro detallado.'}</p>
                    </div>

                    <div className="detail-block">
                      <strong>Trayectoria y Experiencia Acreditada:</strong>
                      <p>{selectedPostulante.postulante_experiencia || 'Experiencia en servicios de salud.'}</p>
                    </div>

                    <div className="detail-block">
                      <strong>Documentos Aportados:</strong>
                      <ul className="doc-list">
                        <li>📄 Curriculum Vitae Actualizado (Firmado) - <em>Recepcionado</em></li>
                        <li>
                          🎓 Certificado de Título Superintendencia de Salud (SIS) -{' '}
                          {selectedPostulante.documentos_completos ? (
                            <span className="text-green">Verificado</span>
                          ) : (
                            <span className="text-red">Pendiente / No adjunto</span>
                          )}
                        </li>
                        <li>📋 Certificado Inhabilidades Ley 20.584 - <em>Válido</em></li>
                      </ul>
                    </div>

                    <hr className="divider" />

                    <h4>Registro de Acuerdo de Comisión</h4>
                    <p className="text-muted">
                      Seleccione la resolución para avanzar al postulante al siguiente hito:
                    </p>
                    <div className="action-buttons">
                      <button
                        className="btn btn-success"
                        onClick={() => handleCambiarEstadoPostulacion(selectedPostulante.id, 'preseleccionada')}
                      >
                        ✔ Preseleccionar para Entrevista
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={() => handleCambiarEstadoPostulacion(selectedPostulante.id, 'en_revision')}
                      >
                        ⏳ Dejar en Revisión
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCambiarEstadoPostulacion(selectedPostulante.id, 'descartada')}
                      >
                        ✖ Descartar por Bases
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card empty-panel">
                    <p>👈 Selecciona un postulante de la lista para ver su expediente y registrar la evaluación.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 3: PAUTAS Y PREGUNTAS ================= */}
        {activeTab === 'pautas' && (
          <div className="tab-pane">
            <div className="section-head">
              <div>
                <h2>Pautas de Abordaje & Banco de Preguntas Adaptativas</h2>
                <p className="text-muted">
                  Estructura lógica de preguntas madre e hijas. El sistema adapta la profundidad de la entrevista
                  según el desempeño del candidato.
                </p>
              </div>
            </div>

            <div className="card graph-card">
              <h3>Árbol de Preguntas por Competencias (UCI Paciente Crítico)</h3>
              <p className="text-muted">
                Visualización de la regla de ramificación condicional:
              </p>

              <div className="tree-container">
                {/* Pregunta Madre */}
                <div className="tree-node root-node">
                  <span className="node-badge">PREGUNTA MADRE (NIVEL 1)</span>
                  <div className="node-competence">Competencia: Manejo de Crisis y Presión</div>
                  <div className="node-text">
                    "Relate una situación crítica en UCI donde un paciente se despeñó rápidamente y cómo coordinó
                    las primeras acciones de rescate."
                  </div>
                  <div className="node-meta">Dificultad: Media &bull; Rúbrica: 1 al 5</div>
                </div>

                <div className="tree-branch-indicator">
                  <span>⬇ Desempeño durante la respuesta ⬇</span>
                </div>

                <div className="tree-children">
                  {/* Rama Si Puntaje Bajo */}
                  <div className="tree-node child-node low-branch">
                    <span className="node-badge badge-warning">SI PUNTAJE BAJO (&lt; 3.0)</span>
                    <div className="node-competence">Competencia: Autocuidado y Contención</div>
                    <div className="node-text">
                      "En caso de verse sobrepasado/a emocionalmente por el fallecimiento de un paciente o la
                      reacción agresiva de un familiar, ¿qué mecanismos personales de contención activa?"
                    </div>
                    <div className="node-reason">
                      <strong>Objetivo:</strong> Evaluar riesgo de desborde y capacidad reflexiva.
                    </div>
                  </div>

                  {/* Rama Si Puntaje Alto */}
                  <div className="tree-node child-node high-branch">
                    <span className="node-badge badge-success">SI PUNTAJE ALTO (&gt;= 4.0)</span>
                    <div className="node-competence">Competencia: Liderazgo y Negociación Ética</div>
                    <div className="node-text">
                      "¿Cómo aborda un desacuerdo técnico o ético con el médico de turno respecto al tratamiento de
                      un paciente terminal?"
                    </div>
                    <div className="node-reason">
                      <strong>Objetivo:</strong> Profundizar juicio clínico superior y asertividad.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulador Interactivo */}
            <div className="card simulator-card">
              <h3>🧪 Simulador Interactivo de Entrevista Adaptativa</h3>
              <p className="text-muted">
                Ajuste el puntaje observado en la pregunta madre para observar cómo el sistema recomienda la siguiente pregunta:
              </p>
              <div className="slider-control">
                <label>
                  Puntaje asignado a Pregunta Madre: <strong>{scoreSimulador} / 5.0</strong>
                </label>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.5"
                  value={scoreSimulador}
                  onChange={(e) => setScoreSimulador(parseFloat(e.target.value))}
                  className="score-range"
                />
              </div>

              <div className="simulator-result">
                {scoreSimulador < 3.0 ? (
                  <div className="alert alert-warning">
                    <strong>Acción sugerida por el sistema:</strong> Se activa la pregunta de profundización de
                    <strong> Autocuidado y Contención</strong> debido a que el puntaje ({scoreSimulador}) está bajo
                    el umbral de confort para servicios críticos.
                  </div>
                ) : (
                  <div className="alert alert-success">
                    <strong>Acción sugerida por el sistema:</strong> Se activa la pregunta avanzada de
                    <strong> Liderazgo y Negociación Ética</strong> ya que el candidato demostró solvencia ({scoreSimulador}).
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 4: ASISTENTE IA ================= */}
        {activeTab === 'ia' && (
          <div className="tab-pane">
            <div className="section-head">
              <div>
                <h2>Módulo de Inteligencia Artificial (Proyección Técnica)</h2>
                <p className="text-muted">
                  Definición formal del algoritmo y laboratorio para la generación inteligente de preguntas.
                </p>
              </div>
            </div>

            <div className="card ai-card">
              <div className="ai-badge-header">
                <span className="ai-status">FASE PREVISTA &bull; ARQUITECTURA DEFINIDA</span>
              </div>
              <h3 className="ai-title">Algoritmo Seleccionado para la Generación de Preguntas:</h3>
              <div className="algo-box">
                <span className="algo-tag">ALGORITMO PRINCIPAL</span>
                <h4 className="algo-name">RAG (Retrieval-Augmented Generation) con Embeddings Semánticos</h4>
                <p className="algo-source">
                  Fuente directa de laboratorio: <code>Lab1_RAG_Desde_Cero.ipynb</code>
                </p>
              </div>

              <div className="ai-explanation">
                <h4>¿Por qué este algoritmo es el idóneo para el Hospital Penco Lirquén?</h4>
                <div className="feature-grid">
                  <div className="feature-item">
                    <span className="feature-icon">🔍</span>
                    <h5>1. Recuperación Contextual (Retrieval)</h5>
                    <p>
                      El hospital maneja normativas rigurosas (Estatuto Administrativo, perfiles MINSAL). RAG busca
                      las competencias específicas del perfil del cargo antes de generar nada, impidiendo inventar requisitos.
                    </p>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">📐</span>
                    <h5>2. Similitud Coseno de Embeddings</h5>
                    <p>
                      Mapea el descriptor del cargo y las preguntas históricas validadas por la psicóloga laboral
                      en un espacio vectorial para emparejar la dificultad exacta requerida.
                    </p>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🛡️</span>
                    <h5>3. Supervisión Humana y Mitigación de Sesgo</h5>
                    <p>
                      Las preguntas sugeridas por el LLM se presentan en borrador con rúbrica obligatoria. Ninguna pregunta
                      se publica sin la aprobación de Carolina Ruiz Parra o la comisión evaluadora.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vista previa de la futura interfaz */}
              <div className="ai-preview-box">
                <h4>Demostración Conceptual de Generación</h4>
                <div className="mock-chat">
                  <div className="chat-bubble user">
                    "Generar 2 preguntas de incidentes críticos para el cargo de Enfermero/a UCI centradas en
                    la competencia de 'Tolerancia al estrés en turno nocturno'."
                  </div>
                  <div className="chat-bubble ai">
                    <div className="bubble-header">🤖 Asistente IA (RAG - Hospital Penco Lirquén)</div>
                    <p>
                      <em>[Recuperado de Perfil UCI v1.0 y Pauta Psicolaboral aprobada]</em>
                    </p>
                    <p>
                      <strong>Pregunta sugerida:</strong> "Describa una ocasión en que durante un turno de noche
                      recibió dos ingresos simultáneos en paro cardiorrespiratorio con dotación reducida. ¿Cómo priorizó
                      la asignación del personal técnico y qué criterios clínicos utilizó?"
                    </p>
                    <p>
                      <strong>Rúbrica de evaluación (1-5):</strong> Puntaje alto si demuestra calma, asignación por
                      roles y comunicación en bucle cerrado.
                    </p>
                    <div className="preview-actions">
                      <button className="btn btn-sm btn-primary">Aprobar e incorporar al Banco</button>
                      <button className="btn btn-sm">Regenerar con mayor dificultad</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 5: AUDITORÍA ================= */}
        {activeTab === 'auditoria' && (
          <div className="tab-pane">
            <div className="section-head">
              <div>
                <h2>Registro de Auditoría y Trazabilidad Pública</h2>
                <p className="text-muted">
                  Cumplimiento del principio de probidad administrativa. Toda decisión queda grabada con fecha y responsable.
                </p>
              </div>
            </div>

            <div className="card">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Fecha y Hora</th>
                    <th>Acción Realizada</th>
                    <th>Responsable</th>
                    <th>Detalle del Registro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>19/10/2026 18:30</td>
                    <td><span className="badge badge-primary">APERTURA_PROCESO</span></td>
                    <td>Carolina Ruiz Parra (Jefa RRHH)</td>
                    <td>Apertura de concurso abreviado Enfermero/a UCI. Bases aprobadas por Dirección.</td>
                  </tr>
                  <tr>
                    <td>19/10/2026 18:35</td>
                    <td><span className="badge badge-warning">REVISION_CURRICULAR</span></td>
                    <td>Comisión de Selección</td>
                    <td>Recepción de 3 postulantes. Verificación de certificados SIS y antecedentes.</td>
                  </tr>
                  <tr>
                    <td>19/10/2026 18:40</td>
                    <td><span className="badge badge-success">PRESELECCION</span></td>
                    <td>Psicólogo Laboral</td>
                    <td>Postulante Camila Sepúlveda Morales cumple 100% de requisitos. Avanza a entrevista.</td>
                  </tr>
                  <tr>
                    <td>19/10/2026 18:41</td>
                    <td><span className="badge badge-danger">DESCARTADA</span></td>
                    <td>Comisión de Selección</td>
                    <td>Postulante María Ignacia Paz descartada por no acreditar año mínimo de experiencia UCI.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div>
          Hospital_Penco_IA &bull; Hospital Penco Lirquén &bull; Universidad de Concepción / Biobío 2026
        </div>
        <div>Desarrollado con Django 5, React y Vite</div>
      </footer>
    </div>
  );
}
