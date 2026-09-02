import { useState } from 'react';
import { useAuth } from '../context/useAuth';
import { 
  Stethoscope, 
  LayoutDashboard, 
  MessageSquare, 
  Calendar, 
  User, 
  LogOut, 
  Menu, 
  X,
  Activity,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, patient, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const displayName = patient?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patient';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat with Kelli', icon: MessageSquare },
    { id: 'appointments', label: 'My Appointments', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
  };

  return (
    <nav className="kelli-navbar">
      <div className="navbar-container">
        {/* Brand */}
        <div className="navbar-brand" onClick={() => handleNavClick('dashboard')}>
          <div className="brand-avatar">
            <Stethoscope size={20} className="brand-icon" />
            <span className="live-status-dot" title="Kelli AI Active" />
          </div>
          <div className="brand-info">
            <div className="brand-title-line">
              <span className="brand-name">Kelli</span>
              <span className="brand-badge-pill">
                <Activity size={10} className="pulse-icon" /> AI Assistant
              </span>
            </div>
            <span className="brand-tagline">AI Healthcare Receptionist</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-link-btn ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={16} className="nav-icon" />
                <span>{item.label}</span>
                {isActive && <span className="active-indicator" />}
              </button>
            );
          })}
        </div>

        {/* Right Action: User Menu */}
        <div className="navbar-user-area">
          <div className="user-profile-menu">
            <button
              type="button"
              className="user-profile-btn"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-label="User menu"
            >
              <div className="user-avatar-circle">
                <User size={15} />
              </div>
              <div className="user-info-text">
                <span className="user-display-name">{displayName}</span>
                <span className="user-email-text">{user?.email}</span>
              </div>
              <ChevronDown size={14} className={`dropdown-arrow ${userDropdownOpen ? 'open' : ''}`} />
            </button>

            {userDropdownOpen && (
              <>
                <div 
                  className="dropdown-backdrop" 
                  onClick={() => setUserDropdownOpen(false)} 
                />
                <div className="user-dropdown-menu">
                  <div className="dropdown-user-header">
                    <p className="dropdown-patient-name">{patient?.name || 'Patient Account'}</p>
                    <p className="dropdown-patient-email">{user?.email}</p>
                    {patient?.phone && (
                      <p className="dropdown-patient-phone">📞 {patient.phone}</p>
                    )}
                  </div>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleNavClick('profile');
                    }}
                  >
                    <User size={15} />
                    <span>View Profile</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleNavClick('appointments');
                    }}
                  >
                    <Calendar size={15} />
                    <span>Appointments</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item text-danger"
                    onClick={handleSignOut}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Direct Logout Button */}
          <button
            type="button"
            className="btn-navbar-logout"
            onClick={handleSignOut}
            title="Sign out of Kelli"
          >
            <LogOut size={15} />
            <span className="logout-text">Logout</span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <div className="mobile-user-card">
            <div className="user-avatar-circle">
              <User size={16} />
            </div>
            <div className="mobile-user-details">
              <span className="mobile-user-name">{displayName}</span>
              <span className="mobile-user-email">{user?.email}</span>
            </div>
          </div>
          <div className="mobile-nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className="mobile-drawer-footer">
            <button
              type="button"
              className="btn-mobile-logout"
              onClick={handleSignOut}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
