const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @POST /api/bills
router.post('/', protect, authorize('Admin', 'Receptionist'), async (req, res) => {
  try {
    const { patientId, items, discount = 0, tax = 0, notes, paymentStatus, paymentMethod } = req.body;
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal - discount + (subtotal * tax / 100);
    const bill = await Bill.create({
      patientId, items, subtotal, discount, tax, totalAmount,
      paymentStatus, paymentMethod, notes, createdBy: req.user._id
    });
    res.status(201).json(bill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @GET /api/bills
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, paymentStatus } = req.query;
    const query = paymentStatus ? { paymentStatus } : {};
    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .populate('patientId', 'name contact type ward')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ bills, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/bills/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBills = await Bill.find({ createdAt: { $gte: today, $lt: tomorrow } });
    const revenueToday = todayBills.reduce((sum, b) => sum + (b.paymentStatus !== 'Pending' ? b.totalAmount : 0), 0);

    const weeklyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const dayBills = await Bill.find({ createdAt: { $gte: d, $lt: next }, paymentStatus: { $ne: 'Pending' } });
      weeklyRevenue.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        Revenue: dayBills.reduce((sum, b) => sum + b.totalAmount, 0),
      });
    }
    res.json({ revenueToday, weeklyRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/bills/:patientId
router.get('/patient/:patientId', protect, async (req, res) => {
  try {
    const bills = await Bill.find({ patientId: req.params.patientId })
      .populate('patientId', 'name contact')
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/bills/single/:id
router.get('/single/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('patientId').populate('createdBy', 'name');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/bills/:id
router.put('/:id', protect, authorize('Admin', 'Receptionist'), async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(bill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
