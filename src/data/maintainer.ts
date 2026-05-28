export interface MaintainerProfile {
  name: string;
  title: string;
  tagline: string;
  avatar: string;
  company?: string;
  location: string;
  bio: string;
  links: { label: string; url: string; icon: string }[];
  stats: { label: string; value: string; icon: string }[];
  certifications: { title: string; issuer: string; year: string }[];
  techStack: { category: string; items: string[] }[];
  focusAreas: string[];
  featuredProjects: { name: string; description: string; url: string; tech: string[] }[];
}

export const maintainer: MaintainerProfile = {
  name: 'Ajeet Kumar Chouksey',
  title: 'AI-Driven Cloud & DevOps Architect',
  tagline: 'Transforming software delivery through intelligent automation',
  avatar: 'https://avatars.githubusercontent.com/u/107052100?v=4',
  location: 'Frankfurt, Germany',
  bio: `Cloud Solution Architect and DevOps Engineer with 18+ years of experience specializing in building next-generation, AI-powered DevOps workflows. Creator of intelligent automation frameworks that combine Infrastructure as Code with autonomous AI agents to accelerate software delivery while ensuring security, compliance, and cost optimization.`,
  links: [
    { label: 'GitHub', url: 'https://github.com/ajeetchouksey', icon: 'github' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/ajeet-chouksey-bb365138/', icon: 'linkedin' },
    { label: 'Blog', url: 'https://theaiops.blog/', icon: 'globe' },
  ],
  stats: [
    { label: 'Years Experience', value: '18+', icon: 'calendar' },
    { label: 'GitHub Contributions (year)', value: '2,044', icon: 'git-commit' },
    { label: 'Public Repos', value: '33', icon: 'folder-git' },
    { label: 'Certifications', value: '5+', icon: 'award' },
  ],
  certifications: [
    { title: 'Azure Solutions Architect Expert', issuer: 'Microsoft', year: '2023' },
    { title: 'Azure DevOps Engineer Expert', issuer: 'Microsoft', year: '2022' },
    { title: 'Terraform Associate', issuer: 'HashiCorp', year: '2023' },
    { title: 'Azure Fundamentals (multiple)', issuer: 'Microsoft', year: '2021' },
  ],
  techStack: [
    { category: 'Cloud Platforms', items: ['Azure', 'AWS'] },
    { category: 'DevOps & Infrastructure', items: ['Terraform', 'Kubernetes', 'Docker', 'GitHub Actions', 'Azure DevOps'] },
    { category: 'AI & Programming', items: ['Python', 'TypeScript', 'OpenAI', 'LangChain', 'Claude API'] },
    { category: 'Security & Monitoring', items: ['SonarQube', 'Azure Monitor', 'Azure Policy', 'CIS Compliance'] },
  ],
  focusAreas: [
    'Agentic DevOps — AI agents that automate code reviews, cost optimization, and infrastructure management',
    'Azure Architecture — Secure, scalable cloud solutions following CIS compliance and best practices',
    'Infrastructure as Code — Modular, reusable Terraform modules and Bicep templates',
    'DevSecOps — Security-first approaches with automated policy enforcement',
    'Cost Optimization — AI-driven analysis and automated remediation for cloud cost management',
  ],
  featuredProjects: [
    {
      name: 'Agentic DevOps Playground',
      description: 'Next-gen DevOps automation combining IaC with intelligent AI agents — code review, cost optimization, and infrastructure management.',
      url: 'https://github.com/ajeetchouksey/ajch_agenticdevops',
      tech: ['Python', 'Terraform', 'Azure OpenAI', 'GitHub Actions'],
    },
    {
      name: 'Aarya — My AI Learning Hub',
      description: 'CCA-F exam prep platform with AI-powered study tools, interactive quizzes, and scenario-based learning.',
      url: 'https://github.com/ajeetchouksey/ajch_cluade_architect',
      tech: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
    },
  ],
};
