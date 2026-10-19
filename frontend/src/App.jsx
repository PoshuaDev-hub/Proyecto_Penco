import { useState } from 'react'

const ETAPAS = [
  'Solicitud de llamado',
  'Preparacion de perfil',
  'Aviso de postulacion',
  'Recepcion de postulaciones',
  'Revision curricular',
  'Entrevistas tecnicas',
  'Evaluacion psicolaboral',
  'Informe a la Directora',
  'Proceso de integracion',
]

export default function App() {
  const [dark, setDark] = useState(false)
  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="topbar">
        <h1>Hospital Penco Lirquen - Reclutamiento RRHH</h1>
        <button className="btn" onClick={() => setDark(!dark)}>
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>
      </header>
      <main className="container grid">
        <section className="card">
          <h2>Pipeline de procesos</h2>
          <ul className="list">
            {ETAPAS.map((e, i) => (
              <li key={i} className="list-item">
                <span className="badge">{i + 1}</span> {e}
              </li>
            ))}
          </ul>
        </section>
        <section className="card">
          <h2>Revision curricular (Comite)</h2>
          <p className="muted">Vista de mesa digital: antecedentes, semaforo documental, registro de acuerdos.</p>
          <div className="row">
            <button className="btn primary">Abrir proceso</button>
            <button className="btn">Registrar decision</button>
          </div>
        </section>
        <section className="card">
          <h2>Asistente IA (Preparacion)</h2>
          <p className="muted">Genera borradores de pautas y preguntas. Requiere validacion humana.</p>
          <div className="row">
            <button className="btn primary">Generar pauta tecnica</button>
            <button className="btn">Generar pauta psicolaboral</button>
          </div>
        </section>
      </main>
    </div>
  )
}
