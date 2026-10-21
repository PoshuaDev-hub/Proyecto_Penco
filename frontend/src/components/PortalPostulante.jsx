import React, { useState, useEffect } from 'react';
import {
  IconHospital,
  IconCheck,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconLock,
  IconFileText,
  IconPlus,
  IconX,
  IconSun,
  IconMoon,
  IconShield,
  IconSend,
  IconUser,
} from './Icons';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000') + '/api';

export default function PortalPostulante({ token, initialRut = '', onVolver, dark, setDark }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successFeedback, setSuccessFeedback] = useState('');
  const [portalData, setPortalData] = useState(null);

  // Verificación de RUT para doble factor de seguridad
  const [rutIngresado, setRutIngresado] = useState(initialRut || '');
  const [rutVerificado, setRutVerificado] = useState(false);
  const [rutInputTemporal, setRutInputTemporal] = useState(initialRut || '');
  const [rutError, setRutError] = useState('');
  const [verificandoRut, setVerificandoRut] = useState(false);

  // Formulario editable del postulante
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
    titulo_profesional: '',
    registro_sis: '',
    formacion_academica: '',
    anios_experiencia: 0,
    experiencia: '',
  });

  const [documentos, setDocumentos] = useState([]);
  const [nuevoDocNombre, setNuevoDocNombre] = useState('');
  const [nuevoDocTipo, setNuevoDocTipo] = useState('certificado');

  // Cargar datos por Token seguro + RUT
  const fetchPortalData = async (tokenToFetch, rutToVerify = rutIngresado) => {
    setLoading(true);
    setError('');
    setRutError('');
    try {
      const query = rutToVerify ? `?rut=${encodeURIComponent(rutToVerify.trim())}` : '';
      const res = await fetch(`${API_BASE}/portal-postulante/${tokenToFetch}/${query}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 || data.rut_invalido) {
          setRutError(data.error || 'El RUT ingresado no coincide con el expediente de este enlace de postulación.');
          setRutVerificado(false);
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          throw new Error('El enlace de postulación no es válido o ha expirado. Verifique el token provisto.');
        }
        throw new Error(data.error || `Error en el servidor (${res.status}). Intente nuevamente.`);
      }

      setPortalData(data);

      if (data.requiere_verificacion_rut) {
        setRutVerificado(false);
        setLoading(false);
        return;
      }

      // Si tiene postulante, está 100% verificado
      if (data.postulante) {
        setRutVerificado(true);
        setRutIngresado(data.postulante.rut || rutToVerify);
        setFormData({
          nombres: data.postulante.nombres || '',
          apellidos: data.postulante.apellidos || '',
          email: data.postulante.email || '',
          telefono: data.postulante.telefono || '',
          titulo_profesional: data.postulante.titulo_profesional || '',
          registro_sis: data.postulante.registro_sis || '',
          formacion_academica: data.postulante.formacion_academica || '',
          anios_experiencia: data.postulante.anios_experiencia || 0,
          experiencia: data.postulante.experiencia || '',
        });
        setDocumentos(data.documentos || []);
      }
    } catch (err) {
      setError(err.message || 'No fue posible cargar los datos de la postulación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData(token, initialRut);
    } else {
      setError('No se ha proporcionado un token de acceso seguro.');
      setLoading(false);
    }
  }, [token, initialRut]);

  const handleVerificarRut = async (e) => {
    if (e) e.preventDefault();
    if (!rutInputTemporal.trim()) {
      setRutError('Debe ingresar su RUT para verificar su identidad.');
      return;
    }
    setVerificandoRut(true);
    setRutError('');
    await fetchPortalData(token, rutInputTemporal.trim());
    setVerificandoRut(false);
  };

  // Manejar cambios en formulario
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Agregar documento a la lista
  const handleAgregarDocumento = () => {
    if (!nuevoDocNombre.trim()) return;
    const doc = {
      id: `temp-${Date.now()}`,
      nombre: nuevoDocNombre.trim(),
      tipo: nuevoDocTipo,
      tipo_display: nuevoDocTipo === 'cv' ? 'Curriculum Vitae' : nuevoDocTipo === 'registro_sis' ? 'Registro SIS' : 'Certificado Oficial',
      recibido: true,
      subido_en: new Date().toISOString(),
    };
    setDocumentos((prev) => [...prev, doc]);
    setNuevoDocNombre('');
  };

  // Guardar y enviar
  const handleSubmitPostulacion = async (accion = 'guardar') => {
    setSubmitting(true);
    setSuccessFeedback('');
    try {
      const payload = {
        ...formData,
        rut: rutIngresado,
        accion, // 'guardar' o 'enviar'
        documentos_declarados: documentos.map((d) => ({
          nombre: d.nombre,
          tipo: d.tipo,
        })),
      };

      const res = await fetch(`${API_BASE}/portal-postulante/${token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Hubo un inconveniente al registrar la postulación en el servidor.');
      }

      const result = await res.json();
      setSuccessFeedback(result.mensaje || 'Información procesada exitosamente.');

      // Recargar datos actualizados
      await fetchPortalData(token, rutIngresado);
    } catch (err) {
      setError(err.message || 'Error al guardar la información.');
    } finally {
      setSubmitting(false);
    }
  };

  // Determinar etapa activa en el stepper
  const getEtapaIndex = (etapaKey, estadoKey) => {
    if (estadoKey === 'aprobada') return 4;
    if (etapaKey === 'informe_directora' || etapaKey === 'integracion') return 3;
    if (etapaKey === 'entrevistas_tecnicas' || etapaKey === 'evaluacion_psicolaboral') return 2;
    if (etapaKey === 'revision_curricular' || estadoKey === 'en_revision') return 1;
    return 0; // recepcion
  };

  const etapaActivaIdx = portalData ? getEtapaIndex(portalData.etapa_actual, portalData.estado) : 0;

  return (
    <div className="portal-container" data-theme={dark ? 'dark' : 'light'}>
      {/* Header Institucional */}
      <header className="portal-header">
        <div className="portal-header-content">
          <div className="portal-brand">
            <div className="portal-brand-icon">
              <IconHospital size={26} />
            </div>
            <div>
              <h1 className="portal-brand-title">Portal de Postulación y Seguimiento Concursal</h1>
              <p className="portal-brand-subtitle">
                Hospital Penco Lirquén &bull; Red Asistencial Servicio de Salud Talcahuano &bull; Ley 18.834
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge-erp badge-erp-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <IconLock size={13} />
              <span>Acceso Cifrado por Token</span>
            </span>

            {setDark && (
              <button
                className="btn-erp btn-erp-sm btn-erp-secondary"
                onClick={() => setDark(!dark)}
                title="Cambiar tema visual"
              >
                {dark ? <IconSun size={15} /> : <IconMoon size={15} />}
              </button>
            )}

            {onVolver && (
              <button
                className="btn-erp btn-erp-sm btn-erp-outline"
                onClick={onVolver}
                title="Regresar al sistema principal"
              >
                <span>Volver al Sistema</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="portal-main">
        {loading ? (
          <div className="card-erp" style={{ padding: 48, textAlign: 'center' }}>
            <div className="erp-spinner" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Cargando expediente seguro...</h3>
            <p style={{ color: 'var(--erp-text-muted)', fontSize: 13, marginTop: 4 }}>
              Verificando token institucional y estado de la convocatoria
            </p>
          </div>
        ) : error ? (
          <div className="card-erp" style={{ padding: 36, textAlign: 'center', borderLeft: '4px solid #dc2626' }}>
            <IconAlertTriangle size={36} style={{ color: '#dc2626', marginBottom: 12 }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#dc2626', margin: '0 0 6px 0' }}>
              Enlace No Disponible
            </h3>
            <p style={{ fontSize: 14, color: 'var(--erp-text-muted)', maxWidth: 500, margin: '0 auto 18px auto' }}>
              {error}
            </p>
            {onVolver && (
              <button className="btn-erp btn-erp-primary" onClick={onVolver}>
                Ir a Inicio
              </button>
            )}
          </div>
        ) : portalData && !rutVerificado ? (
          <div className="card-erp" style={{ maxWidth: 500, margin: '40px auto', padding: '36px 30px', textAlign: 'center', boxShadow: 'var(--erp-shadow-lg)' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(2, 132, 199, 0.1)',
              color: 'var(--erp-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}>
              <IconShield size={28} />
            </div>

            <span className="badge-erp badge-erp-primary" style={{ marginBottom: 10, display: 'inline-block' }}>
              Protección de Datos Personales • Ley 19.628
            </span>

            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '6px 0 8px 0', color: 'var(--erp-text)' }}>
              Verificación de Identidad del Postulante
            </h2>

            <p style={{ fontSize: 13, color: 'var(--erp-text-muted)', marginBottom: 22, lineHeight: 1.5 }}>
              Concurso: <strong>{portalData.proceso?.cargo_nombre || 'Cargo Asistencial'}</strong> ({portalData.proceso?.area_usuaria || 'Hospital Penco Lirquén'}).<br />
              Para consultar el avance de su postulación o completar sus antecedentes, confirme su RUT:
            </p>

            {rutError && (
              <div className="login-error-alert" style={{ marginBottom: 18, textAlign: 'left' }}>
                <IconAlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5 }}>{rutError}</span>
              </div>
            )}

            <form onSubmit={handleVerificarRut}>
              <div className="form-group-erp" style={{ textAlign: 'left', marginBottom: 18 }}>
                <label className="form-label-erp" style={{ fontSize: 13, fontWeight: 700 }}>
                  RUT del Postulante:
                </label>
                <div className="erp-input-box" style={{ height: 44 }}>
                  <input
                    type="text"
                    className="erp-input-field"
                    placeholder="Ej: 12.345.678-9 o 12345678-9"
                    value={rutInputTemporal}
                    onChange={(e) => setRutInputTemporal(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="erp-input-icon">
                    <IconUser size={16} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-erp btn-erp-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: 14 }}
                disabled={verificandoRut}
              >
                <IconCheck size={16} />
                <span>{verificandoRut ? 'Verificando Identidad...' : 'Confirmar y Acceder'}</span>
              </button>
            </form>

            {onVolver && (
              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="link-splash-loop"
                  style={{ fontSize: 12 }}
                  onClick={onVolver}
                >
                  Volver al Inicio
                </button>
              </div>
            )}
          </div>
        ) : portalData && (
          <>
            {/* Stepper de 5 Etapas del Concurso */}
            <div className="portal-stepper">
              {[
                { title: '1. Recepción', desc: 'Ingreso digital de antecedentes' },
                { title: '2. Revisión Curricular', desc: 'Admisibilidad en Comité' },
                { title: '3. Evaluaciones', desc: 'Entrevistas Técnicas / Psico' },
                { title: '4. Terna Final', desc: 'Informe motivado a Dirección' },
                { title: '5. Integración', desc: 'Nombramiento y cierre' },
              ].map((step, idx) => {
                const isCompleted = idx < etapaActivaIdx;
                const isCurrent = idx === etapaActivaIdx;
                return (
                  <div
                    key={idx}
                    className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  >
                    <div className="stepper-circle">
                      {isCompleted ? <IconCheck size={18} /> : idx + 1}
                    </div>
                    <div className="stepper-title">{step.title}</div>
                    <div className="stepper-desc">{step.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Tarjeta de Estado y Resumen del Concurso */}
            <div className="portal-status-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <span className="badge-erp badge-erp-primary" style={{ marginBottom: 6, display: 'inline-block' }}>
                    Convocatoria Ley 18.834
                  </span>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--erp-text)' }}>
                    {portalData.proceso?.cargo_nombre || 'Cargo Asistencial'}
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--erp-text-muted)', margin: '4px 0 0 0' }}>
                    Área Usuaria: <strong>{portalData.proceso?.area_usuaria}</strong> &bull; Concurso #{portalData.proceso?.id}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge-erp ${
                    portalData.estado === 'preseleccionada' || portalData.estado === 'aprobada'
                      ? 'badge-erp-success'
                      : portalData.estado === 'descartada'
                      ? 'badge-erp-danger'
                      : portalData.estado === 'subsanacion' || portalData.subsanacion_solicitada
                      ? 'badge-erp-warning'
                      : 'badge-erp-primary'
                  }`} style={{ fontSize: 13, padding: '6px 14px' }}>
                    Estado: {portalData.estado_display || portalData.estado}
                  </span>
                  {portalData.fecha_envio && (
                    <div style={{ fontSize: 11, color: 'var(--erp-text-muted)', marginTop: 4 }}>
                      Enviado: {new Date(portalData.fecha_envio).toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              </div>

              {/* Banners Condicionales según Estado con Final Coherente */}
              {portalData.estado === 'aprobada' ? (
                <div className="portal-status-banner success" style={{ borderLeft: '4px solid var(--erp-success)', background: 'rgba(16, 185, 129, 0.08)' }}>
                  <IconCheckCircle size={28} style={{ flexShrink: 0, marginTop: 2, color: 'var(--erp-success)' }} />
                  <div>
                    <strong style={{ fontSize: 15, color: 'var(--erp-success)' }}>
                      🎉 Postulación Favorable • Candidato/a Seleccionado/a
                    </strong>
                    <p style={{ fontSize: 13, margin: '6px 0 0 0', lineHeight: 1.5 }}>
                      {portalData.observacion_postulante ||
                        'La Comisión Calificadora del Hospital Penco Lirquén ha finalizado la evaluación curricular y técnica con resultado favorable. La Subdirección de Gestión de las Personas coordinará el examen de salud compatible y el trámite de la Resolución Exenta de designación.'}
                    </p>
                    <span style={{ fontSize: 11.5, opacity: 0.9, marginTop: 6, display: 'inline-block', fontWeight: 600 }}>
                      Estatuto Administrativo Ley 18.834 &bull; Servicio de Salud Talcahuano
                    </span>
                  </div>
                </div>
              ) : portalData.estado === 'descartada' ? (
                <div className="portal-status-banner danger" style={{ borderLeft: '4px solid var(--erp-danger)', background: 'rgba(239, 68, 68, 0.08)' }}>
                  <IconX size={26} style={{ flexShrink: 0, marginTop: 2, color: 'var(--erp-danger)' }} />
                  <div>
                    <strong style={{ fontSize: 14, color: 'var(--erp-danger)' }}>
                      Notificación de Término de Participación Concursal
                    </strong>
                    <p style={{ fontSize: 13, margin: '4px 0 0 0', color: 'var(--erp-text)' }}>
                      {portalData.observacion_postulante ||
                        'En conformidad con las bases de la convocatoria Ley 18.834 y la deliberación de la Comisión, sus antecedentes no han continuado a las siguientes fases. Agradecemos su interés y participación en este concurso público.'}
                    </p>
                    <span style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, display: 'inline-block' }}>
                      Expediente digital custodiado según normativa vigente de archivo público.
                    </span>
                  </div>
                </div>
              ) : portalData.subsanacion_solicitada || portalData.estado === 'subsanacion' ? (
                <div className="portal-status-banner warning">
                  <IconAlertTriangle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: 14 }}>Subsanación de Antecedentes Requerida por la Comisión</strong>
                    <p style={{ fontSize: 13, margin: '4px 0 0 0' }}>
                      {portalData.observacion_postulante || 'Se requiere actualizar o adjuntar documentación adicional para dar cumplimiento a las bases del concurso.'}
                    </p>
                    <span style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, display: 'inline-block' }}>
                      Puede modificar los campos a continuación y presionar "Guardar y Reenviar Postulación".
                    </span>
                  </div>
                </div>
              ) : portalData.estado === 'preseleccionada' ? (
                <div className="portal-status-banner success">
                  <IconCheckCircle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: 14 }}>Expediente Preseleccionado • Habilitado para Entrevistas</strong>
                    <p style={{ fontSize: 13, margin: '4px 0 0 0' }}>
                      {portalData.observacion_postulante || 'Ha superado la revisión curricular y el semáforo documental SIS. Su postulación avanza a la fase de entrevistas técnicas y psicolaborales.'}
                    </p>
                  </div>
                </div>
              ) : portalData.fecha_envio ? (
                <div className="portal-status-banner success">
                  <IconCheckCircle size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: 14 }}>Postulación Oficial Recepcionada y Registrada</strong>
                    <p style={{ fontSize: 13, margin: '4px 0 0 0' }}>
                      {portalData.observacion_postulante || 'Sus antecedentes han sido ingresados exitosamente al sistema de selección del Hospital Penco Lirquén y están asignados a la mesa de revisión curricular.'}
                    </p>
                    <span style={{ fontSize: 11.5, opacity: 0.85, marginTop: 4, display: 'inline-block' }}>
                      Guarde este enlace para consultar en tiempo real las novedades del proceso de selección.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="portal-status-banner info">
                  <IconClock size={24} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ fontSize: 14 }}>Postulación en Fase de Borrador</strong>
                    <p style={{ fontSize: 13, margin: '4px 0 0 0' }}>
                      Por favor complete sus datos personales, formación profesional y declare sus antecedentes adjuntos. Una vez verificado, presione el botón <strong>"Guardar y Enviar Postulación"</strong>.
                    </p>
                  </div>
                </div>
              )}

              {successFeedback && (
                <div className="portal-status-banner success" style={{ marginBottom: 16 }}>
                  <IconCheck size={20} />
                  <span>{successFeedback}</span>
                </div>
              )}

              {/* Formulario de Antecedentes */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconUser size={18} />
                  <span>1. Identificación y Antecedentes Personales</span>
                </h3>

                <div className="portal-form-grid">
                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>RUT (Identificador Oficial)</span>
                    </label>
                    <input
                      type="text"
                      className="portal-input"
                      value={portalData.postulante?.rut || ''}
                      disabled
                      title="El RUT está asignado por la institución y no es modificable"
                    />
                  </div>

                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>Nombres</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="portal-input"
                      value={formData.nombres}
                      onChange={(e) => handleInputChange('nombres', e.target.value)}
                      disabled={!portalData.permite_edicion || submitting}
                      placeholder="Ej: Carolina Andrea"
                    />
                  </div>

                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>Apellidos</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="portal-input"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      disabled={!portalData.permite_edicion || submitting}
                      placeholder="Ej: Silva Contreras"
                    />
                  </div>

                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>Correo Electrónico de Notificación</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="portal-input"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!portalData.permite_edicion || submitting}
                      placeholder="ejemplo@correo.cl"
                    />
                  </div>

                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>Teléfono de Contacto</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      className="portal-input"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      disabled={!portalData.permite_edicion || submitting}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>Años de Experiencia Asistencial / Clínica</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      className="portal-input"
                      value={formData.anios_experiencia}
                      onChange={(e) => handleInputChange('anios_experiencia', e.target.value)}
                      disabled={!portalData.permite_edicion || submitting}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconShield size={18} />
                  <span>2. Formación Profesional y Registro Superintendencia de Salud (SIS)</span>
                </h3>

                <div className="portal-form-grid">
                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>Título Profesional Universitario o Técnico</span>
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="portal-input"
                      value={formData.titulo_profesional}
                      onChange={(e) => handleInputChange('titulo_profesional', e.target.value)}
                      disabled={!portalData.permite_edicion || submitting}
                      placeholder="Ej: Médico Cirujano, Enfermera(o), TENS..."
                    />
                  </div>

                  <div className="portal-field-group">
                    <label className="portal-label">
                      <span>N° de Registro Superintendencia de Salud (SIS)</span>
                    </label>
                    <input
                      type="text"
                      className="portal-input"
                      value={formData.registro_sis}
                      onChange={(e) => handleInputChange('registro_sis', e.target.value)}
                      disabled={!portalData.permite_edicion || submitting}
                      placeholder="Ej: RNPI-482910"
                    />
                  </div>
                </div>

                <div className="portal-field-group" style={{ marginBottom: 18 }}>
                  <label className="portal-label">
                    <span>Institución de Egreso y Especializaciones</span>
                  </label>
                  <textarea
                    rows="2"
                    className="portal-textarea"
                    value={formData.formacion_academica}
                    onChange={(e) => handleInputChange('formacion_academica', e.target.value)}
                    disabled={!portalData.permite_edicion || submitting}
                    placeholder="Detalle universidad / instituto, año de titulación y diplomados o postítulos relevantes..."
                  />
                </div>

                <div className="portal-field-group" style={{ marginBottom: 18 }}>
                  <label className="portal-label">
                    <span>Resumen de Experiencia Laboral Relevante para el Cargo</span>
                  </label>
                  <textarea
                    rows="3"
                    className="portal-textarea"
                    value={formData.experiencia}
                    onChange={(e) => handleInputChange('experiencia', e.target.value)}
                    disabled={!portalData.permite_edicion || submitting}
                    placeholder="Describa servicios hospitalarios, unidades críticas, reemplazos previos o funciones similares desempeñadas..."
                  />
                </div>

                {/* Sección de Documentos */}
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconFileText size={18} />
                  <span>3. Documentos y Antecedentes Declarados</span>
                </h3>

                <div className="portal-docs-box">
                  <div style={{ fontSize: 12, color: 'var(--erp-text-muted)', marginBottom: 12 }}>
                    Requisitos normados Ley 18.834: Currículum Vitae, Certificado de Título legalizado y Certificado de Registro SIS.
                  </div>

                  {documentos.length === 0 ? (
                    <div style={{ padding: 14, textAlign: 'center', color: 'var(--erp-text-muted)', fontSize: 13 }}>
                      No ha registrado documentos aún. Incorpore los antecedentes a continuación.
                    </div>
                  ) : (
                    documentos.map((doc, idx) => (
                      <div key={idx} className="portal-doc-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <IconFileText size={18} style={{ color: 'var(--erp-primary)' }} />
                          <div>
                            <strong style={{ fontSize: 13 }}>{doc.nombre}</strong>
                            <div style={{ fontSize: 11, color: 'var(--erp-text-muted)' }}>
                              Tipo: {doc.tipo_display || doc.tipo} &bull; Sello: Conforme
                            </div>
                          </div>
                        </div>

                        <span className="badge-erp badge-erp-success" style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <IconCheck size={12} />
                          <span>Recepcionado</span>
                        </span>
                      </div>
                    ))
                  )}

                  {portalData.permite_edicion && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        className="portal-input"
                        style={{ flex: 1, minWidth: 200 }}
                        placeholder="Nombre del documento (ej: Certificado SIS, Copia Título)..."
                        value={nuevoDocNombre}
                        onChange={(e) => setNuevoDocNombre(e.target.value)}
                        disabled={submitting}
                      />
                      <select
                        className="portal-select"
                        value={nuevoDocTipo}
                        onChange={(e) => setNuevoDocTipo(e.target.value)}
                        disabled={submitting}
                      >
                        <option value="cv">Curriculum Vitae</option>
                        <option value="certificado">Certificado de Título</option>
                        <option value="registro_sis">Registro Nacional SIS</option>
                        <option value="antecedentes">Certificado Antecedentes</option>
                        <option value="otro">Otro Antecedente</option>
                      </select>
                      <button
                        type="button"
                        className="btn-erp btn-erp-primary"
                        onClick={handleAgregarDocumento}
                        disabled={!nuevoDocNombre.trim() || submitting}
                      >
                        <IconPlus size={15} />
                        <span>Adjuntar / Declarar</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Acciones de Envío */}
                <div className="portal-footer-actions">
                  {portalData.permite_edicion && (
                    <>
                      <button
                        type="button"
                        className="btn-erp btn-erp-secondary"
                        onClick={() => handleSubmitPostulacion('guardar')}
                        disabled={submitting}
                      >
                        <span>Guardar Borrador</span>
                      </button>

                      <button
                        type="button"
                        className="btn-erp btn-erp-primary"
                        onClick={() => handleSubmitPostulacion('enviar')}
                        disabled={submitting || !formData.nombres || !formData.apellidos || !formData.email}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', fontSize: 14 }}
                      >
                        <IconSend size={16} />
                        <span>{portalData.subsanacion_solicitada ? 'Guardar y Reenviar Subsanación' : 'Guardar y Enviar Postulación'}</span>
                      </button>
                    </>
                  )}

                  {!portalData.permite_edicion && (
                    <div style={{ fontSize: 12, color: 'var(--erp-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <IconLock size={14} />
                      <span>
                        Expediente formalmente cerrado para edición. Si requiere modificar algún dato, contacte a la Mesa de Entradas del Hospital Penco Lirquén.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
