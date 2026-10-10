<div align="center">

<img src="./assets/icon.png" width="96" alt="Home Bank logo" />

# Home Bank

**Home banking simulado, construido de punta a punta con React Native + Supabase**

App móvil que replica las funcionalidades core de un banco real — cuentas, transferencias atómicas, tarjetas, pagos de servicios, plazos fijos, préstamos y analytics de gastos — con datos ficticios pero lógica de backend 100% real.

[Capturas](#-capturas) · [Funcionalidades](#-funcionalidades) · [Stack](#-stack-técnico) · [Arquitectura](#-arquitectura) · [Instalación](#-instalación-y-uso)

</div>

---

## 📸 Capturas

<div align="center">

| Inicio | Transferencia | Tarjetas |
|:---:|:---:|:---:|
| <img src="./docs/screenshots/home.png" width="220" /> | <img src="./docs/screenshots/transfer.png" width="220" /> | <img src="./docs/screenshots/cards.png" width="220" /> |

| Pagos | Inversiones | Análisis |
|:---:|:---:|:---:|
| <img src="./docs/screenshots/bills.png" width="220" /> | <img src="./docs/screenshots/investments.png" width="220" /> | <img src="./docs/screenshots/analytics.png" width="220" /> |

| Ajustes | Modo claro | Otra paleta |
|:---:|:---:|:---:|
| <img src="./docs/screenshots/settings.png" width="220" /> | <img src="./docs/screenshots/home-light.png" width="220" /> | <img src="./docs/screenshots/home-purple.png" width="220" /> |

</div>

## 📱 Sobre el proyecto

Home Bank es un proyecto de portfolio pensado para demostrar manejo integral de una aplicación fintech: desde autenticación segura y modelado de base de datos relacional, hasta operaciones financieras atómicas (transferencias, pagos, inversiones) que nunca dejan el sistema en un estado inconsistente — el mismo estándar que se espera de un backend bancario real.

No mueve dinero real ni se conecta a ningún banco: el dinero es simulado, pero **toda la lógica de negocio, seguridad y consistencia de datos es real.**

## ✨ Funcionalidades

- 🔐 **Autenticación completa** — registro, login, sesión persistente, rutas protegidas
- 👋 **Onboarding** — tres pantallas de bienvenida que se muestran solo la primera vez
- 💰 **Cuentas** — saldo en tiempo real (con opción de ocultarlo), alias y CBU generados automáticamente, historial de movimientos
- 💸 **Transferencias** — débito/crédito atómico entre cuentas por alias, con validación de fondos del lado del servidor
- 💳 **Tarjetas** — débito y crédito, número enmascarado con opción de revelarlo, alta de tarjetas nuevas y bloqueo/desbloqueo en tiempo real
- 🧾 **Pagos de servicios** — luz, gas, internet, con estados (pendiente / próximo a vencer / vencido / pagado) y resumen de pagos pendientes
- 📈 **Inversiones y préstamos** — simulador de plazo fijo con cálculo de interés y simulador de préstamos con cuotas
- 📊 **Analytics** — desglose visual de gastos por categoría
- 🎨 **Apariencia personalizable** — modo claro/oscuro y 5 paletas de color
- ♿ **Accesibilidad** — `accessibilityLabel` y `accessibilityRole` en los elementos interactivos, y colores de acento con contraste mínimo de 4.5:1 en botones
- 🔔 **Alertas propias** — modal temático en lugar de los alerts nativos del sistema

## 🛠 Stack técnico

| Capa | Tecnología |
|---|---|
| **Framework** | React Native + Expo (SDK 57) |
| **Navegación** | Expo Router (file-based routing) |
| **Lenguaje** | TypeScript |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Row Level Security) |
| **Estado global** | Zustand |
| **Lógica financiera** | Funciones SQL `plpgsql` con transacciones atómicas |

### Por qué este stack

- **Supabase (Postgres)** en vez de una alternativa NoSQL: las operaciones bancarias necesitan **transacciones atómicas reales** (débito + crédito nunca pueden aplicarse por separado). Postgres lo resuelve de forma nativa con funciones `plpgsql` y bloqueo de filas (`for update`).
- **Row Level Security** en todas las tablas: cada usuario solo puede leer/modificar sus propios datos — la seguridad está en la base de datos, no solo en el cliente.
- **Zustand** en vez de Redux: estado global simple y sin boilerplate, con un store por dominio (`auth`, `profile`, `accounts`, `cards`, `bills`, `investments`, `loans`, `theme`, `alert`).

## 🏗 Arquitectura

```
Home-Bank/
├── src/
│   ├── app/                     # Rutas (Expo Router)
│   │   ├── (auth)/              # Login y registro
│   │   ├── (tabs)/              # Inicio, tarjetas, pagos, inversiones, análisis
│   │   ├── onboarding.tsx       # Bienvenida (solo primera vez)
│   │   ├── settings.tsx         # Ajustes y apariencia
│   │   └── transfer.tsx         # Transferencias
│   ├── components/              # Componentes compartidos (AppAlert)
│   ├── store/                   # Estado global (Zustand), un store por dominio
│   ├── services/                # Cliente de Supabase
│   ├── theme/                   # Sistema de colores (modos + paletas)
│   └── utils/                   # Helpers (showAlert)
├── supabase/
│   └── schema.sql               # Tablas, políticas RLS y funciones SQL
├── assets/                      # Ícono, splash, íconos adaptativos
└── app.json                     # Configuración de Expo
```

### Transacciones atómicas (el corazón del proyecto)

Toda operación que mueve dinero —transferencias, pagos de servicios, plazos fijos, préstamos— corre como una **función SQL en Postgres**, no como llamadas sueltas desde el cliente. Esto garantiza que:

- El saldo nunca queda en un estado intermedio o inconsistente (todo o nada, vía transacción de base de datos)
- Se evitan condiciones de carrera con `for update` (bloqueo de fila) antes de descontar saldo
- Las reglas de negocio (fondos suficientes, cuentas válidas, montos positivos) se validan en el servidor, no solo en el cliente

Ejemplo simplificado de la función de transferencias:

```sql
create or replace function transfer_money(
  origin_account_id uuid,
  destination_alias text,
  transfer_amount numeric
)
returns json as $$
begin
  -- bloquea la fila de origen para evitar condiciones de carrera
  select balance into origin_balance from accounts where id = origin_account_id for update;

  if origin_balance < transfer_amount then
    raise exception 'Fondos insuficientes';
  end if;

  update accounts set balance = balance - transfer_amount where id = origin_account_id;
  update accounts set balance = balance + transfer_amount where id = destination_account_id;
  -- registro de movimientos en ambas cuentas...
end;
$$ language plpgsql security definer;
```

La versión completa, con todas las validaciones, está en [`supabase/schema.sql`](./supabase/schema.sql).

## 🚀 Instalación y uso

### Requisitos previos
- Node.js 18+
- Una cuenta de [Supabase](https://supabase.com) (gratuita)
- App Expo Go en tu celular, o un emulador Android/iOS

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/EmanuelDiazOchoa/Home-Bank.git
cd Home-Bank

# 2. Instalar dependencias (el proyecto usa npm)
npm install --legacy-peer-deps

# 3. Configurar variables de entorno
# Crear un archivo .env en la raíz con:
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica

# 4. Crear la base de datos
# Ejecutar el contenido de supabase/schema.sql en el SQL Editor de tu proyecto Supabase

# 5. Iniciar la app
npx expo start
```

Escaneá el QR con Expo Go (Android/iOS) o presioná `a`/`i` para abrir en un emulador.

> **Tip para probarlo rápido:** en Supabase, andá a *Authentication → Providers → Email* y desactivá **Confirm email**. Así el registro entra directo sin necesidad de confirmar el correo.

## 🗺 Roadmap

- [x] Autenticación y sesión persistente
- [x] Cuentas, saldo y movimientos
- [x] Transferencias atómicas
- [x] Tarjetas (débito y crédito, alta, bloqueo)
- [x] Pagos de servicios
- [x] Plazos fijos y préstamos
- [x] Analytics de gastos
- [x] Temas personalizables + accesibilidad
- [x] Onboarding inicial
- [x] Alertas propias con tema
- [ ] Animaciones de transición y splash animado
- [ ] Notificaciones push
- [ ] Autenticación biométrica (Face ID / huella)

## 📄 Licencia

Este proyecto es de uso educativo / portfolio. Ver [LICENSE](./LICENSE) para más detalles.

---

<div align="center">
Desarrollado por <strong>Emanuel Díaz Ochoa</strong>
</div>