export type Lang = 'en' | 'kn'

export const T = {
  // Navigation
  dashboard: { en: 'Dashboard', kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  firSearch: { en: 'FIR Search', kn: 'ಎಫ್‌ಐಆರ್ ಹುಡುಕಾಟ' },
  aiAssistant: { en: 'AI Assistant', kn: 'AI ಸಹಾಯಕ' },
  analytics: { en: 'Analytics', kn: 'ವಿಶ್ಲೇಷಣೆ' },
  voiceAssistant: { en: 'Voice Assistant', kn: 'ಧ್ವನಿ ಸಹಾಯಕ' },
  adminPanel: { en: 'Admin Panel', kn: 'ನಿರ್ವಾಹಕ ಫಲಕ' },
  settings: { en: 'Settings', kn: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು' },
  // Landing
  searchPlaceholder: { en: 'Search Crime Number, FIR, Victim, Accused, Complainant, Police Station, District...', kn: 'ಅಪರಾಧ ಸಂಖ್ಯೆ, ಎಫ್‌ಐಆರ್, ಸಂತ್ರಸ್ತ, ಆರೋಪಿ, ದೂರುದಾರ, ಪೊಲೀಸ್ ಠಾಣೆ ಹುಡುಕಿ...' },
  search: { en: 'Search', kn: 'ಹುಡುಕಿ' },
  // Dashboard
  goodMorning: { en: 'Good morning', kn: 'ಶುಭೋದಯ' },
  totalFIRs: { en: 'Total FIRs', kn: 'ಒಟ್ಟು ಎಫ್‌ಐಆರ್‌ಗಳು' },
  activeInvestigations: { en: 'Active Investigations', kn: 'ಸಕ್ರಿಯ ತನಿಖೆಗಳು' },
  chargesheetsFileds: { en: 'Chargesheets Filed', kn: 'ಆರೋಪಪಟ್ಟಿ ಸಲ್ಲಿಕೆ' },
  arrestsMade: { en: 'Arrests Made', kn: 'ಬಂಧನಗಳು' },
  pendingCases: { en: 'Pending Cases', kn: 'ಬಾಕಿ ಪ್ರಕರಣಗಳು' },
  todayFIRs: { en: "Today's FIRs", kn: 'ಇಂದಿನ ಎಫ್‌ಐಆರ್‌ಗಳು' },
  successRate: { en: 'Success Rate', kn: 'ಯಶಸ್ಸಿನ ದರ' },
  quickActions: { en: 'Quick Actions', kn: 'ತ್ವರಿತ ಕ್ರಿಯೆಗಳು' },
  registerFIR: { en: 'Register FIR', kn: 'ಎಫ್‌ಐಆರ್ ನೋಂದಾಯಿಸಿ' },
  searchCases: { en: 'Search Cases', kn: 'ಪ್ರಕರಣ ಹುಡುಕಿ' },
  uploadEvidence: { en: 'Upload Evidence', kn: 'ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್' },
  reports: { en: 'Reports', kn: 'ವರದಿಗಳು' },
  recentFIRs: { en: 'Recent FIRs', kn: 'ಇತ್ತೀಚಿನ ಎಫ್‌ಐಆರ್‌ಗಳು' },
  viewAll: { en: 'View all', kn: 'ಎಲ್ಲಾ ನೋಡಿ' },
  // Search
  searchResults: { en: 'Search Results', kn: 'ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು' },
  showing: { en: 'Showing', kn: 'ತೋರಿಸಲಾಗುತ್ತಿದೆ' },
  results: { en: 'results', kn: 'ಫಲಿತಾಂಶಗಳು' },
  filters: { en: 'Filters', kn: 'ಫಿಲ್ಟರ್‌ಗಳು' },
  criminalNetwork: { en: 'Criminal Network', kn: 'ಅಪರಾಧಿ ಜಾಲ' },
  associates: { en: 'Known Associates', kn: 'ಪರಿಚಿತ ಸಹಚರರು' },
  coAccused: { en: 'Co-accused in cases', kn: 'ಜಂಟಿ ಆರೋಪಿಗಳು' },
  // Voice
  voiceTyping: { en: 'Voice Typing Assistant', kn: 'ಧ್ವನಿ ಟೈಪಿಂಗ್ ಸಹಾಯಕ' },
  startListening: { en: 'Start Listening', kn: 'ಆಲಿಸಲು ಪ್ರಾರಂಭಿಸಿ' },
  stopListening: { en: 'Stop Listening', kn: 'ಆಲಿಸುವುದನ್ನು ನಿಲ್ಲಿಸಿ' },
  // AI
  exportPDF: { en: 'Export PDF', kn: 'PDF ರಫ್ತು' },
  newInvestigation: { en: 'New Investigation', kn: 'ಹೊಸ ತನಿಖೆ' },
  clearChat: { en: 'Clear Chat', kn: 'ಚಾಟ್ ತೆರವುಗೊಳಿಸಿ' },
  // Common
  open: { en: 'Open', kn: 'ತೆರೆದಿದೆ' },
  closed: { en: 'Closed', kn: 'ಮುಚ್ಚಲಾಗಿದೆ' },
  language: { en: 'EN', kn: 'ಕನ್ನಡ' },
} as const

export function t(key: keyof typeof T, lang: Lang): string {
  return T[key][lang]
}
