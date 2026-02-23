const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @POST /api/attendance
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const { staffId, date, status, checkIn, checkOut, notes } = req.body;
    const existing = await Attendance.findOne({ staffId, date });
    if (existing) {
      const updated = await Attendance.findByIdAndUpdate(existing._id,
        { status, checkIn, checkOut, notes, markedBy: req.user._id }, { new: true });
      return res.json(updated);
    }
    const attendance = await Attendance.create({
      staffId, date, status, checkIn, checkOut, notes, markedBy: req.user._id
    });
    res.status(201).json(attendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @POST /api/attendance/bulk
router.post('/bulk', protect, authorize('Admin'), async (req, res) => {
  try {
    const { records } = req.body; // [{staffId, date, status}]
    const results = [];
    for (const record of records) {
      const existing = await Attendance.findOne({ staffId: record.staffId, date: record.date });
      if (existing) {
        const updated = await Attendance.findByIdAndUpdate(existing._id,
          { ...record, markedBy: req.user._id }, { new: true });
        results.push(updated);
      } else {
        const att = await Attendance.create({ ...record, markedBy: req.user._id });
        results.push(att);
      }
    }
    res.json(results);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @GET /api/attendance?date=YYYY-MM-DD
router.get('/', protect, async (req, res) => {
  try {
    const { date, staffId, month } = req.query;
    const query = {};
    if (date) query.date = date;
    if (staffId) query.staffId = staffId;
    if (month) query.date = { $regex: `^${month}` }; // YYYY-MM

    const records = await Attendance.find(query)
      .populate('staffId', 'name role department')
      .sort({ date: -1 });

    // If date provided, also return staff without attendance
    if (date) {
      const allStaff = await Staff.find({ isActive: true });
      const attendanceMap = {};
      records.forEach(r => { attendanceMap[r.staffId._id.toString()] = r; });
      const combined = allStaff.map(s => ({
        staff: s,
        attendance: attendanceMap[s._id.toString()] || null,
      }));
      return res.json(combined);
    }
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/attendance/summary
router.get('/summary', protect, async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const records = await Attendance.find({ date: { $regex: `^${month}` } })
      .populate('staffId', 'name role department');

    const summary = {};
    records.forEach(r => {
      const id = r.staffId._id.toString();
      if (!summary[id]) {
        summary[id] = { staff: r.staffId, Present: 0, Absent: 0, Late: 0, 'Half Day': 0, Leave: 0 };
      }
      summary[id][r.status] = (summary[id][r.status] || 0) + 1;
    });
    res.json(Object.values(summary));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
