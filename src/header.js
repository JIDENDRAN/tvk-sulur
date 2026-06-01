class TVKHeader extends HTMLElement {
  connectedCallback() {
    const currentPath = window.location.pathname;
    const isAdmin = this.hasAttribute('is-admin');

    const isActive = (path) => {
      if (path === '/' && (currentPath === '/' || currentPath === '/index.html')) return 'active';
      if (path !== '/' && currentPath.includes(path)) return 'active';
      return '';
    };

    if (isAdmin) {
      this.innerHTML = `
        <header class="admin-topbar" style="position: sticky; width: 100%; top: 0; z-index: 1000; padding: 15px 0; background: rgba(198, 21, 27, 0.95); backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); font-family: 'Outfit', 'Hind Madurai', sans-serif;">
          <div class="container admin-topbar-container" style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 2rem;">
            <div class="logo-text" style="color: white; font-weight: 900; font-size: 1.5rem; letter-spacing: 2px; display: flex; align-items: center; gap: 10px;">
              <span style="background: var(--poster-yellow, #FECE08); color: var(--poster-red, #c6151b); padding: 2px 8px; border-radius: 4px; font-size: 0.9rem;">IT CELL</span>
              TVK ADMIN
            </div>
            <nav class="nav-links admin-topbar-nav" style="display: flex; gap: 20px; align-items: center;">
              <a href="/" style="color: white; text-decoration: none; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; transition: color 0.2s;">Public Site</a>
              <button id="logout-btn" style="display: none; background: var(--poster-yellow, #FECE08); border: none; color: var(--black, #000); font-weight: 800; text-transform: uppercase; font-size: 0.75rem; padding: 6px 15px; border-radius: 5px; cursor: pointer; transition: all 0.3s ease;">
                Logout
              </button>
            </nav>
          </div>
        </header>
      `;
      return;
    }

    this.innerHTML = `
      <style>
        .tvk-main-header {
          position: sticky;
          width: 100%;
          top: 0;
          z-index: 1000;
          padding: 15px 0;
          background: rgba(198, 21, 27, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          font-family: 'Outfit', 'Hind Madurai', sans-serif;
        }
        .tvk-header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        .tvk-logo-text {
          color: white;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: 2px;
          text-decoration: none;
        }
        .tvk-nav {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        .tvk-nav a {
          color: white;
          text-decoration: none;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.75rem;
          transition: color 0.2s;
        }
        .tvk-nav a:hover {
          color: var(--poster-yellow, #FECE08);
        }
        .tvk-nav a.active {
          color: var(--poster-yellow, #FECE08);
          border: 1px solid var(--poster-yellow, #FECE08);
          padding: 5px 10px;
          border-radius: 5px;
        }
        .tvk-nav a.admin-link {
          color: var(--poster-yellow, #FECE08);
          border-left: 1px solid rgba(255,255,255,0.3);
          padding-left: 15px;
        }
        
        /* Hamburger Mobile Menu Toggle Button */
        .mobile-menu-toggle {
          display: none;
          background: none;
          border: none;
          flex-direction: column;
          gap: 6px;
          cursor: pointer;
          padding: 5px;
          z-index: 1100;
        }
        .hamburger-bar {
          width: 25px;
          height: 3px;
          background-color: white;
          border-radius: 3px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Mobile Sidebar menu overlay drawer */
        .tvk-mobile-sidebar {
          position: fixed;
          top: 0;
          right: -280px; /* Off-screen by default */
          width: 280px;
          height: 100vh;
          background: #FFFFFF;
          box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
          z-index: 1200;
          display: flex;
          flex-direction: column;
          padding: 25px;
          transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Outfit', 'Hind Madurai', sans-serif;
        }
        .tvk-mobile-sidebar.active {
          right: 0;
        }
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1150;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .sidebar-overlay.active {
          opacity: 1;
          pointer-events: auto;
        }
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 15px;
        }
        .sidebar-header .tvk-logo-text {
          color: #C6151B !important;
          font-weight: 900;
          font-size: 1.3rem;
        }
        .sidebar-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #64748B;
          cursor: pointer;
          line-height: 1;
          transition: color 0.2s;
        }
        .sidebar-close:hover {
          color: #C6151B;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-nav a {
          color: #334155;
          text-decoration: none;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.85rem;
          padding: 12px 16px;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: block;
        }
        .sidebar-nav a:hover {
          background-color: rgba(198, 21, 27, 0.05);
          color: #C6151B;
        }
        .sidebar-nav a.active {
          background-color: #C6151B;
          color: white;
        }
        .sidebar-nav a.admin-link {
          margin-top: 15px;
          border-top: 1px dashed #E2E8F0;
          padding-top: 20px;
          color: #C6151B;
          background: rgba(198, 21, 27, 0.04);
          text-align: center;
        }
        .sidebar-nav a.admin-link:hover {
          background: #C6151B;
          color: white;
        }
        
        /* Basic mobile handling based on existing layout */
        @media (max-width: 768px) {
          .tvk-nav {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: flex !important;
          }
          .tvk-logo-text {
            font-size: 1.25rem;
          }
        }
      </style>
      <header class="tvk-main-header">
        <div class="tvk-header-inner">
          <a href="/" class="tvk-logo-text">TVK DIGITAL</a>
          
          <!-- Desktop Navigation -->
          <nav class="tvk-nav">
            <a href="/" class="${isActive('/')}">Home</a>
            <a href="/grievances.html" class="${isActive('/grievances.html')}">Grievances</a>
            <a href="/wards.html" class="${isActive('/wards.html')}">Wards</a>
            <a href="/developments.html" class="${isActive('/developments.html')}">Developments</a>
            <a href="/services.html" class="${isActive('/services.html')}">Services</a>
            <a href="/ideology.html" class="${isActive('/ideology.html')}">Ideology</a>
            <a href="/admin.html" class="admin-link ${isActive('/admin.html')}">Admin Login</a>
          </nav>
          
          <!-- Hamburger menu toggle button for mobile -->
          <button class="mobile-menu-toggle" id="menu-toggle-btn" aria-label="Open Menu">
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
            <span class="hamburger-bar"></span>
          </button>
        </div>
      </header>
      
      <!-- Slide-out Sidebar Drawer for Mobile -->
      <div class="tvk-mobile-sidebar" id="mobile-sidebar">
        <div class="sidebar-header">
          <a href="/" class="tvk-logo-text">TVK DIGITAL</a>
          <button class="sidebar-close" id="close-sidebar-btn">&times;</button>
        </div>
        <nav class="sidebar-nav">
          <a href="/" class="${isActive('/')}">Home</a>
          <a href="/grievances.html" class="${isActive('/grievances.html')}">Grievances</a>
          <a href="/wards.html" class="${isActive('/wards.html')}">Wards</a>
          <a href="/developments.html" class="${isActive('/developments.html')}">Developments</a>
          <a href="/services.html" class="${isActive('/services.html')}">Services</a>
          <a href="/ideology.html" class="${isActive('/ideology.html')}">Ideology</a>
          <a href="/admin.html" class="admin-link ${isActive('/admin.html')}">Admin Login</a>
        </nav>
      </div>
      
      <!-- Overlay block backdrop -->
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;

    // Hook up sidebar click triggers on the next macro task tick
    setTimeout(() => {
      const toggleBtn = this.querySelector('#menu-toggle-btn');
      const closeBtn = this.querySelector('#close-sidebar-btn');
      const sidebar = this.querySelector('#mobile-sidebar');
      const overlay = this.querySelector('#sidebar-overlay');
      
      if (toggleBtn && closeBtn && sidebar && overlay) {
        const openSidebar = () => {
          sidebar.classList.add('active');
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden'; // Stop body scrolling when menu is active
        };
        
        const closeSidebar = () => {
          sidebar.classList.remove('active');
          overlay.classList.remove('active');
          document.body.style.overflow = ''; // Re-enable body scroll
        };
        
        toggleBtn.addEventListener('click', openSidebar);
        closeBtn.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // Auto-close sidebar on window resize if resized to desktop viewport
        window.addEventListener('resize', () => {
          if (window.innerWidth > 768 && sidebar.classList.contains('active')) {
            closeSidebar();
          }
        });
      }
    }, 0);
  }
}

customElements.define('tvk-header', TVKHeader);
