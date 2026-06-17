"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useTheme } from "next-themes";
import { Download, ChevronDown, X, Mail, Users, User } from "lucide-react";

export interface Contact {
  id: string;
  name: string;
  email: string;
  connectionStrength: "Very weak" | "Weak" | "Good" | "Very strong";
  twitterFollowers: number;
  description?: string;
}

interface ContactsTableProps {
  title?: string;
  contacts?: Contact[];
  onContactSelect?: (contactId: string) => void;
  className?: string;
  enableAnimations?: boolean;
}

const defaultContacts: Contact[] = [
  { id: "1", name: "Pierre from Claap", email: "pierre@claap.io", connectionStrength: "Weak", twitterFollowers: 2400, description: "Tech entrepreneur and investor" },
  { id: "2", name: "HardwareSavvy", email: "hardwaresavvy@andr.io", connectionStrength: "Very strong", twitterFollowers: 8900, description: "Hardware specialist" },
  { id: "3", name: "Voiceform", email: "harrison@voiceform.co", connectionStrength: "Good", twitterFollowers: 5200, description: "Voice technology expert" },
  { id: "4", name: "Marketer Milk", email: "hi@marketmilk.com", connectionStrength: "Good", twitterFollowers: 6100, description: "Marketing strategist" },
  { id: "5", name: "Allen from CAST AI", email: "allen@mail.cast.ai", connectionStrength: "Weak", twitterFollowers: 3300, description: "AI infrastructure lead" },
  { id: "6", name: "Sarah Chen", email: "sarah.chen@techvault.com", connectionStrength: "Very strong", twitterFollowers: 12400, description: "CEO and founder" },
];

type SortField = "name" | "connectionStrength" | "twitterFollowers";
type SortOrder = "asc" | "desc";

export function ContactsTable({
  title = "Person",
  contacts: initialContacts = defaultContacts,
  onContactSelect,
  className = "",
  enableAnimations = true,
}: ContactsTableProps = {}) {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterStrength, setFilterStrength] = useState<string | null>(null);
  const [selectedContactDetail, setSelectedContactDetail] = useState<Contact | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleContactSelect = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
    onContactSelect?.(contactId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setShowSortMenu(false);
    setCurrentPage(1);
  };

  const handleFilter = (strength: string | null) => {
    setFilterStrength(strength);
    setShowFilterMenu(false);
    setCurrentPage(1);
  };

  const sortedAndFilteredContacts = useMemo(() => {
    let filtered = [...initialContacts];
    if (filterStrength) filtered = filtered.filter((c) => c.connectionStrength === filterStrength);
    if (!sortField) return filtered;

    return filtered.sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (sortField === "connectionStrength") {
        const strengthMap = { "Very weak": 0, Weak: 1, Good: 2, "Very strong": 3 };
        aVal = strengthMap[aVal as keyof typeof strengthMap];
        bVal = strengthMap[bVal as keyof typeof strengthMap];
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [initialContacts, sortField, sortOrder, filterStrength]);

  const paginatedContacts = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedAndFilteredContacts.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [sortedAndFilteredContacts, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredContacts.length / ITEMS_PER_PAGE);

  const handleSelectAll = () => {
    if (selectedContacts.length === paginatedContacts.length) setSelectedContacts([]);
    else setSelectedContacts(paginatedContacts.map((c) => c.id));
  };

  const getStrengthColor = (strength: string) => {
    const map: Record<string, { bgColor: string; textColor: string; dotColor: string }> = {
      "Very weak": { bgColor: isDark ? "bg-red-500/10" : "bg-red-50", textColor: isDark ? "text-red-400" : "text-red-600", dotColor: isDark ? "bg-red-400" : "bg-red-600" },
      Weak: { bgColor: isDark ? "bg-orange-500/10" : "bg-orange-50", textColor: isDark ? "text-orange-400" : "text-orange-600", dotColor: isDark ? "bg-orange-400" : "bg-orange-600" },
      Good: { bgColor: isDark ? "bg-blue-500/10" : "bg-blue-50", textColor: isDark ? "text-blue-400" : "text-blue-600", dotColor: isDark ? "bg-blue-400" : "bg-blue-600" },
      "Very strong": { bgColor: isDark ? "bg-green-500/10" : "bg-green-50", textColor: isDark ? "text-green-400" : "text-green-600", dotColor: isDark ? "bg-green-400" : "bg-green-600" },
    };
    return map[strength] ?? map.Good;
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Connection Strength", "Twitter Followers", "Description"];
    const rows = sortedAndFilteredContacts.map((c) => [c.name, c.email, c.connectionStrength, c.twitterFollowers, c.description || ""]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const shouldAnimate = enableAnimations && !shouldReduceMotion;

  const containerVariants = { visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } };
  const rowVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.7 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <div className={`mx-auto w-full max-w-7xl ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/30 ${filterStrength ? "ring-2 ring-primary/30" : ""}`}>
              Filter {filterStrength && <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">1</span>}
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 z-20 mt-1 w-44 rounded-md border border-border/50 bg-background py-1 shadow-lg">
                  <button onClick={() => handleFilter(null)} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${!filterStrength ? "bg-muted/30" : ""}`}>All Connections</button>
                  <div className="my-1 h-px bg-border/30" />
                  {["Very strong", "Good", "Weak", "Very weak"].map((s) => (
                    <button key={s} onClick={() => handleFilter(s)} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${filterStrength === s ? "bg-muted/30" : ""}`}>{s}</button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)} className="flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/30">
              Sort {sortField && <span className="ml-1 rounded-sm bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">1</span>}
              <ChevronDown size={14} className="opacity-50" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border/50 bg-background py-1 shadow-lg">
                  <button onClick={() => handleSort("name")} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${sortField === "name" ? "bg-muted/30" : ""}`}>Name {sortField === "name" && `(${sortOrder === "asc" ? "A-Z" : "Z-A"})`}</button>
                  <button onClick={() => handleSort("connectionStrength")} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${sortField === "connectionStrength" ? "bg-muted/30" : ""}`}>Connection {sortField === "connectionStrength" && `(${sortOrder === "asc" ? "↑" : "↓"})`}</button>
                  <button onClick={() => handleSort("twitterFollowers")} className={`w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${sortField === "twitterFollowers" ? "bg-muted/30" : ""}`}>Followers {sortField === "twitterFollowers" && `(${sortOrder === "asc" ? "↑" : "↓"})`}</button>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/30">
              <Download size={14} /> Export <ChevronDown size={14} className="opacity-50" />
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 z-20 mt-1 w-32 rounded-md border border-border/50 bg-background shadow-lg">
                  <button onClick={() => { exportToCSV(); setShowExportMenu(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50">CSV</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-background">
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid border-b border-border/30 bg-muted/5 px-3 py-3 text-xs font-medium text-muted-foreground/60" style={{ gridTemplateColumns: "40px 1fr 160px 140px 1fr" }}>
              <div className="flex items-center justify-center border-r border-border/20 pr-3">
                <input type="checkbox" className="size-4 cursor-pointer rounded border-border/40"
                  checked={paginatedContacts.length > 0 && selectedContacts.length === paginatedContacts.length} onChange={handleSelectAll} />
              </div>
              <div className="border-r border-border/20 px-3">{title}</div>
              <div className="border-r border-border/20 px-3">Connection</div>
              <div className="border-r border-border/20 px-3">Followers</div>
              <div className="px-3">Email</div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`page-${currentPage}`} variants={shouldAnimate ? containerVariants : {}} initial={shouldAnimate ? "hidden" : "visible"} animate="visible">
                {paginatedContacts.map((contact) => {
                  const { bgColor, textColor, dotColor } = getStrengthColor(contact.connectionStrength);
                  return (
                    <motion.div key={contact.id} variants={shouldAnimate ? rowVariants : {}}>
                      <div className={`grid border-b border-border/20 px-3 py-3.5 transition-all ${selectedContacts.includes(contact.id) ? "bg-muted/30" : "bg-muted/5 hover:bg-muted/20"}`}
                        style={{ gridTemplateColumns: "40px 1fr 160px 140px 1fr", alignItems: "center" }}>
                        <div className="flex items-center justify-center border-r border-border/20 pr-3">
                          <input type="checkbox" className="size-4 cursor-pointer rounded border-border/40" checked={selectedContacts.includes(contact.id)} onChange={() => handleContactSelect(contact.id)} />
                        </div>
                        <div className="min-w-0 border-r border-border/20 px-3">
                          <button onClick={() => setSelectedContactDetail(contact)} className="truncate text-sm text-foreground hover:underline">{contact.name}</button>
                        </div>
                        <div className="border-r border-border/20 px-3">
                          <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${bgColor} ${textColor}`}>
                            <div className={`size-1.5 rounded-full ${dotColor}`} />{contact.connectionStrength}
                          </div>
                        </div>
                        <div className="border-r border-border/20 px-3 text-sm text-foreground/80">{contact.twitterFollowers.toLocaleString()}</div>
                        <div className="min-w-0 px-3"><a href={`mailto:${contact.email}`} className="truncate text-sm text-blue-500 hover:text-blue-600">{contact.email}</a></div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selectedContactDetail && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setSelectedContactDetail(null)}>
              <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
                className="relative mx-6 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setSelectedContactDetail(null)} className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-muted/50 hover:bg-muted/70">
                  <X className="size-3 text-muted-foreground" />
                </button>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10"><User className="size-6 text-primary" /></div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedContactDetail.name}</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center gap-1.5"><Mail className="size-3.5 text-muted-foreground" /><span className="text-xs uppercase tracking-wide text-muted-foreground">Email</span></div>
                      <a href={`mailto:${selectedContactDetail.email}`} className="text-sm text-blue-500 hover:text-blue-600">{selectedContactDetail.email}</a>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-1.5"><Users className="size-3.5 text-muted-foreground" /><span className="text-xs uppercase tracking-wide text-muted-foreground">Followers</span></div>
                      <p className="text-sm font-medium text-foreground">{selectedContactDetail.twitterFollowers.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="text-xs text-muted-foreground/70">Page {currentPage} of {totalPages} • {sortedAndFilteredContacts.length} contacts</div>
          <div className="flex gap-1.5">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="rounded-md border border-border/50 bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="rounded-md border border-border/50 bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
