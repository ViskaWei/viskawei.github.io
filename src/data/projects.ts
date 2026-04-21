export interface Project {
  slug: string;
  kind: 'paper' | 'project';
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
    slug: 'ips-unlabeled-learning',
    kind: 'paper',
    title: 'Learning Interacting Particle Systems from Unlabeled Data',
    tagline: 'A trajectory-free method for learning interaction potentials from unlabeled particle snapshots via weak-form stochastic evolution equations',
    cardStyle: 'MonetGlass',
    featured: true,
    year: 2026,
    venue: 'arXiv',
    tags: ['Stochastic Processes', 'Statistical Learning', 'Interacting Particle Systems'],
    paperUrl: 'https://arxiv.org/abs/2604.02581',
    githubUrl: 'https://github.com/ViskaWei/lips_unlabeled_data',
    liveUrl: 'https://viskawei.github.io/ips_unlabeled_learning_web',
    relatedCourses: ['EN.553.626', 'EN.553.627'],
  },
  {
    slug: 'specvit',
    kind: 'paper',
    title: 'SpecViT: Multi-Architecture Scaling Analysis for Stellar Parameter Estimation from PFS Medium-Resolution Spectra',
    tagline: 'A transformer-centered paper benchmark for stellar spectroscopy with architecture scaling, baseline comparisons, and transfer analysis',
    cardStyle: 'StellarSpectrum',
    featured: true,
    year: 2025,
    venue: 'Unpublished manuscript',
    tags: ['Astronomy', 'Transformers', 'Spectroscopy'],
    githubUrl: 'https://github.com/viskawei/SpecViT',
    liveUrl: 'https://viskawei.github.io/SpecViT-web',
    relatedCourses: ['EN.601.682', 'AS.171.749', 'AS.171.801'],
  },
  {
    slug: 'icl-task-diversity',
    kind: 'paper',
    title: 'The Generalization Dilemma in In-Context Learning: Task Diversity versus Estimation Accuracy',
    tagline: 'A phase-transition theory for when pretraining task diversity helps and when it hurts in-context inverse linear regression',
    cardStyle: 'PhaseTransition',
    featured: true,
    year: 2026,
    venue: 'Working draft',
    tags: ['In-Context Learning', 'Transfer', 'Phase Transition'],
    githubUrl: 'https://github.com/ViskaWei/icl_task_diversity',
    relatedCourses: ['EN.553.627', 'EN.553.626'],
  },
  {
    slug: 'blindspot-denoiser',
    kind: 'paper',
    title: 'Denoising Stellar Spectra with U-Net Blindspot Neural Network',
    tagline: 'Self-supervised spectral denoising for low-SNR stellar observations with a blind-spot U-Net architecture',
    cardStyle: 'NeuralField',
    featured: false,
    year: 2025,
    venue: 'Astronomy & Computing',
    tags: ['Astronomy', 'Denoising', 'U-Net'],
    githubUrl: 'https://github.com/ViskaWei/BlindSpotDenoiser',
    relatedCourses: ['AS.171.749', 'AS.171.801'],
  },
  {
    slug: 'sketch-and-scale',
    kind: 'paper',
    title: 'Sketch and Scale: Geo-distributed tSNE and UMAP',
    tagline: 'A geo-distributed PCA → random sketching → UMAP pipeline for hundred-million-scale data exploration',
    cardStyle: 'SketchFlow',
    featured: false,
    year: 2020,
    venue: 'IEEE BigData',
    tags: ['Data Science', 'Dimensionality Reduction', 'Algorithms'],
    paperUrl: 'https://arxiv.org/abs/2011.06103',
    githubUrl: 'https://github.com/ViskaWei/sketch-scale',
    relatedCourses: ['EN.553.636', 'EN.601.633'],
  },
  {
    slug: 'symmetric-norm-sliding-windows',
    kind: 'paper',
    title: 'Symmetric Norm Estimation and Regression on Sliding Windows',
    tagline: 'Sliding-window sketches for symmetric norm estimation and regression in streaming settings',
    cardStyle: 'MinimalistMath',
    featured: false,
    year: 2021,
    venue: 'COCOON',
    tags: ['Streaming', 'Algorithms', 'Theory'],
    paperUrl: 'https://arxiv.org/abs/2109.01635',
    relatedCourses: ['EN.601.633'],
  },
  {
    slug: 'laminate-umap',
    kind: 'paper',
    title: 'A UMAP-based Clustering Method for Multi-scale Damage Analysis of Laminates',
    tagline: 'UMAP geometry for discovering multi-scale damage patterns in composite laminate simulations',
    cardStyle: 'ClusterMap',
    featured: false,
    year: 2022,
    venue: 'Applied Mathematical Modelling',
    tags: ['UMAP', 'Materials', 'Scientific Computing'],
    paperUrl: 'https://doi.org/10.1016/j.apm.2022.06.017',
    relatedCourses: ['EN.553.636'],
  },
  {
    slug: 'charm-yukawa',
    kind: 'paper',
    title: 'Bounding the Charm Yukawa Coupling',
    tagline: 'Supersymmetric Higgs phenomenology constraining the charm Yukawa coupling at the LHC',
    cardStyle: 'ParticleSim',
    featured: false,
    year: 2019,
    venue: 'Phys. Rev. D',
    tags: ['Particle Physics', 'QFT', 'Collider Phenomenology'],
    paperUrl: 'https://doi.org/10.1103/PhysRevD.100.073013',
    relatedCourses: ['PHYS232A', 'PHYS232B', 'PHYS233A'],
  },
  {
    slug: 'blade-agent',
    kind: 'project',
    title: 'Blade Agent',
    tagline: 'Multi-lane AI orchestrator for engineering and research workflows with quality gates',
    cardStyle: 'BladePipeline',
    featured: false,
    year: 2025,
    tags: ['AI Agent', 'Orchestration', 'Pipeline'],
    githubUrl: 'https://github.com/ViskaWei/blade-agent-web',
    liveUrl: 'https://viskawei.github.io/blade-agent-web',
  },
];
