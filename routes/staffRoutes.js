const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @POST /api/staff
router.post('/', protect, authorize('Admin'), async (req, res) => {
  try {
    const staff = await Staff.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(staff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @GET /api/staff
router.get('/', protect, async (req, res) => {
  try {
    const { search, role, department } = req.query;
    const query = { isActive: true };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (role) query.role = role;
    if (department) query.department = department;

    const staff = await Staff.find(query).sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/staff/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/staff/:id
router.put('/:id', protect, authorize('Admin'), async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(staff);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
