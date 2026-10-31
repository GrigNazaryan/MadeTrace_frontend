import { useEffect } from "react";
import { useI18n } from "../../lib/i18n/index.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";
import { Link, useRoute } from "../../router/HashRouter.jsx";

const NAV = [
  ["workshops", "admin_nav_workshops"],
  ["payments", "admin_nav_payments"],
  ["audit-log", "admin_nav_audit"],
];

export default function AdminLayout({ section, children }) {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const { navigate } = useRoute();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  if (loading || !user) return null;

  return (
    <div className="workspace">
      <aside className="workspace-side">
        <div className="side-section" style={{ marginTop: 0 }}>
          ADMIN
        </div>
        {NAV.map(([slug, labelKey]) => (
          <Link key={slug} to={`/admin/${slug}`} className={`side-link ${section === slug ? "active" : ""}`}>
            {t(labelKey)}
          </Link>
        ))}
      </aside>
      <main className="workspace-content">{children}</main>
    </div>
  );
}
