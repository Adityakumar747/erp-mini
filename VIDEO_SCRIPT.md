# Demo Video Script — erp mini
**Target duration:** 5–7 minutes  
**Required flow:** Login → Inventory → Work Order → Transfer → Order Reservation

---

## Pre-Recording Setup

1. Open 3 browser tabs:
   - Tab 1: Frontend — `https://frontend-5fub.vercel.app/login`
   - Tab 2: Backend Swagger — `https://erp-mini-gvdl.onrender.com/api-docs`
   - Tab 3: GitHub repo — `https://github.com/Adityakumar747/erp-mini`

2. Have these credentials ready:
   - Admin: `admin@erp.com` / `admin123`
   - Operations: `ops@erp.com` / `ops123`
   - Sales: `sales@erp.com` / `sales123`

3. Use a screen recorder (OBS, Loom, or built-in Windows Snipping Tool recorder)

---

## Shot 1: Introduction & GitHub Repo (0:00–0:30)

**Show:** Tab 3 — GitHub repo  
**URL:** `https://github.com/Adityakumar747/erp-mini`

### What to Say
> "Hi, this is my Full-Stack Developer Technical Case Study submission — erp mini. It's a production-oriented Operations ERP covering the complete inventory lifecycle. The entire source code is in this GitHub repository, which shows a clean development history with 13 incremental commits. You can see the tech stack, ER diagram, and setup instructions in the README."

### What to Point Out
- Scroll to show the README preview (tech stack table)
- Scroll down to show the **ER Diagram** section
- Mention: "The schema covers users, locations, categories, items, inventory, work orders, transfers, and customer orders with proper foreign key relationships."

---

## Shot 2: Login & Role Selection (0:30–1:00)

**Show:** Tab 1 — Frontend login page  
**URL:** `https://frontend-5fub.vercel.app/login`

### What to Say
> "Let me show you the application in action. The login page supports three roles: Admin, Operations, and Sales. Each role has different permissions enforced both in the frontend and backend."

### What to Click / Point Out
1. Click the **Admin** quick-fill button
2. Click **"Sign In to erp mini"**
3. After login, point to the **navbar**:
   - "As Admin, I can see all modules: Inventory, Work Orders, Internal Transfers, and Customer Orders."
   - "I can also switch roles instantly using the Demo Switcher in the top right."

---

## Shot 3: Inventory Management (1:00–1:45)

**Show:** Frontend — Inventory page (`/inventory`)  
**Already logged in as Admin**

### What to Say
> "The Inventory module shows multi-location stock levels. Each row displays the item, category, location, batch, physical quantity, reserved quantity, and available quantity. Available quantity is calculated as physical minus reserved."

### What to Click / Point Out
1. Show the **KPI cards** at the top (Total Records, Physical Units, Reserved Units, Available)
2. Use the **filter dropdowns** to filter by Location and Item
3. Click **"Add Stock"** button (top right)
   - "Only Admin and Operations can add stock."
   - Fill in a sample: Select Item = "Circuit Board A", Location = "Warehouse A", Quantity = 50
   - Click **"Add Stock"**
   - "The stock is added and an IN transaction is logged in the audit trail."
4. Click **"Audit Log"** on any row
   - "Here you can see the complete transaction history for this inventory record — IN, OUT, RESERVE, RELEASE — with timestamps and who performed the action."

---

## Shot 4: Work Orders + Shortage Calculation (1:45–2:45)

**Show:** Frontend — Work Orders page (`/work-orders`)  
**Still logged in as Admin**

### What to Say
> "The Work Orders module lets Admin create production orders. When creating a work order, the system automatically calculates the available stock at the selected location and the shortage quantity."

### What to Click / Point Out
1. Click **"+ New Work Order"**
2. Fill in the form:
   - Location: `Warehouse A`
   - Item: `Circuit Board A`
   - Required Quantity: `300`
   - Assign User: `Operations User`
3. **Point to the "Automatic Material Stock Check" box**:
   - "Available at location: 200"
   - "Required: 300"
   - "Shortage: 100 (Internal Transfer Needed)"
   - "This is calculated automatically — the admin doesn't need to manually check stock."
4. Click **"Create Work Order"**
5. In the table, point to the new work order:
   - Status: `Assigned`
   - Shortage badge: `Shortage: 100`
   - "If there's a shortage, the admin can click 'Transfer Stock' to initiate an internal transfer."

---

## Shot 5: Internal Stock Transfer (2:45–4:00)

**Show:** Frontend — Transfers page (`/transfers`)

### What to Say
> "Internal Transfers move stock between locations. The flow is Requested → Dispatched → Received. On dispatch, the source inventory reduces immediately. On receipt, the destination inventory increases. The same transfer cannot be received twice."

### What to Click / Point Out
1. If not already on Transfers page, navigate via navbar
2. Click **"+ Request Transfer"**
3. Fill in the form:
   - Source Location: `Warehouse B`
   - Destination Location: `Warehouse A`
   - Item: `Circuit Board A`
   - Quantity: `50`
   - Work Order ID: `1` (or leave blank)
   - Notes: `For WO-0001 shortage`
4. Click **"Request Transfer"**
5. In the table, find the new transfer (status: `Requested`)
6. Click **"Dispatch"**
   - "Status changes to Dispatched. Source stock has been reduced."
7. Click **"Confirm Receipt"**
   - "Status changes to Received. Destination stock has increased."
   - "If I try to receive it again, I get a 409 Conflict error — this prevents double-processing."

---

## Shot 6: Customer Order & Stock Reservation (4:00–5:15)

**Show:** Frontend — Customer Orders page (`/orders`)  
**Switch role to Sales using Demo Switcher**

### What to Say
> "The Sales module allows creating customer orders with atomic stock reservation. When an order is placed, the system atomically reserves stock from available inventory. Two users cannot reserve more stock than exists — this is guaranteed by database transactions."

### What to Click / Point Out
1. Switch role to **Sales** using Demo Switcher
2. Navigate to **Customer Orders**
3. Click **"+ New Customer Order"**
4. Fill in the form:
   - Customer Name: `Apex Industrial Corp`
   - Location: `Warehouse A`
   - Item: `Circuit Board A`
   - Quantity: `50`
5. **Point to the "Currently Available at Location" preview**:
   - "The system shows live available stock before I submit."
   - "If available is less than requested, it turns red and the order will fail."
6. Click **"Confirm Order & Reserve"**
   - "Order is created with status Confirmed, and 50 units are now reserved."
7. Show the order in the table:
   - Status: `Confirmed`
   - Qty Reserved: `50`
   - "If I try to create another order for more than the remaining stock, it will fail with an insufficient stock error."

---

## Shot 7: Cancel Order & Release Stock (5:15–5:45)

**Show:** Still on Customer Orders page (as Sales)

### What to Say
> "If an order is cancelled, the reserved stock is released back to available inventory. This ensures stock is not locked up indefinitely."

### What to Click / Point Out
1. Click **"Cancel & Release"** on the order you just created
2. Confirm the dialog
3. "Order status changes to Cancelled, and the reserved stock is released."
4. Navigate to **Inventory** to verify the reserved quantity has decreased

---

## Shot 8: Backend & API Docs (5:45–6:15)

**Show:** Tab 2 — Swagger UI  
**URL:** `https://erp-mini-gvdl.onrender.com/api-docs`

### What to Say
> "The backend is built with Express.js and all endpoints are documented with Swagger. You can see the full API specification here — request/response schemas, authorization requirements, and example values."

### What to Point Out
1. Scroll through the endpoints:
   - `POST /api/auth/login`
   - `GET /api/inventory`
   - `POST /api/work-orders`
   - `PATCH /api/transfers/{id}/dispatch`
   - `POST /api/orders`
2. Click on one endpoint to expand it
3. "All protected routes require a Bearer JWT token. Role-based authorization is enforced per endpoint."

---

## Shot 9: Tests & Conclusion (6:15–7:00)

**Show:** Tab 3 — GitHub repo, Tests section  
**URL:** `https://github.com/Adityakumar747/erp-mini`

### What to Say
> "The project includes 14 automated tests covering all mandatory requirements and a concurrency safety test. Let me show you the test results."

### What to Point Out
1. Scroll to the README's "How to Test" section
2. List the 5 mandatory tests:
   - Test 1: Cannot reserve more than available inventory
   - Test 2: Cannot transfer more than available inventory
   - Test 3: Destination stock increases only after transfer receipt
   - Test 4: Same transfer cannot be received twice
   - Test 5: Unauthorized user cannot perform restricted operation
3. "Plus a concurrency test that guarantees no overselling when two users simultaneously try to reserve the same stock."
4. Final wrap-up:
   - "This is a complete full-stack ERP with frontend, backend, relational database, authentication, authorization, business logic, transactions, validation, testing, and portable configuration."
   - "Deployed on Vercel for frontend and Render for backend."
   - "Thank you for watching."

---

## Timing Summary

| Section | Duration |
|---|---|
| Introduction & GitHub | 0:00–0:30 |
| Login & Roles | 0:30–1:00 |
| Inventory | 1:00–1:45 |
| Work Orders | 1:45–2:45 |
| Transfers | 2:45–4:00 |
| Customer Orders | 4:00–5:15 |
| Cancel Order | 5:15–5:45 |
| Backend & API Docs | 5:45–6:15 |
| Tests & Conclusion | 6:15–7:00 |

---

## Tips for a Polished Video

- Speak clearly and at a moderate pace
- Use the mouse pointer to highlight buttons and fields as you click them
- Pause briefly after each action so the viewer can see the result
- If you make a mistake, it's okay to pause and correct — don't re-record the whole video
- Ensure your browser zoom is at 100% so text is readable
- Close any distracting tabs or notifications before recording
