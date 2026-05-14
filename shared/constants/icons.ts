/* This file exports the icons used throughout the app as a single source of truth of icons */

// ~/constants/icons.ts

export const ICONS = {
  // =========================
  // Core Academic Entities
  // =========================
  students: "lucide:users",
  student: "lucide:user",
  class: "lucide:presentation",
  subject: "lucide:book-open",

  // Tabler has stronger academic/file variants
  result: "tabler:report-analytics",
  scoresheet: "tabler:table-export",

  session: "lucide:calendar-range",
  term: "lucide:calendar-days",

  teacher: "lucide:user-check",
  admin: "lucide:shield-check",

  school: "lucide:building-2",
  department: "lucide:building",
  classroom: "tabler:chalkboard",
  curriculum: "tabler:books",

  // =========================
  // Result Management
  // =========================
  approve: "lucide:check-circle-2",
  publish: "tabler:rosette-discount-check",
  reject: "lucide:x-circle",
  decline: "lucide:x-circle",
  pending: "lucide:clock",

  grading: "tabler:checklist",
  grade: "lucide:trophy",
  gradesheet: "tabler:report",
  transcript: "tabler:file-certificate",

  position: "tabler:podium",
  rank: "tabler:award",

  performance: "lucide:trending-up",
  analytics: "lucide:bar-chart-3",
  statistics: "lucide:chart-pie",

  average: "tabler:math-function",
  attendance: "tabler:calendar-check",

  comment: "lucide:message-square",
  remark: "lucide:file-text",

  // =========================
  // Student Lifecycle
  // =========================
  promote: "lucide:arrow-up-circle",
  demote: "lucide:arrow-down-circle",

  graduate: "tabler:school",
  admission: "tabler:user-plus",
  enrollment: "lucide:user-plus",
  withdrawal: "lucide:user-minus",

  alumni: "tabler:users-group",

  // =========================
  // Authentication & Security
  // =========================
  credentials: "lucide:key-round",
  login: "lucide:log-in",
  logout: "lucide:log-out",

  password: "tabler:password",
  security: "lucide:shield",
  permissions: "lucide:shield-check",
  verified: "tabler:verified",

  userRole: "tabler:user-shield",

  // =========================
  // CRUD Actions
  // =========================
  add: "lucide:plus",
  create: "lucide:plus",
  new: "lucide:plus",

  edit: "lucide:pencil",
  update: "tabler:edit-circle",

  delete: "lucide:trash-2",
  remove: "lucide:trash-2",

  save: "lucide:save",
  cancel: "lucide:x",
  close: "lucide:x",

  view: "lucide:eye",
  hide: "lucide:eye-off",

  duplicate: "lucide:copy",
  archive: "lucide:archive",
  restore: "lucide:rotate-ccw",

  // =========================
  // Navigation & UI
  // =========================
  dashboard: "lucide:layout-dashboard",
  home: "lucide:house",

  menu: "lucide:menu",
  more: "lucide:more-horizontal",

  back: "lucide:arrow-left",
  forward: "lucide:arrow-right",

  up: "lucide:chevron-up",
  down: "lucide:chevron-down",

  next: "lucide:chevron-right",
  previous: "lucide:chevron-left",

  expand: "lucide:maximize-2",
  collapse: "lucide:minimize-2",
  fullscreen: "tabler:maximize",

  sidebar: "tabler:layout-sidebar-left-expand",

  // =========================
  // Search / Filter / Sort
  // =========================
  search: "lucide:search",
  filter: "lucide:sliders-horizontal",

  sort: "tabler:arrows-sort",
  ascending: "lucide:arrow-up",
  descending: "lucide:arrow-down",

  refresh: "lucide:refresh-cw",

  loading: "lucide:loader-2",

  sync: "tabler:arrows-exchange",
  history: "lucide:history",

  // =========================
  // Files & Export
  // =========================
  print: "lucide:printer",

  pdf: "tabler:file-type-pdf",

  export: "lucide:download",
  import: "lucide:upload",

  upload: "lucide:upload-cloud",
  download: "lucide:download-cloud",

  attachment: "lucide:paperclip",

  spreadsheet: "tabler:file-spreadsheet",
  document: "lucide:file-text",

  report: "tabler:file-analytics",

  folder: "lucide:folder",
  folders: "lucide:folders",

  // =========================
  // Communication
  // =========================
  notification: "lucide:bell",
  announcements: "lucide:megaphone",

  message: "lucide:message-circle",
  email: "lucide:mail",
  phone: "lucide:phone",

  // =========================
  // Finance (Optional)
  // =========================
  payment: "lucide:credit-card",
  invoice: "tabler:receipt-2",
  wallet: "lucide:wallet",
  fees: "tabler:cash-banknote",

  // =========================
  // Academic Utilities
  // =========================
  calendar: "lucide:calendar",
  schedule: "tabler:calendar-time",

  time: "lucide:clock-3",

  exam: "tabler:clipboard-text",
  assignment: "tabler:notebook",

  lessonNote: "tabler:notebook",
  library: "tabler:books",
  laboratory: "tabler:flask",

  sport: "tabler:barbell",
  hostel: "tabler:bed",
  transport: "tabler:bus",

  health: "tabler:heartbeat",

  // =========================
  // Status Indicators
  // =========================
  success: "lucide:check-circle",
  warning: "lucide:triangle-alert",
  error: "lucide:alert-circle",
  info: "lucide:info",

  active: "tabler:circle-check",
  inactive: "tabler:circle-x",

  online: "tabler:wifi",
  offline: "tabler:wifi-off",

  // =========================
  // Tags & Labels
  // =========================
  tag: "lucide:tag",
  labels: "lucide:tags",

  bookmark: "lucide:bookmark",
  favorite: "lucide:star",

  // =========================
  // Settings
  // =========================
  settings: "lucide:settings-2",
  preferences: "tabler:adjustments",
  theme: "lucide:palette",
  language: "tabler:language",

  // =========================
  // Helpers
  // =========================
  empty: "tabler:inbox",
  help: "lucide:circle-help",

  faq: "tabler:message-question",
  support: "lucide:life-buoy",
} as const;

export type IconName = keyof typeof ICONS;
