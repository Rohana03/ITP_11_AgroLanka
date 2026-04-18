
import mongoose from 'mongoose';
const ProductSchema = new mongoose.Schema({ name:String, description:String, category:String, brand:String, unit:String, price:Number, stockQty:Number, imageUrl:String, tags:[String] }, { timestamps:true });
export default mongoose.model('Product', ProductSchema);
