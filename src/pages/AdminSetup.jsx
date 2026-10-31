import { useState } from "react";
import { useI18n, errorText } from "../lib/i18n/index.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { Link, useRoute } from "../router/HashRouter.jsx";
import { api, setToken } from "../lib/api.js";

export default function AdminSetup() {
  const { t } = useI18n();
  const { user, loading, setUser } = useAuth();
  const { navigate } = useRoute();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api.bootstrapAdmin(secret.trim());
      setToken(data.accessToken);
      setUser(data.user);
      setDone(true);
      setTimeout(() => navigate("/admin/workshops"), 1200);
    } catch (err) {
      setError(errorText(t, err.code));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return null;

  return (
    <div className="page">
      <section className="section" style={{ maxWidth: 420, margin: "0 auto" }}>
        <h2>{t("admin_setup_title")}</h2>
        <p className="small" style={{ marginTop: 8 }}>{t("admin_setup_lead")}</p>

        {!user && (
          <div className="notice" style={{ marginTop: 16 }}>
            {t("admin_setup_login_first")}{" "}
            <Link to="/login">{t("nav_login")}</Link> · <Link to="/register">{t("nav_register")}</Link>
          </div>
        )}

        {user && !done && (
          <form onSubmit={onSubmit} className="form" style={{ marginTop: 16 }}>
            {error && <div className="notice" role="alert">{error}</div>}
            <label className="field">
              <span className="field-label">{t("admin_setup_secret")}</span>
              <input
                className="control"
                type="password"
                required
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </label>
            <button className="btn primary block" type="submit" disabled={busy}>
              {busy ? t("common_loading") : t("admin_setup_submit")}
            </button>
          </form>
        )}

        {done && <div className="notice" style={{ marginTop: 16 }}>{t("admin_setup_success")}</div>}
      </section>
    </div>
  );
}
