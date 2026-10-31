import { useI18n, languageNames, dictionaries } from "./lib/i18n/index.jsx";
import { useAuth } from "./lib/AuthContext.jsx";
import { Link, useRoute, matchRoute } from "./router/HashRouter.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminSetup from "./pages/AdminSetup.jsx";
import Directory from "./pages/Directory.jsx";
import Storefront from "./pages/Storefront.jsx";
import NewOrder from "./pages/NewOrder.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import OrderPortal from "./pages/OrderPortal.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";
import WsOverview from "./pages/workspace/Overview.jsx";
import WsOrders from "./pages/workspace/Orders.jsx";
import WsOrderDetail from "./pages/workspace/OrderDetail.jsx";
import WsProducts from "./pages/workspace/Products.jsx";
import WsTemplates from "./pages/workspace/Templates.jsx";
import WsSettings from "./pages/workspace/Settings.jsx";
import WsImport from "./pages/workspace/Import.jsx";
import WsClients from "./pages/workspace/Clients.jsx";
import WsReports from "./pages/workspace/Reports.jsx";
import WsBilling from "./pages/workspace/Billing.jsx";
import ForBusiness from "./pages/ForBusiness.jsx";
import Pricing from "./pages/Pricing.jsx";
import AdminWorkshops from "./pages/admin/Workshops.jsx";
import AdminPayments from "./pages/admin/Payments.jsx";
import AdminAuditLog from "./pages/admin/AuditLog.jsx";

const NAV_LINKS = [
  ["/", "nav_directory_home"], // special-cased below
  ["/directory", "nav_directory"],
  ["/for-business", "nav_for_business"],
  ["/pricing", "nav_pricing"],
];

function LanguagePicker() {
  const { language, setLanguage } = useI18n();
  return (
    <select
      className="control small"
      aria-label="Language"
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      style={{ width: "auto" }}
    >
      {Object.keys(dictionaries).map((code) => (
        <option key={code} value={code}>
          {languageNames[code]}
        </option>
      ))}
    </select>
  );
}

function Header() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const { path, navigate } = useRoute();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          MadeTrace
        </Link>
        <nav className="mainnav" aria-label="Main navigation">
          <Link to="/directory" className={path === "/directory" ? "active" : ""}>
            {t("nav_directory")}
          </Link>
          <Link to="/for-business" className={path === "/for-business" ? "active" : ""}>
            {t("nav_for_business")}
          </Link>
          <Link to="/pricing" className={path === "/pricing" ? "active" : ""}>
            {t("nav_pricing")}
          </Link>
        </nav>
        <div className="header-actions">
          <LanguagePicker />
          {user?.role === "customer" && (
            <Link to="/my-orders" className="btn secondary">
              {t("nav_my_orders")}
            </Link>
          )}
          {user?.role === "company_owner" && (
            <Link to="/workspace/overview" className="btn primary">
              {t("nav_workspace")}
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="btn primary">
              {t("nav_admin")}
            </Link>
          )}
          {!user && (
            <>
              <Link to="/login" className="btn secondary">
                {t("nav_login")}
              </Link>
              <Link to="/register" className="btn primary">
                {t("nav_register")}
              </Link>
            </>
          )}
          {user && (
            <button
              className="btn icon"
              onClick={() => {
                logout();
                navigate("/");
              }}
              aria-label={t("nav_logout")}
              title={t("nav_logout")}
            >
              ⎋
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function ImpersonationBanner() {
  const { isImpersonated, isReadOnlyImpersonation, canStopImpersonating, stopImpersonating } = useAuth();
  const { t } = useI18n();
  const { navigate } = useRoute();
  if (!isImpersonated) return null;
  return (
    <div className="notice row between" role="status">
      <span>
        {t("impersonation_banner", {
          mode: t(isReadOnlyImpersonation ? "impersonation_read_only" : "impersonation_read_write"),
        })}
      </span>
      {canStopImpersonating && (
        <button
          className="btn secondary small"
          onClick={async () => {
            await stopImpersonating();
            navigate("/admin/workshops");
          }}
        >
          {t("admin_stop_impersonating")}
        </button>
      )}
    </div>
  );
}

function Routes() {
  const { path } = useRoute();

  if (path === "/") return <Home />;
  if (path === "/login") return <Login />;
  if (path === "/register") return <Register />;
  if (path === "/admin-setup") return <AdminSetup />;
  if (path === "/directory") return <Directory />;
  const storeMatch = matchRoute("/workshops/:id", path);
  if (storeMatch) return <Storefront id={storeMatch.id} />;
  const newOrderMatch = matchRoute("/order/:id", path);
  if (newOrderMatch) return <NewOrder workshopId={newOrderMatch.id} />;
  const orderMatch = matchRoute("/orders/:number", path);
  if (orderMatch) return <OrderPortal number={orderMatch.number} />;
  if (path === "/for-business") return <ForBusiness />;
  if (path === "/pricing") return <Pricing />;
  if (path === "/my-orders") return <MyOrders />;

  if (path === "/workspace" || path === "/workspace/overview") return <WsOverview />;
  if (path === "/workspace/orders") return <WsOrders />;
  const wsOrderMatch = matchRoute("/workspace/orders/:number", path);
  if (wsOrderMatch) return <WsOrderDetail number={wsOrderMatch.number} />;
  if (path === "/workspace/products") return <WsProducts />;
  if (path === "/workspace/templates") return <WsTemplates />;
  if (path === "/workspace/clients") return <WsClients />;
  if (path === "/workspace/reports") return <WsReports />;
  if (path === "/workspace/billing") return <WsBilling />;
  if (path === "/workspace/settings") return <WsSettings />;
  if (path === "/workspace/import") return <WsImport />;
  if (path.startsWith("/workspace")) return <ComingSoon titleKey="nav_workspace" />;

  if (path === "/admin" || path === "/admin/workshops") return <AdminWorkshops />;
  if (path === "/admin/payments") return <AdminPayments />;
  if (path === "/admin/audit-log") return <AdminAuditLog />;
  if (path.startsWith("/admin")) return <ComingSoon titleKey="nav_admin" />;
  if (path.startsWith("/admin")) return <ComingSoon titleKey="nav_admin" />;
  return <ComingSoon titleKey="nav_directory" />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <ImpersonationBanner />
      <Routes />
    </div>
  );
}
