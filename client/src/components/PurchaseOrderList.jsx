import { useEffect, useState } from 'react'
import api from '../api/api'
import { formatLKR } from '../utils/currency'

export default function PurchaseOrderList({ refreshSignal }) {
  const [items, setItems] = useState([])

  const load = async () => {
    const { data } = await api.get('/purchase-orders')
    setItems(data)
  }

  useEffect(() => {
    load()
  }, [refreshSignal])

  const receiptPdf = (id) => {
    window.open(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${id}/receipt.pdf`,
      '_blank'
    )
  }

  const receiptExcel = (id) => {
    window.open(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${id}/receipt.xlsx`,
      '_blank'
    )
  }

  return (
    <div>
      {items.map((po) => (
        <div key={po._id} className="card" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>PO #{po._id.slice(-6)}</strong> – {po.supplier?.name}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => receiptPdf(po._id)}>Receipt PDF</button>
              <button className="btn btn-accent" onClick={() => receiptExcel(po._id)}>Receipt Excel</button>
            </div>
          </div>

          <ul style={{ margin: '8px 0' }}>
            {po.items.map((it, i) => (
              <li key={i}>
                <strong>Qty:</strong> {it.qty} — <strong>Unit Cost:</strong> {formatLKR(it.unitCost)} — {it.product?.name}
              </li>
            ))}
          </ul>

          <div>
            Total: <strong>{formatLKR(po.total)}</strong>
          </div>
        </div>
      ))}
    </div>
  )
}