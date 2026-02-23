const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  contact: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  type: { type: String, enum: ['OPD', 'IPD'], required: true },
  ward: { type: String, enum: ['OPD Floor', 'ICU Floor', 'General Ward', 'Private Ward', 'Emergency'], required: true },
  diagnosis: { type: String, default: '' },
  admissionDate: { type: Date, default: Date.now },
  dischargeDate: { type: Date },
  status: { type: String, enum: ['Active', 'Discharged', 'Critical'], default: 'Active' },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
