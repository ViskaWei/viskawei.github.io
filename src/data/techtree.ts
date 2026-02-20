export interface Track {
  id: string;
  label: string;
  color: string;
  column: number;
  branch: 'core' | 'engineering' | 'society';
}

export type NodeType = 'course' | 'project' | 'thesis' | 'internship' | 'publication' | 'repo' | 'skill';

export interface CourseNode {
  id: string;
  name: string;
  code: string;
  institution: 'Berkeley' | 'UChicago' | 'JHU';
  track: string;
  grade: string;
  year: number;
  semester: 'Fall' | 'Spring' | 'Summer';
  prerequisites?: string[];
  relatedProjects?: string[];
  nodeType?: NodeType;
}

export interface ProjectNode {
  id: string;
  name: string;
  relatedCourses: string[];
  year: number;
  semester: 'Fall' | 'Spring' | 'Summer';
  track?: string;
  nodeType?: NodeType;
  url?: string;
  venue?: string;
}

// Stellaris-style muted pastel palette — 8 sub-tracks across 3 branches
export const tracks: Track[] = [
  // Engineering (applied tech) — leftmost
  { id: 'ai',          label: 'AI',                  color: '#ff4d4d', column: 0, branch: 'engineering' },
  { id: 'ml',          label: 'ML / Deep Learning',  color: '#7fd4a8', column: 1, branch: 'engineering' },
  { id: 'algorithms',  label: 'Algorithms',          color: '#4ade80', column: 2, branch: 'engineering' },
  { id: 'systems',     label: 'Systems & Frameworks',color: '#6ec4e8', column: 3, branch: 'engineering' },
  // Core (fundamental knowledge) — middle
  { id: 'physics',     label: 'Physics',             color: '#a0c8e8', column: 4, branch: 'core' },
  { id: 'math',        label: 'Mathematics',         color: '#f0e6a0', column: 5, branch: 'core' },
  // Society — rightmost
  { id: 'business',    label: 'Business & Ops',      color: '#d4a0c8', column: 6, branch: 'society' },
  { id: 'social',      label: 'Growth & Social',     color: '#c8a0d4', column: 7, branch: 'society' },
];

export const courses: CourseNode[] = [
  // ── Physics ──────────────────────────────────────────────
  // UC Berkeley
  {
    id: 'PHYS221A', name: 'Quantum Mechanics I', code: 'PHYS 221A',
    institution: 'Berkeley', track: 'physics', grade: 'A', year: 2017, semester: 'Fall',
  },
  {
    id: 'PHYS212', name: 'Nonequil Statistical Physics', code: 'PHYS 212',
    institution: 'Berkeley', track: 'physics', grade: 'A-', year: 2017, semester: 'Fall',
  },
  {
    id: 'PHYS221B', name: 'Quantum Mechanics II', code: 'PHYS 221B',
    institution: 'Berkeley', track: 'physics', grade: 'A+', year: 2017, semester: 'Spring',
    prerequisites: ['PHYS221A'],
  },
  {
    id: 'PHYS232A', name: 'QFT I', code: 'PHYS 232A',
    institution: 'Berkeley', track: 'physics', grade: 'A', year: 2018, semester: 'Fall',
    prerequisites: ['PHYS221B'],
  },
  {
    id: 'PHYS232B', name: 'QFT II', code: 'PHYS 232B',
    institution: 'Berkeley', track: 'physics', grade: 'A+', year: 2018, semester: 'Spring',
    prerequisites: ['PHYS232A'],
  },
  {
    id: 'PHYS226', name: 'PPP', code: 'PHYS 226',
    institution: 'Berkeley', track: 'physics', grade: 'A', year: 2018, semester: 'Spring',
    prerequisites: ['PHYS232A'],
  },
  {
    id: 'PHYS233A', name: 'Standard Model & Beyond', code: 'PHYS 233A',
    institution: 'Berkeley', track: 'physics', grade: 'A', year: 2018, semester: 'Spring',
    prerequisites: ['PHYS232B'],
  },
  // UChicago
  {
    id: 'PHYS44500', name: 'QFT-3', code: 'PHYS 44500',
    institution: 'UChicago', track: 'physics', grade: 'A', year: 2020, semester: 'Fall',
    prerequisites: ['PHYS232B'],
  },

  // UC Berkeley (Gravity & Cosmology)
  {
    id: 'PHYS231', name: 'General Relativity', code: 'PHYS 231',
    institution: 'Berkeley', track: 'physics', grade: 'A+', year: 2018, semester: 'Fall',
    prerequisites: ['PHYS221A'],
  },
  // UChicago
  {
    id: 'PHYS26400', name: 'Spacetime & Black Holes', code: 'PHYS 26400',
    institution: 'UChicago', track: 'physics', grade: 'A', year: 2019, semester: 'Fall',
  },
  {
    id: 'PHYS36400', name: 'General Relativity', code: 'PHYS 36400',
    institution: 'UChicago', track: 'physics', grade: 'A', year: 2020, semester: 'Fall',
    prerequisites: ['PHYS26400'],
  },
  {
    id: 'PHYS46000', name: 'Gravitational Waves', code: 'PHYS 46000',
    institution: 'UChicago', track: 'physics', grade: 'P', year: 2020, semester: 'Spring',
    prerequisites: ['PHYS36400'],
  },
  {
    id: 'PSMS39900', name: 'MS Thesis/Project Research', code: 'PSMS 39900',
    institution: 'UChicago', track: 'physics', grade: 'A', year: 2020, semester: 'Spring',
    relatedProjects: ['proj-charm'],
  },

  // ── Mathematics ───────────────────────────────────────────
  // UChicago
  {
    id: 'MATH31700', name: 'Topology/Geometry I', code: 'MATH 31700',
    institution: 'UChicago', track: 'math', grade: 'A', year: 2019, semester: 'Fall',
  },
  {
    id: 'PHYS33000', name: 'Math Methods of Physics', code: 'PHYS 33000',
    institution: 'UChicago', track: 'math', grade: 'A', year: 2019, semester: 'Fall',
  },
  {
    id: 'MATH31800', name: 'Topology/Geometry II', code: 'MATH 31800',
    institution: 'UChicago', track: 'math', grade: 'A-', year: 2019, semester: 'Spring',
    prerequisites: ['MATH31700'],
  },
  {
    id: 'MATH39701', name: 'Low-Dimensional Topology', code: 'MATH 39701',
    institution: 'UChicago', track: 'math', grade: 'A', year: 2020, semester: 'Fall',
    prerequisites: ['MATH31800'],
  },
  // JHU
  {
    id: 'EN553620', name: 'Intro to Probability', code: 'EN.553.620',
    institution: 'JHU', track: 'math', grade: 'A+', year: 2021, semester: 'Fall',
  },
  {
    id: 'EN553626', name: 'Intro to Stochastic Processes', code: 'EN.553.626',
    institution: 'JHU', track: 'math', grade: 'A+', year: 2021, semester: 'Spring',
    prerequisites: ['EN553620'],
  },

  // ── Algorithms ────────────────────────────────────────────
  {
    id: 'EN601633', name: 'Intro Algorithms', code: 'EN.601.633',
    institution: 'JHU', track: 'algorithms', grade: 'A+', year: 2022, semester: 'Fall',
    relatedProjects: ['proj-sketch'],
  },
  {
    id: 'EN601668', name: 'Machine Translation', code: 'EN.601.668',
    institution: 'JHU', track: 'algorithms', grade: 'A+', year: 2023, semester: 'Spring',
  },

  // ── ML / Deep Learning ────────────────────────────────────
  {
    id: 'EN553636', name: 'Intro to Data Science', code: 'EN.553.636',
    institution: 'JHU', track: 'ml', grade: 'A+', year: 2021, semester: 'Fall',
    relatedProjects: ['proj-cancer'],
  },
  {
    id: 'AS171749', name: 'ML for Scientists', code: 'AS.171.749',
    institution: 'JHU', track: 'ml', grade: 'A', year: 2023, semester: 'Fall',
    prerequisites: ['EN553636'],
    relatedProjects: ['proj-piml', 'proj-specvit'],
  },
  {
    id: 'EN601682', name: 'Deep Learning', code: 'EN.601.682',
    institution: 'JHU', track: 'ml', grade: 'A', year: 2023, semester: 'Fall',
    prerequisites: ['EN601664'],
    relatedProjects: ['proj-specvit'],
  },
  {
    id: 'AS171801', name: 'Independent Research', code: 'AS.171.801',
    institution: 'JHU', track: 'ml', grade: 'A+', year: 2024, semester: 'Spring',
    prerequisites: ['AS171749', 'EN601682'],
    relatedProjects: ['proj-specvit'],
  },

  // ── AI ────────────────────────────────────────────────────
  {
    id: 'EN601664', name: 'Artificial Intelligence', code: 'EN.601.664',
    institution: 'JHU', track: 'ai', grade: 'A+', year: 2022, semester: 'Fall',
  },

  // ── Stochastic (moved to math) ───────────────────────────
  {
    id: 'EN553627', name: 'Stochastic Processes Finance I', code: 'EN.553.627',
    institution: 'JHU', track: 'math', grade: 'A+', year: 2022, semester: 'Fall',
    prerequisites: ['EN553626'],
  },
  {
    id: 'EN553628', name: 'Stochastic Processes Finance II', code: 'EN.553.628',
    institution: 'JHU', track: 'math', grade: 'A+', year: 2022, semester: 'Spring',
    prerequisites: ['EN553627'],
  },
  {
    id: 'EN553643', name: 'Energy Markets & Risk Mgmt', code: 'EN.553.643',
    institution: 'JHU', track: 'math', grade: 'A-', year: 2022, semester: 'Spring',
    prerequisites: ['EN553627'],
  },
];

export const projectNodes: ProjectNode[] = [
  // ── Projects ──────────────────────────────────────────────
  {
    id: 'proj-charm', name: 'Charm Yukawa',
    relatedCourses: ['PHYS232A', 'PHYS232B', 'PHYS233A', 'PSMS39900'],
    year: 2019, semester: 'Spring', track: 'physics',
    nodeType: 'project',
    url: 'https://arxiv.org/abs/1905.09360',
  },
  {
    id: 'proj-cancer', name: 'Cancer Clustering',
    relatedCourses: ['EN553636'],
    year: 2020, semester: 'Fall', track: 'ml',
    nodeType: 'project',
    url: 'https://arxiv.org/abs/2011.06103',
  },
  {
    id: 'proj-sketch', name: 'Sketch & Scale',
    relatedCourses: ['EN553636', 'EN601633'],
    year: 2023, semester: 'Spring', track: 'algorithms',
    nodeType: 'project',
    url: 'https://github.com/viskawei/sketch-scale',
  },
  {
    id: 'proj-ips', name: 'IPS Unlabeled Particle',
    relatedCourses: ['EN553626', 'EN553627'],
    year: 2024, semester: 'Fall', track: 'math',
    nodeType: 'project',
    url: 'https://viskawei.github.io/ips_unlabeled_learning_web/',
  },
  {
    id: 'proj-piml', name: 'Physics-Informed ML',
    relatedCourses: ['AS171749', 'AS171801'],
    year: 2024, semester: 'Spring', track: 'ml',
    nodeType: 'project',
    url: 'https://github.com/viskawei/Physics_Informed_AI',
  },
  {
    id: 'proj-specvit', name: 'SpecViT',
    relatedCourses: ['EN601682', 'AS171749', 'AS171801'],
    year: 2025, semester: 'Fall', track: 'ml',
    nodeType: 'project',
    url: 'https://github.com/viskawei/SpecViT',
  },

  // ── Theses ────────────────────────────────────────────────
  {
    id: 'thesis-ba', name: 'BA: Charm Quark Yukawa',
    relatedCourses: ['PHYS232B', 'PHYS233A'],
    year: 2019, semester: 'Spring', track: 'physics',
    nodeType: 'thesis', venue: 'UC Berkeley',
  },
  {
    id: 'thesis-ms', name: 'MS: Gravitational Waves',
    relatedCourses: ['PHYS36400', 'PHYS46000'],
    year: 2021, semester: 'Spring', track: 'physics',
    nodeType: 'thesis', venue: 'UChicago',
  },
  {
    id: 'thesis-phd', name: 'PhD: SpecViT (ongoing)',
    relatedCourses: ['AS171801', 'EN601682'],
    year: 2025, semester: 'Fall', track: 'ml',
    nodeType: 'thesis', venue: 'JHU',
  },

  // ── Internships ───────────────────────────────────────────
  {
    id: 'intern-jpmorgan', name: 'JPMorgan AI/ML Intern',
    relatedCourses: ['EN601682', 'AS171749'],
    year: 2023, semester: 'Summer', track: 'ai',
    nodeType: 'internship',
  },
  {
    id: 'intern-bytedance', name: 'ByteDance LLM Intern',
    relatedCourses: ['EN601668', 'EN601682'],
    year: 2024, semester: 'Summer', track: 'ai',
    nodeType: 'internship',
  },

  // ── Publications ──────────────────────────────────────────
  {
    id: 'pub-charm', name: 'PhysRevD: Charm Yukawa',
    relatedCourses: ['PHYS232B', 'PHYS233A'],
    year: 2019, semester: 'Fall', track: 'physics',
    nodeType: 'publication', venue: 'Phys. Rev. D',
    url: 'https://arxiv.org/abs/1905.09360',
  },
  {
    id: 'pub-cancer', name: 'IEEE BigData: Sketch & Scale',
    relatedCourses: ['EN553636'],
    year: 2020, semester: 'Fall', track: 'ml',
    nodeType: 'publication', venue: 'IEEE Big Data',
    url: 'https://arxiv.org/abs/2011.06103',
  },
  {
    id: 'pub-cocoon', name: 'COCOON: Symmetric Norm',
    relatedCourses: ['EN601633'],
    year: 2021, semester: 'Fall', track: 'algorithms',
    nodeType: 'publication', venue: 'COCOON 2021',
    url: 'https://arxiv.org/abs/2109.01635',
  },
  {
    id: 'pub-piml', name: 'Appl Math: PIML Stellar',
    relatedCourses: ['AS171749'],
    year: 2022, semester: 'Fall', track: 'ml',
    nodeType: 'publication', venue: 'Appl. Math. Modeling',
  },
  {
    id: 'pub-specvit-aas', name: 'AAS: SpecViT Poster',
    relatedCourses: ['AS171801'],
    year: 2025, semester: 'Spring', track: 'ml',
    nodeType: 'publication', venue: 'AAS 245',
  },
  {
    id: 'pub-specvit-apj', name: 'ApJ: SpecViT (submitted)',
    relatedCourses: ['AS171801', 'EN601682'],
    year: 2025, semester: 'Fall', track: 'ml',
    nodeType: 'publication', venue: 'ApJ',
  },

  // ── GitHub Repos ──────────────────────────────────────────
  {
    id: 'repo-specvit', name: 'viskawei/SpecViT',
    relatedCourses: ['EN601682', 'AS171801'],
    year: 2025, semester: 'Spring', track: 'ml',
    nodeType: 'repo', url: 'https://github.com/viskawei/SpecViT',
  },
  {
    id: 'repo-vit', name: 'viskawei/VIT',
    relatedCourses: ['EN601682'],
    year: 2024, semester: 'Fall', track: 'ml',
    nodeType: 'repo', url: 'https://github.com/viskawei/VIT',
  },
  {
    id: 'repo-denoiser', name: 'viskawei/BlindSpotDenoiser',
    relatedCourses: ['EN601682'],
    year: 2024, semester: 'Spring', track: 'ml',
    nodeType: 'repo', url: 'https://github.com/viskawei/BlindSpotDenoiser',
  },
  {
    id: 'repo-piai', name: 'viskawei/Physics_Informed_AI',
    relatedCourses: ['AS171749', 'AS171801'],
    year: 2024, semester: 'Spring', track: 'ml',
    nodeType: 'repo', url: 'https://github.com/viskawei/Physics_Informed_AI',
  },

  // New additions
  {
    id: 'proj-blade', name: 'Blade Agent',
    relatedCourses: ['EN601664'],
    year: 2026, semester: 'Spring', track: 'ai',
    nodeType: 'project',
  },
  {
    id: 'proj-giftlive', name: 'GiftLive',
    relatedCourses: [],
    year: 2026, semester: 'Spring', track: 'social',
    nodeType: 'project',
  },
];
