export type Lang = 'en' | 'kn';
export const dict = {
  en: {
    open: 'Open', save: 'Save', cancel: 'Cancel', search: 'Search', all: 'All', status: 'Status', loading: 'Loading...', email: 'Email', password: 'Password',
    signup: 'Create citizen account', logout: 'Logout', myComplaints: 'My complaints', officer: 'Officer', noData: 'No records found',
    tagline: 'Track police complaints with automatic deadlines, SMS reminders and escalation to senior officers.',
    f1: 'Automatic deadlines', f2: 'SMS reminders', f3: 'Escalation to senior officers', demoNote: 'Demo logins are listed in the README.',
    appName: 'Smart Police Complaint Tracker', submit: 'Submit Complaint', track: 'Track Complaint', login: 'Login',
    name: 'Full name', mobile: 'Mobile number', category: 'Category', location: 'Location', description: 'Description',
    trackingId: 'Tracking ID', dueDate: 'Due date', submittedOn: 'Submitted on', remarks: 'Remarks',
    'cat.Cybercrime': 'Cybercrime', 'cat.Financial Fraud': 'Financial Fraud', 'cat.Lost Property': 'Lost Property', 'cat.Traffic Complaints': 'Traffic Complaints',
    'st.Submitted': 'Submitted', 'st.Assigned': 'Assigned', 'st.In Progress': 'In Progress', 'st.Resolved': 'Resolved', 'st.Overdue': 'Overdue', 'st.Escalated': 'Escalated',
    total: 'Total', pending: 'Pending', resolved: 'Resolved', overdue: 'Overdue', escalated: 'Escalated',
    escalationHistory: 'Escalation history', reminderHistory: 'Reminder history', advance3: 'Advance Demo Time +3 Days', advance1: 'Advance Demo Time +1 Day',
    required: 'This field is required', invalidMobile: 'Enter a valid 10-digit mobile number', success: 'Complaint submitted successfully', error: 'Something went wrong. Please try again.',
    reminderMsg: 'Reminder: Complaint ID #{id} has reached its deadline and is still pending.',
  },
  kn: {
    open: 'ತೆರೆಯಿರಿ', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದುಮಾಡಿ', search: 'ಹುಡುಕಿ', all: 'ಎಲ್ಲಾ', status: 'ಸ್ಥಿತಿ', loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', email: 'ಇಮೇಲ್', password: 'ಪಾಸ್‌ವರ್ಡ್',
    signup: 'ನಾಗರಿಕ ಖಾತೆ ರಚಿಸಿ', logout: 'ಲಾಗ್ ಔಟ್', myComplaints: 'ನನ್ನ ದೂರುಗಳು', officer: 'ಅಧಿಕಾರಿ', noData: 'ಯಾವುದೇ ದಾಖಲೆ ಸಿಗಲಿಲ್ಲ',
    tagline: 'ಸ್ವಯಂಚಾಲಿತ ಗಡುವು, SMS ಜ್ಞಾಪನೆ ಮತ್ತು ಮೇಲಧಿಕಾರಿಗಳಿಗೆ ಉನ್ನತೀಕರಣದೊಂದಿಗೆ ಪೊಲೀಸ್ ದೂರುಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
    f1: 'ಸ್ವಯಂಚಾಲಿತ ಗಡುವು', f2: 'SMS ಜ್ಞಾಪನೆಗಳು', f3: 'ಮೇಲಧಿಕಾರಿಗಳಿಗೆ ಉನ್ನತೀಕರಣ', demoNote: 'ಡೆಮೋ ಲಾಗಿನ್‌ಗಳು README ನಲ್ಲಿವೆ.',
    appName: 'ಸ್ಮಾರ್ಟ್ ಪೊಲೀಸ್ ದೂರು ಟ್ರ್ಯಾಕರ್', submit: 'ದೂರು ಸಲ್ಲಿಸಿ', track: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', login: 'ಲಾಗಿನ್',
    name: 'ಪೂರ್ಣ ಹೆಸರು', mobile: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', category: 'ವರ್ಗ', location: 'ಸ್ಥಳ', description: 'ವಿವರಣೆ',
    trackingId: 'ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿ', dueDate: 'ಅಂತಿಮ ದಿನಾಂಕ', submittedOn: 'ಸಲ್ಲಿಸಿದ ದಿನಾಂಕ', remarks: 'ಟಿಪ್ಪಣಿಗಳು',
    'cat.Cybercrime': 'ಸೈಬರ್ ಅಪರಾಧ', 'cat.Financial Fraud': 'ಆರ್ಥಿಕ ವಂಚನೆ', 'cat.Lost Property': 'ಕಳೆದುಹೋದ ಆಸ್ತಿ', 'cat.Traffic Complaints': 'ಸಂಚಾರ ದೂರುಗಳು',
    'st.Submitted': 'ಸಲ್ಲಿಸಲಾಗಿದೆ', 'st.Assigned': 'ನಿಯೋಜಿಸಲಾಗಿದೆ', 'st.In Progress': 'ಪ್ರಗತಿಯಲ್ಲಿದೆ', 'st.Resolved': 'ಪರಿಹರಿಸಲಾಗಿದೆ', 'st.Overdue': 'ಗಡುವು ಮೀರಿದೆ', 'st.Escalated': 'ಮೇಲಧಿಕಾರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    total: 'ಒಟ್ಟು', pending: 'ಬಾಕಿ', resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ', overdue: 'ಗಡುವು ಮೀರಿದೆ', escalated: 'ಮೇಲಧಿಕಾರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    escalationHistory: 'ಉನ್ನತೀಕರಣ ಇತಿಹಾಸ', reminderHistory: 'ಜ್ಞಾಪನೆ ಇತಿಹಾಸ', advance3: 'ಡೆಮೋ ಸಮಯ +3 ದಿನ ಮುಂದೆ', advance1: 'ಡೆಮೋ ಸಮಯ +1 ದಿನ ಮುಂದೆ',
    required: 'ಈ ಕ್ಷೇತ್ರ ಕಡ್ಡಾಯವಾಗಿದೆ', invalidMobile: 'ಮಾನ್ಯವಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ', success: 'ದೂರು ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಸಲಾಗಿದೆ', error: 'ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.',
    reminderMsg: 'ಜ್ಞಾಪನೆ: ದೂರು ಐಡಿ #{id} ಗಡುವು ತಲುಪಿದೆ ಮತ್ತು ಇನ್ನೂ ಬಾಕಿ ಇದೆ.',
  },
} as const;
export const t = (l: Lang, k: keyof typeof dict.en) => dict[l][k] ?? dict.en[k];
