
import mongoose from 'mongoose';
const SupplierSchema = new mongoose.Schema({ name:String, contactName:String, phone:String, email:String, address:String, notes:String, isActive:{type:Boolean,default:true} }, { timestamps:true });
export default mongoose.model('Supplier', SupplierSchema);
