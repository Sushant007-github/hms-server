const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true },
});

const billSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  billNumber: { type: String, unique: true },
  items: [billItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Partial'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Insurance', ''], default: '' },
  notes: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

billSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const count = await mongoose.model('Bill').countDocuments();
    this.billNumber = `HMS-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);

