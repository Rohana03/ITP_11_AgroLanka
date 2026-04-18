
import mongoose from 'mongoose';
const ProductRequestSchema = new mongoose.Schema({ name:String, description:String, category:String, brand:String, unit:String, price:Number, stockQty:Number, imageUrl:String, tags:[String], status:{type:String,default:'pending'}, requestedBy:String, reviewedBy:String, reviewedAt:Date, rejectionReason:String }, { timestamps:true });
export default mongoose.model('ProductRequest', ProductRequestSchema);
