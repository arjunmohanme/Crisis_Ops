# CrisisOps

## Emergency Response Coordination & Verification Platform

CrisisOps is a MERN-stack web application for a controlled, academic emergency-response coordination workflow. It centralizes incident reporting, administrator verification, resource inventory and allocation, volunteer assignments, sandbox donations, dashboards, and audit logging.

**Core workflow:**

**Report → Verify → Prioritize → Request → Allocate → Assign → Track → Resolve**

CrisisOps is a capstone prototype. It does not provide authoritative emergency truth or replace police, fire, ambulance, government, or other professional emergency systems.

---

## 1. Technology Stack

- **Frontend:** React.js, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT + bcryptjs + server-side RBAC
- **Payment:** Razorpay Sandbox/Test mode
- **Validation:** express-validator

---

## 2. User Roles

### Citizen
- Register and log in
- Submit incident reports
- View own reports and verified operational incidents
- Update permitted profile information
- Make sandbox donations for verified incidents
- View own donation history

### Volunteer
- Maintain profile, skills, and availability
- View assigned response work
- Accept/reject assignments and update progress
- View permitted operational information

### Organization
- Maintain organization profile
- Create and manage organization-owned resource inventory
- View resource requests for its resources
- Allocate available resources to valid requests
- Track allocation and fulfillment status

### Administrator
- Review and verify/reject incidents
- Manage incident priority and lifecycle
- Manage users and account status
- Manage organizations, resources, assignments, donations, and audit logs
- View role-specific operational KPIs

---

## 3. Main Modules

1. **Authentication & User Management**
2. **Incident Management**
3. **Verification & Evidence**
4. **Organization & Resource Management**
5. **Resource Request & Allocation**
6. **Volunteer Management**
7. **Donation & Payment**
8. **Dashboard & Analytics**
9. **Audit & Administration**

---

## 4. Important Business Rules

- New incidents start as **Reported** and are not treated as verified information automatically.
- Incident lifecycle is **Reported → Under Review → Verified → Active → Resolved → Archived**. Rejection is an alternative review outcome.
- Only administrators can verify or reject incidents.
- Priority is limited to **Low, Medium, High, Critical**.
- Resource quantities cannot be negative.
- Allocations cannot exceed available inventory or the remaining requested quantity.
- Resource-request states are **Pending, Partially Fulfilled, Fulfilled**.
- Only available volunteers can be assigned to active incidents.
- Organization users can modify only resources owned by their organization.
- Payment success is recorded only after server-side Razorpay verification.
- Important operational actions generate audit-log entries.

---

## 5. Project Structure

```text
CrisisOps/
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── utils/
│
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── scripts/
│       ├── services/
│       ├── utils/
│       └── validators/
│
└── SRS_IMPLEMENTATION_AUDIT.md
```

---

## 6. Required Environment Variables

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGODB_URI=<mongodb-atlas-connection>
CLIENT_URL=http://localhost:5173
JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=1d
RAZORPAY_KEY_ID=<sandbox-key>
RAZORPAY_KEY_SECRET=<sandbox-secret>
```

`MONGO_URI` is still accepted by the backend as a legacy compatibility fallback.

For the frontend, optionally set:

```env
VITE_API_URL=http://localhost:5000
```

Do not commit `.env` files or secrets.

---

## 7. Run Locally

### Backend

```bash
cd server
npm install
npm run dev
```

Backend default: `http://localhost:5000`

### Frontend

```bash
cd client
npm install
npm run dev
```

Frontend default: `http://localhost:5173`

### Create an administrator

```bash
cd server
npm run create-admin
```

Follow the script prompts and then use the generated administrator account to review incidents and manage operational workflows.

---

## 8. SRS API Highlights

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Incidents
- `GET /api/incidents`
- `POST /api/incidents`
- `GET /api/incidents/:id`
- `PUT /api/incidents/:id`
- `PATCH /api/incidents/:id/status`
- `DELETE /api/incidents/:id`

### Resources and allocation
- `POST /api/resources`
- `GET /api/resources`
- `PUT /api/resources/:id`
- `DELETE /api/resources/:id`
- `POST /api/resource-requests`
- `GET /api/resource-requests`
- `PATCH /api/resource-requests/:id`
- `POST /api/volunteer-assignments`
- `PATCH /api/volunteer-assignments/:id`

### Payments
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `GET /api/donations`

---

## 9. Scope Boundary

The project intentionally excludes real emergency dispatch integrations, authoritative incident verification, real charitable fund custody, real-time GPS tracking, AI disaster prediction/classification, SMS/push infrastructure, IoT/satellite integrations, advanced GIS route optimization, and mobile-native applications.

Map visualization, charts, and richer evidence-file uploads are optional SRS features.

---

## 10. Implementation Audit

See **`SRS_IMPLEMENTATION_AUDIT.md`** for the current SRS-to-code alignment summary and validation notes.
