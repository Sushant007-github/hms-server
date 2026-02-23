require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Staff = require('./models/Staff');
const Bill = require('./models/Bill');
const Attendance = require('./models/Attendance');

const seed = async () => {
  await connectDB();
  await Promise.all([
    User.deleteMany(), Patient.deleteMany(), Staff.deleteMany(),
    Bill.deleteMany(), Attendance.deleteMany()
  ]);
  console.log('🗑️  Cleared existing data');

  // Users
  const admin = await User.create({ name: 'Dr. Admin Kumar', email: 'admin@hms.com', password: 'admin123', role: 'Admin', department: 'Administration' });
  const doctor = await User.create({ name: 'Dr. Priya Sharma', email: 'doctor@hms.com', password: 'doctor123', role: 'Doctor', department: 'Cardiology' });
  const receptionist = await User.create({ name: 'Anita Singh', email: 'receptionist@hms.com', password: 'recep123', role: 'Receptionist', department: 'Front Desk' });
  console.log('✅ Users created');

  // Staff
  const staffData = [
    { name: 'Dr. Priya Sharma', email: 'priya.sharma@hms.com', phone: '9876543210', role: 'Doctor', department: 'Cardiology', qualification: 'MBBS, MD', experience: 8, salary: 150000 },
    { name: 'Dr. Rajesh Patel', email: 'rajesh.patel@hms.com', phone: '9876543211', role: 'Doctor', department: 'Orthopedics', qualification: 'MBBS, MS', experience: 12, salary: 180000 },
    { name: 'Dr. Meena Gupta', email: 'meena.gupta@hms.com', phone: '9876543212', role: 'Doctor', department: 'Pediatrics', qualification: 'MBBS, DCH', experience: 6, salary: 130000 },
    { name: 'Sunita Verma', email: 'sunita.verma@hms.com', phone: '9876543213', role: 'Nurse', department: 'ICU', qualification: 'BSc Nursing', experience: 4, salary: 45000 },
    { name: 'Ravi Kumar', email: 'ravi.kumar@hms.com', phone: '9876543214', role: 'Nurse', department: 'General Ward', qualification: 'GNM', experience: 3, salary: 38000 },
    { name: 'Anita Singh', email: 'anita.singh@hms.com', phone: '9876543215', role: 'Receptionist', department: 'Front Desk', qualification: 'BA', experience: 2, salary: 30000 },
    { name: 'Mohammed Ali', email: 'mohammed.ali@hms.com', phone: '9876543216', role: 'Lab Technician', department: 'Pathology', qualification: 'DMLT', experience: 5, salary: 42000 },
    { name: 'Pooja Mehta', email: 'pooja.mehta@hms.com', phone: '9876543217', role: 'Pharmacist', department: 'Pharmacy', qualification: 'B.Pharm', experience: 3, salary: 40000 },
  ];
  const staffList = await Staff.insertMany(staffData.map(s => ({ ...s, createdBy: admin._id })));
  console.log('✅ Staff created');

  // Patients
  const wards = ['OPD Floor', 'ICU Floor', 'General Ward', 'Private Ward', 'Emergency'];
  const diagnoses = ['Hypertension', 'Diabetes', 'Fracture', 'Fever', 'Appendicitis', 'Asthma', 'Cardiac Arrest', 'Pneumonia'];
  const patientList = [];
  for (let i = 0; i < 25; i++) {
    const type = i % 3 === 0 ? 'IPD' : 'OPD';
    const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 10));
    patientList.push({
      name: ['Amit Sharma', 'Priya Patel', 'Rahul Singh', 'Kavita Gupta', 'Deepak Kumar', 'Sneha Joshi', 'Vikram Rao', 'Ananya Das'][i % 8] + ` ${i + 1}`,
      age: 20 + Math.floor(Math.random() * 50),
      gender: ['Male', 'Female'][i % 2],
      contact: `98765${String(43200 + i).padStart(5, '0')}`,
      type,
      ward: type === 'IPD' ? wards[Math.floor(Math.random() * wards.length)] : 'OPD Floor',
      diagnosis: diagnoses[i % diagnoses.length],
      status: ['Active', 'Active', 'Active', 'Discharged'][i % 4],
      admissionDate: d,
      createdBy: admin._id,
    });
  }
  const patients = await Patient.insertMany(patientList);
  console.log('✅ Patients created');

  // Bills
  const services = [
    { serviceName: 'Consultation', unitPrice: 500 },
    { serviceName: 'Blood Test', unitPrice: 800 },
    { serviceName: 'X-Ray', unitPrice: 1200 },
    { serviceName: 'ECG', unitPrice: 600 },
    { serviceName: 'Ward Charges', unitPrice: 2000 },
    { serviceName: 'Medicine', unitPrice: 350 },
    { serviceName: 'Nursing Care', unitPrice: 1500 },
    { serviceName: 'Surgery', unitPrice: 25000 },
  ];
  for (let i = 0; i < 15; i++) {
    const numItems = 2 + Math.floor(Math.random() * 3);
    const items = Array.from({ length: numItems }, () => {
      const svc = services[Math.floor(Math.random() * services.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      return { serviceName: svc.serviceName, quantity: qty, unitPrice: svc.unitPrice, total: qty * svc.unitPrice };
    });
    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const d = new Date(); d.setDate(d.getDate() - Math.floor(Math.random() * 10));
    await Bill.create({
      patientId: patients[i % patients.length]._id,
      items, subtotal, discount: 0, tax: 0, totalAmount: subtotal,
      paymentStatus: ['Paid', 'Paid', 'Pending', 'Partial'][i % 4],
      paymentMethod: ['Cash', 'Card', 'UPI'][i % 3],
      createdBy: admin._id,
      createdAt: d,
    });
  }
  console.log('✅ Bills created');

  // Attendance (last 7 days)
  const today = new Date();
  for (let day = 0; day < 7; day++) {
    const d = new Date(today); d.setDate(d.getDate() - day);
    const dateStr = d.toISOString().split('T')[0];
    for (const staff of staffList) {
      const status = ['Present', 'Present', 'Present', 'Present', 'Absent', 'Late'][Math.floor(Math.random() * 6)];
      try {
        await Attendance.create({ staffId: staff._id, date: dateStr, status, checkIn: '09:00', checkOut: '17:00', markedBy: admin._id });
      } catch (e) {}
    }
  }
  console.log('✅ Attendance created');

  console.log('\n🎉 Seed complete!\n');
  console.log('📧 Login Credentials:');
  console.log('   Admin:       admin@hms.com / admin123');
  console.log('   Doctor:      doctor@hms.com / doctor123');
  console.log('   Receptionist: receptionist@hms.com / recep123\n');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
