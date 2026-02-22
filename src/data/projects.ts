export interface Project {
  slug: string;
  title: string;
  tagline: string;
  cardStyle: string;
  featured: boolean;
  year: number;
  venue?: string;
  tags: string[];
  paperUrl?: string;
  githubUrl?: string;
  liveUrl?: string;
  relatedCourses?: string[];
}

export const projects: Project[] = [
  {
    slug: 'blade-agent',
    title: 'Blade Agent',
    tagline: 'Multi-lane AI orchestrator — engineer, scientist & student pipelines with quality gates',
    cardStyle: 'BladePipeline',
    featured: true,
    year: 2025,
    tags: ['AI Agent', 'Orchestration', 'Pipeline'],
    githubUrl: 'https://github.com/ViskaWei/blade-agent-web',
    liveUrl: 'https://viskawei.github.io/blade-agent-web',
  },
  {
    slug: 'specvit',
    title: 'SpecViT',
    tagline: 'Vision Transformers for stellar parameter estimation from spectroscopic data',
    cardStyle: 'StellarSpectrum',
    featured: false,
    year: 2025,
    tags: ['Deep Learning', 'Astronomy', 'Vision Transformers'],
    githubUrl: 'https://github.com/viskawei/SpecViT',
    liveUrl: 'https://viskawei.github.io/SpecViT-web',
    relatedCourses: ['EN.601.682', 'AS.171.749', 'AS.171.801'],
  },
  {
    slug: 'ips-unlabeled-particle',
    title: 'IPS Unlabeled Particle',
    tagline: 'Interacting particle systems with unlabeled particles and mean-field limits',
    cardStyle: 'MonetGlass',
    featured: false,
    year: 2024,
    tags: ['Stochastic Processes', 'Mathematical Physics', 'Mean-Field Theory'],
    liveUrl: 'https://viskawei.github.io/ips_unlabeled_learning_web/',
    relatedCourses: ['EN.553.626', 'EN.553.627'],
  },
  {
    slug: 'sketch-and-scale',
    title: 'Sketch & Scale',
    tagline: 'Dimensionality reduction pipeline: PCA → random sketching → UMAP for large-scale data',
    cardStyle: 'SketchFlow',
    featured: false,
    year: 2023,
    tags: ['Data Science', 'Dimensionality Reduction', 'Algorithms'],
    githubUrl: 'https://github.com/viskawei/sketch-scale',
    relatedCourses: ['EN.553.636', 'EN.601.633'],
  },
  {
    slug: 'charm-yukawa',
    title: 'Charm Yukawa Coupling',
    tagline: 'Probing charm quark Yukawa coupling at the LHC via Higgs production channels',
    cardStyle: 'ParticleSim',
    featured: false,
    year: 2019,
    venue: 'Phys. Rev. D',
    tags: ['Particle Physics', 'QFT', 'Collider Phenomenology'],
    paperUrl: 'https://arxiv.org/abs/1905.09360',
    relatedCourses: ['PHYS232A', 'PHYS232B', 'PHYS233A'],
  },
  {
    slug: 'piml',
    title: 'Physics-Informed ML',
    tagline: 'Physics-informed neural networks for stellar atmosphere parameter estimation',
    cardStyle: 'NeuralField',
    featured: false,
    year: 2024,
    tags: ['Physics-Informed', 'ML', 'Stellar Physics'],
    githubUrl: 'https://github.com/viskawei/Physics_Informed_AI',
    relatedCourses: ['AS.171.749', 'AS.171.801'],
  },
  {
    slug: 'cancer-clustering',
    title: 'Cancer Subtype Clustering',
    tagline: 'Unsupervised clustering of cancer subtypes using multi-omics data with UMAP',
    cardStyle: 'ClusterMap',
    featured: false,
    year: 2020,
    venue: 'IEEE Big Data',
    tags: ['Bioinformatics', 'Clustering', 'UMAP'],
    paperUrl: 'https://arxiv.org/abs/2011.06103',
    relatedCourses: ['EN.553.636'],
  },
];
