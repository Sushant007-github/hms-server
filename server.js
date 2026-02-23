require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
app.get('/api/create-admin', async (req, res) => {
  try {
    const User = require('./models/User');
    const exists = await User.findOne({ email: 'admin@hms.com' });
    if (exists) return res.json({ message: 'Admin already exists! Try logging in.' });
    await User.create({
      name: 'Admin User',
      email: 'admin@hms.com',
      password: 'admin123',
      role: 'Admin',
      department: 'Administration'
    });
    res.json({ message: 'Admin created! Login with admin@hms.com / admin123' });
  } catch(e) {
    res.json({ error: e.message });
  }
});app.get('/api/create-users', async (req, res) => {
  try {
    const User = require('./models/User');
    await User.deleteMany({});
    await User.create([
      { name: 'Admin Kumar', email: 'admin@hms.com', password: 'admin123', role: 'Admin', department: 'Administration' },
      { name: 'Dr. Priya Sharma', email: 'doctor@hms.com', password: 'doctor123', role: 'Doctor', department: 'Cardiology' },
      { name: 'Anita Singh', email: 'receptionist@hms.com', password: 'recep123', role: 'Receptionist', department: 'Front Desk' }
    ]);
    res.json({ message: 'All 3 users created!' });
  } catch(e) {
    res.json({ error: e.message });
  }
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 HMS Server running on port ${PORT}`));
