# Reglas de Proyecto - Hospital Penco Lirquen RRHH

## Skill 1 - django-cascade-integrity
Todo modelo Django debe declarar related_name, verbose_name, db_index=True e on_delete justificado (CASCADE composicion, PROTECT catalogos, SET_NULL opcionales). Logica de negocio pesada en services.py o metodos de modelo, no en vistas.

## Skill 2 - clinical-responsive-ui
Paleta clinica moderna (azul hospitalario/teal), modo oscuro nativo, grillas adaptativas (grid-cols-1 md:grid-cols-12), areas tactiles minimo 44x44px.

## Skill 3 - debian-zero-maintenance
Scripts idempotentes. Verificar .env, BD, migraciones y seeds antes de levantar. Debian + Nginx + Gunicorn + systemd.

## Skill 4 - psych-selection-workflow
Preguntas como nodos conectables (base -> condicion -> profundizacion). Cada etapa vinculada a Guia de Abordaje visible.
