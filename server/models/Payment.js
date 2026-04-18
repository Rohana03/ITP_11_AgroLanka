
import mongoose from 'mongoose';
const PaymentSchema = new mongoose.Schema({ supplier:{ type:mongoose.Schema.Types.ObjectId, ref:'Supplier' }, amount:Number, date:{ type:Date, default:Date.now }, reference:String, notes:String }, { timestamps:true });
export default mongoose.model('Payment', PaymentSchema);
