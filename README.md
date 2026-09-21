<div align="center">

<img src="./assets/icon.png" width="96" alt="Home Bank logo" />

# Home Bank

**Home banking simulado, construido de punta a punta con React Native + Supabase**

App móvil que replica las funcionalidades core de un banco real — cuentas, transferencias atómicas, tarjetas, pagos de servicios, plazos fijos, préstamos y analytics de gastos — con datos ficticios pero lógica de backend 100% real.

[Stack](#-stack-técnico) · [Funcionalidades](#-funcionalidades) · [Arquitectura](#-arquitectura) · [Instalación](#-instalación-y-uso) · [Capturas](#-capturas)

</div>

---

## 📱 Sobre el proyecto

Home Bank es un proyecto de portfolio pensado para demostrar manejo integral de una aplicación fintech: desde autenticación segura y modelado de base de datos relacional, hasta operaciones financieras atómicas (transferencias, pagos, inversiones) que nunca dejan el sistema en un estado inconsistente — el mismo estándar que se espera de un backend bancario real.

No mueve dinero real ni se conecta a ningún banco: el dinero es simulado, pero **toda la lógica de negocio, seguridad y consistencia de datos es real.**

## ✨ Funcionalidades

- 🔐 **Autenticación completa** — registro, login, sesión persistente, rutas protegidas
- 💰 **Cuentas** — saldo en tiempo real, alias y CBU generados automáticamente, historial de movimientos
- 💸 **Transferencias** — débito/crédito atómico entre cuentas por alias, con validación de fondos server-side
- 💳 **Tarjetas** — visualización tipo tarjeta física, bloqueo/desbloqueo en tiempo real
- 🧾 **Pagos de servicios** — luz, gas, internet, con estados (pendiente / próximo a vencer / vencido / pagado)
- 📈 **Inversiones y préstamos** — simulador de plazo fijo con cálculo de interés, simulador de préstamos con cuotas
- 📊 **Analytics** — desglose visual de gastos por categoría
- 🎨 **Temas personalizables** — modo claro/oscuro + 5 paletas de color, con soporte de accesibilidad (`accessibilityLabel`, `accessibilityRole`, contraste AA)

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
- **Zustand** en vez de Redux: estado global simple y sin boilerplate, con un store por dominio (`auth`, `accounts`, `cards`, `bills`, `investments`, `loans`, `theme`).

## 🏗 Arquitectura

```
Home-Bank/
├── src/
│   ├── app/                    # Rutas (Expo Router)
│   │   ├── (auth)/              # Login, registro
│   │   ├── (tabs)/               # Inicio, tarjetas, pagos, inversiones, análisis
│   │   ├── settings.tsx         # Configuración de tema
│   │   └── transfer.tsx         # Transferencias
│   ├── store/                   # Estado global (Zustand), un store por dominio
│   ├── services/                # Cliente de Supabase
│   └── theme/                   # Sistema de colores (temas + paletas)
├── assets/                      # Íconos, splash
└── app.json                     # Configuración de Expo
```

### Transacciones atómicas (el corazón del proyecto)

Toda operación que mueve dinero —transferencias, pagos de servicios, plazos fijos, préstamos— corre como una **función SQL en Postgres**, no como llamadas sueltas desde el cliente. Esto garantiza que:

- El saldo nunca queda en un estado intermedio o inconsistente (todo o nada, vía transacción de base de datos)
- Se valida contra condiciones de carrera con `for update` (bloqueo de fila) antes de descontar saldo
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

# 2. Instalar dependencias
npm install --legacy-peer-deps

# 3. Configurar variables de entorno
# Crear un archivo .env en la raíz con:
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-publica

# 4. Correr el schema SQL
# Copiar y ejecutar el contenido de /supabase/schema.sql en el SQL Editor de tu proyecto Supabase

# 5. Iniciar la app
npx expo start
```

Escaneá el QR con Expo Go (Android/iOS) o presioná `a`/`i` para abrir en un emulador.

## 📸 Capturas

_(agregar capturas o GIF de la app funcionando: login, home con saldo, transferencia, tarjetas, analytics)_

## 🗺 Roadmap

- [x] Autenticación y sesión persistente
- [x] Cuentas, saldo y movimientos
- [x] Transferencias atómicas
- [x] Tarjetas (visualización y bloqueo)
- [x] Pagos de servicios
- [x] Plazos fijos y préstamos
- [x] Analytics de gastos
- [x] Temas personalizables + accesibilidad
- [ ] Notificaciones push
- [ ] Onboarding inicial
- [ ] Autenticación biométrica (Face ID / huella)

## 📄 Licencia

Este proyecto es de uso educativo / portfolio. Ver [LICENSE](./LICENSE) para más detalles.

---

<div align="center">
Desarrollado por <strong>Emanuel Díaz Ochoa</strong>
</div>
