"use client";

import * as React from "react";
import { tokenStore } from "@/lib/http";
import { AuthContext } from "./authContext";
import { authApi } from "./api";
import type {
  AuthSession,
  LoginInput,
  RegisterInput,
  RoleName,
  VerifyEmailInput,
} from "./types";

export function roleHome(role?: RoleName): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "warden":
    case "staff":
      return "/warden";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  const { state, dispatch } = ctx;

  const applySession = React.useCallback(
    (session: AuthSession) => {
      tokenStore.set(session.accessToken, session.refreshToken);
      dispatch({ type: "AUTH_SUCCESS", user: session.user });
      return session.user;
    },
    [dispatch],
  );

  // Step 1: submit credentials. Returns { otp_required, email, dev_otp? }.
  // No session yet — tokens are issued only after the OTP is verified.
  const login = React.useCallback((input: LoginInput) => authApi.login(input), []);

  // Step 2: verify the emailed login code → establishes the session.
  const verifyLoginOtp = React.useCallback(
    async (input: VerifyEmailInput) => {
      dispatch({ type: "AUTH_LOADING" });
      try {
        const session = await authApi.verifyLoginOtp(input);
        return applySession(session);
      } catch (err) {
        dispatch({ type: "AUTH_FAILURE", error: (err as Error).message });
        throw err;
      }
    },
    [applySession, dispatch],
  );

  const register = React.useCallback(
    (input: RegisterInput) => authApi.register(input),
    [],
  );

  const verifyEmail = React.useCallback(
    async (input: VerifyEmailInput) => {
      dispatch({ type: "AUTH_LOADING" });
      try {
        const session = await authApi.verifyEmail(input);
        return applySession(session);
      } catch (err) {
        dispatch({ type: "AUTH_FAILURE", error: (err as Error).message });
        throw err;
      }
    },
    [applySession, dispatch],
  );

  const resendOtp = React.useCallback((email: string) => authApi.resendOtp(email), []);

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout(tokenStore.refresh);
    } catch {
      /* ignore network/logout errors */
    } finally {
      tokenStore.clear();
      dispatch({ type: "AUTH_LOGOUT" });
    }
  }, [dispatch]);

  const updateProfile = React.useCallback(
    async (input: { full_name?: string; phone?: string }) => {
      const updated = await authApi.updateProfile(input);
      dispatch({ type: "AUTH_SET_USER", user: updated });
      return updated;
    },
    [dispatch],
  );

  const clearError = React.useCallback(() => dispatch({ type: "AUTH_CLEAR_ERROR" }), [dispatch]);

  return {
    user: state.user,
    role: state.user?.role?.name,
    status: state.status,
    error: state.error,
    isAuthenticated: state.status === "authenticated",
    isLoading: state.status === "loading" || state.status === "idle",
    login,
    verifyLoginOtp,
    register,
    verifyEmail,
    resendOtp,
    logout,
    updateProfile,
    clearError,
  };
}
