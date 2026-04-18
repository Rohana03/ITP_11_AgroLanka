
import mongoose from 'mongoose';
const PurchaseItemSchema = new mongoose.Schema({ product:{ type:mongoose.Schema.Types.ObjectId, ref:'Product' }, qty:Number, unitCost:Number, receivedQty:{type:Number,default:0} }, { _id:false });
const PurchaseOrderSchema = new mongoose.Schema({ supplier:{ type:mongoose.Schema.Types.ObjectId, ref:'Supplier' }, items:[PurchaseItemSchema], status:{ type:String, default:'draft' }, total:Number, receivedAt:Date }, { timestamps:true });
export default mongoose.model('PurchaseOrder', PurchaseOrderSchema);
