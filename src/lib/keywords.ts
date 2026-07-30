/**
 * keywords.ts
 * Platform-wide keyword dictionary for inline term highlighting.
 * All terms are statically defined — no user input, no external calls.
 *
 * Categories: architecture, cloud, ai-ml, devops, security, networking, cloudflare, data
 *
 * Security note: escapeRegex() escapes all terms before regex construction
 * to handle special characters (e.g. C++, .NET, CI/CD) safely.
 */

export type KeywordCategory =
  | 'architecture'
  | 'cloud'
  | 'ai-ml'
  | 'devops'
  | 'security'
  | 'networking'
  | 'cloudflare'
  | 'data';

export interface Keyword {
  term: string;
  category: KeywordCategory;
  description?: string;
}

export interface CategoryStyle {
  color: string;
  bg: string;
  border: string;
  label: string;
}

export const CATEGORY_STYLE: Record<KeywordCategory, CategoryStyle> = {
  architecture: {
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.30)',
    label: 'Architecture',
  },
  cloud: {
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.30)',
    label: 'Cloud',
  },
  'ai-ml': {
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    border: 'rgba(129,140,248,0.30)',
    label: 'AI / ML',
  },
  devops: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.12)',
    border: 'rgba(52,211,153,0.30)',
    label: 'DevOps',
  },
  security: {
    color: '#fb7185',
    bg: 'rgba(251,113,133,0.12)',
    border: 'rgba(251,113,133,0.30)',
    label: 'Security',
  },
  networking: {
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    border: 'rgba(6,182,212,0.30)',
    label: 'Networking',
  },
  cloudflare: {
    color: '#f97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.30)',
    label: 'Cloudflare',
  },
  data: {
    color: '#facc15',
    bg: 'rgba(250,204,21,0.12)',
    border: 'rgba(250,204,21,0.30)',
    label: 'Data',
  }
};

export const KEYWORDS: Keyword[] = [
  // ── Architecture ────────────────────────────────────────────────────────────
  { term: 'microservices', category: 'architecture', description: 'Small, independently deployable services that make up a larger application' },
  { term: 'event-driven', category: 'architecture', description: 'Services communicate through asynchronous events rather than direct calls' },
  { term: 'CQRS', category: 'architecture', description: 'Command Query Responsibility Segregation — separates read and write models' },
  { term: 'saga pattern', category: 'architecture', description: 'Distributed transaction pattern using a sequence of local transactions' },
  { term: 'circuit breaker', category: 'architecture', description: 'Prevents cascading failures by stopping calls to an unhealthy service' },
  { term: 'API gateway', category: 'architecture', description: 'Single entry point that routes, authenticates, and rate-limits API requests' },
  { term: 'API', category: 'architecture', description: 'Application Programming Interface — contract defining how software components communicate' },
  { term: 'service mesh', category: 'architecture', description: 'Dedicated infrastructure layer for service-to-service communication (e.g. Istio)' },
  { term: 'idempotent', category: 'architecture', description: 'Operation that produces the same result regardless of how many times it runs' },
  { term: 'eventual consistency', category: 'architecture', description: 'Data will become consistent across nodes over time without requiring immediate sync' },
  { term: 'stateless', category: 'architecture', description: 'Server holds no client session state between requests' },
  { term: 'stateful', category: 'architecture', description: 'Server retains client session data across requests' },
  { term: 'monolith', category: 'architecture', description: 'Single deployable unit containing all application components' },
  { term: 'CAP theorem', category: 'architecture', description: 'Consistency, Availability, Partition tolerance — a distributed system can only guarantee two' },
  { term: 'load balancing', category: 'architecture', description: 'Distributing incoming traffic across multiple server instances' },
  { term: 'horizontal scaling', category: 'architecture', description: 'Adding more instances to handle increased load (scale out)' },
  { term: 'vertical scaling', category: 'architecture', description: 'Adding more CPU/RAM to a single instance (scale up)' },
  { term: 'message queue', category: 'architecture', description: 'Asynchronous buffer that decouples producers and consumers' },
  { term: 'event sourcing', category: 'architecture', description: 'Storing state as an immutable sequence of events rather than current values' },
  { term: 'blue-green deployment', category: 'architecture', description: 'Zero-downtime release strategy using two identical production environments' },
  { term: 'canary deployment', category: 'architecture', description: 'Gradual traffic shift to a new version to detect issues before full rollout' },
  { term: 'sidecar pattern', category: 'architecture', description: 'Auxiliary container deployed alongside a main service to add cross-cutting concerns' },
  { term: 'strangler fig', category: 'architecture', description: 'Incremental migration: new functionality wraps the legacy system until it is replaced' },
  { term: 'domain-driven design', category: 'architecture', description: 'Software design approach focused on business domains and bounded contexts' },
  { term: 'bounded context', category: 'architecture', description: 'Logical boundary within a domain where a model applies consistently' },
  { term: 'hexagonal architecture', category: 'architecture', description: 'Ports-and-adapters architecture separating business logic from external systems' },
  { term: 'clean architecture', category: 'architecture', description: 'Layered architecture emphasizing separation of concerns and maintainability' },
  { term: 'enterprise architecture', category: 'architecture', description: 'Strategic framework aligning business processes, applications, and technology' },
  { term: 'EDA', category: 'architecture', description: 'Event-Driven Architecture for asynchronous distributed systems' },
  { term: 'distributed systems', category: 'architecture', description: 'Multiple interconnected systems working together as one platform' },
  { term: 'data mesh', category: 'architecture', description: 'Decentralized approach to data ownership and management' },
  { term: 'data fabric', category: 'architecture', description: 'Unified data architecture connecting multiple data sources' },
  { term: 'resilience', category: 'architecture', description: 'Ability of systems to recover from failures and continue operating' },
  // ── Cloud ────────────────────────────────────────────────────────────────────
  { term: 'Azure', category: 'cloud', description: 'Microsoft\'s cloud computing platform' },
  { term: 'Kubernetes', category: 'cloud', description: 'Container orchestration system (K8s) for automated deployment and scaling' },
  { term: 'Docker', category: 'cloud', description: 'Platform for building, shipping, and running containerised applications' },
  { term: 'serverless', category: 'cloud', description: 'Code runs on-demand without provisioning or managing servers' },
  { term: 'PaaS', category: 'cloud', description: 'Platform as a Service — managed runtime, middleware, and OS' },
  { term: 'IaaS', category: 'cloud', description: 'Infrastructure as a Service — virtualised compute, storage, and networking' },
  { term: 'SaaS', category: 'cloud', description: 'Software as a Service — fully managed, ready-to-use application' },
  { term: 'AKS', category: 'cloud', description: 'Azure Kubernetes Service — managed Kubernetes on Azure' },
  { term: 'App Service', category: 'cloud', description: 'Azure PaaS for hosting web apps, REST APIs, and mobile backends' },
  { term: 'Azure Functions', category: 'cloud', description: 'Event-driven serverless compute service on Azure' },
  { term: 'Cosmos DB', category: 'cloud', description: 'Azure globally distributed, multi-model NoSQL database' },
  { term: 'Azure SQL', category: 'cloud', description: 'Azure managed relational database based on SQL Server' },
  { term: 'Key Vault', category: 'cloud', description: 'Azure service for managing secrets, encryption keys, and certificates' },
  { term: 'managed identity', category: 'cloud', description: 'Azure-assigned identity for services — no credentials stored in code' },
  { term: 'RBAC', category: 'cloud', description: 'Role-Based Access Control — permissions assigned via roles, not individuals' },
  { term: 'blob storage', category: 'cloud', description: 'Azure object storage for unstructured data (images, logs, backups)' },
  { term: 'VNet', category: 'cloud', description: 'Azure Virtual Network — isolated private network in the cloud' },
  { term: 'Entra ID', category: 'cloud', description: 'Microsoft cloud identity platform (formerly Azure Active Directory)' },
  { term: 'Logic Apps', category: 'cloud', description: 'Azure low-code workflow automation and integration service' },
  { term: 'Service Bus', category: 'cloud', description: 'Azure enterprise message broker with queues and topics' },
  { term: 'Event Hub', category: 'cloud', description: 'Azure big-data streaming and event ingestion service' },
  { term: 'Azure AI Foundry', category: 'cloud', description: 'Microsoft platform for building, deploying, and managing AI solutions' },
  { term: 'Azure OpenAI', category: 'cloud', description: 'Azure-hosted OpenAI models with enterprise security and governance' },
  { term: 'Container Apps', category: 'cloud', description: 'Azure managed container platform for microservices and event-driven workloads' },
  { term: 'Azure DevOps', category: 'cloud', description: 'Microsoft platform for source control, pipelines, boards, and testing' },
  { term: 'Landing Zone', category: 'cloud', description: 'Predefined cloud foundation with governance, security, and networking' },
  { term: 'FinOps', category: 'cloud', description: 'Practice of cloud cost optimization and financial accountability' },
  { term: 'multi-cloud', category: 'cloud', description: 'Using services from multiple cloud providers' },
  { term: 'hybrid cloud', category: 'cloud', description: 'Combining on-premises infrastructure with cloud services' },
  { term: 'cloud-native', category: 'cloud', description: 'Applications designed specifically for cloud environments' },
  { term: 'AKS Fleet', category: 'cloud', description: 'Azure service for managing multiple Kubernetes clusters' },
  // ── AI / ML ──────────────────────────────────────────────────────────────────
  { term: 'LLM', category: 'ai-ml', description: 'Large Language Model — deep learning model trained on vast text corpora' },
  { term: 'RAG', category: 'ai-ml', description: 'Retrieval-Augmented Generation — grounding LLM responses with external knowledge' },
  { term: 'embeddings', category: 'ai-ml', description: 'Dense vector representations that encode semantic meaning of text or data' },
  { term: 'vector database', category: 'ai-ml', description: 'Database optimised for nearest-neighbour search on high-dimensional vectors' },
  { term: 'fine-tuning', category: 'ai-ml', description: 'Adapting a pre-trained model on domain-specific data for a targeted task' },
  { term: 'prompt engineering', category: 'ai-ml', description: 'Designing inputs to reliably guide LLM outputs' },
  { term: 'hallucination', category: 'ai-ml', description: 'LLM generating confident but factually incorrect content' },
  { term: 'context window', category: 'ai-ml', description: 'Maximum number of tokens an LLM can process in a single request' },
  { term: 'inference', category: 'ai-ml', description: 'Running a trained model to generate predictions or completions' },
  { term: 'neural network', category: 'ai-ml', description: 'Layered mathematical functions that learn patterns from data' },
  { term: 'transformer', category: 'ai-ml', description: 'Attention-based architecture that powers modern LLMs (BERT, GPT, etc.)' },
  { term: 'attention mechanism', category: 'ai-ml', description: 'Allows the model to weight the relevance of each input token when generating output' },
  { term: 'grounding', category: 'ai-ml', description: 'Connecting AI outputs to verifiable real-world data sources' },
  { term: 'agentic', category: 'ai-ml', description: 'AI that autonomously plans and executes multi-step tasks' },
  { term: 'AI orchestration', category: 'ai-ml', description: 'Coordinating multiple AI models, tools, and memory in a pipeline' },
  { term: 'multimodal', category: 'ai-ml', description: 'Model that processes multiple input modalities (text, image, audio, video)' },
  { term: 'zero-shot', category: 'ai-ml', description: 'Model solves tasks without any task-specific training examples' },
  { term: 'few-shot', category: 'ai-ml', description: 'Model is guided by a small number of in-context demonstrations' },
  { term: 'chain-of-thought', category: 'ai-ml', description: 'Prompting technique where the model reasons step-by-step before answering' },
  { term: 'MCP', category: 'ai-ml', description: 'Model Context Protocol — open standard for AI agent tool and context APIs' },
  { term: 'tool use', category: 'ai-ml', description: 'LLM calling external functions or APIs to extend its capabilities' },
  { term: 'temperature', category: 'ai-ml', description: 'Controls LLM output randomness — lower = more deterministic, higher = more creative' },
  { term: 'tokenisation', category: 'ai-ml', description: 'Breaking text into sub-word units (tokens) for LLM processing' },
  { term: 'Agentic RAG', category: 'ai-ml', description: 'RAG enhanced with planning, tool-use, and multi-step reasoning' },
  { term: 'AI Agent', category: 'ai-ml', description: 'Autonomous AI system capable of planning, reasoning, and action' },
  { term: 'multi-agent system', category: 'ai-ml', description: 'Multiple AI agents collaborating to solve complex tasks' },
  { term: 'reasoning model', category: 'ai-ml', description: 'AI model optimized for deliberate multi-step reasoning' },
  { term: 'semantic search', category: 'ai-ml', description: 'Search based on meaning instead of exact keyword matching' },
  { term: 'knowledge graph', category: 'ai-ml', description: 'Graph structure representing entities and relationships' },
  { term: 'memory', category: 'ai-ml', description: 'Mechanism allowing agents to retain and recall information over time' },
  { term: 'agent orchestration', category: 'ai-ml', description: 'Coordinating multiple agents, tools, and workflows' },
  { term: 'function calling', category: 'ai-ml', description: 'Structured invocation of external APIs and tools by LLMs' },
  { term: 'tool calling', category: 'ai-ml', description: 'Using external systems during AI execution to perform actions' },
  { term: 'vector search', category: 'ai-ml', description: 'Similarity search over embeddings using nearest-neighbor algorithms' },
  { term: 'reranking', category: 'ai-ml', description: 'Improving retrieval quality by reordering retrieved results' },
  { term: 'chunking', category: 'ai-ml', description: 'Splitting documents into optimized retrieval segments' },
  { term: 'evaluation', category: 'ai-ml', description: 'Measuring AI system quality, accuracy, and reliability' },
  { term: 'LLMOps', category: 'ai-ml', description: 'Operational practices for managing large language models' },
  { term: 'AI Governance', category: 'ai-ml', description: 'Processes ensuring AI compliance, risk management, and accountability' },
  { term: 'Responsible AI', category: 'ai-ml', description: 'Framework for ethical, transparent, and trustworthy AI' },
  { term: 'synthetic data', category: 'ai-ml', description: 'Artificially generated datasets used for training and testing' },
  { term: 'in-context learning', category: 'ai-ml', description: 'Learning patterns from examples included directly in prompts' },
  { term: 'prompt chaining', category: 'ai-ml', description: 'Linking multiple prompts together into a workflow' },
  { term: 'AI workflow', category: 'ai-ml', description: 'Structured sequence of AI-driven tasks and decisions' },
  { term: 'vector index', category: 'ai-ml', description: 'Data structure optimized for fast vector similarity searches' },
  { term: 'MCP Server', category: 'ai-ml', description: 'Model Context Protocol endpoint exposing tools and context to AI agents' },
  // ── DevOps ───────────────────────────────────────────────────────────────────
  { term: 'CI/CD', category: 'devops', description: 'Continuous Integration / Continuous Deployment — automated build, test, and release pipeline' },
  { term: 'GitHub Actions', category: 'devops', description: 'GitHub\'s native CI/CD and workflow automation platform' },
  { term: 'Terraform', category: 'devops', description: 'HashiCorp Infrastructure as Code tool for declarative cloud provisioning' },
  { term: 'Infrastructure as Code', category: 'devops', description: 'Managing infrastructure through version-controlled declarative config files' },
  { term: 'GitOps', category: 'devops', description: 'Using Git as the single source of truth for infrastructure and app state' },
  { term: 'feature flag', category: 'devops', description: 'Toggle that enables or disables features without redeploying code' },
  { term: 'observability', category: 'devops', description: 'Ability to understand internal system state from external outputs (logs, metrics, traces)' },
  { term: 'SLO', category: 'devops', description: 'Service Level Objective — the target reliability metric your service aims to meet' },
  { term: 'SLA', category: 'devops', description: 'Service Level Agreement — contractual commitment on service reliability and uptime' },
  { term: 'SLI', category: 'devops', description: 'Service Level Indicator — specific measurable metric backing an SLO' },
  { term: 'DORA metrics', category: 'devops', description: 'Deployment frequency, lead time for changes, MTTR, and change failure rate' },
  { term: 'shift left', category: 'devops', description: 'Moving testing, security, and quality checks earlier in the development lifecycle' },
  { term: 'trunk-based development', category: 'devops', description: 'Developers integrate to the main branch frequently with short-lived feature branches' },
  { term: 'artifact', category: 'devops', description: 'Build output (binary, image, package) produced by a CI pipeline' },
  { term: 'rollback', category: 'devops', description: 'Reverting a deployment to a previously known-good version' },
  { term: 'Platform Engineering', category: 'devops', description: 'Building internal developer platforms for self-service software delivery' },
  { term: 'Internal Developer Platform', category: 'devops', description: 'Platform providing standardized developer tooling and workflows' },
  { term: 'Golden Path', category: 'devops', description: 'Recommended developer workflow optimized for productivity and governance' },
  { term: 'Backstage', category: 'devops', description: 'Open-source platform for developer portals and software catalogs' },
  { term: 'ArgoCD', category: 'devops', description: 'GitOps continuous delivery tool for Kubernetes' },
  { term: 'Helm', category: 'devops', description: 'Package manager for Kubernetes applications' },
  { term: 'Kustomize', category: 'devops', description: 'Declarative customization of Kubernetes manifests' },
  { term: 'OpenTelemetry', category: 'devops', description: 'Open standard for traces, metrics, and logs' },
  { term: 'DevSecOps', category: 'devops', description: 'Integrating security into DevOps workflows and automation' },
  { term: 'policy as code', category: 'devops', description: 'Managing governance and compliance policies as version-controlled code' },
  // ── Security ─────────────────────────────────────────────────────────────────
  { term: 'zero trust', category: 'security', description: 'Security model: never trust, always verify — no implicit network perimeter' },
  { term: 'OWASP', category: 'security', description: 'Open Web Application Security Project — standard web security guidelines and Top 10' },
  { term: 'OAuth', category: 'security', description: 'Open authorization protocol for delegated, token-based access' },
  { term: 'JWT', category: 'security', description: 'JSON Web Token — compact, signed token for stateless authentication' },
  { term: 'encryption', category: 'security', description: 'Transforming data into an unreadable form without the correct decryption key' },
  { term: 'secrets management', category: 'security', description: 'Securely storing, distributing, and rotating credentials and API keys' },
  { term: 'IAM', category: 'security', description: 'Identity and Access Management — defines who can do what on which resources' },
  { term: 'MFA', category: 'security', description: 'Multi-Factor Authentication — requires two or more verification methods' },
  { term: 'SSO', category: 'security', description: 'Single Sign-On — one authentication grants access to multiple systems' },
  { term: 'XSS', category: 'security', description: 'Cross-Site Scripting — injecting malicious scripts into web pages seen by other users' },
  { term: 'CSRF', category: 'security', description: 'Cross-Site Request Forgery — tricks an authenticated user into submitting unintended actions' },
  { term: 'penetration testing', category: 'security', description: 'Simulated cyberattack against a system to identify exploitable vulnerabilities' },
  { term: 'supply chain attack', category: 'security', description: 'Compromising software by targeting a less-secure upstream dependency or vendor' },
  { term: 'DevSecOps', category: 'security', description: 'Embedding security practices throughout the software lifecycle' },
  { term: 'least privilege', category: 'security', description: 'Granting only the minimum permissions required' },
  { term: 'passwordless', category: 'security', description: 'Authentication without passwords using stronger identity methods' },
  { term: 'threat modeling', category: 'security', description: 'Systematic analysis of potential security threats' },
  { term: 'SBOM', category: 'security', description: 'Software Bill of Materials listing application dependencies' },
  { term: 'SAST', category: 'security', description: 'Static Application Security Testing performed on source code' },
  { term: 'DAST', category: 'security', description: 'Dynamic Application Security Testing performed against running applications' },
  { term: 'supply chain security', category: 'security', description: 'Protecting software delivery pipelines and dependencies' },
  // ── Networking ───────────────────────────────────────────────────────────────
  { term: 'DNS', category: 'networking', description: 'Domain Name System — translates human-readable hostnames to IP addresses' },
  { term: 'TLS', category: 'networking', description: 'Transport Layer Security — cryptographic protocol encrypting data in transit' },
  { term: 'WebSocket', category: 'networking', description: 'Full-duplex persistent communication channel over a single TCP connection' },
  { term: 'load balancer', category: 'networking', description: 'Distributes incoming requests across multiple backend servers for reliability and scale' },
  { term: 'reverse proxy', category: 'networking', description: 'Sits in front of backend servers, forwarding client requests and handling TLS' },
  { term: 'edge computing', category: 'networking', description: 'Processing data close to the source at the network edge, reducing latency' },
  { term: 'anycast', category: 'networking', description: 'Network routing that directs traffic to the nearest of several identical endpoints' },
  { term: 'BGP', category: 'networking', description: 'Border Gateway Protocol — the routing protocol of the internet' },
  { term: 'TCP/IP', category: 'networking', description: 'The foundational communication protocol suite of the internet' },
  { term: 'HTTP/2', category: 'networking', description: 'Binary protocol with multiplexing, header compression, and server push' },
  { term: 'gRPC', category: 'networking', description: 'High-performance RPC framework using Protocol Buffers over HTTP/2' },
  { term: 'CDN', category: 'networking', description: 'Content Delivery Network improving performance through edge caching' },
  { term: 'IPv6', category: 'networking', description: 'Latest Internet Protocol standard supporting a large address space' },
  { term: 'VPN', category: 'networking', description: 'Virtual Private Network providing secure encrypted connectivity' },
  { term: 'latency', category: 'networking', description: 'Time required for data to travel between systems' },
  { term: 'throughput', category: 'networking', description: 'Amount of data transferred within a given time period' },
  { term: 'API Management', category: 'networking', description: 'Gateway and lifecycle management for APIs and integrations' },
  // ── Cloudflare ───────────────────────────────────────────────────────────────
  { term: 'Workers', category: 'cloudflare', description: 'Cloudflare serverless execution environment running code at 300+ edge locations' },
  { term: 'Durable Objects', category: 'cloudflare', description: 'Cloudflare stateful serverless primitives with strong consistency and WebSocket support' },
  { term: 'Workers KV', category: 'cloudflare', description: 'Cloudflare globally replicated key-value store for edge-accessible data' },
  { term: 'R2', category: 'cloudflare', description: 'Cloudflare S3-compatible object storage with zero egress fees' },
  { term: 'D1', category: 'cloudflare', description: 'Cloudflare serverless SQLite database — replicated across the edge' },
  { term: 'Turnstile', category: 'cloudflare', description: 'Cloudflare privacy-preserving CAPTCHA alternative with no user friction' },
  { term: 'WAF', category: 'cloudflare', description: 'Web Application Firewall — inspects and blocks malicious HTTP/HTTPS traffic' },
  { term: 'Magic Transit', category: 'cloudflare', description: 'Cloudflare network-layer DDoS protection for IP prefixes' },
  { term: 'Argo Smart Routing', category: 'cloudflare', description: 'Routes traffic over the fastest, least-congested Cloudflare network paths' },
  { term: 'Zero Trust Network Access', category: 'cloudflare', description: 'Cloudflare ZTNA — identity-aware, network-perimeter-free access control' },
  { term: 'Cloudflare Pages', category: 'cloudflare', description: 'Cloudflare JAMstack hosting with automatic deploys from Git' },
  { term: 'Vectorize', category: 'cloudflare', description: 'Cloudflare vector database for AI similarity search, native to Workers' },
  { term: 'Cloudflare AI Gateway', category: 'cloudflare', description: 'AI traffic observability, caching, and routing service' },
  { term: 'Cloudflare Tunnel', category: 'cloudflare', description: 'Secure outbound-only connectivity without exposing public IPs' },
  { term: 'Cloudflare Access', category: 'cloudflare', description: 'Identity-aware application access without VPN requirements' },
  { term: 'Cloudflare Images', category: 'cloudflare', description: 'Managed image storage, optimization, and delivery service' },
  { term: 'Cloudflare Queues', category: 'cloudflare', description: 'Reliable message queue service for Workers applications' },
  // ── Data ───────────────────────────────────────────────────────────────
  { term: 'Data Lake', category: 'data', description: 'Centralized repository storing large volumes of raw structured and unstructured data' },
  { term: 'Data Warehouse', category: 'data', description: 'Analytical repository optimized for business intelligence workloads' },
  { term: 'ETL', category: 'data', description: 'Extract, Transform, Load data integration process' },
  { term: 'ELT', category: 'data', description: 'Extract, Load, Transform modern cloud data processing pattern' },
  { term: 'Apache Kafka', category: 'data', description: 'Distributed event streaming platform' },
  { term: 'Delta Lake', category: 'data', description: 'Storage layer adding reliability and ACID transactions to data lakes' },
  { term: 'Databricks', category: 'data', description: 'Unified analytics and AI platform built on Apache Spark' },
  { term: 'Data Governance', category: 'data', description: 'Management of data quality, security, ownership, and compliance' }
];

// ── Lazy-initialised regex and lookup map ─────────────────────────────────────

/** Escapes special regex metacharacters in a string (OWASP-safe, no user input). */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let _regex: RegExp | null = null;
let _map: Map<string, Keyword> | null = null;

/**
 * Returns a compiled RegExp matching any keyword from KEYWORDS.
 * Terms are sorted longest-first so multi-word phrases match before sub-terms.
 * Lookahead/lookbehind prevent partial-word matches (e.g. "Azure" inside "AzureAD").
 */
export function getKeywordRegex(): RegExp {
  if (_regex) return _regex;
  const sorted = [...KEYWORDS].sort((a, b) => b.term.length - a.term.length);
  // Append s? to each term to match common plural forms (LLM→LLMs, API→APIs)
  const pattern = sorted.map((k) => `${escapeRegex(k.term)}s?`).join('|');
  _regex = new RegExp(`(?<![a-zA-Z0-9])(${pattern})(?![a-zA-Z0-9])`, 'gi');
  return _regex;
}

/** Returns a Map<lowerCaseTerm, Keyword> for O(1) category lookup after a regex match. */
export function getKeywordMap(): Map<string, Keyword> {
  if (_map) return _map;
  _map = new Map(KEYWORDS.map((k) => [k.term.toLowerCase(), k]));
  return _map;
}
