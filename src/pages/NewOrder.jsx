import { useEffect, useState } from "react";
import { useI18n, errorText } from "../lib/i18n/index.jsx";
import { useAuth } from "../lib/AuthContext.jsx";
import { Link, useRoute } from "../router/HashRouter.jsx";
import { api, ApiError } from "../lib/api.js";
import DesignEditor from "../components/DesignEditor.jsx";

function emptyLine(product) {
  return {
    localId: crypto.randomUUID(),
    productId: product.id,
    color: product.colors[0] || "#f7f7f5",
    size: product.sizes[0] || "",
    quantity: 1,
    design: { front: [], back: [] },
    editing: false,
  };
}

function hasArtwork(design) {
  return (design.front || []).length > 0 || (design.back || []).length > 0;
}

export default function NewOrder({ workshopId }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { navigate } = useRoute();
  const [workshop, setWorkshop] = useState(null);
  const [error, setError] = useState(null);
  const [lines, setLines] = useState([]);
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .storefront(workshopId)
      .then((w) => !cancelled && setWorkshop(w))
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) setError(t("store_not_available"));
        else setError(errorText(t, err.code));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId]);

  const products = (workshop?.products || []).filter((p) => p.published);

  useEffect(() => {
    if (products.length > 0 && lines.length === 0) setLines([emptyLine(products[0])]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshop]);

  function addLine() {
    if (products.length === 0) return;
    setLines((prev) => [...prev, emptyLine(products[0])]);
  }

  function updateLine(localId, patch) {
    setLines((prev) => prev.map((l) => (l.localId === localId ? { ...l, ...patch } : l)));
  }

  function removeLine(localId) {
    setLines((prev) => prev.filter((l) => l.localId !== localId));
  }

  function productFor(line) {
    return products.find((p) => p.id === line.productId) || products[0];
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    if (!user) {
      navigate("/login");
      return;
    }
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        workshopId,
        note,
        lines: lines.map((l) => ({
          id: `line-${l.localId}`,
          productId: l.productId,
          color: l.color,
          size: l.size,
          quantity: l.quantity,
          design: l.design,
          printWidthsCm: { front: 0, back: 0 },
        })),
      };
      const order = await api.createOrder(payload);
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setSubmitError(errorText(t, err.code));
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <div className="page narrow">
        <div className="empty">
          <strong>{error}</strong>
          <Link to="/directory" className="btn primary">
            {t("store_back")}
          </Link>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="page">
        <p className="small">{t("common_loading")}</p>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to={`/workshops/${workshopId}`} className="small">
        ← {workshop.name}
      </Link>
      <h2 style={{ marginTop: 10 }}>{t("neworder_title")}</h2>

      {products.length === 0 ? (
        <div className="empty">
          <strong>{t("neworder_no_products")}</strong>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          {!user && (
            <div className="notice" role="alert">
              {t("neworder_login_required")}
            </div>
          )}

          <div className="stack" style={{ marginTop: 16 }}>
            {lines.map((line) => {
              const product = productFor(line);
              return (
                <div className="card pad" key={line.localId}>
                  <div className="row wrap" style={{ gap: 14, alignItems: "flex-end" }}>
                    <label className="field" style={{ minWidth: 180 }}>
                      <span className="field-label">{t("neworder_product")}</span>
                      <select
                        className="control"
                        value={line.productId}
                        onChange={(e) => {
                          const next = products.find((p) => p.id === e.target.value);
                          updateLine(line.localId, {
                            productId: next.id,
                            color: next.colors[0] || "#f7f7f5",
                            size: next.sizes[0] || "",
                            design: { front: [], back: [] },
                          });
                        }}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">{t("neworder_color")}</span>
                      <div className="row wrap color-options">
                        {(product?.colors || []).map((c) => (
                          <button
                            type="button"
                            key={c}
                            className="color-dot"
                            style={{
                              background: c,
                              outline: line.color === c ? "2px solid #2464e8" : "1px solid #d7dde6",
                            }}
                            aria-label={c}
                            onClick={() => updateLine(line.localId, { color: c })}
                          />
                        ))}
                      </div>
                    </label>
                    <label className="field">
                      <span className="field-label">{t("neworder_size")}</span>
                      <select
                        className="control"
                        value={line.size}
                        onChange={(e) => updateLine(line.localId, { size: e.target.value })}
                      >
                        {(product?.sizes || []).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field" style={{ width: 100 }}>
                      <span className="field-label">{t("neworder_quantity")}</span>
                      <input
                        className="control"
                        type="number"
                        min={1}
                        max={10000}
                        value={line.quantity}
                        onChange={(e) => updateLine(line.localId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                      />
                    </label>
                  </div>

                  <div className="row wrap" style={{ marginTop: 14 }}>
                    <button
                      className="btn secondary small"
                      type="button"
                      onClick={() => updateLine(line.localId, { editing: !line.editing })}
                    >
                      {hasArtwork(line.design) ? t("neworder_designed") : t("neworder_customize")}
                    </button>
                    <button className="btn danger small" type="button" onClick={() => removeLine(line.localId)}>
                      {t("neworder_remove_line")}
                    </button>
                  </div>

                  {line.editing && product && (
                    <div style={{ marginTop: 16 }}>
                      <DesignEditor
                        product={product}
                        color={line.color}
                        value={line.design}
                        onChange={(design) => updateLine(line.localId, { design })}
                        folder={`orders/${workshopId}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="btn secondary" type="button" onClick={addLine} style={{ marginTop: 14 }}>
            {t("neworder_add_line")}
          </button>

          <label className="field" style={{ marginTop: 20 }}>
            <span className="field-label">{t("neworder_note")}</span>
            <textarea className="control" rows={3} value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} />
          </label>

          {submitError && (
            <div className="notice" role="alert" style={{ marginTop: 12 }}>
              {submitError}
            </div>
          )}

          <button className="btn primary block" type="submit" disabled={submitting || lines.length === 0} style={{ marginTop: 16 }}>
            {submitting ? t("common_loading") : t("neworder_submit")}
          </button>
        </form>
      )}
    </div>
  );
}
