const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @POST /api/patients
router.post('/', protect, authorize('Admin', 'Receptionist'), async (req, res) => {
  try {
    const patient = await Patient.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @GET /api/patients
router.get('/', protect, async (req, res) => {
  try {
    const { search, ward, type, status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { contact: { $regex: search, $options: 'i' } },
    ];
    if (ward) query.ward = ward;
    if (type) query.type = type;
    if (status) query.status = status;

    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('createdBy', 'name')
      .populate('assignedDoctor', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ patients, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/patients/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalToday, opdToday, ipdToday, totalActive] = await Promise.all([
      Patient.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Patient.countDocuments({ type: 'OPD', createdAt: { $gte: today, $lt: tomorrow } }),
      Patient.countDocuments({ type: 'IPD', createdAt: { $gte: today, $lt: tomorrow } }),
      Patient.countDocuments({ status: 'Active' }),
    ]);

    // Weekly OPD vs IPD
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const [opd, ipd] = await Promise.all([
        Patient.countDocuments({ type: 'OPD', createdAt: { $gte: d, $lt: next } }),
        Patient.countDocuments({ type: 'IPD', createdAt: { $gte: d, $lt: next } }),
      ]);
      weeklyData.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        OPD: opd,
        IPD: ipd,
      });
    }

    res.json({ totalToday, opdToday, ipdToday, totalActive, weeklyData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/patients/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('assignedDoctor', 'name');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/patients/:id
router.put('/:id', protect, authorize('Admin', 'Receptionist'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @DELETE /api/patients/:id
router.delete('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
