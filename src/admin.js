import './style.css';
import './admin.css';
import {
  createIcons,
  ShieldCheck,
  Shield,
  Users,
  Clock,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Eye,
  Inbox,
  PlusCircle,
  Layout,
  Search,
  User,
  Upload,
  Edit3,
  Trash2
} from 'lucide';

// Initialize Lucide Icons
function initIcons() {
  createIcons({
    icons: {
      ShieldCheck,
      Shield,
      Users,
      Clock,
      BrainCircuit,
      CheckCircle2,
      ClipboardList,
      Eye,
      Inbox,
      PlusCircle,
      Layout,
      Search,
      User,
      Upload,
      Edit3,
      Trash2
    }
  });
}

// Variables & State
const API_BASE = import.meta.env.VITE_API_BASE || '';

let allGrievances = [];
let currentGrievance = null;
let allMembers = [];
let allWards = [];
let memberPhotoBase64 = '';

// DOM Elements - Auth & Grievances
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const refreshBtn = document.getElementById('refresh-btn');
const grievancesTbody = document.getElementById('grievances-tbody');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statProgress = document.getElementById('stat-progress');
const statResolved = document.getElementById('stat-resolved');

// Filter Elements
const searchInput = document.getElementById('search-input');
const filterStatus = document.getElementById('filter-status');
const filterCategory = document.getElementById('filter-category');

// Grievances Modal Elements
const detailsModal = document.getElementById('details-modal');
const closeModalBtn = document.querySelector('.close-modal');
const updateForm = document.getElementById('update-grievance-form');
const deleteGrievanceBtn = document.getElementById('delete-grievance-btn');

// DOM Elements - Tab Switching
const tabBtnGrievances = document.getElementById('tab-btn-grievances');
const tabBtnWards = document.getElementById('tab-btn-wards');
const tabContentGrievances = document.getElementById('tab-content-grievances');
const tabContentWards = document.getElementById('tab-content-wards');

// DOM Elements - Ward Members Management
const addMemberBtn = document.getElementById('add-member-btn');
const membersTbody = document.getElementById('members-tbody');
const memberSearchKeyword = document.getElementById('member-search-keyword');
const memberFilterWard = document.getElementById('member-filter-ward');
const memberFilterPosition = document.getElementById('member-filter-position');

// DOM Elements - Member Modal & Form
const memberModal = document.getElementById('member-modal');
const memberModalTitle = document.getElementById('member-modal-title');
const closeMemberModal = document.getElementById('close-member-modal');
const memberForm = document.getElementById('member-form');
const memberDbId = document.getElementById('member-db-id');
const memberName = document.getElementById('member-name');
const memberWard = document.getElementById('member-ward');
const memberPosition = document.getElementById('member-position');
const memberArea = document.getElementById('member-area');
const memberYear = document.getElementById('member-year');
const memberPhone = document.getElementById('member-phone');
const memberFb = document.getElementById('member-fb');
const memberInsta = document.getElementById('member-insta');
const memberTwitter = document.getElementById('member-twitter');

const memberPhotoFile = document.getElementById('member-photo-file');
const uploadMemberPhotoBtn = document.getElementById('upload-member-photo-btn');
const clearMemberPhotoBtn = document.getElementById('clear-member-photo-btn');
const memberPhotoPreviewImg = document.getElementById('member-photo-preview-img');
const memberPhotoPlaceholder = document.getElementById('member-photo-placeholder');
const cancelMemberModalBtn = document.getElementById('cancel-member-modal-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  checkAuthStatus();
  setupEventListeners();
  setupPhotoUpload();
});

// Event Listeners setup
function setupEventListeners() {
  // Login Form
  loginForm.addEventListener('submit', handleLogin);

  // Logout Button
  logoutBtn.addEventListener('click', handleLogout);

  // Refresh Button
  refreshBtn.addEventListener('click', fetchGrievances);

  // Filters Event Listeners (Real-time Filtering for Grievances)
  searchInput.addEventListener('input', renderTable);
  filterStatus.addEventListener('change', renderTable);
  filterCategory.addEventListener('change', renderTable);

  // Grievance Details Modal Close
  closeModalBtn.addEventListener('click', () => {
    detailsModal.classList.remove('active');
  });

  // Update Form for Grievance
  updateForm.addEventListener('submit', handleUpdateGrievance);

  // Delete Grievance Button
  deleteGrievanceBtn.addEventListener('click', handleDeleteGrievance);

  // Tab Switcher
  tabBtnGrievances.addEventListener('click', () => {
    tabBtnGrievances.classList.add('active');
    tabBtnWards.classList.remove('active');
    tabContentGrievances.classList.add('active');
    tabContentWards.classList.remove('active');
    fetchGrievances();
  });

  tabBtnWards.addEventListener('click', () => {
    tabBtnWards.classList.add('active');
    tabBtnGrievances.classList.remove('active');
    tabContentWards.classList.add('active');
    tabContentGrievances.classList.remove('active');
    fetchWards();
    fetchMembers();
  });

  // Wards & Members Event Listeners
  memberSearchKeyword.addEventListener('input', renderMembersTable);
  memberFilterWard.addEventListener('change', renderMembersTable);
  memberFilterPosition.addEventListener('change', renderMembersTable);

  // Add Member Modal trigger
  addMemberBtn.addEventListener('click', openAddMemberModal);

  // Member Modal Close
  closeMemberModal.addEventListener('click', () => {
    memberModal.classList.remove('active');
  });

  cancelMemberModalBtn.addEventListener('click', () => {
    memberModal.classList.remove('active');
  });

  // Member Form Submit
  memberForm.addEventListener('submit', handleMemberSubmit);

  // Window click to close modals
  window.addEventListener('click', (e) => {
    if (e.target === detailsModal) {
      detailsModal.classList.remove('active');
    }
    if (e.target === memberModal) {
      memberModal.classList.remove('active');
    }
  });
}

// Authentication Check Status
async function checkAuthStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/admin/status`, {
      credentials: 'include'
    });
    const data = await res.json();

    if (data.loggedIn) {
      showDashboard();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
    showLogin();
  }
}

// Show Login Page
function showLogin() {
  loginContainer.style.display = 'flex';
  dashboardContainer.style.display = 'none';
  logoutBtn.style.display = 'none';
  loginError.style.display = 'none';
  usernameInput.value = '';
  passwordInput.value = '';
}

// Show Dashboard Page
function showDashboard() {
  loginContainer.style.display = 'none';
  dashboardContainer.style.display = 'block';
  logoutBtn.style.display = 'block';
  fetchGrievances();
}

// Handle Login Form Submission
async function handleLogin(e) {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const submitBtn = document.getElementById('login-submit-btn');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Authenticating...';
  loginError.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    });

    const data = await res.json();

    if (data.success) {
      showDashboard();
    } else {
      showLoginError(data.message || 'Invalid username or password');
    }
  } catch (error) {
    console.error('Login error:', error);
    showLoginError('Network error. Make sure backend is running.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Authenticate & Enter';
  }
}

// Show login error box
function showLoginError(msg) {
  loginError.textContent = msg;
  loginError.style.display = 'block';
}

// Handle Logout action
async function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;

  try {
    await fetch(`${API_BASE}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    showLogin();
  } catch (error) {
    console.error('Logout error:', error);
    showLogin();
  }
}

// Fetch grievances from server
async function fetchGrievances() {
  grievancesTbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="8">
        <div class="table-loading">
          <span class="spinner"></span> Syncing database files...
        </div>
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`${API_BASE}/api/admin/grievances`, {
      credentials: 'include'
    });
    if (res.status === 401) {
      showLogin();
      return;
    }

    const data = await res.json();

    if (data.success) {
      allGrievances = data.data;
      updateStats();
      renderTable();
    } else {
      console.error('Failed to load grievances:', data.message);
    }
  } catch (error) {
    console.error('Error fetching grievances:', error);
  }
}

// Update Stats widgets
function updateStats() {
  const total = allGrievances.length;
  const pending = allGrievances.filter(g => g.status === 'Pending').length;
  const progress = allGrievances.filter(g => g.status === 'In Progress').length;
  const resolved = allGrievances.filter(g => g.status === 'Resolved').length;

  statTotal.textContent = total;
  statPending.textContent = pending;
  statProgress.textContent = progress;
  statResolved.textContent = resolved;
}

// Render dynamic grievances table with clientside filtering
function renderTable() {
  const searchKeyword = searchInput.value.trim().toLowerCase();
  const statusVal = filterStatus.value;
  const categoryVal = filterCategory.value;

  const filtered = allGrievances.filter(g => {
    // Search filter
    const matchesSearch =
      g.name.toLowerCase().includes(searchKeyword) ||
      g.phone.includes(searchKeyword) ||
      g.constituency.toLowerCase().includes(searchKeyword) ||
      `TVK-GR-2026-${String(g.id).padStart(4, '0')}`.toLowerCase().includes(searchKeyword) ||
      g.description.toLowerCase().includes(searchKeyword);

    // Status filter
    const matchesStatus = statusVal === 'all' || g.status === statusVal;

    // Category filter
    const matchesCategory = categoryVal === 'all' || g.category === categoryVal;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (filtered.length === 0) {
    grievancesTbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <p>No queries match your search or filter settings.</p>
          </div>
        </td>
      </tr>
    `;
    initIcons();
    return;
  }

  grievancesTbody.innerHTML = filtered.map(g => {
    const trackId = `TVK-GR-2026-${String(g.id).padStart(4, '0')}`;
    const dateStr = new Date(g.created_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusClass = g.status.toLowerCase().replace(' ', '');
    const categoryName = g.category.charAt(0).toUpperCase() + g.category.slice(1);

    return `
      <tr>
        <td><span class="track-id-badge">${trackId}</span></td>
        <td><strong>${escapeHtml(g.name)}</strong></td>
        <td>
          <a href="tel:${escapeHtml(g.phone)}" style="text-decoration:none; color:inherit;">
            ${escapeHtml(g.phone)}
          </a>
        </td>
        <td>${escapeHtml(g.constituency)}</td>
        <td><span style="font-weight:600; color:#555;">${escapeHtml(categoryName)}</span></td>
        <td style="font-size:0.85rem; color:#666;">${dateStr}</td>
        <td>
          <span class="status-badge ${statusClass}">
            ${g.status}
          </span>
        </td>
        <td>
          <button class="dashboard-btn btn-secondary view-details-btn" data-id="${g.id}" style="padding: 6px 12px; font-size: 0.8rem;">
            <i data-lucide="eye"></i> View Detail
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach Click events to the dynamically rendered View Detail buttons
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dbId = parseInt(e.currentTarget.getAttribute('data-id'));
      openDetailsModal(dbId);
    });
  });

  initIcons();
}

// Open Details Modal and populate details
function openDetailsModal(id) {
  currentGrievance = allGrievances.find(g => g.id === id);
  if (!currentGrievance) return;

  const trackId = `TVK-GR-2026-${String(currentGrievance.id).padStart(4, '0')}`;

  document.getElementById('modal-track-id').textContent = trackId;
  document.getElementById('modal-db-id').value = currentGrievance.id;
  document.getElementById('modal-name').textContent = currentGrievance.name;
  document.getElementById('modal-phone').textContent = currentGrievance.phone;
  document.getElementById('modal-constituency').textContent = currentGrievance.constituency;

  const categoryName = currentGrievance.category.charAt(0).toUpperCase() + currentGrievance.category.slice(1);
  document.getElementById('modal-category').textContent = categoryName;

  const dateStr = new Date(currentGrievance.created_at).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  document.getElementById('modal-date').textContent = dateStr;
  document.getElementById('modal-description').textContent = currentGrievance.description;

  const photoBox = document.getElementById('modal-photo-box');
  const photoImg = document.getElementById('modal-photo');
  const photoLink = document.getElementById('modal-photo-link');
  const photoName = document.getElementById('modal-photo-name');

  if (currentGrievance.photo_data) {
    photoImg.src = currentGrievance.photo_data;
    photoLink.href = currentGrievance.photo_data;
    photoName.textContent = currentGrievance.photo_name || 'Uploaded grievance photo';
    photoBox.hidden = false;
  } else {
    photoImg.removeAttribute('src');
    photoLink.href = '#';
    photoName.textContent = '';
    photoBox.hidden = true;
  }

  // Inputs
  document.getElementById('modal-status').value = currentGrievance.status;
  document.getElementById('modal-notes').value = currentGrievance.admin_notes || '';

  // Activate modal view
  detailsModal.classList.add('active');
  initIcons();
}

// Handle updates to Status and Notes
async function handleUpdateGrievance(e) {
  e.preventDefault();

  const id = document.getElementById('modal-db-id').value;
  const status = document.getElementById('modal-status').value;
  const admin_notes = document.getElementById('modal-notes').value;

  const submitBtn = updateForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving Updates...';

  try {
    const res = await fetch(`${API_BASE}/api/admin/grievances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes }),
      credentials: 'include'
    });

    const data = await res.json();

    if (data.success) {
      detailsModal.classList.remove('active');
      fetchGrievances();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error updating grievance:', error);
    alert('Failed to update submission records due to network errors.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Updates';
  }
}

// Handle Delete grievance
async function handleDeleteGrievance() {
  const id = document.getElementById('modal-db-id').value;
  const trackId = document.getElementById('modal-track-id').textContent;

  if (!confirm(`Are you absolutely sure you want to delete query ${trackId}? This cannot be undone.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/grievances/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const data = await res.json();

    if (data.success) {
      detailsModal.classList.remove('active');
      fetchGrievances();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error deleting grievance:', error);
    alert('Failed to delete query record due to network errors.');
  }
}

// ── Wards & Members Administrative Logic ──

// Fetch Wards
async function fetchWards() {
  try {
    const res = await fetch(`${API_BASE}/api/public/wards`);
    const data = await res.json();
    if (data.success) {
      allWards = data.data;

      // Populate filters
      memberFilterWard.innerHTML = '<option value="all">All Wards</option>' +
        allWards.map(w => `<option value="${w.ward_number}">Ward ${w.ward_number} - ${escapeHtml(w.ward_name)}</option>`).join('');

      // Populate modal dropdown
      memberWard.innerHTML = allWards.map(w => `<option value="${w.ward_number}">Ward ${w.ward_number} - ${escapeHtml(w.ward_name)}</option>`).join('');
    }
  } catch (error) {
    console.error('Error fetching wards:', error);
  }
}

// Fetch Members
async function fetchMembers() {
  membersTbody.innerHTML = `
    <tr class="loading-row">
      <td colspan="8">
        <div class="table-loading">
          <span class="spinner"></span> Loading ward directory database...
        </div>
      </td>
    </tr>
  `;
  try {
    const res = await fetch(`${API_BASE}/api/admin/members`, {
      credentials: 'include'
    });
    if (res.status === 401) {
      showLogin();
      return;
    }
    const data = await res.json();
    if (data.success) {
      allMembers = data.data;
      renderMembersTable();
    }
  } catch (error) {
    console.error('Error fetching members:', error);
  }
}

// Render dynamic members table
function renderMembersTable() {
  const keyword = memberSearchKeyword.value.trim().toLowerCase();
  const wardVal = memberFilterWard.value;
  const positionVal = memberFilterPosition.value;

  const filtered = allMembers.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(keyword) ||
      m.area.toLowerCase().includes(keyword) ||
      (m.phone && m.phone.includes(keyword));
    const matchesWard = wardVal === 'all' || m.ward_number === parseInt(wardVal, 10);
    const matchesPosition = positionVal === 'all' || m.position === positionVal;
    return matchesSearch && matchesWard && matchesPosition;
  });

  if (filtered.length === 0) {
    membersTbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <i data-lucide="inbox"></i>
            <p>No members match your search or filter settings.</p>
          </div>
        </td>
      </tr>
    `;
    initIcons();
    return;
  }

  membersTbody.innerHTML = filtered.map(m => {
    let tagClass = 'member';
    if (m.position === 'Coordinator') tagClass = 'coordinator';
    else if (m.position === 'Deputy Coordinator') tagClass = 'deputy';

    return `
      <tr>
        <td style="width: 60px; text-align: center;">
          <img class="member-avatar-admin" src="${m.photo_data || ''}" alt="${escapeHtml(m.name)}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI1MCIgZmlsbD0iI2U4ZThlOCIvPjwvc3ZnPg=='" />
        </td>
        <td><strong>${escapeHtml(m.name)}</strong></td>
        <td><span class="position-tag ${tagClass}">${escapeHtml(m.position)}</span></td>
        <td>Ward ${m.ward_number} - <span style="font-weight:600;">${escapeHtml(m.ward_name)}</span></td>
        <td>${escapeHtml(m.area)}</td>
        <td>${m.joining_year}</td>
        <td>${escapeHtml(m.phone || 'No phone')}</td>
        <td>
          <div class="action-buttons-cell">
            <button class="action-btn-small edit edit-member-btn" data-id="${m.id}">
              <i data-lucide="edit-3"></i> Edit
            </button>
            <button class="action-btn-small delete delete-member-btn" data-id="${m.id}">
              <i data-lucide="trash-2"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach event listeners
  document.querySelectorAll('.edit-member-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
      openEditMemberModal(id);
    });
  });

  document.querySelectorAll('.delete-member-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);
      handleDeleteMember(id);
    });
  });

  initIcons();
}

// Photo Upload in modal
function setupPhotoUpload() {
  uploadMemberPhotoBtn.addEventListener('click', () => {
    memberPhotoFile.click();
  });

  memberPhotoFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Only images are allowed!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      memberPhotoBase64 = event.target.result;
      memberPhotoPreviewImg.src = memberPhotoBase64;
      memberPhotoPreviewImg.style.display = 'block';
      memberPhotoPlaceholder.style.display = 'none';
      clearMemberPhotoBtn.style.display = 'inline-flex';
    };
    reader.readAsDataURL(file);
  });

  clearMemberPhotoBtn.addEventListener('click', () => {
    memberPhotoBase64 = '';
    memberPhotoFile.value = '';
    memberPhotoPreviewImg.removeAttribute('src');
    memberPhotoPreviewImg.style.display = 'none';
    memberPhotoPlaceholder.style.display = 'block';
    clearMemberPhotoBtn.style.display = 'none';
  });
}

// Open Add Member modal
function openAddMemberModal() {
  memberModalTitle.textContent = "Add New Ward Member";
  memberForm.reset();
  memberDbId.value = '';

  // Clear photo preview
  memberPhotoBase64 = '';
  memberPhotoFile.value = '';
  memberPhotoPreviewImg.removeAttribute('src');
  memberPhotoPreviewImg.style.display = 'none';
  memberPhotoPlaceholder.style.display = 'block';
  clearMemberPhotoBtn.style.display = 'none';

  memberModal.classList.add('active');
  initIcons();
}

// Open Edit Member modal
function openEditMemberModal(id) {
  const member = allMembers.find(m => m.id === id);
  if (!member) return;

  memberModalTitle.textContent = "Edit Ward Member Details";
  memberDbId.value = member.id;
  memberName.value = member.name;
  memberWard.value = member.ward_number;
  memberPosition.value = member.position;
  memberArea.value = member.area;
  memberYear.value = member.joining_year;
  memberPhone.value = member.phone || '';

  // Parse social links
  let socials = { facebook: '', instagram: '', twitter: '' };
  if (member.social_links) {
    try {
      socials = typeof member.social_links === 'string' ? JSON.parse(member.social_links) : member.social_links;
    } catch (e) {
      console.error(e);
    }
  }
  memberFb.value = socials.facebook || '';
  memberInsta.value = socials.instagram || '';
  memberTwitter.value = socials.twitter || '';

  // Setup photo preview
  if (member.photo_data) {
    memberPhotoBase64 = member.photo_data;
    memberPhotoPreviewImg.src = member.photo_data;
    memberPhotoPreviewImg.style.display = 'block';
    memberPhotoPlaceholder.style.display = 'none';
    clearMemberPhotoBtn.style.display = 'inline-flex';
  } else {
    memberPhotoBase64 = '';
    memberPhotoPreviewImg.removeAttribute('src');
    memberPhotoPreviewImg.style.display = 'none';
    memberPhotoPlaceholder.style.display = 'block';
    clearMemberPhotoBtn.style.display = 'none';
  }

  memberModal.classList.add('active');
  initIcons();
}

// Handle Add/Edit Submit
async function handleMemberSubmit(e) {
  e.preventDefault();

  const id = memberDbId.value;
  const isEdit = !!id;

  const payload = {
    ward_number: parseInt(memberWard.value, 10),
    name: memberName.value.trim(),
    position: memberPosition.value,
    area: memberArea.value.trim(),
    joining_year: parseInt(memberYear.value, 10),
    phone: memberPhone.value.trim(),
    social_links: {
      facebook: memberFb.value.trim(),
      instagram: memberInsta.value.trim(),
      twitter: memberTwitter.value.trim()
    },
    photo_data: memberPhotoBase64
  };

  const url = isEdit ? `${API_BASE}/api/admin/members/${id}` : `${API_BASE}/api/admin/members`;
  const method = isEdit ? 'PUT' : 'POST';

  const submitBtn = memberForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving details...';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      memberModal.classList.remove('active');
      fetchMembers();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error(error);
    alert('Network error saving member data.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Member';
  }
}

// Delete Member
async function handleDeleteMember(id) {
  const member = allMembers.find(m => m.id === id);
  if (!member) return;

  if (!confirm(`Are you sure you want to remove ward representative ${member.name}? This will delete them from the public directory.`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/members/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      fetchMembers();
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error(error);
    alert('Network error deleting member.');
  }
}

// Basic HTML Sanitization
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
