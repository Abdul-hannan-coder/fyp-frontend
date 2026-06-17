// Mock data for the Second Home UI (no backend calls — pure presentation data).

export const currentUsers = {
  admin: { name: "Ayesha Khan", email: "admin@secondhome.app", role: "Administrator" },
  warden: { name: "Bilal Ahmed", email: "warden@secondhome.app", role: "Warden" },
  student: { name: "Hamza Iqbal", email: "hamza@secondhome.app", role: "Resident", studentId: "STU-2026-184" },
};

// ── Admin overview ──
export const adminStats = [
  { label: "Total Residents", value: "486", delta: "+12", trend: "up", hint: "vs last month" },
  { label: "Occupancy", value: "92%", delta: "+4%", trend: "up", hint: "118 / 128 rooms" },
  { label: "Fee Collection", value: "₨ 4.82M", delta: "+8.1%", trend: "up", hint: "this term" },
  { label: "Open Tickets", value: "23", delta: "-6", trend: "down", hint: "7 high priority" },
];

export const revenueSeries = [
  { month: "Jan", collected: 3.2, pending: 0.9 },
  { month: "Feb", collected: 3.6, pending: 0.7 },
  { month: "Mar", collected: 4.1, pending: 0.8 },
  { month: "Apr", collected: 3.9, pending: 1.1 },
  { month: "May", collected: 4.5, pending: 0.6 },
  { month: "Jun", collected: 4.82, pending: 0.74 },
];

export const occupancyByBlock = [
  { block: "Block A", occupied: 38, total: 40 },
  { block: "Block B", occupied: 31, total: 36 },
  { block: "Block C", occupied: 28, total: 32 },
  { block: "Block D", occupied: 21, total: 20 },
];

export const feeBreakdown = [
  { name: "Hostel Rent", value: 62, fill: "var(--chart-1)" },
  { name: "Mess", value: 21, fill: "var(--chart-2)" },
  { name: "Security", value: 11, fill: "var(--chart-3)" },
  { name: "Other", value: 6, fill: "var(--chart-5)" },
];

export const recentUsers = [
  { name: "Sara Malik", email: "sara.m@uni.edu", role: "student", status: "pending", joined: "2h ago" },
  { name: "Omar Farooq", email: "omar.f@uni.edu", role: "student", status: "active", joined: "5h ago" },
  { name: "Zainab Ali", email: "zainab.a@uni.edu", role: "student", status: "active", joined: "1d ago" },
  { name: "Imran Shah", email: "imran.s@staff.edu", role: "staff", status: "active", joined: "2d ago" },
  { name: "Nida Hassan", email: "nida.h@uni.edu", role: "student", status: "blocked", joined: "3d ago" },
];

export const studentsTable = [
  { id: "STU-2026-184", name: "Hamza Iqbal", room: "A-204", block: "Block A", dept: "Computer Science", year: 2, fee: "paid", status: "active" },
  { id: "STU-2026-185", name: "Fatima Noor", room: "B-110", block: "Block B", dept: "Electrical Eng.", year: 3, fee: "partial", status: "active" },
  { id: "STU-2026-186", name: "Ali Raza", room: "A-208", block: "Block A", dept: "Business", year: 1, fee: "overdue", status: "active" },
  { id: "STU-2026-187", name: "Mariam Sheikh", room: "C-301", block: "Block C", dept: "Architecture", year: 4, fee: "paid", status: "active" },
  { id: "STU-2026-188", name: "Usman Tariq", room: "D-105", block: "Block D", dept: "Mechanical", year: 2, fee: "paid", status: "active" },
  { id: "STU-2026-189", name: "Hira Aslam", room: "B-115", block: "Block B", dept: "Medicine", year: 3, fee: "partial", status: "active" },
  { id: "STU-2026-190", name: "Bilal Yousaf", room: "—", block: "—", dept: "Law", year: 1, fee: "unpaid", status: "pending" },
];

// ── Warden / operations ──
export const wardenStats = [
  { label: "Pending Requests", value: "9", delta: "needs review", trend: "flat", hint: "allocation" },
  { label: "Present Today", value: "441", delta: "91%", trend: "up", hint: "of 486" },
  { label: "Visitors Inside", value: "14", delta: "live", trend: "flat", hint: "checked in" },
  { label: "Open Tickets", value: "23", delta: "7 high", trend: "down", hint: "support" },
];

export const allocationRequests = [
  { id: "REQ-3012", student: "Bilal Yousaf", type: "Standard Double", pref: "Block A", year: "2026-27", priority: "high", status: "pending", date: "Today" },
  { id: "REQ-3011", student: "Ayesha Siddiqui", type: "Premium Single", pref: "Block C", year: "2026-27", priority: "medium", status: "pending", date: "Today" },
  { id: "REQ-3010", student: "Kashif Mehmood", type: "Standard Double", pref: "Block B", year: "2026-27", priority: "low", status: "pending", date: "Yesterday" },
  { id: "REQ-3009", student: "Sana Javed", type: "Economy Triple", pref: "Block D", year: "2026-27", priority: "medium", status: "approved", date: "Yesterday" },
  { id: "REQ-3008", student: "Tariq Aziz", type: "Standard Double", pref: "Block A", year: "2026-27", priority: "low", status: "rejected", date: "2 days ago" },
];

export const attendanceToday = [
  { name: "Hamza Iqbal", room: "A-204", status: "present", time: "07:42" },
  { name: "Fatima Noor", room: "B-110", status: "present", time: "08:05" },
  { name: "Ali Raza", room: "A-208", status: "leave", time: "—" },
  { name: "Mariam Sheikh", room: "C-301", status: "present", time: "07:15" },
  { name: "Usman Tariq", room: "D-105", status: "absent", time: "—" },
  { name: "Hira Aslam", room: "B-115", status: "present", time: "08:31" },
];

export const visitorsToday = [
  { name: "Mr. Iqbal (Father)", host: "Hamza Iqbal", room: "A-204", purpose: "Family visit", in: "10:24", status: "checked_in" },
  { name: "Ms. Khan", host: "Fatima Noor", room: "B-110", purpose: "Document drop", in: "11:02", status: "checked_in" },
  { name: "A. Rehman", host: "Ali Raza", room: "A-208", purpose: "Family visit", in: "09:15", status: "checked_out" },
  { name: "S. Bukhari", host: "Mariam Sheikh", room: "C-301", purpose: "Guardian meeting", in: "12:40", status: "checked_in" },
];

export const tickets = [
  { id: "TKT-881", subject: "AC not cooling in A-204", category: "Facility", priority: "high", status: "open", by: "Hamza Iqbal", age: "2h" },
  { id: "TKT-880", subject: "Hot water issue, B wing", category: "Facility", priority: "high", status: "in_progress", by: "Fatima Noor", age: "5h" },
  { id: "TKT-879", subject: "Wi-Fi slow in C block", category: "Facility", priority: "medium", status: "open", by: "Mariam Sheikh", age: "1d" },
  { id: "TKT-878", subject: "Payment not reflecting", category: "Payment", priority: "high", status: "in_progress", by: "Ali Raza", age: "1d" },
  { id: "TKT-877", subject: "Room change request", category: "Allocation", priority: "low", status: "resolved", by: "Usman Tariq", age: "3d" },
];

// ── Student ──
export const studentFees = [
  { id: "PMT-5521", item: "Hostel Rent — Term 2", amount: "₨ 85,000", due: "Jun 30, 2026", status: "paid" },
  { id: "PMT-5522", item: "Mess Charges — June", amount: "₨ 12,500", due: "Jun 30, 2026", status: "pending" },
  { id: "PMT-5523", item: "Security Deposit", amount: "₨ 25,000", due: "Paid", status: "paid" },
  { id: "PMT-5524", item: "Maintenance Fee", amount: "₨ 3,000", due: "Jul 05, 2026", status: "pending" },
];

export const messMenu = [
  { day: "Monday", breakfast: "Paratha, Omelette, Chai", lunch: "Chicken Karahi, Rice, Salad", dinner: "Daal Mash, Roti, Raita" },
  { day: "Tuesday", breakfast: "Halwa Puri, Lassi", lunch: "Beef Pulao, Raita", dinner: "Vegetable, Roti, Custard" },
  { day: "Wednesday", breakfast: "Toast, Eggs, Tea", lunch: "Chicken Biryani, Salad", dinner: "Chana Daal, Roti" },
  { day: "Thursday", breakfast: "Aloo Paratha, Yogurt", lunch: "Fish, Rice, Lentils", dinner: "Qeema, Naan, Kheer" },
  { day: "Friday", breakfast: "Channay, Naan", lunch: "Mutton Pulao, Raita", dinner: "Mixed Veg, Roti" },
];

export const studentLeave = [
  { id: "LV-220", type: "Home visit", from: "Jul 12", to: "Jul 16", status: "approved" },
  { id: "LV-205", type: "Medical", from: "May 03", to: "May 05", status: "approved" },
  { id: "LV-198", type: "Personal", from: "Apr 20", to: "Apr 21", status: "rejected" },
];

export const studentVisitors = [
  { name: "Mr. Iqbal (Father)", date: "Jun 09, 2026", purpose: "Family visit", status: "checked_in" },
  { name: "Sister", date: "May 28, 2026", purpose: "Family visit", status: "checked_out" },
  { name: "Cousin", date: "May 10, 2026", purpose: "Drop documents", status: "checked_out" },
];

export const announcements = [
  { title: "Water supply maintenance — Block A", body: "Water will be unavailable on Jun 11 from 9am–1pm for tank cleaning.", category: "Maintenance", date: "Jun 08, 2026", pinned: true },
  { title: "Mess menu refresh for July", body: "New summer menu rolls out July 1st with more fresh options.", category: "Mess", date: "Jun 06, 2026", pinned: false },
  { title: "Semester fee deadline reminder", body: "Term 2 hostel fees are due by Jun 30. Pay online to avoid late charges.", category: "Finance", date: "Jun 05, 2026", pinned: false },
  { title: "Independence Day celebrations", body: "Join us in the common hall on Aug 14 for food, music and games.", category: "Event", date: "Jun 01, 2026", pinned: false },
];

export const studentAttendanceSeries = [
  { week: "W1", rate: 96 },
  { week: "W2", rate: 92 },
  { week: "W3", rate: 100 },
  { week: "W4", rate: 88 },
  { week: "W5", rate: 94 },
  { week: "W6", rate: 98 },
];

export const staffTable = [
  { name: "Bilal Ahmed", role: "Warden", dept: "Operations", shift: "Morning", status: "on_duty" },
  { name: "Rashid Khan", role: "Security", dept: "Security", shift: "Night", status: "on_duty" },
  { name: "Naseem Bibi", role: "Housekeeping", dept: "Facilities", shift: "Morning", status: "off" },
  { name: "Javed Akhtar", role: "Mess Manager", dept: "Mess", shift: "Full day", status: "on_duty" },
  { name: "Farah Deeba", role: "Accountant", dept: "Finance", shift: "Morning", status: "on_leave" },
];

export const assetsTable = [
  { code: "AST-1042", name: "Study Desk", category: "Furniture", room: "A-204", condition: "good", status: "in_use" },
  { code: "AST-1043", name: "Ceiling Fan", category: "Electrical", room: "A-204", condition: "fair", status: "maintenance" },
  { code: "AST-1044", name: "Wardrobe", category: "Furniture", room: "B-110", condition: "good", status: "in_use" },
  { code: "AST-1045", name: "Geyser", category: "Electrical", room: "Common", condition: "poor", status: "maintenance" },
  { code: "AST-1046", name: "Mattress", category: "Bedding", room: "C-301", condition: "good", status: "in_use" },
];

export const blocks = [
  { name: "Block A", floors: 4, rooms: 40, occupied: 38, type: "Boys" },
  { name: "Block B", floors: 4, rooms: 36, occupied: 31, type: "Boys" },
  { name: "Block C", floors: 3, rooms: 32, occupied: 28, type: "Girls" },
  { name: "Block D", floors: 2, rooms: 20, occupied: 21, type: "Girls" },
];
