export const DISTRICTS = [
  'Bengaluru Urban', 'Bengaluru Rural', 'Mysuru', 'Tumakuru', 'Kalaburagi',
  'Belagavi', 'Mangaluru', 'Hubballi-Dharwad', 'Ballari', 'Vijayapura',
  'Shivamogga', 'Davanagere', 'Chitradurga', 'Hassan', 'Mandya',
  'Raichur', 'Bidar', 'Yadgir', 'Gadag', 'Haveri', 'Uttara Kannada',
  'Chikkamagaluru', 'Udupi', 'Kodagu', 'Chamarajanagar'
];

export const POLICE_STATIONS: Record<string, string[]> = {
  'Bengaluru Urban': ['Cubbon Park PS', 'Indiranagar PS', 'Whitefield PS', 'Electronic City PS', 'Koramangala PS', 'Jayanagar PS', 'Rajajinagar PS', 'Majestic PS', 'Shivajinagar PS', 'HSR Layout PS'],
  'Mysuru': ['Devaraja PS', 'Nazarbad PS', 'V.V. Mohalla PS', 'Jayalakshmipuram PS', 'Udayagiri PS'],
  'Mangaluru': ['Mangaluru North PS', 'Mangaluru South PS', 'Bunder PS', 'Panjimogaru PS', 'Kulur PS'],
  'Hubballi-Dharwad': ['Hubballi Town PS', 'Keshwapur PS', 'Gokul PS', 'Dharwad PS', 'Vidyanagar PS'],
  'Belagavi': ['Belagavi City PS', 'Shahpur PS', 'Tilakwadi PS', 'Kakati PS', 'Ramadurga PS'],
};

export const CRIME_CATEGORIES = [
  'Crime Against Body', 'Crime Against Property', 'Cybercrimes',
  'Economic Offences', 'Crime Against Women', 'Crime Against Children',
  'Drug Offences', 'Traffic Violations', 'Organized Crime',
  'Terrorism Related', 'Land Disputes', 'ATM Frauds'
];

export const CRIME_HEADS = [
  'Murder', 'Attempt to Murder', 'Culpable Homicide', 'Rape', 'POCSO',
  'Robbery', 'Dacoity', 'Burglary', 'Theft', 'Chain Snatching',
  'Cheating', 'Fraud', 'Extortion', 'Kidnapping', 'Missing Person',
  'Assault', 'Domestic Violence', 'Dowry Harassment', 'Cyber Fraud',
  'Drug Peddling', 'Arms Act', 'Eve Teasing', 'Stalking', 'Hit and Run'
];

export const SECTIONS = [
  { act: 'IPC', section: '302', description: 'Punishment for Murder' },
  { act: 'IPC', section: '307', description: 'Attempt to Murder' },
  { act: 'IPC', section: '376', description: 'Rape' },
  { act: 'IPC', section: '420', description: 'Cheating and dishonestly inducing delivery of property' },
  { act: 'IPC', section: '379', description: 'Theft' },
  { act: 'IPC', section: '380', description: 'Theft in a dwelling house' },
  { act: 'IPC', section: '392', description: 'Robbery' },
  { act: 'IPC', section: '395', description: 'Dacoity' },
  { act: 'IPC', section: '354', description: 'Assault or use of criminal force with intent to outrage modesty' },
  { act: 'IPC', section: '498A', description: 'Cruelty by husband or his relatives' },
  { act: 'POCSO', section: '4', description: 'Penetrative sexual assault' },
  { act: 'POCSO', section: '8', description: 'Sexual assault' },
  { act: 'IT Act', section: '66C', description: 'Identity theft' },
  { act: 'IT Act', section: '66D', description: 'Cheating by personation using computer resource' },
  { act: 'NDPS', section: '20', description: 'Punishment for contravention of provisions in relation to cannabis' },
];

export const OFFICERS = [
  { id: 'OFF001', name: 'Rajesh Kumar S', rank: 'Inspector', station: 'Cubbon Park PS', badge: 'KAR/INS/2456' },
  { id: 'OFF002', name: 'Priya Nair M', rank: 'Sub Inspector', station: 'Indiranagar PS', badge: 'KAR/SI/3891' },
  { id: 'OFF003', name: 'Manjunath B H', rank: 'Inspector', station: 'Koramangala PS', badge: 'KAR/INS/1234' },
  { id: 'OFF004', name: 'Suma Reddy G', rank: 'Sub Inspector', station: 'Whitefield PS', badge: 'KAR/SI/5678' },
  { id: 'OFF005', name: 'Venkatesh Rao K', rank: 'Inspector', station: 'Jayanagar PS', badge: 'KAR/INS/9012' },
  { id: 'OFF006', name: 'Deepa Krishnamurthy', rank: 'Sub Inspector', station: 'HSR Layout PS', badge: 'KAR/SI/3456' },
];

export const FIRS: FIR[] = [
  {
    id: 'FIR-001',
    crimeNumber: 'CR-No.142/2024',
    caseNumber: 'CASE/BLR/2024/142',
    firCategory: 'Heinous Crime',
    registrationDate: '2024-03-15',
    incidentDate: '2024-03-14',
    incidentTime: '23:45',
    status: 'Under Investigation',
    gravity: 'Heinous',
    crimeHead: 'Murder',
    crimeCategory: 'Crime Against Body',
    policeStation: 'Koramangala PS',
    district: 'Bengaluru Urban',
    investigatingOfficer: OFFICERS[2],
    briefFacts: 'On 14.03.2024 at 23:45 hrs, the complainant Suresh Babu reported that his neighbour Ravi Kumar was found dead in his residence at No. 45, 5th Block, Koramangala, with multiple stab wounds on his body. Based on the complaint, case registered under Sec. 302 IPC.',
    latitude: 12.9352,
    longitude: 77.6245,
    location: 'No. 45, 5th Block, Koramangala, Bengaluru - 560095',
    complainants: [
      { name: 'Suresh Babu V', age: 42, gender: 'Male', occupation: 'Software Engineer', religion: 'Hindu', caste: 'Vokkaliga', address: 'No. 46, 5th Block, Koramangala', phone: '9876543210' }
    ],
    victims: [
      { name: 'Ravi Kumar M', age: 38, gender: 'Male', isPolicePersonnel: false, occupation: 'Businessman', address: 'No. 45, 5th Block, Koramangala', injuries: 'Multiple stab wounds on chest and abdomen' }
    ],
    accused: [
      { accusedNo: 'A1', name: 'Santhosh Hegde', age: 35, gender: 'Male', address: 'No. 12, HSR Layout', arrestStatus: 'Arrested', arrestDate: '2024-03-17' },
      { accusedNo: 'A2', name: 'Kiran Kumar B', age: 28, gender: 'Male', address: 'Unknown', arrestStatus: 'Wanted', arrestDate: null }
    ],
    sections: [
      { act: 'IPC', section: '302', description: 'Punishment for Murder' },
      { act: 'IPC', section: '34', description: 'Acts done by several persons in furtherance of common intention' }
    ],
    arrests: [
      { date: '2024-03-17', type: 'Arrest', accusedName: 'Santhosh Hegde', officer: 'Manjunath B H', station: 'Koramangala PS', court: 'ACMM Court, Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' }
    ],
    chargesheet: null,
    evidence: [
      { id: 'EV001', type: 'Image', name: 'Crime Scene Photos.zip', date: '2024-03-15', size: '45 MB', tags: ['Crime Scene', 'Forensic'] },
      { id: 'EV002', type: 'PDF', name: 'Post Mortem Report.pdf', date: '2024-03-16', size: '2.1 MB', tags: ['Medical', 'Forensic'] },
      { id: 'EV003', type: 'PDF', name: 'FSL Report.pdf', date: '2024-03-20', size: '1.8 MB', tags: ['Lab Report', 'Forensic'] },
    ]
  },
  {
    id: 'FIR-002',
    crimeNumber: 'CR-No.089/2024',
    caseNumber: 'CASE/BLR/2024/089',
    firCategory: 'Cyber Crime',
    registrationDate: '2024-02-20',
    incidentDate: '2024-02-18',
    incidentTime: '14:30',
    status: 'Chargesheet Filed',
    gravity: 'Serious',
    crimeHead: 'Cyber Fraud',
    crimeCategory: 'Cybercrimes',
    policeStation: 'Whitefield PS',
    district: 'Bengaluru Urban',
    investigatingOfficer: OFFICERS[3],
    briefFacts: 'The complainant Anitha Sharma reported that she received a call from an unknown person posing as a bank official and was duped of Rs. 8,50,000/- through online transactions by sharing OTP.',
    latitude: 12.9698,
    longitude: 77.7499,
    location: 'Whitefield, Bengaluru - 560066',
    complainants: [
      { name: 'Anitha Sharma D', age: 55, gender: 'Female', occupation: 'Retired', religion: 'Hindu', caste: 'Brahmin', address: 'Prestige Shantiniketan, Whitefield', phone: '9845678901' }
    ],
    victims: [
      { name: 'Anitha Sharma D', age: 55, gender: 'Female', isPolicePersonnel: false, occupation: 'Retired', address: 'Prestige Shantiniketan, Whitefield', injuries: 'Financial loss of Rs. 8,50,000/-' }
    ],
    accused: [
      { accusedNo: 'A1', name: 'Mohammed Farouk', age: 30, gender: 'Male', address: 'Hyderabad, Telangana', arrestStatus: 'Arrested', arrestDate: '2024-02-25' }
    ],
    sections: [
      { act: 'IPC', section: '420', description: 'Cheating' },
      { act: 'IT Act', section: '66D', description: 'Cheating by personation' }
    ],
    arrests: [
      { date: '2024-02-25', type: 'Arrest', accusedName: 'Mohammed Farouk', officer: 'Suma Reddy G', station: 'Whitefield PS', court: 'CJM Court, Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' }
    ],
    chargesheet: { date: '2024-04-10', reportType: 'Charge Sheet', filingOfficer: 'Suma Reddy G', court: 'CJM Court, Bengaluru', courtNumber: 'CC No. 234/2024' },
    evidence: [
      { id: 'EV004', type: 'PDF', name: 'Bank Statements.pdf', date: '2024-02-22', size: '3.2 MB', tags: ['Financial', 'Transaction'] },
      { id: 'EV005', type: 'PDF', name: 'Call Records.pdf', date: '2024-02-23', size: '1.1 MB', tags: ['Communication', 'Evidence'] },
    ]
  },
  {
    id: 'FIR-003',
    crimeNumber: 'CR-No.231/2024',
    caseNumber: 'CASE/MYS/2024/231',
    firCategory: 'FIR',
    registrationDate: '2024-04-01',
    incidentDate: '2024-03-31',
    incidentTime: '02:15',
    status: 'Under Investigation',
    gravity: 'Serious',
    crimeHead: 'Robbery',
    crimeCategory: 'Crime Against Property',
    policeStation: 'Devaraja PS',
    district: 'Mysuru',
    investigatingOfficer: OFFICERS[0],
    briefFacts: 'Three armed persons entered the jewellery shop of complainant Nanjunda Swamy at Devaraja Market and decamped with gold ornaments worth Rs. 42 lakhs and cash of Rs. 1.5 lakhs at gunpoint.',
    latitude: 12.3052,
    longitude: 76.6551,
    location: 'Devaraja Market, Mysuru - 570001',
    complainants: [
      { name: 'Nanjunda Swamy H', age: 58, gender: 'Male', occupation: 'Jeweller', religion: 'Hindu', caste: 'Veerashaiva', address: 'Devaraja Market, Mysuru', phone: '9741234567' }
    ],
    victims: [
      { name: 'Nanjunda Swamy H', age: 58, gender: 'Female', isPolicePersonnel: false, occupation: 'Jeweller', address: 'Devaraja Market, Mysuru', injuries: 'Loss of gold ornaments worth Rs. 42 lakhs' }
    ],
    accused: [
      { accusedNo: 'A1', name: 'Unknown A1', age: null, gender: 'Male', address: 'Unknown', arrestStatus: 'Wanted', arrestDate: null },
      { accusedNo: 'A2', name: 'Unknown A2', age: null, gender: 'Male', address: 'Unknown', arrestStatus: 'Wanted', arrestDate: null },
      { accusedNo: 'A3', name: 'Unknown A3', age: null, gender: 'Male', address: 'Unknown', arrestStatus: 'Wanted', arrestDate: null }
    ],
    sections: [
      { act: 'IPC', section: '392', description: 'Robbery' },
      { act: 'IPC', section: '397', description: 'Robbery with deadly weapon' },
      { act: 'Arms Act', section: '25', description: 'Possession of arms' }
    ],
    arrests: [],
    chargesheet: null,
    evidence: [
      { id: 'EV006', type: 'Video', name: 'CCTV Footage.mp4', date: '2024-04-01', size: '1.2 GB', tags: ['CCTV', 'Surveillance'] },
    ]
  },
  {
    id: 'FIR-004',
    crimeNumber: 'CR-No.056/2024',
    caseNumber: 'CASE/BLR/2024/056',
    firCategory: 'Zero FIR',
    registrationDate: '2024-01-28',
    incidentDate: '2024-01-27',
    incidentTime: '19:30',
    status: 'Closed',
    gravity: 'Moderate',
    crimeHead: 'Theft',
    crimeCategory: 'Crime Against Property',
    policeStation: 'Indiranagar PS',
    district: 'Bengaluru Urban',
    investigatingOfficer: OFFICERS[1],
    briefFacts: 'Complainant Vijay Krishnaswamy reported that his Honda City car bearing KA-01-MN-4567 was stolen from the parking area of Forum Nexus Mall, Indiranagar.',
    latitude: 12.9716,
    longitude: 77.6412,
    location: 'Forum Nexus Mall, Indiranagar, Bengaluru',
    complainants: [
      { name: 'Vijay Krishnaswamy R', age: 44, gender: 'Male', occupation: 'Manager', religion: 'Hindu', caste: 'Iyengar', address: 'Indiranagar, Bengaluru', phone: '9880012345' }
    ],
    victims: [
      { name: 'Vijay Krishnaswamy R', age: 44, gender: 'Male', isPolicePersonnel: false, occupation: 'Manager', address: 'Indiranagar, Bengaluru', injuries: 'Vehicle theft worth Rs. 8,50,000' }
    ],
    accused: [
      { accusedNo: 'A1', name: 'Ramesh Gowda', age: 25, gender: 'Male', address: 'Malleswaram, Bengaluru', arrestStatus: 'Arrested', arrestDate: '2024-02-05' }
    ],
    sections: [
      { act: 'IPC', section: '379', description: 'Theft' },
      { act: 'IPC', section: '411', description: 'Dishonestly receiving stolen property' }
    ],
    arrests: [
      { date: '2024-02-05', type: 'Arrest', accusedName: 'Ramesh Gowda', officer: 'Priya Nair M', station: 'Indiranagar PS', court: 'ACMM Court, Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' }
    ],
    chargesheet: { date: '2024-03-15', reportType: 'Charge Sheet', filingOfficer: 'Priya Nair M', court: 'ACMM Court, Bengaluru', courtNumber: 'CC No. 145/2024' },
    evidence: [
      { id: 'EV007', type: 'Image', name: 'Recovered Vehicle Photos.zip', date: '2024-02-06', size: '12 MB', tags: ['Vehicle', 'Recovery'] },
    ]
  },
  {
    id: 'FIR-005',
    crimeNumber: 'CR-No.178/2024',
    caseNumber: 'CASE/BLR/2024/178',
    firCategory: 'FIR',
    registrationDate: '2024-03-25',
    incidentDate: '2024-03-24',
    incidentTime: '11:00',
    status: 'Under Investigation',
    gravity: 'Heinous',
    crimeHead: 'Rape',
    crimeCategory: 'Crime Against Women',
    policeStation: 'Jayanagar PS',
    district: 'Bengaluru Urban',
    investigatingOfficer: OFFICERS[4],
    briefFacts: 'Woman aged 26 years lodged a complaint that she was sexually assaulted by her employer at his residence in Jayanagar 9th Block. Case registered under relevant sections of IPC.',
    latitude: 12.9279,
    longitude: 77.5930,
    location: 'Jayanagar 9th Block, Bengaluru',
    complainants: [
      { name: 'Victim (Name Withheld)', age: 26, gender: 'Female', occupation: 'Domestic Worker', religion: 'Christian', caste: '-', address: 'Address Withheld', phone: 'Withheld' }
    ],
    victims: [
      { name: 'Victim (Name Withheld)', age: 26, gender: 'Female', isPolicePersonnel: false, occupation: 'Domestic Worker', address: 'Address Withheld', injuries: 'Sexual assault' }
    ],
    accused: [
      { accusedNo: 'A1', name: 'Prakash Rao N', age: 52, gender: 'Male', address: 'No. 78, 9th Block, Jayanagar', arrestStatus: 'Arrested', arrestDate: '2024-03-25' }
    ],
    sections: [
      { act: 'IPC', section: '376', description: 'Rape' },
      { act: 'IPC', section: '354', description: 'Outraging modesty' }
    ],
    arrests: [
      { date: '2024-03-25', type: 'Arrest', accusedName: 'Prakash Rao N', officer: 'Venkatesh Rao K', station: 'Jayanagar PS', court: 'Fast Track Court, Bengaluru', state: 'Karnataka', district: 'Bengaluru Urban' }
    ],
    chargesheet: null,
    evidence: []
  }
];

export const ANALYTICS_DATA = {
  monthlyCrimes: [
    { month: 'Jan', firs: 245, arrests: 178, chargesheets: 89, heinous: 12 },
    { month: 'Feb', firs: 278, arrests: 201, chargesheets: 102, heinous: 15 },
    { month: 'Mar', firs: 312, arrests: 234, chargesheets: 118, heinous: 18 },
    { month: 'Apr', firs: 289, arrests: 198, chargesheets: 134, heinous: 14 },
    { month: 'May', firs: 334, arrests: 256, chargesheets: 145, heinous: 21 },
    { month: 'Jun', firs: 298, arrests: 221, chargesheets: 121, heinous: 16 },
    { month: 'Jul', firs: 356, arrests: 278, chargesheets: 156, heinous: 22 },
    { month: 'Aug', firs: 321, arrests: 245, chargesheets: 142, heinous: 19 },
    { month: 'Sep', firs: 343, arrests: 267, chargesheets: 163, heinous: 24 },
    { month: 'Oct', firs: 367, arrests: 291, chargesheets: 178, heinous: 25 },
    { month: 'Nov', firs: 389, arrests: 312, chargesheets: 189, heinous: 27 },
    { month: 'Dec', firs: 412, arrests: 334, chargesheets: 201, heinous: 29 },
  ],
  crimeByCategory: [
    { category: 'Crime Against Property', count: 1245, pct: 32 },
    { category: 'Crime Against Body', count: 876, pct: 22 },
    { category: 'Cybercrimes', count: 698, pct: 18 },
    { category: 'Crime Against Women', count: 534, pct: 14 },
    { category: 'Drug Offences', count: 387, pct: 10 },
    { category: 'Others', count: 156, pct: 4 },
  ],
  districtStats: [
    { district: 'Bengaluru Urban', firs: 1456, solved: 1123, pending: 333 },
    { district: 'Mysuru', firs: 456, solved: 389, pending: 67 },
    { district: 'Belagavi', firs: 389, solved: 312, pending: 77 },
    { district: 'Hubballi-Dharwad', firs: 345, solved: 278, pending: 67 },
    { district: 'Mangaluru', firs: 312, solved: 256, pending: 56 },
    { district: 'Kalaburagi', firs: 298, solved: 234, pending: 64 },
  ],
  officerPerformance: [
    { name: 'Rajesh Kumar S', cases: 45, solved: 38, chargesheets: 22, rank: 'Inspector' },
    { name: 'Priya Nair M', cases: 38, solved: 34, chargesheets: 19, rank: 'Sub Inspector' },
    { name: 'Manjunath B H', cases: 52, solved: 41, chargesheets: 28, rank: 'Inspector' },
    { name: 'Suma Reddy G', cases: 41, solved: 36, chargesheets: 21, rank: 'Sub Inspector' },
    { name: 'Venkatesh Rao K', cases: 48, solved: 39, chargesheets: 25, rank: 'Inspector' },
  ]
};

export const KPI_DATA = {
  totalFIRs: 3896,
  activeInvestigations: 1234,
  chargesheetsFileds: 892,
  arrestsMade: 2156,
  pendingCases: 445,
  heinousToday: 3,
  todayFIRs: 18,
  successRate: 78.4,
};

export interface FIR {
  id: string;
  crimeNumber: string;
  caseNumber: string;
  firCategory: string;
  registrationDate: string;
  incidentDate: string;
  incidentTime: string;
  status: string;
  gravity: string;
  crimeHead: string;
  crimeCategory: string;
  policeStation: string;
  district: string;
  investigatingOfficer: typeof OFFICERS[0];
  briefFacts: string;
  latitude: number;
  longitude: number;
  location: string;
  complainants: Complainant[];
  victims: Victim[];
  accused: Accused[];
  sections: Section[];
  arrests: Arrest[];
  chargesheet: Chargesheet | null;
  evidence: Evidence[];
}

export interface Complainant { name: string; age: number; gender: string; occupation: string; religion: string; caste: string; address: string; phone: string; }
export interface Victim { name: string; age: number; gender: string; isPolicePersonnel: boolean; occupation: string; address: string; injuries: string; }
export interface Accused { accusedNo: string; name: string; age: number | null; gender: string; address: string; arrestStatus: string; arrestDate: string | null; }
export interface Section { act: string; section: string; description: string; }
export interface Arrest { date: string; type: string; accusedName: string; officer: string; station: string; court: string; state: string; district: string; }
export interface Chargesheet { date: string; reportType: string; filingOfficer: string; court: string; courtNumber: string; }
export interface Evidence { id: string; type: string; name: string; date: string; size: string; tags: string[]; }
