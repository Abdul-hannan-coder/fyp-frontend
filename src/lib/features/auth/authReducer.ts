import type { AuthAction, AuthState } from "./types";

export const initialAuthState: AuthState = {
  status: "idle",
  user: null,
  error: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, status: "loading", error: null };
    case "AUTH_SUCCESS":
      return { status: "authenticated", user: action.user, error: null };
    case "AUTH_SET_USER":
      return { ...state, status: "authenticated", user: action.user };
    case "AUTH_FAILURE":
      return { status: "unauthenticated", user: null, error: action.error };
    case "AUTH_LOGOUT":
      return { status: "unauthenticated", user: null, error: null };
    case "AUTH_CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}
