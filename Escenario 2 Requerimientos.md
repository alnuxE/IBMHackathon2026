# Documento de Requerimientos - NeoWallet P2P Payments

## 📄 Información del Documento

**Proyecto:** NeoWallet - Sistema de Pagos Peer-to-Peer  
**Cliente:** FastPay (Startup Fintech)  
**Versión:** 1.0  
**Fecha:** Junio 2026  
**Nivel de Complejidad:** Medio-Bajo (Ideal para Juniors/Recién Egresados)  
**Estado:** ✅ Aprobado  

---

## 📖 Tabla de Contenidos

1. [Contexto del Negocio](#1-contexto-del-negocio)
2. [Objetivos del Proyecto](#2-objetivos-del-proyecto)
3. [Alcance](#3-alcance)
4. [Requerimientos Funcionales](#4-requerimientos-funcionales)
5. [Requerimientos No Funcionales](#5-requerimientos-no-funcionales)
6. [Arquitectura del Sistema](#6-arquitectura-del-sistema)
7. [Modelo de Datos](#7-modelo-de-datos)
8. [Especificación de APIs](#8-especificación-de-apis)
9. [Reglas de Negocio](#9-reglas-de-negocio)
10. [Casos de Uso](#10-casos-de-uso)
11. [Criterios de Aceptación](#11-criterios-de-aceptación)
12. [Restricciones y Supuestos](#12-restricciones-y-supuestos)
13. [Riesgos y Mitigaciones](#13-riesgos-y-mitigaciones)
14. [Glosario](#14-glosario)
15. [Referencias](#15-referencias)

---

## 1. Contexto del Negocio

### 1.1 Situación Actual

**FastPay** es una startup fintech emergente que busca competir en el mercado de billeteras digitales, similar a servicios como Venmo, Yape o PayPal. Actualmente, el mercado de pagos P2P está en crecimiento exponencial, con usuarios que demandan:

- ✅ Transferencias instantáneas entre usuarios
- ✅ Interfaz simple y confiable
- ✅ Seguridad en las transacciones
- ✅ Disponibilidad 24/7

### 1.2 Problema a Resolver

Los usuarios necesitan una forma rápida y segura de:
1. **Recargar saldo** en su billetera digital
2. **Enviar dinero** a otros usuarios de la plataforma
3. **Consultar su saldo** en tiempo real
4. **Ver historial** de sus transacciones

### 1.3 Propuesta de Valor

NeoWallet ofrecerá:
- 🚀 Transferencias instantáneas entre usuarios
- 💰 Sin comisiones en transferencias P2P
- 🔒 Arquitectura segura y escalable
- 📱 API REST moderna para futuras integraciones móviles

---

## 2. Objetivos del Proyecto

### 2.1 Objetivo General

Desarrollar un **MVP (Minimum Viable Product)** de una billetera digital que permita a los usuarios gestionar su saldo y realizar transferencias P2P, utilizando una arquitectura de microservicios moderna y escalable.

### 2.2 Objetivos Específicos

#### Objetivos de Negocio
- ✅ Permitir a los usuarios recargar saldo de forma simulada
- ✅ Facilitar transferencias de dinero entre usuarios registrados
- ✅ Garantizar que no se pierda dinero en el sistema
- ✅ Proporcionar visibilidad del saldo en tiempo real

#### Objetivos Técnicos
- ✅ Implementar arquitectura de microservicios desacoplada
- ✅ Establecer comunicación HTTP/REST entre servicios
- ✅ Garantizar consistencia de datos en operaciones distribuidas
- ✅ Implementar manejo robusto de errores
- ✅ Crear APIs RESTful siguiendo estándares de la industria

#### Objetivos de Calidad
- ✅ Cobertura de tests > 80%
- ✅ Tiempo de respuesta < 200ms para operaciones simples
- ✅ 0 errores críticos en casos de uso principales
- ✅ Código limpio y bien documentado

---

## 3. Alcance

### 3.1 Dentro del Alcance (In Scope)

#### Funcionalidades Incluidas
- ✅ Gestión de cuentas de usuario (consulta de saldo)
- ✅ Recarga de saldo (simulada, sin procesador de pagos real)
- ✅ Transferencias P2P entre usuarios
- ✅ Validaciones de negocio (fondos suficientes, usuarios válidos)
- ✅ Registro de transacciones
- ✅ Manejo de errores y casos excepcionales

#### Componentes Técnicos
- ✅ Accounts Service (Microservicio de Cuentas)
- ✅ Processor Service (Microservicio de Procesamiento)
- ✅ Base de datos PostgreSQL (2 instancias)
- ✅ APIs REST documentadas
- ✅ Docker Compose para orquestación local

### 3.2 Fuera del Alcance (Out of Scope)

#### Funcionalidades NO Incluidas
- ❌ Integración con procesadores de pago reales (Stripe, PayPal)
- ❌ Autenticación y autorización de usuarios (JWT, OAuth)
- ❌ Interfaz de usuario (Frontend)
- ❌ Notificaciones push o email
- ❌ Retiro de dinero a cuentas bancarias
- ❌ Conversión de divisas
- ❌ Programa de recompensas o cashback
- ❌ Soporte para múltiples monedas

### 3.3 Funcionalidades Opcionales (Bonus)

Estas funcionalidades otorgan puntos extra pero no son obligatorias:
- 🎁 Historial de transacciones por usuario
- 🎁 Implementación de patrón Saga para resiliencia
- 🎁 Job de reconciliación para transacciones pendientes
- 🎁 Logs estructurados en formato JSON
- 🎁 Health checks para los servicios
- 🎁 Documentación Swagger/OpenAPI

---

## 4. Requerimientos Funcionales

### RF-001: Consultar Saldo de Usuario

**Prioridad:** Alta  
**Complejidad:** Baja  

**Descripción:**  
El sistema debe permitir consultar el saldo actual de un usuario específico.

**Actor:** Sistema externo / Usuario  
**Precondiciones:** El usuario debe existir en el sistema  

**Flujo Principal:**
1. El cliente envía una petición GET con el ID del usuario
2. El sistema valida que el ID sea numérico
3. El sistema busca al usuario en la base de datos
4. El sistema retorna los datos del usuario incluyendo su saldo

**Postcondiciones:** El saldo del usuario es retornado sin modificaciones

**Criterios de Aceptación:**
- ✅ Retorna código HTTP 200 con datos del usuario si existe
- ✅ Retorna código HTTP 404 si el usuario no existe
- ✅ Retorna código HTTP 400 si el ID no es válido
- ✅ El saldo debe tener precisión de 2 decimales
- ✅ Tiempo de respuesta < 100ms

---

### RF-002: Recargar Saldo (Simulado)

**Prioridad:** Alta  
**Complejidad:** Media  

**Descripción:**  
El sistema debe permitir agregar fondos a la cuenta de un usuario, simulando una recarga externa (tarjeta de crédito, transferencia bancaria).

**Actor:** Usuario  
**Precondiciones:** 
- El usuario debe existir en el sistema
- El monto debe ser positivo

**Flujo Principal:**
1. El cliente envía una petición POST con user_id, amount y payment_method
2. El sistema valida que el usuario exista
3. El sistema valida que el monto sea positivo y numérico
4. El sistema incrementa el saldo del usuario
5. El sistema registra la transacción (opcional)
6. El sistema retorna el nuevo saldo

**Flujos Alternativos:**
- **FA-1:** Si el usuario no existe → Retornar error 404
- **FA-2:** Si el monto es negativo o cero → Retornar error 400
- **FA-3:** Si el monto no es numérico → Retornar error 400

**Postcondiciones:** El saldo del usuario se incrementa en el monto especificado

**Criterios de Aceptación:**
- ✅ Acepta montos positivos con hasta 2 decimales
- ✅ Rechaza montos negativos con error 400
- ✅ Rechaza montos de cero con error 400
- ✅ Retorna el nuevo saldo después de la recarga
- ✅ La operación es atómica (todo o nada)

---

### RF-003: Transferir Dinero entre Usuarios (P2P)

**Prioridad:** Crítica  
**Complejidad:** Alta  

**Descripción:**  
El sistema debe permitir transferir dinero de un usuario (sender) a otro usuario (receiver), validando fondos suficientes y actualizando ambos saldos de forma consistente.

**Actor:** Usuario (Sender)  
**Precondiciones:**
- Ambos usuarios (sender y receiver) deben existir
- El sender debe tener saldo suficiente
- El monto debe ser positivo
- Sender y receiver deben ser diferentes

**Flujo Principal:**
1. El cliente envía petición POST con sender_id, receiver_id y amount
2. El sistema valida que sender_id != receiver_id
3. El sistema valida que el monto sea positivo
4. El sistema verifica que el sender exista y tenga saldo suficiente
5. El sistema verifica que el receiver exista
6. El sistema crea un registro de transacción con estado PENDING
7. El sistema debita el monto del sender
8. El sistema acredita el monto al receiver
9. El sistema actualiza la transacción a estado COMPLETED
10. El sistema retorna confirmación con transaction_id

**Flujos Alternativos:**
- **FA-1:** Si sender == receiver → Retornar error 400 "self_transfer_not_allowed"
- **FA-2:** Si monto <= 0 → Retornar error 400 "invalid_amount"
- **FA-3:** Si sender no existe → Retornar error 404 "user_not_found"
- **FA-4:** Si receiver no existe → Retornar error 404 "user_not_found"
- **FA-5:** Si saldo insuficiente → Retornar error 400 "insufficient_funds"
- **FA-6:** Si falla el débito → Marcar transacción como FAILED
- **FA-7:** Si falla el crédito → Revertir débito (compensación) y marcar ROLLED_BACK

**Postcondiciones:**
- El saldo del sender disminuye en el monto transferido
- El saldo del receiver aumenta en el monto transferido
- Se crea un registro de transacción
- La suma total de dinero en el sistema permanece constante

**Criterios de Aceptación:**
- ✅ Transferencia exitosa actualiza ambos saldos correctamente
- ✅ No permite transferencias a uno mismo
- ✅ No permite montos negativos o cero
- ✅ Valida existencia de ambos usuarios antes de procesar
- ✅ Verifica fondos suficientes antes de debitar
- ✅ Si falla el crédito, revierte el débito (patrón Saga)
- ✅ Retorna transaction_id único para rastreo
- ✅ Tiempo de respuesta < 500ms
- ✅ **CRÍTICO:** No se pierde dinero bajo ninguna circunstancia

---

### RF-004: Actualizar Balance (Endpoint Interno)

**Prioridad:** Alta  
**Complejidad:** Media  

**Descripción:**  
Endpoint interno usado por el Processor Service para actualizar el saldo de un usuario (débito o crédito).

**Actor:** Processor Service  
**Precondiciones:** El usuario debe existir  

**Flujo Principal:**
1. El Processor Service envía petición POST con user_id, amount y operation
2. El sistema valida que el usuario exista
3. Si operation = "debit":
   - Verifica que balance >= amount
   - Resta el monto del saldo
4. Si operation = "credit":
   - Suma el monto al saldo
5. Retorna el saldo anterior y el nuevo saldo

**Criterios de Aceptación:**
- ✅ Soporta operaciones "debit" y "credit"
- ✅ En débitos, verifica fondos suficientes
- ✅ Retorna balance anterior y nuevo
- ✅ Operación atómica a nivel de base de datos

---

### RF-005: Consultar Historial de Transacciones (Bonus)

**Prioridad:** Baja (Opcional)  
**Complejidad:** Media  

**Descripción:**  
El sistema debe permitir consultar el historial de transacciones de un usuario específico.

**Actor:** Usuario  
**Precondiciones:** El usuario debe existir  

**Flujo Principal:**
1. El cliente envía petición GET con user_id
2. El sistema busca todas las transacciones donde el usuario es sender o receiver
3. El sistema formatea las transacciones con tipo (sent/received/recharge)
4. El sistema retorna la lista ordenada por fecha descendente

**Criterios de Aceptación:**
- ✅ Muestra transacciones enviadas y recibidas
- ✅ Incluye tipo de transacción y monto
- ✅ Ordenado por fecha (más reciente primero)
- ✅ Incluye información del counterparty (otro usuario)
- ✅ Soporta paginación (opcional)

---

## 5. Requerimientos No Funcionales

### RNF-001: Performance

**Descripción:** El sistema debe responder rápidamente a las peticiones

**Criterios:**
- ✅ Consulta de saldo: < 100ms (percentil 95)
- ✅ Recarga de saldo: < 200ms (percentil 95)
- ✅ Transferencia P2P: < 500ms (percentil 95)
- ✅ Soportar al menos 100 peticiones concurrentes

---

### RNF-002: Disponibilidad

**Descripción:** El sistema debe estar disponible la mayor parte del tiempo

**Criterios:**
- ✅ Uptime objetivo: 99% (permite ~7 horas de downtime al mes)
- ✅ Los servicios deben tener health checks
- ✅ Reinicio automático en caso de fallo (Docker restart policy)

---

### RNF-003: Escalabilidad

**Descripción:** La arquitectura debe permitir escalar horizontalmente

**Criterios:**
- ✅ Servicios stateless (sin estado en memoria)
- ✅ Bases de datos separadas por servicio
- ✅ Comunicación vía HTTP (sin dependencias de memoria compartida)
- ✅ Preparado para agregar load balancer en el futuro

---

### RNF-004: Seguridad

**Descripción:** El sistema debe proteger los datos de los usuarios

**Criterios:**
- ✅ Validación de todos los inputs
- ✅ Prevención de SQL Injection (usar prepared statements)
- ✅ No exponer información sensible en logs
- ✅ Credenciales de BD en variables de entorno (no hardcoded)
- ✅ HTTPS en producción (no requerido para MVP local)

---

### RNF-005: Mantenibilidad

**Descripción:** El código debe ser fácil de entender y modificar

**Criterios:**
- ✅ Código limpio y bien comentado
- ✅ Nombres de variables descriptivos
- ✅ Separación de responsabilidades (controllers, services, models)
- ✅ Documentación actualizada
- ✅ Tests automatizados con cobertura > 80%

---

### RNF-006: Consistencia de Datos

**Descripción:** Los datos deben ser consistentes en todo momento

**Criterios:**
- ✅ **CRÍTICO:** La suma total de dinero en el sistema debe ser constante
- ✅ No se permite crear o destruir dinero
- ✅ Transacciones deben ser atómicas
- ✅ En caso de fallo, revertir cambios (patrón Saga)
- ✅ Logs de auditoría para todas las operaciones monetarias

---

### RNF-007: Observabilidad

**Descripción:** El sistema debe ser fácil de monitorear y debuggear

**Criterios:**
- ✅ Logs estructurados con niveles (INFO, WARN, ERROR)
- ✅ Cada transacción tiene un ID único para rastreo
- ✅ Logs incluyen timestamps en formato ISO 8601
- ✅ Errores incluyen stack traces en desarrollo
- ✅ Health check endpoints para cada servicio

---

## 6. Arquitectura del Sistema

### 6.1 Patrón Arquitectónico

**Microservicios Simplificados (Microservices Lite)**

El sistema utiliza una arquitectura de microservicios con dos servicios independientes que se comunican vía HTTP/REST.

### 6.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│                   (Postman / Frontend)                      │
└────────────────┬────────────────────────┬───────────────────┘
                 │                        │
                 │ HTTP                   │ HTTP
                 ▼                        ▼
    ┌────────────────────────┐  ┌────────────────────────┐
    │   Accounts Service     │  │  Processor Service     │
    │      (Port 3000)       │◄─┤      (Port 3001)       │
    │                        │  │                        │
    │ - GET /accounts/:id    │  │ - POST /api/transfer   │
    │ - POST /api/recharge   │  │ - GET /api/transactions│
    │ - POST /update-balance │  │                        │
    └────────────┬───────────┘  └────────────┬───────────┘
                 │                           │
                 │ SQL                       │ SQL
                 ▼                           ▼
         ┌──────────────┐           ┌──────────────┐
         │ accounts_db  │           │processor_db  │
         │ (Port 5432)  │           │ (Port 5433)  │
         │              │           │              │
         │ Table: users │           │Table: trans. │
         └──────────────┘           └──────────────┘
```

### 6.3 Descripción de Servicios

#### **Accounts Service**
- **Puerto:** 3000
- **Responsabilidad:** Gestión de usuarios y saldos
- **Base de Datos:** accounts_db (PostgreSQL en puerto 5432)
- **Endpoints:**
  - `GET /accounts/{user_id}` - Consultar saldo
  - `POST /api/recharge` - Recargar saldo
  - `POST /accounts/update-balance` - Actualizar balance (interno)

#### **Processor Service**
- **Puerto:** 3001
- **Responsabilidad:** Lógica de negocio de transferencias
- **Base de Datos:** processor_db (PostgreSQL en puerto 5433)
- **Endpoints:**
  - `POST /api/transfer` - Ejecutar transferencia P2P
  - `GET /api/transactions/{user_id}` - Historial (bonus)

---

## 7. Modelo de Datos

### 7.1 Base de Datos: accounts_db

#### Tabla: users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `id`: Identificador único del usuario (auto-incremental)
- `name`: Nombre completo del usuario
- `email`: Email único del usuario
- `balance`: Saldo actual (no puede ser negativo)
- `created_at`: Fecha de creación del registro
- `updated_at`: Fecha de última actualización

**Constraints:**
- ✅ `balance >= 0` (no permite saldos negativos)
- ✅ `email UNIQUE` (no permite emails duplicados)

---

### 7.2 Base de Datos: processor_db

#### Tabla: transactions

```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('PENDING', 'DEBITED', 'COMPLETED', 'FAILED', 'ROLLED_BACK'))
);
```

**Estados Posibles:**
- `PENDING`: Transacción iniciada
- `DEBITED`: Dinero debitado del sender
- `COMPLETED`: Transacción completada exitosamente
- `FAILED`: Transacción falló
- `ROLLED_BACK`: Transacción revertida

---

### 7.3 Datos Semilla (Seed Data)

```sql
INSERT INTO users (name, email, balance) VALUES 
('Usuario A (Rico)', 'usuario.a@neowallet.com', 1000.00),
('Usuario B (Pobre)', 'usuario.b@neowallet.com', 50.00),
('Usuario C (Nuevo)', 'usuario.c@neowallet.com', 0.00);
```

---

## 8. Especificación de APIs

Ver documento completo en: [docs/api-spec.md](./api-spec.md)

### Resumen de Endpoints

#### Accounts Service (Port 3000)
- `GET /accounts/{user_id}` - Consultar saldo
- `POST /api/recharge` - Recargar saldo
- `POST /accounts/update-balance` - Actualizar balance (interno)

#### Processor Service (Port 3001)
- `POST /api/transfer` - Transferir dinero
- `GET /api/transactions/{user_id}` - Historial (bonus)

---

## 9. Reglas de Negocio

### RN-001: Validación de Montos
Todos los montos deben ser positivos y mayores a cero (excepto en operaciones internas de débito).

### RN-002: Prevención de Auto-transferencias
Un usuario no puede transferirse dinero a sí mismo.

### RN-003: Verificación de Fondos Suficientes
El sender debe tener saldo suficiente antes de iniciar la transferencia.

### RN-004: Conservación de Dinero
La suma total de dinero en el sistema debe permanecer constante.

### RN-005: Precisión Decimal
Todos los montos deben tener exactamente 2 decimales.

### RN-006: Saldo Mínimo
El saldo de un usuario nunca puede ser negativo.

### RN-007: Unicidad de Email
Cada email solo puede estar asociado a un usuario.

### RN-008: Estados de Transacción
Las transacciones deben seguir un flujo de estados válido.

---

## 10. Casos de Uso

### CU-001: Transferencia Exitosa

**Precondiciones:**
- Usuario A tiene $1000
- Usuario B tiene $50

**Flujo:**
1. Cliente envía POST /api/transfer (sender:1, receiver:2, amount:100)
2. Sistema valida todo correctamente
3. Sistema debita $100 de Usuario A
4. Sistema acredita $100 a Usuario B
5. Sistema retorna success

**Postcondiciones:**
- Usuario A: $900
- Usuario B: $150
- Suma total constante

---

### CU-002: Fondos Insuficientes

**Precondiciones:**
- Usuario B tiene $50

**Flujo:**
1. Cliente intenta transferir $100
2. Sistema detecta saldo insuficiente
3. Sistema retorna error 400

**Postcondiciones:**
- Sin cambios en saldos

---

### CU-003: Auto-transferencia

**Flujo:**
1. Cliente intenta transferir a sí mismo
2. Sistema detecta sender == receiver
3. Sistema retorna error 400

---

### CU-004: Recarga de Saldo

**Flujo:**
1. Cliente envía POST /api/recharge
2. Sistema valida y aumenta saldo
3. Sistema retorna nuevo saldo

---

### CU-005: Fallo con Compensación

**Flujo:**
1. Sistema debita sender exitosamente
2. Falla al acreditar receiver
3. Sistema revierte débito (compensación)
4. Sistema retorna error
5. **Resultado:** No se pierde dinero

---

## 11. Criterios de Aceptación

### Generales
- ✅ Dos servicios independientes
- ✅ Comunicación HTTP entre servicios
- ✅ Manejo correcto de errores
- ✅ Validaciones completas
- ✅ Tests automatizados

### Por Endpoint
- ✅ GET /accounts/{id}: Retorna 200/404 según corresponda
- ✅ POST /api/recharge: Valida montos positivos
- ✅ POST /api/transfer: Actualiza ambos saldos correctamente
- ✅ Previene pérdida de dinero en fallos

---

## 12. Restricciones y Supuestos

### Restricciones Técnicas
- PostgreSQL como base de datos
- HTTP/REST para comunicación
- Docker Compose para orquestación
- Ambiente local (localhost)

### Supuestos de Negocio
- Usuarios pre-registrados
- Recargas simuladas
- Transferencias instantáneas
- Sin comisiones
- Moneda única (USD)

---

## 13. Riesgos y Mitigaciones

### Riesgo 1: Pérdida de Dinero
**Severidad:** 🔴 Crítica  
**Mitigación:** Patrón Saga con compensación

### Riesgo 2: Race Conditions
**Severidad:** 🟠 Alta  
**Mitigación:** Transacciones de BD, locks

### Riesgo 3: Fallo de Comunicación
**Severidad:** 🟠 Alta  
**Mitigación:** Reintentos, circuit breaker

### Riesgo 4: Validaciones Insuficientes
**Severidad:** 🟡 Media  
**Mitigación:** Checklist de validaciones, tests

---

## 14. Glosario

**P2P (Peer-to-Peer):** Transferencia directa entre usuarios sin intermediarios.

**Saga Pattern:** Patrón de diseño para transacciones distribuidas con compensación.

**Microservicio:** Servicio independiente con responsabilidad única.

**API REST:** Interfaz de programación basada en HTTP.

**Idempotencia:** Propiedad donde múltiples ejecuciones producen el mismo resultado.

**Circuit Breaker:** Patrón que previene llamadas a servicios que están fallando.

**Compensación:** Operación que revierte los efectos de una transacción fallida.

**ACID:** Atomicidad, Consistencia, Aislamiento, Durabilidad.

**CAP Theorem:** Teorema que establece trade-offs entre Consistencia, Disponibilidad y Tolerancia a Particiones.

---

## 15. Referencias

### Documentación del Proyecto
- [API Specification](./api-spec.md)
- [Architecture Decision Record](./architecture-decision.md)
- [Bonus: Resilience Challenge](./bonus-resilience.md)
- [Plan de Implementación](./plan-implementacion.md)

### Patrones y Best Practices
- [Microservices Pattern: Database per Service](https://microservices.io/patterns/data/database-per-service.html)
- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)

### Herramientas
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Postman Documentation](https://learning.postman.com/)

---

## 📝 Historial de Cambios

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2026-06-17 | NeoWallet Team | Versión inicial del documento |

---

## ✅ Aprobaciones

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Product Owner | - | ✅ | 2026-06-17 |
| Tech Lead | - | ✅ | 2026-06-17 |
| QA Lead | - | ✅ | 2026-06-17 |

---

**Documento Controlado - Versión 1.0**  
**Última Actualización:** Junio 2026  
**Estado:** ✅ Aprobado para Implementación