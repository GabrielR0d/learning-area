# CheckIn RFID — SaaS de Controle de Acesso via WhatsApp

Sistema SaaS completo para registro de entrada e saída de clientes via cartão RFID/NFC, com notificações automáticas pelo WhatsApp.

## Arquitetura

```
[Cartão RFID/NFC]
       ↓ (toque)
[card-reader-client]  ──── HTTP POST ────→  [Backend API (Express)]
                                                      ↓
                                              [PostgreSQL + Prisma]
                                                      ↓
                                         [Evolution API (WhatsApp)]
                                                      ↓
                                        [Cliente recebe mensagem]

[Dashboard React] ──── REST + Socket.io ──→ [Backend API]
```

## Estrutura do Monorepo

```
saas-checkin/
├── backend/          # API REST (Node.js + Express + TypeScript + Prisma)
├── frontend/         # Dashboard admin (React + TypeScript + Tailwind)
├── card-reader-client/ # Agente do leitor RFID (roda na máquina com o hardware)
└── docker-compose.yml  # PostgreSQL + Redis + Evolution API
```

## Pré-requisitos

- Node.js 20+
- Docker + Docker Compose
- Leitor RFID/NFC (serial ou USB HID)

## Instalação

### 1. Subir infraestrutura

```bash
docker-compose up -d
```

Isso inicia:
- **PostgreSQL** na porta 5432
- **Redis** na porta 6379
- **Evolution API** (WhatsApp) na porta 8080

### 2. Configurar o Backend

```bash
cd backend
cp .env.example .env
# Edite o .env com suas configurações

npm install
npm run db:push    # Cria as tabelas
npm run db:seed    # Cria dados iniciais (super admin + tenant demo)
npm run dev        # Inicia em modo desenvolvimento
```

### 3. Configurar o Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

**Login demo:** admin@demo.com / Demo@123

### 4. Configurar o Leitor de Cartão

```bash
cd card-reader-client
cp .env.example .env
# Configure DEVICE_API_KEY (obtenha no dashboard em Dispositivos)
# Configure SERIAL_PORT ou HID_VENDOR_ID/HID_PRODUCT_ID

npm install
npm run dev
```

## Fluxo de Uso

1. **Cadastre o tenant** (super admin) ou use o tenant demo
2. **Cadastre clientes** com nome e telefone WhatsApp
3. **Cadastre cartões RFID** e vincule aos clientes
4. **Crie um dispositivo** no dashboard → copie a API Key
5. **Configure o card-reader-client** com a API Key
6. **Configure o WhatsApp** em Configurações → Evolution API
7. Quando o cliente passar o cartão, o sistema:
   - Registra a entrada/saída
   - Atualiza o dashboard em tempo real (Socket.io)
   - Envia mensagem WhatsApp ao cliente

## API Principais

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login |
| GET  | `/api/v1/clients` | Listar clientes |
| POST | `/api/v1/clients` | Cadastrar cliente |
| GET  | `/api/v1/cards` | Listar cartões |
| POST | `/api/v1/card-reads` | Leitura de cartão (dispositivo) |
| GET  | `/api/v1/access-logs` | Histórico de acessos |
| GET  | `/api/v1/reports/summary` | KPIs do dashboard |
| PUT  | `/api/v1/whatsapp/config` | Configurar WhatsApp |

## Tipos de Leitores Suportados

### Serial (RS232/USB-Serial)
```env
READER_TYPE=SERIAL
SERIAL_PORT=/dev/ttyUSB0   # Linux
SERIAL_PORT=COM3           # Windows
SERIAL_BAUD_RATE=9600
```

### USB HID (emulação de teclado)
```env
READER_TYPE=HID
HID_VENDOR_ID=0x0403
HID_PRODUCT_ID=0x6001
```

## Multi-tenancy

Cada empresa é um **tenant** isolado. O isolamento é feito por linha (row-level) usando `tenantId` em todas as tabelas. A autenticação JWT garante que cada usuário veja apenas os dados do seu tenant.

## Provedores WhatsApp

- **Evolution API** (self-hosted, recomendado) — gratuito
- **Z-API** — pago, mais simples de configurar

## Variáveis de Ambiente (Backend)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rfid_saas
REDIS_URL=redis://localhost:6379
JWT_SECRET=chave-secreta-minimo-32-chars
JWT_REFRESH_SECRET=chave-refresh-minimo-32-chars
PORT=3001
FRONTEND_URL=http://localhost:5173
```
