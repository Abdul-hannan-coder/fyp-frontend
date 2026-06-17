export type RoleName = "admin" | "warden" | "staff" | "student";

export type Role = {
  id: string;
  name: RoleName;
  description?: string;
  permissions?: Record<string, unknown>;
};

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role_id: string;
  role?: Role;
  is_active: boolean;
  is_verified: boolean;
  is_approved: boolean;
  preferred_room_type_id?: string | null;
  selected_package_id?: string | null;
  selected_room_id?: string | null;
  last_login?: string | null;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type LoginInput = { email: string; password: string };

// Login is two-step (2FA): credentials → emailed OTP → session.
export type LoginOtpResult = { otp_required: true; email: string; dev_otp?: string };

export type RegisterStudentProfile = {
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relation?: string;
  address?: string;
  city?: string;
  admission_date?: string;
  course?: string;
  department?: string;
  student_id?: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role_name?: RoleName;
  preferred_room_type_id?: string;
  selected_package_id?: string;
  selected_room_id?: string;
  student?: RegisterStudentProfile;
};

export type VerifyEmailInput = { email: string; otp: string };

export type AuthStatus =
  | "idle" // not yet bootstrapped
  | "loading" // bootstrapping / in-flight auth action
  | "authenticated"
  | "unauthenticated";

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
};

export type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; user: AuthUser }
  | { type: "AUTH_FAILURE"; error: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "AUTH_SET_USER"; user: AuthUser }
  | { type: "AUTH_CLEAR_ERROR" };
