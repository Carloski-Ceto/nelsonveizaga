# MASTER AGENT PROMPT

**⚠️ REGLAS PRIMARIAS PARA CUALQUIER IA O AGENTE QUE PROGRAME ESTE CÓDIGO:**

---

1. **CONTEXTO OMNIPRESENTE (LEE `docs/ai/`):** El sistema es un **Sistema de Información/Gestión** (Web + Backend). Incluye un backend Django y un panel web frontend (Next.js). **No hay app móvil.** Antes de ejecutar o predecir código, absorbe toda la documentación base en `docs/ai/`, siendo obligatoria la lectura de `ARCHITECTURE.md`.
2. **PACIENTE ≠ USUARIO:** Los pacientes son entidades de datos gestionadas por el personal. **No tienen cuenta, no hacen login, no interactúan con el sistema.** Nunca crear endpoints de registro público (`/auth/register/`). Los usuarios del sistema son: ADMIN, ADMINISTRATIVO, MEDICO, ESPECIALISTA.
3. **NO HARDCODEES Y PIENSA EN INFRAESTRUCTURA ABIERTA:** Todo secreto, token y URL se pasa vía `.env`. Proyecta siempre tus adiciones pensando en un empaquetado `Local + Docker + Nube/VM`.
4. **LA SEGURIDAD Y UI/UX INICIARON DESDE LA BASE:** Implementa control de errores limpios en todos lados (Spinners, Toasts en React, respuestas de error HTTP semánticas `4xx, 5xx` en Python).
5. **EL MANDAMIENTO DE MEMORIA (ACTUALIZA DOCS/AI/):** Antes de entregar la solución al usuario y abandonar el chat, **tienes el deber incuestionable de:**
   - Escribir lo logrado a `CURRENT_STATE.md`.
   - Llenar el `HANDOFF_LATEST.md` para el agente (o tú mismo) del mañana.
   - Reflejar si se completaron o añadieron `NEXT_STEPS.md`.
   - Modificar lógicas arquitecturales en `DECISIONS_LOG.md` (si aplica).
