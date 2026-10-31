import { createContext, useContext, useEffect, useState, useCallback } from "react";

const RouteContext = createContext(null);

function currentPath() {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

export function HashRouterProvider({ children }) {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onHashChange = () => setPath(currentPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((to) => {
    if (currentPath() === to) {
      setPath(to); // re-render even if the hash didn't change (e.g. re-navigating to the same route)
      return;
    }
    window.location.hash = to;
  }, []);

  return <RouteContext.Provider value={{ path, navigate }}>{children}</RouteContext.Provider>;
}

export function useRoute() {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRoute must be used inside <HashRouterProvider>");
  return ctx;
}

/** Matches "/workshops/:id" style patterns against the current path. Returns params or null. */
export function matchRoute(pattern, path) {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(pathParts[i]);
    else if (p !== pathParts[i]) return null;
  }
  return params;
}

export function Link({ to, className, children, ...rest }) {
  const { navigate } = useRoute();
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
