
# Crop Product Management (MERN) — v6h (Edit/Delete + Draft clarity)

**New in this build:**
- **Inventory:** Added **Edit** and **Delete** buttons per product (with modal editor + confirmation for delete).
- **Buying → PO:** Clear **DRAFT** badge on the form + stronger labels for **Qty** and **Unit Cost (LKR)**.
- **PO list:** Clear status badges and clearer item lines (Qty, Unit Cost, Name) in each PO card.

> Everything else from v6g remains: Products (request-only), Approvals, Inventory grid, Suppliers, Payments, Supplier Statement (PDF), POs, GRN, PO receipts (PDF/Excel).

## Run
Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
Frontend
```bash
cd ../client
npm install
npm run dev
```

Optional `client/.env`:
```
VITE_API_BASE_URL=http://YOUR_HOST:5000/api
VITE_API_ORIGIN=http://YOUR_HOST:5000
```
