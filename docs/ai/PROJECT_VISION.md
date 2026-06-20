# PROJECT VISION

## Nombre del Proyecto
Oftalmología SI1

## Problema que Resuelve
Gestión fragmentada e ineficiente de las operaciones de una clínica oftalmológica: registro de pacientes, asignación de citas, manejo de historiales médicos especializados y control interno del personal médico y administrativo.

## Objetivo Principal
Proveer un **Sistema de Información/Gestión** web moderno y escalable que centralice la gestión clínica, administrativa y operativa. El sistema es de uso exclusivo del personal interno de la clínica (administradores, médicos, especialistas y recepcionistas). Los pacientes no tienen acceso al sistema.

## Alcance General
- **Backend Central:** API RESTful robusta y segura (Django).
- **Frontend Web:** Panel de gestión para administradores, médicos y personal de recepción (Next.js).

## Visión del Sistema
Una plataforma segura, modular y altamente mantenible preparada para Local + Docker + Nube/VM. Construida como un monorepo que separa estrictamente las responsabilidades del backend (reglas de negocio y datos) del frontend web (presentación).

## Principios Inmutables (Qué no perder)
- **Paciente como dato, no como actor:** Los pacientes son entidades de datos registradas y gestionadas por el personal. No tienen cuenta de usuario ni login.
- **Seguridad y UI/UX primero:** Cuidado riguroso del almacenamiento de tokens (HTTP-only) y flujos limpios con prevención de datos hardcodeados.
- **"Lienzo en Blanco" Activo:** Solo programar lo solicitado bajo demanda. No sobre-empaquetar sin justificación funcional.
