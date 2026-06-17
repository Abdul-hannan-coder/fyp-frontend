import { http } from "@/lib/http";
import type {
  AuthSession,
  AuthUser,
  LoginInput,
  LoginOtpResult,
  RegisterInput,
  VerifyEmailInput,
} from "./types";

export const authApi = {
  // Step 1: validate credentials → server emails a one-time code (no tokens yet).
  login: (input: LoginInput) =>
    http.post<LoginOtpResult>("/auth/login", input, { auth: false }),

  // Step 2: confirm the emailed code → returns the full session.
  verifyLoginOtp: (input: VerifyEmailInput) =>
    http.post<AuthSession>("/auth/verify-login-otp", input, { auth: false }),

  // Applying for a room = creating an account (OTP is emailed afterwards).
  register: (input: RegisterInput) =>
    http.post<null>(
      "/auth/register",
      { role_name: "student", ...input },
      { auth: false },
    ),

  // Returns a full session — verifying email also logs the user in.
  verifyEmail: (input: VerifyEmailInput) =>
    http.post<AuthSession>("/auth/verify-email", input, { auth: false }),

  resendOtp: (email: string) =>
    http.post<null>("/auth/resend-otp", { email }, { auth: false }),

  forgotPassword: (email: string) =>
    http.post<null>("/auth/forgot-password", { email }, { auth: false }),

  resetPassword: (input: { email: string; otp: string; new_password: string }) =>
    http.post<null>("/auth/reset-password", input, { auth: false }),

  getProfile: () =>
    http.get<{ user: AuthUser }>("/auth/profile").then((d) => d.user),

  updateProfile: (input: { full_name?: string; phone?: string }) =>
    http.put<{ user: AuthUser } | AuthUser>("/auth/profile", input).then((d) =>
      d && "user" in d ? d.user : (d as AuthUser),
    ),

  changePassword: (input: { current_password: string; new_password: string }) =>
    http.post<null>("/auth/change-password", input),

  logout: (refreshToken: string | null) =>
    http.post<null>("/auth/logout", { refreshToken }),
};
