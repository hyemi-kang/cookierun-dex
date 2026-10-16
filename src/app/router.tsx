import { useCallback, useEffect, useState } from "react";

export type Route = "/" | "/promo" | "notfound";

function currentRoute(): Route {
  const path = window.location.pathname;
  if (path === "/") return "/";
  if (path === "/promo") return "/promo";
  return "notfound";
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(currentRoute);

  useEffect(() => {
    const onPop = () => setRoute(currentRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: string) => {
    window.history.pushState(null, "", to);
    setRoute(currentRoute());
  }, []);

  return { route, navigate };
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  navigate: (to: string) => void;
}

export function Link({ to, navigate, onClick, ...rest }: LinkProps) {
  return (
    <a
      {...rest}
      href={to}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    />
  );
}
