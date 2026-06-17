"use client";

import * as React from "react";
import { tokenStore } from "@/lib/http";
import { authApi } from "./api";
import { authReducer, initialAuthState } from "./authReducer";
import type { AuthAction, AuthState } from "./types";

type AuthContextValue = {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
};

export const AuthContext = React.createContext<AuthContextValue | null>(null);

// AuthProvider holds the auth cache (reducer state) and bootstraps the session
// from the stored token on first mount. Written without JSX to stay a .ts file.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(authReducer, initialAuthState);
  const booted = React.useRef(false);

  React.useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    if (!tokenStore.access) {
      dispatch({ type: "AUTH_LOGOUT" });
      return;
    }

    dispatch({ type: "AUTH_LOADING" });
    authApi
      .getProfile()
      .then((user) => dispatch({ type: "AUTH_SUCCESS", user }))
      .catch(() => {
        tokenStore.clear();
        dispatch({ type: "AUTH_LOGOUT" });
      });
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { state, dispatch } },
    children,
  );
}
