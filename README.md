# Hospital_Penco_IA

**Sistema Integrado de Gestión de Reclutamiento y Selección Psicolaboral Abreviada**  
*Subdirección de Gestión y Desarrollo de las Personas — Hospital Penco Lirquén (Servicio de Salud Talcahuano)*

---

## 🎯 Propósito del Sistema
Estandarizar, agilizar y auditar el flujo de selección abreviada de personal clínico y administrativo bajo el marco de la Ley 18.834 (Estatuto Administrativo), reduciendo tiempos muertos y garantizando la trazabilidad pública de las decisiones de la comisión evaluadora.

---

## 🏗️ Stack Tecnológico
- **Backend:** Python 3.10+, Django 5, Django REST Framework (DRF), PostgreSQL (Producción) / SQLite (Desarrollo).
- **Frontend:** React 18, Vite 5, Vanilla CSS modular con paleta clínica y modo oscuro.
- **Orquestación:** Node.js con scripts dedicados para instalación y levantamiento concurrente.
- **Despliegue Producción:** Debian Linux, Gunicorn, Nginx, systemd.

---

## 🚀 Inicio Rápido (2 Pasos)

### Paso 1: Verificación e Instalación de Dependencias
Este script verifica Node y Python, crea el entorno virtual (`venv`), instala las dependencias de backend y frontend, genera el archivo `.env`, crea la base de datos con sus migraciones y carga los datos institucionales (Seed) junto con el superusuario:
```bash
npm run setup
```

### Paso 2: Lanzamiento del Sistema
Inicia en paralelo el servidor backend (Django) y el frontend (Vite):
```bash
npm start
# o alternativamente:
npm run dev
```

### 🌐 Accesos Directos una vez iniciado:
- **Frontend Web:** [http://localhost:5173](http://localhost:5173)
- **Backend API REST:** [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
- **Panel Administrativo Django:** [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
  - *Usuario:* `admin` | *Contraseña:* `admin123`
  - *Jefatura RRHH:* `carolina.ruiz` | *Contraseña:* `penco2026`
- **Chequeo de Salud (Health Check):** [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/)

---

## 📂 Estructura del Monorepo
```
Hospital_Penco_IA/
├── backend/
│   ├── apps/
│   │   ├── seleccion/   # Perfiles de cargo, procesos, postulantes, hitos, auditoría
│   │   ├── pautas/      # Flujos, etapas, pautas de abordaje y evaluaciones
│   │   └── preguntas/   # Banco de preguntas y árbol adaptativo (madre -> hijas)
│   ├── config/          # Configuración de Django (settings, urls, wsgi, asgi)
│   ├── requirements.txt # Dependencias Python
│   └── manage.py
├── frontend/
│   ├── src/             # Componentes React, interfaz de mesa de evaluación, árbol interactivo
│   ├── index.html
│   └── package.json
├── scripts/
│   ├── setup.js         # Script independiente de verificación, instalación y base de datos
│   └── launch.js        # Script independiente de lanzamiento de servidores
├── deploy/debian/       # Plantillas systemd y Nginx para producción hospitalaria
├── docs-labs/           # Documentación técnica, laboratorios y arquitectura
└── ARQUITECTURA_Y_FLUJO.md # Presentación formal de la arquitectura y flujo del sistema
```

---

## 🤖 Módulo de Inteligencia Artificial (Proyección)
Para la futura generación automática y adaptativa de preguntas de entrevista psicológica, se utilizará:
- **Algoritmo Seleccionado:** **RAG (Retrieval-Augmented Generation) con Embeddings Semánticos y Similitud Coseno**.
- **Base Experimental:** Procedente del notebook de laboratorio `Lab1_RAG_Desde_Cero.ipynb`.
- **Lógica de Integración:** Contrastará los perfiles de cargo normados y pautas clínicas del hospital con un LLM generativo, garantizando rúbricas de respuesta y supervisión humana obligatoria.

---

Para más detalles sobre la arquitectura y el flujo de negocio, consultar [ARQUITECTURA_Y_FLUJO.md](./ARQUITECTURA_Y_FLUJO.md).
