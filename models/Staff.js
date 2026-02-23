const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['Doctor', 'Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Admin', 'Security', 'Cleaner'], required: true },
  department: { type: String, required: true },
  qualification: { type: String, default: '' },
  experience: { type: Number, default: 0 },
  salary: { type: Number, default: 0 },
  joiningDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  address: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
