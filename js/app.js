// ============================================
// UNIVERSITY PLATFORM - MAIN APP JS
// ============================================

const API = '/api';

// State
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let currentPage = 'dashboard';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  if (token && currentUser) {
    showApp();
    loadDashboard();
  } else {
    showLogin();
  }
  setupEventListeners();
});

function setupEventListeners() {
  // Auth forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
  });
  document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
  });

  // Navigation
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  // Sidebar
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('sidebar-close').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Course modal
  document.getElementById('close-course-modal').addEventListener('click', closeCourseModal);
  document.querySelector('.modal-overlay')?.addEventListener('click', closeCourseModal);

  // Profile form
  document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
}

// ============================================
// AUTH
// ============================================
async function handleLogin(e) {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  const student_id = document.getElementById('login-student-id').value.trim();
  const password = document.getElementById('login-password').value;

  if (!student_id || !password) {
    errorEl.textContent = 'يرجى ملء جميع الحقول';
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, password })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error;
      return;
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    showApp();
    loadDashboard();
  } catch (err) {
    errorEl.textContent = 'خطأ في الاتصال بالخادم';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>تسجيل الدخول</span><span class="material-icons-round">login</span>';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const errorEl = document.getElementById('register-error');
  errorEl.textContent = '';

  const student_id = document.getElementById('reg-student-id').value.trim();
  const full_name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const department = document.getElementById('reg-department').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!student_id || !full_name || !email || !department || !password) {
    errorEl.textContent = 'يرجى ملء جميع الحقول';
    return;
  }

  const btn = document.getElementById('register-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>';

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id, full_name, email, password, department })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error;
      return;
    }

    token = data.token;
    currentUser = data.user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(currentUser));
    showApp();
    loadDashboard();
  } catch (err) {
    errorEl.textContent = 'خطأ في الاتصال بالخادم';
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>إنشاء الحساب</span><span class="material-icons-round">person_add</span>';
  }
}

function handleLogout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showLogin();
}

// ============================================
// NAVIGATION
// ============================================
function showLogin() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('topbar-name').textContent = currentUser?.full_name || 'الطالب';
  document.getElementById('welcome-name').textContent = currentUser?.full_name?.split(' ')[0] || 'الطالب';
}

function navigateTo(page) {
  currentPage = page;

  // Update nav
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  // Update title
  const titles = {
    dashboard: 'لوحة التحكم',
    courses: 'المقررات الدراسية',
    grades: 'الدرجات والمعدل',
    announcements: 'الإعلانات',
    profile: 'الملف الشخصي'
  };
  document.getElementById('page-title').textContent = titles[page] || '';

  // Load page data
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'courses': loadCourses(); break;
    case 'grades': loadGrades(); break;
    case 'announcements': loadAnnouncements(); break;
    case 'profile': loadProfile(); break;
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

// ============================================
// API HELPER
// ============================================
async function apiFetch(url) {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (res.status === 401 || res.status === 403) {
    handleLogout();
    return null;
  }
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiPut(url, body) {
  const res = await fetch(`${API}${url}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ============================================
// DASHBOARD
// ============================================
async function loadDashboard() {
  try {
    const [courses, gradesData, announcements] = await Promise.all([
      apiFetch('/courses'),
      apiFetch('/grades'),
      apiFetch('/announcements')
    ]);

    if (!courses || !gradesData || !announcements) return;

    // Stats
    document.getElementById('stat-courses').textContent = courses.length;
    document.getElementById('stat-gpa').textContent = gradesData.gpa;
    document.getElementById('stat-announcements').textContent = announcements.length;
    document.getElementById('stat-credits').textContent = gradesData.totalCredits;

    // Recent announcements
    const dashAnn = document.getElementById('dash-announcements');
    dashAnn.innerHTML = announcements.slice(0, 4).map(a => `
      <div class="dash-item" onclick="navigateTo('announcements')">
        <span class="priority-badge priority-${a.priority}">${a.priority === 'high' ? 'هام' : 'عام'}</span>
        <h4>${a.title}</h4>
        <p>${a.author} • ${formatDate(a.created_at)}</p>
      </div>
    `).join('');

    // Courses
    const dashCourses = document.getElementById('dash-courses');
    dashCourses.innerHTML = courses.slice(0, 4).map(c => `
      <div class="dash-item" onclick="navigateTo('courses')">
        <h4>${c.code} - ${c.name}</h4>
        <p>${c.instructor} • ${c.schedule || ''}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Dashboard error:', err);
  }
}

// ============================================
// COURSES
// ============================================
async function loadCourses() {
  const coursesGrid = document.getElementById('courses-grid');
  coursesGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    const courses = await apiFetch('/courses');
    if (!courses) return;

    coursesGrid.innerHTML = courses.map(c => `
      <div class="course-card" onclick="viewCourse(${c.id})">
        <span class="course-code">${c.code}</span>
        <h3>${c.name}</h3>
        <p><span class="material-icons-round">person</span> ${c.instructor}</p>
        <p><span class="material-icons-round">schedule</span> ${c.schedule || 'غير محدد'}</p>
        <p><span class="material-icons-round">room</span> ${c.room || 'غير محدد'}</p>
        <div class="course-meta">
          <span><span class="material-icons-round">school</span> ${c.credits} ساعات</span>
          <span><span class="material-icons-round">calendar_today</span> ${c.semester}</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    coursesGrid.innerHTML = '<p>خطأ في تحميل المقررات</p>';
  }
}

async function viewCourse(id) {
  const modal = document.getElementById('course-modal');
  const content = document.getElementById('course-detail-content');

  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  modal.classList.remove('hidden');

  try {
    const course = await apiFetch(`/courses/${id}`);
    if (!course) return;

    const gradeHTML = course.grade ? `
      <div class="detail-section">
        <h3><span class="material-icons-round">grade</span> الدرجات</h3>
        <div class="detail-info">
          <div class="detail-info-item">
            <label>النصفي</label>
            <span>${course.grade.midterm}/30</span>
          </div>
          <div class="detail-info-item">
            <label>النهائي</label>
            <span>${course.grade.final_exam}/40</span>
          </div>
          <div class="detail-info-item">
            <label>الواجبات</label>
            <span>${course.grade.assignments}/20</span>
          </div>
          <div class="detail-info-item">
            <label>الحضور</label>
            <span>${course.grade.attendance}/10</span>
          </div>
          <div class="detail-info-item">
            <label>المجموع</label>
            <span>${course.grade.total}/100</span>
          </div>
          <div class="detail-info-item">
            <label>التقدير</label>
            <span class="grade-badge grade-${getGradeClass(course.grade.grade_letter)}">${course.grade.grade_letter}</span>
          </div>
        </div>
      </div>
    ` : '';

    const materialsHTML = course.materials?.length ? `
      <div class="detail-section">
        <h3><span class="material-icons-round">folder</span> المواد التعليمية</h3>
        ${course.materials.map(m => `
          <div class="material-item">
            <span class="material-icons-round">${m.type === 'pdf' ? 'picture_as_pdf' : 'description'}</span>
            <span>${m.title}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    content.innerHTML = `
      <div class="course-detail-header">
        <span class="course-code">${course.code}</span>
        <h2>${course.name}</h2>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">${course.description || ''}</p>
      </div>
      <div class="detail-section">
        <h3><span class="material-icons-round">info</span> معلومات المقرر</h3>
        <div class="detail-info">
          <div class="detail-info-item">
            <label>المحاضر</label>
            <span>${course.instructor}</span>
          </div>
          <div class="detail-info-item">
            <label>الساعات</label>
            <span>${course.credits} ساعات</span>
          </div>
          <div class="detail-info-item">
            <label>الجدول</label>
            <span>${course.schedule || 'غير محدد'}</span>
          </div>
          <div class="detail-info-item">
            <label>القاعة</label>
            <span>${course.room || 'غير محدد'}</span>
          </div>
        </div>
      </div>
      ${gradeHTML}
      ${materialsHTML}
    `;
  } catch (err) {
    content.innerHTML = '<p>خطأ في تحميل تفاصيل المقرر</p>';
  }
}

function closeCourseModal() {
  document.getElementById('course-modal').classList.add('hidden');
}

// ============================================
// GRADES
// ============================================
async function loadGrades() {
  const gradesBody = document.getElementById('grades-body');
  const gpaOverview = document.getElementById('gpa-overview');

  try {
    const data = await apiFetch('/grades');
    if (!data) return;

    const gpaPercent = (parseFloat(data.gpa) / 4.0 * 100).toFixed(0);

    gpaOverview.innerHTML = `
      <div>
        <div class="gpa-circle" style="--gpa-percent: ${gpaPercent}%;">
          <span class="gpa-value">${data.gpa}</span>
        </div>
        <p class="gpa-label">المعدل التراكمي من 4.0</p>
      </div>
      <div class="gpa-stat">
        <h3>${data.totalCredits}</h3>
        <p>ساعة مكتسبة</p>
      </div>
      <div class="gpa-stat">
        <h3>${data.grades.length}</h3>
        <p>مقرر مسجل</p>
      </div>
    `;

    gradesBody.innerHTML = data.grades.map(g => `
      <tr>
        <td><span class="course-code">${g.code}</span></td>
        <td style="text-align: right; font-weight: 600;">${g.course_name}</td>
        <td>${g.midterm}</td>
        <td>${g.final_exam}</td>
        <td>${g.assignments}</td>
        <td>${g.attendance}</td>
        <td><strong>${g.total}</strong></td>
        <td><span class="grade-badge grade-${getGradeClass(g.grade_letter)}">${g.grade_letter}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    gradesBody.innerHTML = '<tr><td colspan="8">خطأ في تحميل الدرجات</td></tr>';
  }
}

// ============================================
// ANNOUNCEMENTS
// ============================================
async function loadAnnouncements() {
  const list = document.getElementById('announcements-list');
  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    const announcements = await apiFetch('/announcements');
    if (!announcements) return;

    list.innerHTML = announcements.map(a => `
      <div class="announcement-card ${a.priority === 'high' ? 'high-priority' : ''}">
        <div class="announcement-meta">
          ${a.course_code ? `<span class="course-code">${a.course_code}</span>` : '<span class="course-code" style="background:rgba(0,206,201,0.15);color:var(--accent);">إعلان عام</span>'}
          <span class="announcement-author">
            <span class="material-icons-round" style="font-size:14px;">person</span>
            ${a.author}
          </span>
          <span class="announcement-date">${formatDate(a.created_at)}</span>
        </div>
        <h3>${a.title}</h3>
        <p>${a.content}</p>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = '<p>خطأ في تحميل الإعلانات</p>';
  }
}

// ============================================
// PROFILE
// ============================================
async function loadProfile() {
  try {
    const profile = await apiFetch('/profile');
    if (!profile) return;

    const info = document.getElementById('profile-info');
    info.innerHTML = `
      <h2>${profile.full_name}</h2>
      <div class="profile-info-item">
        <span class="material-icons-round">badge</span>
        <span>${profile.student_id}</span>
      </div>
      <div class="profile-info-item">
        <span class="material-icons-round">email</span>
        <span>${profile.email}</span>
      </div>
      <div class="profile-info-item">
        <span class="material-icons-round">apartment</span>
        <span>${profile.department}</span>
      </div>
      <div class="profile-info-item">
        <span class="material-icons-round">school</span>
        <span>المستوى ${profile.level}</span>
      </div>
      <div class="profile-info-item">
        <span class="material-icons-round">menu_book</span>
        <span>${profile.courseCount} مقررات مسجلة</span>
      </div>
    `;

    document.getElementById('edit-name').value = profile.full_name;
    document.getElementById('edit-email').value = profile.email;
  } catch (err) {
    console.error('Profile error:', err);
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const msgEl = document.getElementById('profile-msg');
  msgEl.textContent = '';
  msgEl.className = 'success-msg';

  const body = {};
  const name = document.getElementById('edit-name').value.trim();
  const email = document.getElementById('edit-email').value.trim();
  const currentPass = document.getElementById('edit-current-pass').value;
  const newPass = document.getElementById('edit-new-pass').value;

  if (name) body.full_name = name;
  if (email) body.email = email;
  if (currentPass && newPass) {
    body.current_password = currentPass;
    body.new_password = newPass;
  }

  try {
    const data = await apiPut('/profile', body);
    if (data.error) {
      msgEl.className = 'error-msg';
      msgEl.textContent = data.error;
    } else {
      msgEl.textContent = data.message;
      if (data.user) {
        currentUser = { ...currentUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(currentUser));
        document.getElementById('topbar-name').textContent = currentUser.full_name;
      }
      document.getElementById('edit-current-pass').value = '';
      document.getElementById('edit-new-pass').value = '';
      loadProfile();
    }
  } catch (err) {
    msgEl.className = 'error-msg';
    msgEl.textContent = 'خطأ في تحديث الملف الشخصي';
  }
}

// ============================================
// HELPERS
// ============================================
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `منذ ${days} أيام`;
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getGradeClass(letter) {
  if (!letter) return '';
  if (letter.startsWith('A')) return 'a';
  if (letter.startsWith('B')) return 'b';
  if (letter.startsWith('C')) return 'c';
  if (letter.startsWith('D')) return 'd';
  return 'f';
}
