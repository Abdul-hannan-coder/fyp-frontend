"use client";

import * as React from "react";
import { toast } from "sonner";
import { API_URL, http, tokenStore, unwrapList } from "@/lib/http";
import { useAsync } from "@/lib/useAsync";
import { invalidateFeature } from "@/lib/cache";

export type StudentRecord = {
  id: string;
  user_id: string;
  student_id?: string;
  department?: string;
  year_of_study?: number;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  admission_date?: string;
  profile_image_url?: string | null;
  createdAt?: string;
  user?: { id: string; full_name: string; email: string; phone?: string; is_active?: boolean };
};

export type StudentDocument = {
  id: string;
  student_id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at?: string;
  createdAt?: string;
};

export type EmergencyContact = {
  id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  is_primary?: boolean;
};

export type ContactInput = {
  contact_name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary?: boolean;
};

export type ImportResult = {
  imported: number;
  failed: number;
  total: number;
  success: unknown[];
  errors: unknown[];
};

export type StudentProfileInput = {
  user_id?: string;
  student_id: string;
  date_of_birth: string;
  gender: string;
  admission_date: string;
  department?: string;
  year_of_study?: number;
  blood_group?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
};

export const studentsApi = {
  // The list endpoint is role-scoped: a student sees only their own record.
  list: () => http.get<unknown>("/students?limit=100").then((d) => unwrapList<StudentRecord>(d, "students")),
  getById: (id: string) =>
    http.get<{ student: StudentRecord } | StudentRecord>(`/students/${id}`).then((d) =>
      d && "student" in d ? d.student : (d as StudentRecord),
    ),
  createProfile: (body: StudentProfileInput) => http.post<{ student: StudentRecord }>("/students", body),
  updateProfile: (id: string, body: Partial<StudentProfileInput>) =>
    http.put<{ student: StudentRecord }>(`/students/${id}`, body),
  documents: (id: string) =>
    http.get<unknown>(`/students/${id}/documents`).then((d) => unwrapList<StudentDocument>(d, "documents")),
  uploadDocument: (id: string, form: FormData) =>
    http.post<StudentDocument>(`/students/${id}/documents`, form, { isForm: true }),
  deleteDocument: (id: string, documentId: string) =>
    http.del<null>(`/students/${id}/documents/${documentId}`),
  uploadProfilePhoto: (id: string, file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return http.post<{ student: StudentRecord } | StudentRecord>(`/students/${id}/profile-photo`, form, { isForm: true });
  },

  // CSV bulk operations.
  // Export returns raw CSV text (not the JSON envelope), so it can't go through `http`.
  exportCsv: async () => {
    const res = await fetch(`${API_URL}/students/export/csv`, {
      headers: tokenStore.access ? { Authorization: `Bearer ${tokenStore.access}` } : {},
    });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
  importCsv: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http.post<ImportResult>("/students/import/csv", form, { isForm: true });
  },

  contacts: (id: string) =>
    http.get<unknown>(`/students/${id}/emergency-contacts`).then((d) => unwrapList<EmergencyContact>(d, "contacts")),
  addContact: (id: string, body: ContactInput) =>
    http.post<EmergencyContact>(`/students/${id}/emergency-contacts`, body),
  updateContact: (id: string, contactId: string, body: Partial<ContactInput>) =>
    http.put<EmergencyContact>(`/students/${id}/emergency-contacts/${contactId}`, body),
  deleteContact: (id: string, contactId: string) =>
    http.del<null>(`/students/${id}/emergency-contacts/${contactId}`),
};

/** Loads the signed-in student's own record + emergency contacts, with contact CRUD. */
export function useMyProfile() {
  const recordQ = useAsync(() => studentsApi.list(), [], { key: "students" });
  const record = recordQ.data?.[0] ?? null;

  const contactsQ = useAsync(() => studentsApi.contacts(record!.id), [record?.id], {
    enabled: !!record?.id,
    key: record?.id ? `students:${record.id}:contacts` : undefined,
  });
  const [busy, setBusy] = React.useState(false);

  const addContact = async (body: ContactInput) => {
    if (!record?.id) return false;
    setBusy(true);
    try {
      await studentsApi.addContact(record.id, body);
      toast.success("Contact added");
      invalidateFeature("students");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const removeContact = async (contactId: string) => {
    if (!record?.id) return;
    setBusy(true);
    try {
      await studentsApi.deleteContact(record.id, contactId);
      toast.success("Contact removed");
      invalidateFeature("students");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!record?.id) {
      toast.error("Your student profile isn't ready yet.");
      return false;
    }
    setBusy(true);
    try {
      await studentsApi.uploadProfilePhoto(record.id, file);
      toast.success("Profile photo updated");
      invalidateFeature("students");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Update the student record's personal + guardian fields.
  const updateRecord = async (body: Partial<StudentProfileInput>) => {
    if (!record?.id) {
      toast.error("Your student profile isn't ready yet.");
      return false;
    }
    setBusy(true);
    try {
      await studentsApi.updateProfile(record.id, body);
      invalidateFeature("students");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    record,
    contacts: contactsQ.data ?? [],
    loading: recordQ.loading || contactsQ.loading,
    busy,
    addContact,
    removeContact,
    uploadPhoto,
    updateRecord,
  };
}

/** Admin-only CSV export/import of the student roster, with busy state + toasts. */
export function useStudentCsv(onImported?: () => void) {
  const [busy, setBusy] = React.useState(false);

  const exportCsv = async () => {
    setBusy(true);
    try {
      await studentsApi.exportCsv();
      toast.success("Students exported");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async (file: File) => {
    setBusy(true);
    try {
      const res = await studentsApi.importCsv(file);
      toast.success(`Imported ${res.imported} of ${res.total}${res.failed ? ` (${res.failed} failed)` : ""}`);
      invalidateFeature("students");
      onImported?.();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return { busy, exportCsv, importCsv };
}

/**
 * Resolves the signed-in student's own record id, then loads their documents.
 * Used by the student documents page.
 */
export function useMyDocuments() {
  const recordQ = useAsync(() => studentsApi.list(), [], { key: "students" });
  const record = recordQ.data?.[0] ?? null;

  const docsQ = useAsync(() => studentsApi.documents(record!.id), [record?.id], {
    enabled: !!record?.id,
    key: record?.id ? `students:${record.id}:documents` : undefined,
  });

  const [busy, setBusy] = React.useState(false);

  const upload = async (file: File, documentType: string, documentName?: string) => {
    if (!record?.id) {
      toast.error("Your student profile isn't ready yet.");
      return false;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("document", file);
      form.append("document_type", documentType);
      if (documentName) form.append("document_name", documentName);
      await studentsApi.uploadDocument(record.id, form);
      toast.success("Document uploaded");
      invalidateFeature("students");
      return true;
    } catch (err) {
      toast.error((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const remove = async (documentId: string) => {
    if (!record?.id) return;
    setBusy(true);
    try {
      await studentsApi.deleteDocument(record.id, documentId);
      toast.success("Document removed");
      invalidateFeature("students");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return {
    record,
    documents: docsQ.data ?? [],
    loading: recordQ.loading || docsQ.loading,
    error: recordQ.error || docsQ.error,
    busy,
    upload,
    remove,
  };
}
