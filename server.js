import express from 'express';
import session from 'express-session';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5002;

// Setup Database
const db = new Database('grievances.db', { verbose: console.log });

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS grievances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    constituency TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    photo_data TEXT DEFAULT '',
    photo_name TEXT DEFAULT '',
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const grievanceColumns = db.prepare("PRAGMA table_info(grievances)").all().map(column => column.name);
if (!grievanceColumns.includes('photo_data')) {
  db.exec("ALTER TABLE grievances ADD COLUMN photo_data TEXT DEFAULT ''");
}
if (!grievanceColumns.includes('photo_name')) {
  db.exec("ALTER TABLE grievances ADD COLUMN photo_name TEXT DEFAULT ''");
}

// Helper to make custom SVG letter avatars dynamically
const makeAvatarSvg = (name, index) => {
  const initial = name.charAt(0).toUpperCase();
  const colors = ["#C6151B", "#FECE08", "#1e293b", "#0ea5e9", "#10b981", "#8B0000", "#d97706", "#2563EB"];
  const bgColor = colors[index % colors.length];
  const textColor = bgColor === "#FECE08" ? "#000000" : "#FFFFFF";
  return 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="50" fill="${bgColor}"/><text x="50" y="58" font-family="sans-serif" font-weight="bold" font-size="34" fill="${textColor}" text-anchor="middle">${initial}</text></svg>`).toString('base64');
};

// Setup Wards & Ward Members Database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS wards (
    ward_number INTEGER PRIMARY KEY,
    ward_name TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ward_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ward_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL, -- 'Coordinator', 'Deputy Coordinator', 'Member'
    area TEXT NOT NULL,
    joining_year INTEGER NOT NULL,
    phone TEXT DEFAULT '',
    social_links TEXT DEFAULT '', -- JSON string
    photo_data TEXT DEFAULT '',
    FOREIGN KEY(ward_number) REFERENCES wards(ward_number) ON DELETE CASCADE
  );
`);

// Seed Wards and Ward Members if empty
const wardCount = db.prepare("SELECT COUNT(*) as count FROM wards").get().count;
if (wardCount === 0) {
  console.log("Wards database is empty. Seeding 15 wards and 150 members...");
  
  const insertWard = db.prepare("INSERT INTO wards (ward_number, ward_name, description) VALUES (?, ?, ?)");
  
  const wardNames = [
    "Sulur East", "Sulur West", "Kannampalayam East", "Kannampalayam West",
    "Kalangal", "Ravathur", "Peedampalli", "Pattanam",
    "Neelambur", "Muthugoundenpudur", "Kaniyur", "Arasur",
    "Thennampalayam", "Kaduvettipalayam", "Karanampettai"
  ];
  
  for (let i = 1; i <= 15; i++) {
    insertWard.run(i, `${wardNames[i-1]} Ward`, `Dedicated to local public services, water supply, street lighting, and civic development in ${wardNames[i-1]} area.`);
  }

  const insertMember = db.prepare(`
    INSERT INTO ward_members (ward_number, name, position, area, joining_year, phone, social_links, photo_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const firstNames = [
    "Anand", "Balaji", "Chandra", "Devan", "Elango", "Ganesan", "Hari", "Ilango", "Jeeva", "Karthik",
    "Loganathan", "Mani", "Natarajan", "Prabhu", "Ramesh", "Suresh", "Thangam", "Uday", "Vijay", "Yuvraj",
    "Arun", "Babu", "Dinesh", "Gokul", "Kavin", "Manoj", "Naveen", "Prakash", "Sanjay", "Vignesh",
    "Abirami", "Deepa", "Gayathri", "Indhu", "Janani", "Kavitha", "Meena", "Nandhini", "Priya", "Sandhya",
    "Uma", "Vidya", "Saritha", "Revathi", "Kokila", "Anitha", "Bhuvanesh", "Chelladurai", "Dharmaraj", "Eswaran"
  ];

  const lastNames = [
    "Kumar", "Rajan", "Murugan", "Samy", "Gounder", "Dhar", "Prasad", "Lingam", "Vel", "Senthil",
    "Nath", "Pandi", "Selvam", "Devan", "Mani", "Durai", "Kannan", "Sundaram", "Sekar", "Babu",
    "Karthi", "Arasu", "Balan", "Chidambaram", "Moorthy", "Naicker", "Pillai", "Srinivasan", "Venkatesh", "Veeran"
  ];

  const positions = ["Coordinator", "Deputy Coordinator", "Member", "Member", "Member", "Member", "Member", "Member", "Member", "Member"];

  let nameIndex = 0;
  for (let w = 1; w <= 15; w++) {
    const wardName = wardNames[w-1];
    for (let m = 0; m < 10; m++) {
      const position = positions[m];
      
      const fn = firstNames[nameIndex % firstNames.length];
      const ln = lastNames[nameIndex % lastNames.length];
      const memberName = `${fn} ${ln}`;
      nameIndex++;

      const area = `${wardName} Sector ${m + 1}`;
      const joiningYear = 2020 + (nameIndex % 6);
      const phone = `+91 9${String(nameIndex * 12345).padStart(9, '0').slice(-9)}`;
      const socials = JSON.stringify({
        facebook: `https://facebook.com/tvk.${fn.toLowerCase()}`,
        instagram: `https://instagram.com/tvk.${fn.toLowerCase()}`,
        twitter: `https://twitter.com/tvk.${fn.toLowerCase()}`
      });
      const photo = makeAvatarSvg(memberName, nameIndex);

      insertMember.run(w, memberName, position, area, joiningYear, phone, socials, photo);
    }
  }

  console.log("Successfully seeded 15 wards and 150 members!");
}

// Seed Database with Sample Grievances if empty
const countStmt = db.prepare("SELECT COUNT(*) as count FROM grievances");
const { count } = countStmt.get();
if (count === 0) {
  console.log("Database is empty. Seeding realistic sample grievances...");
  
  const insertStmt = db.prepare(`
    INSERT INTO grievances (name, phone, constituency, category, description, photo_data, photo_name, status, admin_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayIso = new Date().toISOString();
  
  // High quality illustrative SVGs base64 encoded for universal browser compatibility
  const svgRoads = 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%"><rect width="100%" height="100%" fill="#334155"/><path d="M0 160h400v40H0z" fill="#1e293b"/><circle cx="120" cy="160" r="25" fill="#ef4444" opacity="0.8"/><path d="M120 145l15 30h-30z" fill="#fece08"/><rect x="190" y="80" width="120" height="80" rx="8" fill="#475569"/><path d="M210 100h80v10h-80zm0 20h60v10h-60z" fill="#94a3b8"/><text x="20" y="50" fill="#fece08" font-family="sans-serif" font-weight="bold" font-size="20">ROADS &amp; INFRASTRUCTURE</text><path d="M80 160c5-10 15-10 20 0s15 10 20 0" stroke="#f43f5e" stroke-width="4" fill="none"/></svg>`).toString('base64');
  const svgWater = 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%"><rect width="100%" height="100%" fill="#0ea5e9"/><circle cx="200" cy="90" r="45" fill="#38bdf8" opacity="0.6"/><path d="M200 45v90M165 75h70" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/><circle cx="200" cy="140" r="12" fill="#ffffff"/><circle cx="230" cy="160" r="8" fill="#ffffff" opacity="0.8"/><text x="20" y="50" fill="#fece08" font-family="sans-serif" font-weight="bold" font-size="20">WATER SUPPLY UPDATES</text></svg>`).toString('base64');
  const svgPower = 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%"><rect width="100%" height="100%" fill="#1e1b4b"/><path d="M200 20v100" stroke="#94a3b8" stroke-width="6"/><circle cx="200" cy="120" r="25" fill="#fef08a" opacity="0.8"/><circle cx="200" cy="120" r="40" fill="#fef08a" opacity="0.3"/><path d="M170 120h60M180 130h40M190 140h20" stroke="#fece08" stroke-width="4"/><text x="20" y="50" fill="#fece08" font-family="sans-serif" font-weight="bold" font-size="20">POWER &amp; STREETLIGHTS</text></svg>`).toString('base64');
  const svgClean = 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="100%" height="100%"><rect width="100%" height="100%" fill="#10b981"/><rect x="150" y="70" width="100" height="90" rx="10" fill="#059669"/><path d="M130 70h140" stroke="#34d399" stroke-width="8" stroke-linecap="round"/><circle cx="200" cy="115" r="18" fill="#ffffff" opacity="0.25"/><text x="20" y="50" fill="#fece08" font-family="sans-serif" font-weight="bold" font-size="20">SANITATION &amp; CLEANLINESS</text></svg>`).toString('base64');

  // Sample 1: Today's pending road issue
  insertStmt.run(
    "Aravind Swamy",
    "9876543210",
    "Nilakottai Town",
    "roads",
    "Severe potholes and water logging near Nilakottai main junction causing heavy traffic congestion during school hours.",
    svgRoads,
    "roads_potholes.svg",
    "Pending",
    "",
    todayIso
  );

  // Sample 2: Today's pending water issue
  insertStmt.run(
    "Meenakshi Sundaram",
    "9123456789",
    "Ward 4, Batlagundu",
    "water",
    "Extremely low pressure in the drinking water supply pipeline for the past three consecutive days.",
    svgWater,
    "water_low_pressure.svg",
    "Pending",
    "",
    todayIso
  );

  // Sample 3: Today's in-progress electricity issue
  insertStmt.run(
    "Kathiravan P.",
    "9443218765",
    "Gandhi Nagar High Street",
    "electricity",
    "Major streetlights from Gandhi Nagar junction to Main Road are completely out of service, causing safety hazards for pedestrians at night.",
    svgPower,
    "streetlights_broken.svg",
    "In Progress",
    "MLA office has registered the complaint with TNEB. Verification complete, replacement bulbs and wiring crews are scheduled for dispatch.",
    todayIso
  );

  // Sample 4: Resolved Sanitation issue
  insertStmt.run(
    "Rajesh Kumar",
    "9500123456",
    "Nilakottai Bus Stand Area",
    "sanitation",
    "Heavy accumulation of solid waste and garbage near the central bus terminal attracting stray dogs and generating foul odor.",
    svgClean,
    "bus_stand_garbage.svg",
    "Resolved",
    "Sanitation crews were deployed immediately with municipal waste trucks. The entire dump has been cleared, bleached, and sanitized. Two new high-capacity trash bins have been installed with daily morning clearance schedules.",
    "2026-05-30T10:00:00.000Z"
  );

  // Sample 5: Resolved Water issue
  insertStmt.run(
    "Devi Karumariamman",
    "9884567123",
    "Anna Nagar West",
    "water",
    "Major fracture in the municipal drinking water supply line resulting in massive wastage and low pressure to adjacent households.",
    svgWater,
    "water_pipeline_leak.svg",
    "Resolved",
    "Highways and municipal water engineers located the pipe joint fracture. Plumber units sealed and replaced the broken pipe segment. Normal pressure was restored, and leakage has been fully resolved.",
    "2026-05-29T14:30:00.000Z"
  );

  console.log("Seeding complete. Added 5 premium grievances with SVGs!");
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: 'tvk-digital-super-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd, // True on Render HTTPS
    sameSite: isProd ? 'none' : 'lax', // Permissive cross-origin session on Vercel/Render
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Serve static built assets from Vite in production
app.use(express.static(path.join(__dirname, 'dist')));

// Admin credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123';

let instagramCache = {
  fetchedAt: 0,
  data: []
};

// Middleware to check if logged in
const requireAuth = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }
};

// API: Submit Grievance
app.post('/api/grievances', (req, res) => {
  try {
    const { name, phone, constituency, category, description, photoData, photoName } = req.body;
    
    if (!name || !phone || !constituency || !category || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (photoData && !String(photoData).startsWith('data:image/')) {
      return res.status(400).json({ success: false, message: 'Only image uploads are allowed.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO grievances (name, phone, constituency, category, description, photo_data, photo_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      name,
      phone,
      constituency,
      category,
      description,
      photoData || '',
      photoName || ''
    );
    const id = result.lastInsertRowid;
    
    // Generate an elegant, tracking ID
    const trackId = `TVK-GR-2026-${String(id).padStart(4, '0')}`;

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      trackId,
      data: { id, name, constituency, category, status: 'Pending' }
    });
  } catch (error) {
    console.error('Error submitting grievance:', error);
    res.status(500).json({ success: false, message: 'Failed to save grievance. Database error.' });
  }
});

// API: Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`[Admin Login Attempt] Username: "${username}", Password: "${password}"`);
  
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// API: Admin Logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logout successful' });
  });
});

// API: Admin Check Status
app.get('/api/admin/status', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ success: true, loggedIn: true });
  } else {
    res.json({ success: true, loggedIn: false });
  }
});

// API: Instagram media feed for development page
app.get('/api/instagram/media', async (req, res) => {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const instagramUserId = process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !instagramUserId) {
    return res.json({
      success: false,
      message: 'Instagram API is not configured. Add INSTAGRAM_USER_ID and INSTAGRAM_ACCESS_TOKEN.',
      data: []
    });
  }

  const cacheAge = Date.now() - instagramCache.fetchedAt;
  if (instagramCache.data.length > 0 && cacheAge < 10 * 60 * 1000) {
    return res.json({ success: true, source: 'cache', data: instagramCache.data });
  }

  try {
    const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
    const graphUrl = new URL(`https://graph.facebook.com/v20.0/${instagramUserId}/media`);
    graphUrl.searchParams.set('fields', fields);
    graphUrl.searchParams.set('limit', '8');
    graphUrl.searchParams.set('access_token', accessToken);

    const response = await fetch(graphUrl);
    const result = await response.json();

    if (!response.ok) {
      console.error('Instagram API error:', result);
      return res.status(502).json({
        success: false,
        message: result.error?.message || 'Instagram API request failed.',
        data: []
      });
    }

    const media = (result.data || []).map(item => ({
      id: item.id,
      caption: item.caption || 'Instagram update',
      mediaType: item.media_type,
      mediaUrl: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
      permalink: item.permalink,
      timestamp: item.timestamp
    })).filter(item => item.mediaUrl && item.permalink);

    instagramCache = {
      fetchedAt: Date.now(),
      data: media
    };

    res.json({ success: true, source: 'instagram', data: media });
  } catch (error) {
    console.error('Error fetching Instagram media:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch Instagram media.', data: [] });
  }
});

// Helper to mask names for public privacy
function maskName(name) {
  if (!name) return 'Anonymous';
  const parts = name.trim().split(/\s+/);
  return parts.map(part => {
    if (part.length <= 1) return part;
    if (part.length === 2) return part[0] + '*';
    return part[0] + '*'.repeat(part.length - 2) + part[part.length - 1];
  }).join(' ');
}

// API: Fetch All Public Grievances (Omits sensitive phone data and masks name)
app.get('/api/public/grievances', (req, res) => {
  try {
    const grievances = db.prepare('SELECT id, name, constituency, category, description, photo_data, photo_name, status, admin_notes, created_at FROM grievances ORDER BY created_at DESC').all();
    const publicGrievances = grievances.map(g => ({
      ...g,
      name: maskName(g.name)
    }));
    res.json({ success: true, data: publicGrievances });
  } catch (error) {
    console.error('Error fetching public grievances:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Fetch All Grievances (Admin only)
app.get('/api/admin/grievances', requireAuth, (req, res) => {
  try {
    const grievances = db.prepare('SELECT * FROM grievances ORDER BY created_at DESC').all();
    res.json({ success: true, data: grievances });
  } catch (error) {
    console.error('Error fetching grievances:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Update Grievance Status & Notes (Admin only)
app.put('/api/admin/grievances/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updateStmt = db.prepare(`
      UPDATE grievances 
      SET status = ?, admin_notes = ?
      WHERE id = ?
    `);

    const result = updateStmt.run(status, admin_notes || '', id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    res.json({ success: true, message: 'Grievance updated successfully' });
  } catch (error) {
    console.error('Error updating grievance:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Delete Grievance (Admin only)
app.delete('/api/admin/grievances/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM grievances WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    res.json({ success: true, message: 'Grievance deleted successfully' });
  } catch (error) {
    console.error('Error deleting grievance:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Fetch All Public Wards (Returns wards, dynamic member counts, and coordinator details)
app.get('/api/public/wards', (req, res) => {
  try {
    const wards = db.prepare('SELECT * FROM wards ORDER BY ward_number ASC').all();
    const result = wards.map(ward => {
      const count = db.prepare('SELECT COUNT(*) as count FROM ward_members WHERE ward_number = ?').get(ward.ward_number).count;
      const coordinator = db.prepare("SELECT name, photo_data FROM ward_members WHERE ward_number = ? AND position = 'Coordinator' LIMIT 1").get(ward.ward_number);
      return {
        ...ward,
        total_members: count,
        coordinator_name: coordinator ? coordinator.name : 'Not Assigned',
        coordinator_photo: coordinator ? coordinator.photo_data : ''
      };
    });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching public wards:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Fetch All Members of a specific Ward
app.get('/api/public/wards/:id/members', (req, res) => {
  try {
    const wardNumber = parseInt(req.params.id, 10);
    if (isNaN(wardNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid ward number' });
    }
    const members = db.prepare("SELECT * FROM ward_members WHERE ward_number = ? ORDER BY CASE WHEN position = 'Coordinator' THEN 1 WHEN position = 'Deputy Coordinator' THEN 2 ELSE 3 END, name ASC").all(wardNumber);
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching ward members:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Fetch All Ward Members (Admin only)
app.get('/api/admin/members', requireAuth, (req, res) => {
  try {
    const members = db.prepare(`
      SELECT m.*, w.ward_name 
      FROM ward_members m 
      JOIN wards w ON m.ward_number = w.ward_number 
      ORDER BY m.ward_number ASC, 
               CASE WHEN m.position = 'Coordinator' THEN 1 
                    WHEN m.position = 'Deputy Coordinator' THEN 2 
                    ELSE 3 END, 
               m.name ASC
    `).all();
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching admin ward members:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Add Ward Member (Admin only)
app.post('/api/admin/members', requireAuth, (req, res) => {
  try {
    const { ward_number, name, position, area, joining_year, phone, social_links, photo_data } = req.body;
    
    if (!ward_number || !name || !position || !area || !joining_year) {
      return res.status(400).json({ success: false, message: 'Ward number, name, position, area, and joining year are required.' });
    }

    const wardNum = parseInt(ward_number, 10);
    const joinYr = parseInt(joining_year, 10);
    if (isNaN(wardNum) || isNaN(joinYr)) {
      return res.status(400).json({ success: false, message: 'Invalid ward number or joining year.' });
    }

    // Default photo if none provided
    let photo = photo_data || '';
    if (!photo) {
      const randomIndex = Math.floor(Math.random() * 100);
      photo = makeAvatarSvg(name, randomIndex);
    }

    const socials = typeof social_links === 'string' ? social_links : JSON.stringify(social_links || {});

    const insertStmt = db.prepare(`
      INSERT INTO ward_members (ward_number, name, position, area, joining_year, phone, social_links, photo_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(wardNum, name, position, area, joinYr, phone || '', socials, photo);
    
    res.status(201).json({
      success: true,
      message: 'Ward member added successfully',
      data: { id: result.lastInsertRowid, ward_number: wardNum, name, position }
    });
  } catch (error) {
    console.error('Error adding ward member:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Update Ward Member (Admin only)
app.put('/api/admin/members/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { ward_number, name, position, area, joining_year, phone, social_links, photo_data } = req.body;

    if (!ward_number || !name || !position || !area || !joining_year) {
      return res.status(400).json({ success: false, message: 'Ward number, name, position, area, and joining year are required.' });
    }

    const wardNum = parseInt(ward_number, 10);
    const joinYr = parseInt(joining_year, 10);
    if (isNaN(wardNum) || isNaN(joinYr)) {
      return res.status(400).json({ success: false, message: 'Invalid ward number or joining year.' });
    }

    const socials = typeof social_links === 'string' ? social_links : JSON.stringify(social_links || {});

    // If update provides a new photo_data, we use it; otherwise we keep the old one
    let result;
    if (photo_data) {
      const updateStmt = db.prepare(`
        UPDATE ward_members 
        SET ward_number = ?, name = ?, position = ?, area = ?, joining_year = ?, phone = ?, social_links = ?, photo_data = ?
        WHERE id = ?
      `);
      result = updateStmt.run(wardNum, name, position, area, joinYr, phone || '', socials, photo_data, id);
    } else {
      const updateStmt = db.prepare(`
        UPDATE ward_members 
        SET ward_number = ?, name = ?, position = ?, area = ?, joining_year = ?, phone = ?, social_links = ?
        WHERE id = ?
      `);
      result = updateStmt.run(wardNum, name, position, area, joinYr, phone || '', socials, id);
    }

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Ward member not found' });
    }

    res.json({ success: true, message: 'Ward member updated successfully' });
  } catch (error) {
    console.error('Error updating ward member:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// API: Delete Ward Member (Admin only)
app.delete('/api/admin/members/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const deleteStmt = db.prepare('DELETE FROM ward_members WHERE id = ?');
    const result = deleteStmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Ward member not found' });
    }

    res.json({ success: true, message: 'Ward member deleted successfully' });
  } catch (error) {
    console.error('Error deleting ward member:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Wildcard: serve Vite frontend pages in production (use app.use to avoid path-to-regexp v8 issues)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const cleanPath = req.path.replace(/\/$/, '');
  if (cleanPath === '' || cleanPath === '/') {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    const hasExtension = path.extname(cleanPath) !== '';
    const fileToServe = hasExtension
      ? path.join(__dirname, 'dist', cleanPath)
      : path.join(__dirname, 'dist', `${cleanPath}.html`);

    res.sendFile(fileToServe, (err) => {
      if (err) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
      }
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
