import { useState, useEffect } from 'react'
import { apiFetch } from './api'

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
  'Cerrado',
]

export default function App() {
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark')
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'))
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [procesos, setProcesos] = useState([])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (token) {
      apiFetch('/api/seleccion/procesos/')
        .then((d) => setProcesos(Array.isArray(d) ? d : (d.results || [])))
        .catch(() => setProcesos([]))
    }
  }, [token])

  const login = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      }).then((r) => r.json())
      if (data.status !== 'ok') throw new Error(data.message || 'Login failed')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setUser(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setProcesos([])
  }

  if (!token) {
    return (
      <div className={dark ? 'app dark' : 'app'}>
        <main className="container">
          <section className="card" style={{ gridColumn: 'span 12', maxWidth: 420, margin: '40px auto' }}>
            <h2>Acceso institucional</h2>
            <form onSubmit={login} className="col">
              <input className="input" placeholder="Usuario" value={creds.username}
                onChange={(e) => setCreds({ ...creds, username: e.target.value })} />
              <input className="input" type="password" placeholder="Contrasena" value={creds.password}
                onChange={(e) => setCreds({ ...creds, password: e.target.value })} />
              {error && <p className="muted" style={{ color: '#dc2626' }}>{error}</p>}
              <button className="btn primary" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
            <p className="muted">Usuarios demo: admin/admin123, carolina.ruiz/rrhh123, psicologa/psico123, comite1/comite123</p>
          </section>
        </main>
      </div>
    )
  }

  const rol = user?.rol || ''
  const isAdmin = rol.includes('Administrador')
  const isRRHH = rol.includes('RRHH') || isAdmin
  const isPsico = rol.includes('Psicologo') || isAdmin
  const isComite = rol.includes('Comision') || isAdmin

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="topbar">
        <div>
          <h1>Hospital Penco Lirquen - Reclutamiento RRHH</h1>
          <span className="muted">{user?.nombre} · {rol}</span>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setDark(!dark)}>{dark ? 'Claro' : 'Oscuro'}</button>
          <button className="btn" onClick={logout}>Salir</button>
        </div>
      </header>
      <main className="container grid">
        <section className="card">
          <h2>Pipeline ({procesos.length})</h2>
          <ul className="list">
            {ETAPAS.map((e, i) => (
              <li key={i} className="list-item"><span className="badge">{i + 1}</span> {e}</li>
            ))}
          </ul>
        </section>
        {isComite && (
          <section className="card">
            <h2>Comite de revision</h2>
            <p className="muted">Revision curricular y registro de acuerdos.</p>
          </section>
        )}
        {isPsico && (
          <section className="card">
            <h2>Asistente IA (Preparacion)</h2>
            <p className="muted">Genera borradores de pautas y preguntas. Requiere validacion humana.</p>
          </section>
        )}
        {isRRHH && (
          <section className="card">
            <h2>Gestion de procesos</h2>
            <p className="muted">Crear, mover etapas y auditar.</p>
            <ul className="list">
              {procesos.map((p) => (
                <li key={p.id} className="list-item">{p.id} · {p.estado}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
