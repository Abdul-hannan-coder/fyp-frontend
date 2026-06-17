"use client";

import * as React from "react";
import { toast } from "sonner";
import { http, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";
import { invalidateFeature } from "@/lib/cache";

export type MessPlan = {
  id: string;
  name: string;
  plan_type?: string;
  price_per_month?: string | number;
  status?: string;
  description?: string;
};

export type MenuItem = { item?: string; calories?: number; protein?: number };

export type MealMenu = {
  id: string;
  meal_type: string; // breakfast | lunch | dinner
  menu_date: string;
  items?: MenuItem[] | string;
  notes?: string;
  creator?: { id?: string; full_name?: string };
};

export type StudentSummary = {
  id: string;
  student_id?: string;
  department?: string;
  year_of_study?: number;
  user?: { id: string; full_name?: string; email?: string };
};

export type MessSubscription = {
  id: string;
  student_id: string;
  mess_plan_id: string;
  start_date: string;
  end_date?: string | null;
  status: "active" | "paused" | "ended";
  messPlan?: MessPlan;
  student?: StudentSummary;
};

export type MessBill = {
  id: string;
  month: string;
  amount_due: string | number;
  amount_paid: string | number;
  status: "pending" | "partial" | "paid" | "waived";
  due_date?: string;
  paid_date?: string | null;
  subscription?: MessSubscription;
  student?: StudentSummary;
};

export type BillingReport = {
  filters?: Record<string, unknown>;
  totals: {
    total_due: number;
    total_paid: number;
    total_outstanding: number;
    status_counts: Record<string, number>;
  };
  bills: MessBill[];
};

export type UpdatePlanInput = {
  name?: string;
  plan_type?: string;
  price_per_month?: number;
  description?: string;
  status?: string;
};

export type CreateMenuInput = {
  menu_date: string;
  meal_type: string;
  items: MenuItem[];
  notes?: string;
};

export type GenerateBillingInput = {
  month?: string;
  due_date?: string;
  notes?: string;
};

export const messApi = {
  adminPlans: () => http.get<unknown>("/mess/admin/plans?limit=100").then((d) => unwrapList<MessPlan>(d, "plans")),
  plans: () => http.get<unknown>("/mess/plans?limit=100").then((d) => unwrapList<MessPlan>(d, "plans")),
  menu: () => http.get<unknown>("/mess/menu?limit=100").then((d) => unwrapList<MealMenu>(d, "menus")),
  menuByDate: (date: string) =>
    http.get<unknown>(`/mess/menu/by-date/${date}`).then((d) => unwrapList<MealMenu>(d, "menus")),
  myPlan: () => http.get<MessSubscription | null>("/mess/my-plan"),
  billing: () => http.get<unknown>("/mess/billing?limit=100").then((d) => unwrapList<MessBill>(d, "bills")),
  subscribe: (planId: string) => http.post<MessSubscription>(`/mess/subscribe/${planId}`),
  changePlan: (planId: string) => http.patch<MessSubscription>("/mess/my-plan", { mess_plan_id: planId }),
  payBill: (id: string) => http.patch<MessBill>(`/mess/billing/${id}/pay`),
  createPlan: (body: { name: string; plan_type: string; price_per_month: number; description?: string }) =>
    http.post<MessPlan>("/mess/admin/plans", body),
  updatePlan: (id: string, body: UpdatePlanInput) => http.put<MessPlan>(`/mess/admin/plans/${id}`, body),
  deletePlan: (id: string) => http.del<{ success: boolean }>(`/mess/admin/plans/${id}`),
  adminMenu: () => http.get<unknown>("/mess/admin/menu?limit=100").then((d) => unwrapList<MealMenu>(d, "menus")),
  createMenu: (body: CreateMenuInput) => http.post<MealMenu>("/mess/admin/menu", body),
  generateBilling: (body: GenerateBillingInput) => http.post<MessBill[]>("/mess/admin/billing/generate", body),
  billingReport: (month?: string) =>
    http
      .get<BillingReport>(`/mess/admin/billing/report${month ? `?month=${month}` : ""}`)
      .then((d) => d ?? { totals: { total_due: 0, total_paid: 0, total_outstanding: 0, status_counts: {} }, bills: [] }),
  adminSubscriptions: () =>
    http.get<unknown>("/mess/admin/subscriptions?limit=100").then((d) => unwrapList<MessSubscription>(d, "subscriptions")),
};

export const MESS_PLAN_TYPES = [
  "breakfast", "lunch", "dinner", "combined", "breakfast_lunch", "lunch_dinner", "full",
] as const;

export const MESS_PLAN_STATUSES = ["active", "inactive"] as const;
export const MENU_MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export function useMessPlans(admin = false) {
  const q = useAsync(() => (admin ? messApi.adminPlans() : messApi.plans()), [admin], {
    key: "mess:plans",
  });
  const [busy, setBusy] = React.useState(false);

  const wrap = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      invalidateFeature("mess");
      await q.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    plans: q.data ?? [],
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    busy,
    create: (body: { name: string; plan_type: string; price_per_month: number; description?: string }) =>
      wrap(() => messApi.createPlan(body), "Mess plan created"),
    update: (id: string, body: UpdatePlanInput) => wrap(() => messApi.updatePlan(id, body), "Mess plan updated"),
    remove: (id: string) => wrap(() => messApi.deletePlan(id), "Mess plan deleted"),
  };
}

/** Admin mess hook: daily menu, billing generation + report, and subscriptions. */
export function useAdminMess() {
  const [menuDate, setMenuDate] = React.useState<string>("");
  const menuQ = useAsync(
    () => (menuDate ? messApi.menuByDate(menuDate) : messApi.adminMenu()),
    [menuDate],
    { key: "mess:menu" },
  );
  const subsQ = useAsync(() => messApi.adminSubscriptions(), [], { key: "mess:subscriptions" });
  const [reportMonth, setReportMonth] = React.useState<string>("");
  const reportQ = useAsync(() => messApi.billingReport(reportMonth || undefined), [reportMonth], {
    key: "mess:billing",
  });
  const [busy, setBusy] = React.useState(false);

  const createMenu = async (body: CreateMenuInput) => {
    setBusy(true);
    try {
      await messApi.createMenu(body);
      toast.success("Menu entry added");
      invalidateFeature("mess");
      await menuQ.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const generateBilling = async (body: GenerateBillingInput) => {
    setBusy(true);
    try {
      const bills = await messApi.generateBilling(body);
      toast.success(`Generated ${Array.isArray(bills) ? bills.length : 0} bill(s)`);
      invalidateFeature("mess");
      await reportQ.refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    menu: menuQ.data ?? [],
    menuLoading: menuQ.loading,
    menuError: menuQ.error,
    menuDate,
    setMenuDate,
    subscriptions: subsQ.data ?? [],
    subsLoading: subsQ.loading,
    subsError: subsQ.error,
    report: reportQ.data ?? null,
    reportLoading: reportQ.loading,
    reportError: reportQ.error,
    reportMonth,
    setReportMonth,
    busy,
    createMenu,
    generateBilling,
  };
}

export function useMessMenu() {
  const q = useAsync(() => messApi.menu(), [], { key: "mess:menu" });
  return { menu: q.data ?? [], loading: q.loading, error: q.error };
}

/** Student mess hook: plan + available plans + billing, with change/subscribe/pay actions. */
export function useMyMess() {
  const planQ = useAsync(() => messApi.myPlan(), [], { key: "mess" });
  const plansQ = useAsync(() => messApi.plans(), [], { key: "mess:plans" });
  const billsQ = useAsync(() => messApi.billing(), [], { key: "mess:billing:my" });
  const [busy, setBusy] = React.useState(false);

  const refetch = async () => {
    await Promise.all([planQ.refetch(), billsQ.refetch()]);
  };

  const choosePlan = async (planId: string) => {
    setBusy(true);
    try {
      // Switch if already subscribed, otherwise create a subscription.
      if (planQ.data?.id) await messApi.changePlan(planId);
      else await messApi.subscribe(planId);
      toast.success("Mess plan updated");
      invalidateFeature("mess");
      await refetch();
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const payBill = async (id: string) => {
    setBusy(true);
    try {
      await messApi.payBill(id);
      toast.success("Bill paid");
      invalidateFeature("mess");
      await billsQ.refetch();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    plan: planQ.data ?? null,
    plans: plansQ.data ?? [],
    bills: billsQ.data ?? [],
    loading: planQ.loading || plansQ.loading,
    error: planQ.error,
    busy,
    choosePlan,
    payBill,
  };
}
