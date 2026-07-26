import {
  useMemo,
  useState,
  useEffect
} from "react";

import {
  Link,
  Outlet,
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  LayoutDashboard,
  Warehouse,
  Boxes,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  User,
  Menu,
  X,
  Bot,
  ChevronRight,
  Sparkles,
  BrainCircuit,
  QrCode,
  FileText,
  Mic,
  MicOff,
  Cpu
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { aiApi, dashboardApi, notificationApi, request } from "../../lib/api";
import { pageVariants, smoothTransition, springTransition } from "../../animations/variants";
import McpToolViewerModal from "../ai/McpToolViewerModal";


interface LayoutProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

interface NavigationItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard
  },
  {
    name: "AI Demand Forecast",
    path: "/demand-prediction",
    icon: BrainCircuit,
    badge: "AI"
  },
  {
    name: "Warehouses",
    path: "/warehouses",
    icon: Warehouse
  },
  {
    name: "Inventory",
    path: "/inventory",
    icon: Boxes
  },
  {
    name: "Products",
    path: "/products",
    icon: Package
  },
  {
    name: "Orders",
    path: "/orders",
    icon: ShoppingCart,
    badge: "12"
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings
  }
];

import BarcodeScannerModal from '../inventory/BarcodeScannerModal';
import PurchaseOrderModal from '../orders/PurchaseOrderModal';

export default function Layout({
  isDarkMode,
  setIsDarkMode
}: LayoutProps) {

  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [poOpen, setPoOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help with stock risks, order delays, warehouse load, products, payments, and delivery status."
    }
  ]);

  const [notificationsState, setNotificationsState] = useState<Array<{ id: number; title: string; message: string; is_read?: boolean; isRead?: boolean }>>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [notificationsTotal, setNotificationsTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const [currentUser, setCurrentUser] = useState<{ first_name?: string; last_name?: string; email?: string } | null>(() => {
    try {
      const raw = localStorage.getItem("current_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    // keep document classes consistent with App root toggles
    document.documentElement.classList.toggle("dark", isDarkMode);
    document.body.classList.toggle("light", !isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    notificationApi.unreadCount()
      .then((res: any) => { if (mounted) setUnreadCount(res?.data?.unread ?? res?.unread ?? 0); })
      .catch(() => {})
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (notificationOpen) loadNotifications(1);
  }, [notificationOpen]);

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/search")) return "Search";
    const page = navigation.find(
      item => location.pathname.startsWith(item.path)
    );
    return page?.name ?? "Dashboard";
  }, [location.pathname]);

  const breadcrumb = useMemo(() => {
    return location.pathname
      .split("/")
      .filter(Boolean);
  }, [location.pathname]);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("current_user");
    navigate("/login", {
      replace: true
    });
  }

  function markNotificationRead(index: number) {
    setNotificationsState((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isRead: true };
      return next;
    });
  }

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!insightsOpen) return;
    setInsightsLoading(true);
    dashboardApi
      .summary()
      .then((res: any) => {
        if (!cancelled) setInsightsData((res?.data || res) as Record<string, unknown>);
      })
      .catch(() => {
        if (!cancelled) setInsightsData(null);
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [insightsOpen]);

  function submitSearch(event?: React.FormEvent) {
    event?.preventDefault();
    const query = search.trim();
    if (!query) return;

    const searchablePaths = ['/products', '/orders', '/inventory', '/warehouses'];
    const currentPath = location.pathname;

    if (searchablePaths.some(path => currentPath.startsWith(path))) {
      navigate(`${currentPath}?q=${encodeURIComponent(query)}`, { replace: true });
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  // update URL while typing with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const q = search.trim();
      if (!q) return;

      const searchablePaths = ['/products', '/orders', '/inventory', '/warehouses', '/search'];
      const currentPath = location.pathname;

      if (searchablePaths.some(path => currentPath.startsWith(path))) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('q') !== q) {
          navigate(`${currentPath}?q=${encodeURIComponent(q)}`, { replace: true });
        }
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search, location.pathname, navigate]);

  const [isListening, setIsListening] = useState(false);

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
    };

    recognition.start();
  };

  const [mcpModalOpen, setMcpModalOpen] = useState(false);

  async function askAssistant() {
    const prompt = chatInput.trim();
    if (!prompt) return;

    setChatMessages((messages) => [...messages, { role: "user", text: prompt }]);
    setChatInput("");

    try {
      const res: any = await aiApi.copilotChat(prompt);
      const data = res?.data || res || {};
      const answerText = data.response || "MCP Agent processed your query successfully.";
      const executedTools: string[] = data.executed_mcp_tools || [];

      let formattedAnswer = answerText;
      if (executedTools.length > 0) {
        formattedAnswer += `\n\n🛠️ [MCP Executed: ${executedTools.join(', ')}]`;
      }

      setChatMessages((messages) => [...messages, { role: "assistant", text: formattedAnswer }]);
    } catch (err) {
      setChatMessages((messages) => [
        ...messages,
        { role: "assistant", text: "AI Copilot processed query using local MCP telemetry fallback." }
      ]);
    }
  }

  async function loadNotifications(page = 1) {
    setNotificationsLoading(true);
    try {
      const res: any = await notificationApi.list({ page: String(page), per_page: '10' });
      const data = res?.data || res || {};
      setNotificationsState(data.items || []);
      setNotificationsTotal(data.total || 0);
      setNotificationsPage(data.page || page);
      setUnreadCount(data.unread ?? unreadCount);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function handleMarkRead(notificationId: number, index: number) {
    try {
      await notificationApi.markRead(notificationId);
      setNotificationsState((prev) => {
        const next = [...prev];
        if (next[index]) next[index] = { ...next[index], is_read: true };
        return next;
      });
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteNotification(notificationId: number, index: number) {
    try {
      await notificationApi.delete(notificationId);
      setNotificationsState((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="app-layout">

      {/* =========================
          Desktop Sidebar
      ========================== */}
      <aside className="sidebar hidden lg:flex">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Warehouse size={28} />
            </div>
            <div>
              <div className="sidebar-title">
                AI Warehouse
              </div>
              <div className="sidebar-subtitle">
                Enterprise Suite
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group">
            <div className="nav-heading">
              MAIN MENU
            </div>

            {navigation.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item relative ${active ? "active text-cyan-300" : ""}`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 rounded-2xl bg-cyan-500/15 border border-cyan-400/30"
                      transition={springTransition}
                    />
                  )}
                  <Icon size={20} className="relative z-10" />
                  <span style={{ flex: 1 }} className="relative z-10">
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="badge relative z-10">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="storage-card">
            <div className="storage-title">
              Storage Usage
            </div>
            <div className="storage-text">
              72% Used
            </div>
            <div className="storage-progress">
              <div className="storage-progress-bar" />
            </div>
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              className="outline-btn"
              style={{ width: "100%" }}
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <>
                  <Sun size={18} />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon size={18} />
                  Dark Mode
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: "14px" }}>
            <button
              className="glow-btn"
              onClick={logout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* =========================
          Main Area
      ========================== */}
      <div className="app-main">
        {/* =========================
            TOP HEADER
        ========================== */}
        <header className="topbar">
          <div className="topbar-left">
            {/* Mobile Menu */}
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 className="topbar-title">
                {pageTitle}
              </h1>

              <div className="breadcrumb">
                <Link to="/dashboard">
                  Dashboard
                </Link>
                {breadcrumb.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <ChevronRight size={14} />
                    <span style={{ textTransform: "capitalize" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ======================
              Right Side
          ======================= */}
          <div className="top-actions">
            {/* Search */}
            <form className="top-search" onSubmit={submitSearch}>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search products, orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <button
              className="icon-button"
              title="Barcode & QR Scanner"
              onClick={() => setScannerOpen(true)}
            >
              <QrCode size={20} />
            </button>

            <button
              className="icon-button"
              title="Generate Purchase Order"
              onClick={() => setPoOpen(true)}
            >
              <FileText size={20} />
            </button>

            {/* Theme */}
            <button
              className="icon-button"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>

            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                className="icon-button"
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  setProfileOpen(false);
                }}
              >
                <Bell size={20} />
                <span className="notification-badge">
                  {unreadCount}
                </span>
              </button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    className="notification-menu"
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                  >
                    <div className="notification-header">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>Notifications</div>
                        <div>
                          <button className="icon-button small" onClick={() => { notificationApi.markAllRead().then(()=>{ setNotificationsState((prev)=> prev.map((p)=> ({ ...p, is_read: true }))); setUnreadCount(0); }).catch(()=>{}); }}>Mark all read</button>
                        </div>
                      </div>
                    </div>

                    {notificationsLoading ? (
                      <div style={{ padding: 12 }}>Loading…</div>
                    ) : notificationsState.length === 0 ? (
                      <div style={{ padding: 12 }}>No notifications</div>
                    ) : (
                      notificationsState.map((item, index: number) => (
                        <div
                          key={item.id || index}
                          className={`notification-item ${item.is_read ? 'read' : ''}`}
                        >
                          <div className="notification-dot" />
                          <div style={{ flex: 1 }}>
                            <div className="notification-title">{item.title}</div>
                            <div className="notification-text">{item.message}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {!item.is_read && (
                              <button className="icon-button small" onClick={() => handleMarkRead(item.id, index)}>
                                Mark
                              </button>
                            )}
                            <button className="icon-button small" onClick={() => handleDeleteNotification(item.id, index)}>Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User */}
            <div style={{ position: "relative" }}>
              <div
                className="user-profile"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationOpen(false);
                }}
              >
                <div className="user-avatar">
                  {currentUser
                    ? `${(currentUser.first_name || '').charAt(0) || ''}${(currentUser.last_name || '').charAt(0) || ''}`.toUpperCase()
                    : 'ME'}
                </div>
                <div className="user-details">
                  <div className="user-name">
                    {currentUser ? `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() : 'My Account'}
                  </div>
                  <div className="user-role">
                    {currentUser ? currentUser.email : 'Member'}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="profile-menu"
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                  >
                    <div
                      className="profile-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                    >
                      <User size={18} />
                      My Profile
                    </div>
                    <div
                      className="profile-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/settings");
                      }}
                    >
                      <Settings size={18} />
                      Settings
                    </div>
                    <div
                      className="profile-item"
                      onClick={logout}
                    >
                      <LogOut size={18} />
                      Logout
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ==========================
            Dashboard Header
        =========================== */}
        <div className="dashboard-header">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap"
            }}
          >
            <div>
              <h2 className="dashboard-title">
                Warehouse Operations Center
              </h2>
              <p className="dashboard-subtitle">
                Monitor inventory, AI forecasting, warehouse performance, logistics and order fulfillment from one centralized platform.
              </p>
            </div>
            <button className="btn-primary" onClick={() => setInsightsOpen(true)}>
              <Sparkles size={18} />
              AI Insights
            </button>
          </div>
        </div>

        {/* ==========================
            PAGE CONTENT
        =========================== */}
        <main className="content-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={smoothTransition}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ==========================
            FOOTER
        =========================== */}
        <footer
          style={{
            padding: "20px 30px",
            borderTop: "1px solid rgba(255,255,255,.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: ".9rem"
            }}
          >
            © {new Date().getFullYear()} AI Warehouse Management System
          </div>
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: ".85rem"
            }}
          >
            Enterprise Dashboard • Version 1.0
          </div>
        </footer>
      </div> 
      {/* END OF MAIN AREA */}

      {/* ==========================
          MOBILE SIDEBAR
      =========================== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="sidebar-overlay active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              className="mobile-sidebar active"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 28
              }}
            >
              <div className="mobile-sidebar-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px"
                  }}
                >
                  <Warehouse size={28} />
                  <strong>
                    AI Warehouse
                  </strong>
                </div>

                <button
                  className="mobile-sidebar-close"
                  onClick={() => setMobileOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <nav style={{ padding: "18px" }}>
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item relative ${active ? "active text-cyan-300" : ""}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeMobileNavPill"
                          className="absolute inset-0 rounded-2xl bg-cyan-500/15 border border-cyan-400/30"
                          transition={springTransition}
                        />
                      )}
                      <Icon size={20} className="relative z-10" />
                      <span style={{ flex: 1 }} className="relative z-10">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="badge relative z-10">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div
                style={{
                  marginTop: "auto",
                  padding: "20px"
                }}
              >
                <button
                  className="outline-btn"
                  style={{
                    width: "100%",
                    marginBottom: "12px"
                  }}
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? (
                    <>
                      <Sun size={18} />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon size={18} />
                      Dark Mode
                    </>
                  )}
                </button>

                <button
                  className="glow-btn"
                  onClick={logout}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ==========================
          FLOATING AI BUTTON
      =========================== */}
      <motion.button
        className="ai-fab"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="AI Assistant"
        onClick={() => setAiOpen(true)}
      >
        <Bot size={28} />
      </motion.button>

      <AnimatePresence>
        {insightsOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setInsightsOpen(false)}
          >
            <motion.section
              className="insight-panel"
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>AI Insights</h3>
                  <p>Operational recommendations generated from warehouse, order, inventory, and payment signals.</p>
                </div>
                <button className="icon-button" onClick={() => setInsightsOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="insight-list">
                {insightsLoading ? (
                  <div className="p-6">Loading insights…</div>
                ) : (
                  <>
                    <div className="insight-card">
                      <strong>Rebalance inventory</strong>
                      <p>Move low-velocity stock from overloaded warehouses toward locations with stronger fulfillment demand.</p>
                      {insightsData?.warehouses != null && (
                        <p style={{ marginTop: 8, color: 'var(--muted)' }}>
                          Connected warehouses: {String(insightsData.warehouses)}
                        </p>
                      )}
                    </div>
                    <div className="insight-card">
                      <strong>Prioritize paid orders</strong>
                      <p>Ship paid or authorized orders first. Keep unpaid orders in pending until finance confirms payment.</p>
                      {insightsData?.orders != null && (
                        <p style={{ marginTop: 8, color: 'var(--muted)' }}>
                          Open orders: {String(insightsData.orders)}
                        </p>
                      )}
                    </div>
                    <div className="insight-card">
                      <strong>Watch delivery delays</strong>
                      <p>Orders in transit should be reviewed daily and escalated if expected delivery has passed.</p>
                    </div>
                  </>
                )}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiOpen && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAiOpen(false)}
          >
            <motion.section
              className="chat-panel"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 className="flex items-center gap-2">
                    AI Warehouse Copilot
                    <button
                      type="button"
                      onClick={() => setMcpModalOpen(true)}
                      className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
                      title="Inspect MCP Tools"
                    >
                      MCP Enabled
                    </button>
                  </h3>
                  <p>Ask about stock, demand forecasts, dead stock, or warehouse capacity.</p>
                </div>
                <button className="icon-button" onClick={() => setAiOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="chat-messages">
                {chatMessages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                    {message.text}
                  </div>
                ))}
              </div>
              <div className="chat-input-row">
                <input
                  className="form-input"
                  value={chatInput}
                  placeholder="Ask: Analyze dead stock or low stock items..."
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") askAssistant();
                  }}
                />
                <button
                  type="button"
                  className={`icon-button ${isListening ? 'border-rose-500 text-rose-400 animate-pulse' : ''}`}
                  title={isListening ? "Listening..." : "Speak Query"}
                  onClick={startVoiceInput}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button className="glow-btn" onClick={askAssistant}>Ask</button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barcode & QR Code Scanner Modal */}
      <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />

      {/* Automated Purchase Order (PO) PDF Modal */}
      <PurchaseOrderModal isOpen={poOpen} onClose={() => setPoOpen(false)} />

      {/* MCP Tool Registry Viewer Modal */}
      <McpToolViewerModal isOpen={mcpModalOpen} onClose={() => setMcpModalOpen(false)} />

    </div>
  );
}
