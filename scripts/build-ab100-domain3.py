import json, pathlib

base = pathlib.Path(r'C:\Users\ajeet.k.chouksey\Documents\Code\ajch_platform\public\content\skillup\ab100\questions')
d3 = json.loads((base / 'ab100-domain3.json').read_text(encoding='utf-8'))
d4 = json.loads((base / 'ab100-domain4.json').read_text(encoding='utf-8'))

merged = []
for i, q in enumerate(d3, 1):
    q2 = dict(q)
    q2['domain'] = 3
    q2['id'] = f'ab100-d3-{i:03d}'
    merged.append(q2)

for i, q in enumerate(d4, len(d3) + 1):
    q2 = dict(q)
    q2['domain'] = 3
    q2['id'] = f'ab100-d3-{i:03d}'
    merged.append(q2)

new_questions = [
    {
        "domain": 3,
        "id": "ab100-d3-027",
        "scenario": "A team has built several AI agents using Microsoft Foundry Agents service and needs to implement a CI/CD pipeline to promote agents from development through staging to production environments. Each agent has connections to Foundry models, Azure AI Search indexes, and Azure Functions tools. The team wants to ensure safe, repeatable deployments.",
        "question": "What are the key components of an ALM process for Microsoft Foundry Agents service?",
        "options": [
            "Export the agent as a ZIP file and manually copy it between environments using the Azure portal",
            "Use infrastructure-as-code (Bicep/ARM) to define Foundry Hub, Project, and agent configurations; store agent definitions in source control; use deployment pipelines (GitHub Actions or Azure DevOps) to promote environment-specific configurations, with environment-specific connection strings and model deployment names per environment",
            "Test only in production using feature flags to limit user exposure during initial rollout",
            "Deploy agents directly from the Foundry Studio UI to production after local testing"
        ],
        "correct": 1,
        "explanation": "IaC-based ALM for Foundry Agents (B) is the correct approach. Key components: agent definition in source control (YAML or JSON describing agent instructions, tools, knowledge sources), Bicep/ARM templates for Foundry Hub and Project resources, environment-specific parameter files (model deployment names differ per environment), CI pipeline for validation (evaluation against golden dataset), CD pipeline for staged promotion (dev to staging to production). Manual ZIP copy (A) is error-prone and untracked. Production-only testing (C) exposes real users to unvalidated agents. UI-only deployment (D) bypasses version control and automated evaluation gates.",
        "tags": ["ALM", "Foundry-Agents", "CI/CD", "infrastructure-as-code"]
    },
    {
        "domain": 3,
        "id": "ab100-d3-028",
        "scenario": "A security assessment of an AI agent reveals three vulnerabilities: (1) users can override the system prompt by instructing the agent to ignore previous instructions, (2) retrieved web content contains embedded instructions that the agent follows as if they were legitimate, (3) users can extract the full system prompt by asking the agent to repeat it verbatim.",
        "question": "Which combination of mitigations correctly addresses all three prompt manipulation vulnerabilities?",
        "options": [
            "Add stronger wording to the system prompt such as 'never ignore your instructions' to address all three issues",
            "For direct injection: add Azure AI Content Safety input scanner to detect and block jailbreak patterns before the prompt reaches the LLM; for indirect injection: scan retrieved content with Content Safety prompt injection detector and use structural delimiters (XML tags) to separate trusted instructions from untrusted retrieved content; for system prompt extraction: instruct the agent not to reveal its system prompt and filter responses via API Management",
            "Switch to a different LLM model that is immune to prompt injection attacks",
            "Disable the retrieval step to eliminate indirect injection risk and restrict users to predefined question templates"
        ],
        "correct": 1,
        "explanation": "Layered mitigations per vulnerability (B) is the correct defense-in-depth approach. Direct injection: Azure AI Content Safety jailbreak detection blocks known attack patterns at the input layer before the LLM sees them. Indirect injection: Content Safety scans retrieved content, and structural prompt delimiting (XML tags distinguishing trusted instructions from retrieved context) helps the LLM treat untrusted content appropriately. System prompt extraction: response filtering and explicit system prompt confidentiality instructions address this. No LLM is immune to prompt injection (C) — all can be manipulated. Disabling retrieval (D) eliminates indirect injection but destroys the agent knowledge base capability entirely.",
        "tags": ["prompt-injection", "indirect-injection", "content-safety", "defense-in-depth"]
    },
    {
        "domain": 3,
        "id": "ab100-d3-029",
        "scenario": "An AI agent for customer service has been in production for 3 months. The telemetry dashboard in Azure Application Insights shows: average input tokens per request increased from 850 to 1,340 over 4 weeks, P95 latency increased from 4.2s to 7.8s, and groundedness scores from nightly evaluation dropped from 4.2 to 3.6.",
        "question": "What does this telemetry pattern indicate and what action should be taken?",
        "options": [
            "The system is scaling naturally with more users and no action is needed",
            "The increasing input token count suggests knowledge base growth is injecting more retrieved context per query; the latency increase correlates directly with token growth; the groundedness drop indicates the additional retrieved context contains conflicting or low-quality chunks — investigate retrieval quality, apply relevance score thresholds to filter low-quality chunks, and re-evaluate the chunking strategy",
            "The latency increase indicates the Azure OpenAI deployment needs to be scaled up with additional PTU capacity",
            "The groundedness drop indicates the LLM model needs to be updated to the latest available version"
        ],
        "correct": 1,
        "explanation": "Retrieval quality degradation (B) is the correct interpretation. The token growth pattern (850 to 1,340) suggests the RAG pipeline is retrieving more chunks per query — likely because the knowledge base expanded without corresponding quality filtering. More chunks do not always improve answers — low-relevance chunks add noise and can cause the model to blend contradictory information, explaining the groundedness drop. Latency directly correlates with input token count. Recommended action: implement relevance score thresholds to filter low-quality retrieved chunks, review chunking strategy for new content, and re-run nightly evaluation after each change. Natural scaling (A) ignores the quality degradation signal. Adding PTU (C) addresses latency symptoms but not the root cause. A model update (D) does not fix retrieval quality issues.",
        "tags": ["telemetry", "RAG", "groundedness", "performance-tuning"]
    },
    {
        "domain": 3,
        "id": "ab100-d3-030",
        "scenario": "A QA team needs to create comprehensive test cases for an AI agent that handles insurance claims across Dynamics 365 Customer Service, Copilot Studio, and Azure AI Foundry. The agent processes 50 claim types with varying complexity. Writing test cases manually would take 6 weeks and the team has 2 weeks before the release deadline.",
        "question": "How should the team use Copilot to build the test case strategy efficiently within the time constraint?",
        "options": [
            "Ask Copilot in Microsoft Word to generate a test plan document, then implement all test cases manually from the document",
            "Use GitHub Copilot or Copilot in Azure DevOps to: generate test case templates from the agent specification and acceptance criteria, produce scenario variations by parameterizing claim types and edge cases across all 50 claim types, generate test data sets covering boundary conditions, and produce LLM-as-judge evaluation prompts for automated quality scoring — then validate and refine the generated cases before adding to the test suite",
            "Deploy the agent to 1% of production traffic and use real insurance claims as implicit test cases",
            "Use the existing golden dataset from development as the complete test suite without expansion"
        ],
        "correct": 1,
        "explanation": "Copilot-assisted test case generation (B) is the correct strategy for meeting the 2-week deadline. GitHub Copilot and Azure DevOps Copilot can generate test case templates from acceptance criteria at 10x the speed of manual authoring, create scenario variations by parameterizing claim types and edge cases across all 50 types, produce realistic test data, and generate LLM-as-judge prompts for automated quality scoring. The team validates and curates the output rather than writing from scratch. Copilot in Word (A) produces documents, not executable test artifacts. Production traffic as implicit tests (C) exposes real customers to unvalidated agent behavior. The existing golden dataset (D) covers development-phase happy paths but misses new claim types and edge cases introduced in this release.",
        "tags": ["test-strategy", "Copilot", "test-generation", "QA"]
    }
]

merged.extend(new_questions)

out_path = base / 'ab100-domain3.json'
out_path.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'Written {len(merged)} questions to ab100-domain3.json')
print('Last 4 IDs:', [q["id"] for q in merged[-4:]])
