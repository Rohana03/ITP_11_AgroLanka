
import Supplier from '../models/Supplier.js';
import Payment from '../models/Payment.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export const listSuppliers = async (req,res)=>{ const items=await Supplier.find({}).sort({name:1}); res.json(items) };
export const createSupplier = async (req,res)=>{ const s=await Supplier.create(req.body); res.status(201).json(s) };
export const updateSupplier = async (req,res)=>{ const s=await Supplier.findByIdAndUpdate(req.params.id, req.body, { new:true }); if(!s) return res.status(404).json({error:'not found'}); res.json(s) };
export const deleteSupplier = async (req,res)=>{ const d=await Supplier.findByIdAndDelete(req.params.id); if(!d) return res.status(404).json({error:'not found'}); res.json({ok:true}) };
export const createPayment = async (req,res)=>{ const p=await Payment.create({ supplier:req.params.id, amount:Number(req.body.amount||0), date:req.body.date?new Date(req.body.date):new Date(), reference:req.body.reference||'' }); res.status(201).json(p) };
export const listPayments = async (req,res)=>{ const items=await Payment.find({supplier:req.params.id}).sort({date:-1}); res.json(items) };

// Helper to calc sums
const withinRange = (d, from, to) => (!from || d>=from) && (!to || d<=to);
export const supplierStatement = async (req,res)=>{
  const { id } = req.params; const { from, to, format } = req.query;
  const fromD = from? new Date(from): null; const toD = to? new Date(to): null;
  const allPOs = await PurchaseOrder.find({ supplier: id });
  const allPays = await Payment.find({ supplier: id });
  const sum = (arr) => arr.reduce((s,v)=> s + Number(v), 0);
  const lineTotals = (po)=> (po.items||[]).reduce((s,it)=> s + Number(it.qty||0)*Number(it.unitCost||0), 0);
  // Opening = (Purchases before from) - (Payments before from)
  const purchasesBefore = sum(allPOs.filter(po=> fromD && po.createdAt<fromD).map(lineTotals));
  const paymentsBefore = sum(allPays.filter(p=> fromD && p.date<fromD).map(p=> Number(p.amount||0)));
  const opening = purchasesBefore - paymentsBefore;
  const periodPurch = sum(allPOs.filter(po=> withinRange(po.createdAt, fromD, toD)).map(lineTotals));
  const periodPays = sum(allPays.filter(p=> withinRange(p.date, fromD, toD)).map(p=> Number(p.amount||0)));
  const closing = opening + periodPurch - periodPays;
  const payload = { supplier: id, from: from||null, to: to||null, openingBalance: opening, periodPurchases: periodPurch, periodPayments: periodPays, closingBalance: closing };
  if(format==='pdf'){
    const pdf = await PDFDocument.create(); const page = pdf.addPage([595.28, 841.89]); const font = await pdf.embedFont(StandardFonts.Helvetica);
    let y=800; const draw=(t,s=12,x=50)=>{ page.drawText(String(t), {x,y,size:s,font}); y-=s+6 };
    draw('Supplier Statement',16); draw(`Supplier ID: ${id}`); if(from) draw(`From: ${from}`); if(to) draw(`To: ${to}`);
    y-=6; draw(`Opening: ${opening.toFixed(2)}`); draw(`Purchases: ${periodPurch.toFixed(2)}`); draw(`Payments: ${periodPays.toFixed(2)}`); draw(`Closing: ${closing.toFixed(2)}`);
    const bytes = await pdf.save(); res.setHeader('Content-Type','application/pdf'); res.setHeader('Content-Disposition',`inline; filename="supplier_${id}_statement.pdf"`); return res.send(Buffer.from(bytes));
  }
  res.json(payload);
};
