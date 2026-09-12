# erp mini

Production-oriented full-stack erp mini covering the complete inventory lifecycle:
**Inventory → Work Order → Stock Check → Internal Transfer / Shortage → Customer Reservation**

---
[Live Demo](https://frontend-5fub.vercel.app/login)

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, React Router |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (Node.js built-in `node:sqlite`, ACID Compliant) |
| **Authentication** | JWT (JSON Web Tokens), bcryptjs |
| **Security** | Role-Based Access Control (RBAC), Helmet, CORS |
| **Testing** | Jest, Supertest |
| **API Docs** | Swagger UI (`/api-docs`) |

---

## Database Setup & ER Diagram

The database uses SQLite with WAL (Write-Ahead Logging) mode and foreign key constraints enabled. Zero configuration is required; tables and relational constraints are automatically initialized upon server boot or seeding.

```mermaid
erDiagram
    USERS ||--o{ WORK_ORDERS : "assigned / created"
    USERS ||--o{ TRANSFERS : "created"
    USERS ||--o{ CUSTOMER_ORDERS : "created"
    USERS ||--o{ INVENTORY_TRANSACTIONS : "logged"

    CATEGORIES ||--o{ ITEMS : "classifies"

    ITEMS ||--o{ INVENTORY : "stocked in"
    ITEMS ||--o{ WORK_ORDERS : "required for"
    ITEMS ||--o{ TRANSFERS : "transferred"
    ITEMS ||--o{ CUSTOMER_ORDERS : "ordered"

    LOCATIONS ||--o{ INVENTORY : "located at"
    LOCATIONS ||--o{ WORK_ORDERS : "production at"
    LOCATIONS ||--o{ TRANSFERS : "source / dest"
    LOCATIONS ||--o{ CUSTOMER_ORDERS : "fulfilled from"

    INVENTORY ||--o{ INVENTORY_TRANSACTIONS : "audit log"

    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role "admin | operations | sales"
        datetime createdAt
    }

    LOCATIONS {
        int id PK
        string name UK
        string address
    }

    CATEGORIES {
        int id PK
        string name UK
    }

    ITEMS {
        int id PK
        string name
        string unit
        int category_id FK
    }

    INVENTORY {
        int id PK
        int item_id FK
        int location_id FK
        string batch
        float physical_qty
        float reserved_qty
    }

    INVENTORY_TRANSACTIONS {
        int id PK
        int inventory_id FK
        string type "IN | OUT | RESERVE | RELEASE"
        float quantity
        string reference_type
        int reference_id
        int created_by FK
    }

    WORK_ORDERS {
        int id PK
        int location_id FK
        int item_id FK
        float required_qty
        float available_at_location
        float shortage_qty
        int assigned_user_id FK
        string status "Assigned | InProgress | Completed"
    }

    TRANSFERS {
        int id PK
        int source_location_id FK
        int dest_location_id FK
        int item_id FK
        float quantity
        string status "Requested | Dispatched | Received"
        datetime dispatched_at
        datetime received_at
    }

    CUSTOMER_ORDERS {
        int id PK
        int item_id FK
        int location_id FK
        float quantity
        string status "Confirmed | Cancelled"
        string customer_name
        int created_by FK
    }
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
DB_STORAGE=./database.sqlite
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Project Setup & How to Run

### Prerequisites
- Node.js (v22.5+ or v24+)
- Git

### 1. Start the Backend

```bash
cd backend
npm install
npm run seed     # Seeds users, locations, items, and initial inventory
npm start
```
- Backend API running at: `http://localhost:5000`
- Interactive Swagger Documentation: `http://localhost:5000/api-docs`

### 2. Start the Frontend

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
- Frontend application running at: `http://localhost:3000`

---

## Pre-Configured Users (Roles)

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@erp.com` | `admin123` | Create Work Orders, View All Modules, Full System Access |
| **Operations User** | `ops@erp.com` | `ops123` | Manage Inventory Stock, Request/Dispatch/Receive Transfers |
| **Sales User** | `sales@erp.com` | `sales123` | Create Customer Orders, Reserve Stock, Cancel Orders |

---

## How to Test

Run the automated test suite with Jest:

```bash
cd backend
npm test:jest
```

### Test Coverage:
- **Test 1**: Cannot reserve more than available inventory (`400 Bad Request`).
- **Test 2**: Cannot transfer more than available inventory (`400 Bad Request`).
- **Test 3**: Destination stock increases only after transfer receipt (remains unchanged after dispatch).
- **Test 4**: Same transfer cannot be received twice (`409 Conflict` idempotency guard).
- **Test 5**: Unauthorized users cannot perform restricted operations (`403 Forbidden`).
- **Concurrency Test**: Database transaction guarantees race condition protection when multiple users concurrently attempt to reserve the same inventory.
