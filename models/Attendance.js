const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD format
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day', 'Leave'], required: true },
  checkIn: { type: String, default: '' },
  checkOut: { type: String, default: '' },
  notes: { type: String, default: '' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
