# Census Service - SEVoTec

> **Microservicio de Gestión del Padrón Electoral**  
> Sistema de Votación Electrónica Segura

---

## Descripción General

Servicio que administra el **padrón electoral** y controla el estado de votación de cada ciudadano empadronado, implementando una máquina de estados para garantizar la integridad del proceso electoral.

---

## Arquitectura

```
census-services/
├── src/
│   ├── census.controller.ts    # Endpoints RPC
│   ├── census.service.ts       # Lógica de padrón
│   ├── dto/
│   │   └── census.dto.ts       # DTOs de validación
│   └── main.ts                 # Punto de entrada
├── Dockerfile
└── package.json
```

---

## Máquina de Estados

```
┌───────────────┐   start-voting   ┌───────────────┐
│    NO_VOTO    │─────────────────▶│    VOTANDO    │
│  (Habilitado) │                  │  (En proceso) │
└───────────────┘                  └───────┬───────┘
                                           │ save-vote
                                           ▼
                                   ┌───────────────┐
                                   │GUARDANDO_VOTO │
                                   │ (Blockchain)  │
                                   └───────┬───────┘
                                           │ confirm-vote
                                           ▼
                                   ┌───────────────┐
                                   │     VOTO      │
                                   │  (Completado) │
                                   └───────────────┘
```

| Estado | Código | Descripción |
|--------|--------|-------------|
| `NO_VOTO` | 0 | Ciudadano habilitado, no ha iniciado |
| `VOTANDO` | 1 | En proceso activo de votación |
| `GUARDANDO_VOTO` | 2 | Voto pendiente de confirmar en blockchain |
| `VOTO` | 3 | Voto registrado exitosamente |

---

## Endpoints (Message Patterns)

### `census.check-status`
**Objetivo:** Verificar si un ciudadano puede votar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Número de cédula |

**Respuesta:**
```json
{
  "puedeVotar": true,
  "estadoVoto": "NO_VOTO",
  "mensaje": "Ciudadano habilitado para votar.",
  "nombres": "ISSAC DE LA CADENA",
  "recinto": "EPN - FIEE"
}
```

---

### `census.get-status`
**Objetivo:** Obtener estado actual de voto.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Número de cédula |

**Respuesta:**
```json
{
  "success": true,
  "cedula": "1500958069",
  "nombres": "ISSAC DE LA CADENA",
  "recinto": "EPN - FIEE",
  "estadoVoto": "NO_VOTO"
}
```

---

### `census.start-voting`
**Objetivo:** Iniciar proceso de votación (NO_VOTO → VOTANDO).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Número de cédula |

**Validaciones:**
- Ciudadano debe existir en padrón
- Estado actual debe ser `NO_VOTO`

---

### `census.save-vote`
**Objetivo:** Guardar voto (VOTANDO → GUARDANDO_VOTO).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Número de cédula |

**Validaciones:**
- Estado actual debe ser `VOTANDO`

---

### `census.confirm-vote`
**Objetivo:** Confirmar voto y emitir evento para certificado (GUARDANDO_VOTO → VOTO).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Número de cédula |

**Acciones:**
1. Cambia estado a `VOTO`
2. Emite evento `vote.confirmed` al Certificate Service

---

### `census.register-vote`
**Objetivo:** Registrar voto completo (shortcut: NO_VOTO → VOTO).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedula` | `string` | Número de cédula |

---

### `census.consult_citizine_with_vote`
**Objetivo:** Obtener ciudadanos que votaron pero no tienen certificado enviado.

**Respuesta:**
```json
[
  {
    "cedula": "1500958069",
    "nombres": "ISSAC DE LA CADENA",
    "recinto": "EPN - FIEE",
    "email": "santiagomfo@outlook.com"
  }
]
```

---

### `census.certificates_send_update`
**Objetivo:** Confirmar envío de certificados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cedulas` | `string[]` | Lista de cédulas procesadas |

**Respuesta:**
```json
{
  "success": true,
  "procesados": 3,
  "fallidos": 0,
  "errores": [],
  "message": "Se finalizaron 3 procesos de votación con éxito."
}
```

---

### `census.health`
**Objetivo:** Estado del servicio con estadísticas.

**Respuesta:**
```json
{
  "status": "ok",
  "service": "census-service",
  "totalCiudadanos": 3,
  "estadisticas": {
    "NO_VOTO": 2,
    "VOTANDO": 0,
    "GUARDANDO_VOTO": 0,
    "VOTO": 1
  },
  "timestamp": "2026-01-21T12:00:00.000Z"
}
```

---

## Componentes de Seguridad

### 1. Validación de Transiciones de Estado

**Archivo:** `src/census.service.ts`

**Objetivo:** Garantizar que las transiciones de estado sigan el flujo autorizado.

**Operación:**
```typescript
// iniciarVotacion()
if (ciudadano.estadoVoto !== EstadoVoto.NO_VOTO) {
    throw new RpcException({
        success: false,
        message: `No puede iniciar votación. Estado actual: ${ciudadano.estadoVoto}`,
        statusCode: 400
    });
}
```

**Transiciones permitidas:**
| Desde | Hacia | Método |
|-------|-------|--------|
| `NO_VOTO` | `VOTANDO` | `iniciarVotacion()` |
| `VOTANDO` | `GUARDANDO_VOTO` | `guardarVoto()` |
| `GUARDANDO_VOTO` | `VOTO` | `confirmarVoto()` |
| `NO_VOTO` | `VOTO` | `registrarVotoRealizado()` (shortcut) |

---

### 2. Verificación de Empadronamiento

**Archivo:** `src/census.service.ts` - Método `verificarEstadoVoto()`

**Objetivo:** Verificar que el ciudadano esté registrado en el padrón electoral.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `cedula` | `string` | Cédula a verificar |

**Operación:**
```typescript
const ciudadano = this.padronElectoral.get(cedula);

if (!ciudadano) {
    throw new RpcException({
        success: false,
        message: 'Ciudadano no empadronado o no existe.',
        statusCode: 404
    });
}

const puedeVotar = ciudadano.estadoVoto === EstadoVoto.NO_VOTO;
```

**Retorno:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `puedeVotar` | `boolean` | `true` si estado es `NO_VOTO` |
| `estadoVoto` | `string` | Estado actual |
| `mensaje` | `string` | Descripción del estado |
| `nombres` | `string` | Nombre del ciudadano |
| `recinto` | `string` | Lugar de votación asignado |

---

### 3. Protección contra Doble Voto

**Archivo:** `src/census.service.ts`

**Objetivo:** Impedir que un ciudadano vote más de una vez.

**Implementación:**
- Estado `VOTO` es terminal (no hay transiciones desde él)
- Intentar iniciar votación con estado ≠ `NO_VOTO` lanza error 400
- Cada transición valida estado previo

---

### 4. Emisión de Eventos para Certificados

**Archivo:** `src/census.service.ts` - Método `confirmarVoto()`

**Objetivo:** Notificar al servicio de certificados cuando se confirma un voto.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `cedula` | `string` | Cédula del votante |

**Operación:**
```typescript
this.actualizarEstadoVoto(cedula, EstadoVoto.VOTO);

const secretToken = this.configService.get<string>('INTERNAL_SECRET');

this.clientCertificate.emit('vote.confirmed', {
    token: secretToken,
    cedula: ciudadano.cedula,
    nombres: ciudadano.nombres,
    recinto: ciudadano.recinto,
    email: ciudadano.email
});
```

**Evento emitido:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `token` | `string` | Token de autenticación interna |
| `cedula` | `string` | Identificador del votante |
| `nombres` | `string` | Nombre completo |
| `recinto` | `string` | Lugar de votación |
| `email` | `string` | Email para enviar certificado |

---

### 5. Control de Certificados Enviados

**Archivo:** `src/census.service.ts` - Método `confirmarEnvioCertificados()`

**Objetivo:** Registrar que los certificados fueron enviados exitosamente.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `cedulas` | `string[]` | Lista de cédulas procesadas |

**Operación:**
```typescript
cedulas.forEach(cedula => {
    const ciudadano = this.padronElectoral.get(cedula);
    
    if (ciudadano.estadoVoto !== EstadoVoto.GUARDANDO_VOTO) {
        resultados.errores.push({
            cedula,
            mensaje: `Estado inválido: ${ciudadano.estadoVoto}`
        });
        return;
    }
    
    this.confirmarVoto(cedula);
    ciudadano.certificado_enviado = true;
    resultados.actualizados++;
});
```

---

## Modelo de Datos

### Interfaz CiudadanoPadron

```typescript
interface CiudadanoPadron {
    cedula: string;              // Identificador único
    nombres: string;             // Nombre completo
    recinto: string;             // Lugar de votación
    estadoVoto: EstadoVoto;      // Estado actual
    email: string;               // Para certificado
    certificado_enviado: boolean; // Flag de envío
}
```

---

## Padrón Electoral Mock

| Cédula | Nombre | Recinto | Email |
|--------|--------|---------|-------|
| `1500958069` | ISSAC DE LA CADENA | EPN - FIEE | santiagomfo@outlook.com |
| `1724915770` | JOEL DEFAZ | COLEGIO MEJIA | joe.def2019@gmail.com |
| `0104992564` | MARIA LOPEZ | UNIVERSIDAD CENTRAL | participante3@epn.edu.ec |

---

## Variables de Entorno

```env
# Comunicación interna
INTERNAL_SECRET=<token para eventos entre servicios>

# Certificate Service
CERTIFICATE_SERVICE_HOST=localhost
CERTIFICATE_SERVICE_PORT=3004

# Puerto TCP
CENSUS_SERVICE_PORT=3003
```

---

## Ejecución

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Docker
docker build -t census-service .
docker run -p 3003:3003 census-service
```

---

## Comunicación con Otros Servicios

### → Certificate Service
- **Protocolo:** TCP (NestJS Microservices)
- **Tipo:** Event Pattern (fire-and-forget)
- **Evento:** `vote.confirmed`

---

## Diagrama de Flujo Completo

```
┌──────────┐  check-status  ┌─────────────────┐
│ Frontend │───────────────▶│ Census Service  │
│          │                │                 │
│          │  start-voting  │  ┌───────────┐  │
│          │───────────────▶│  │  Padrón   │  │
│          │                │  │ Electoral │  │
│          │  save-vote     │  │  (Map)    │  │
│          │───────────────▶│  └───────────┘  │
│          │                │        │        │
│          │  confirm-vote  │        ▼        │
│          │───────────────▶│  vote.confirmed │───▶ Certificate Svc
└──────────┘                └─────────────────┘
```
