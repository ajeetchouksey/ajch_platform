# Domain 2: Microsoft AI Apps & Services
**Exam Weight: 38% — Heaviest Domain (tied)**

---

## 🧠 The Golden Rule

> **"Microsoft 365 Copilot = AI embedded in your daily work apps. Foundry Tools = AI you build custom solutions with."**

<div class="note-important"><strong>Core distinction:</strong> If the scenario is about a business user in Word / Excel / Teams / Outlook getting AI help → M365 Copilot. If the scenario is about building a custom AI application, agent, or service → Foundry Tools / Azure AI Foundry. Copilot Studio sits in between — it lets non-developers build custom agents using M365 data.</div>

---

## 2.1 The Microsoft AI Stack

![Diagram 1](/content/skillup/ab731/images/d2-microsoft-ai-services-01.png)

---

## 2.2 Microsoft Copilot vs Microsoft 365 Copilot

<div class="note-trap"><strong>This is a favourite exam trap.</strong> These are two different products.</div>

| | **Microsoft Copilot** | **Microsoft 365 Copilot** |
|---|---|---|
| **Audience** | Anyone (consumer + business) | M365 subscribers (paid add-on) |
| **Powered by** | Bing + GPT | GPT + **Microsoft Graph** (your org data) |
| **Access to org data** | ❌ No | ✅ Yes — emails, docs, Teams chats, calendar |
| **Licence** | Free (Copilot) or included | Paid add-on (~$30/user/month) |
| **Use case** | General web research, tasks | Work productivity with YOUR org data |

<div class="note-scribble">The key differentiator: Microsoft Graph. M365 Copilot can answer "Summarise last week's emails about Project X" because it reads YOUR Graph data. Free Microsoft Copilot cannot do this.</div>

---

## 2.3 Microsoft Graph — The Data Connector

Microsoft Graph is the **API layer that connects Copilot to your organisation's data** stored in Microsoft 365 services.

![Diagram 2](/content/skillup/ab731/images/d2-microsoft-ai-services-02.png)

**Why it matters for Copilot:**
- When you ask Copilot "What are my action items from today's meetings?" — Graph pulls your Teams transcripts and calendar
- Copilot **respects existing permissions** — you only see data you're already authorised to see
- No data is shared across tenants

<mark>Exam key point: Microsoft Graph is WHY M365 Copilot knows about your specific org. Without Graph, Copilot would only know public internet information.</mark>

---

## 2.4 Copilot in Microsoft 365 Apps

| App | Key Copilot capabilities |
|---|---|
| **Word** | Draft, rewrite, summarise documents; generate from outline |
| **Excel** | Analyse data, generate formulas, create charts, highlight trends |
| **PowerPoint** | Generate presentations from a Word doc or prompt; add slides; design suggestions |
| **Outlook** | Draft emails, summarise threads, schedule meetings, coaching on tone |
| **Teams** | Meeting transcription + summary, action items, live translation, chat summaries |
| **OneNote** | Organise notes, generate summaries, create to-do lists |
| **Loop** | Collaborative workspaces with AI-generated content that stays in sync |

<div class="note-important"><strong>Exam pattern:</strong> "A manager needs to quickly catch up on a 2-hour meeting they missed. Which Copilot feature is most appropriate?" → Teams Copilot meeting recap / summary.</div>

---

## 2.5 Copilot Chat (Web & Mobile)

**Copilot Chat** is the chat interface available at copilot.microsoft.com and in the Microsoft 365 mobile apps.

- Available to M365 users as part of their subscription (or free tier for consumer)
- Supports **web search** (grounded in Bing) + **work data** (via Graph, for M365 users)
- Supports **file uploads** for analysis
- Can generate images (via DALL·E integration)

**Work vs Web toggle:** In the M365 Copilot Chat interface, users can toggle between searching the web or searching their work data. This is a common exam concept.

---

## 2.6 Researcher and Analyst in Copilot

Two specialised **Copilot agents** available in Microsoft 365:

| Agent | Purpose | Best for |
|---|---|---|
| **Researcher** | Deep research using the web + your org data | Building comprehensive reports, competitive analysis, literature review |
| **Analyst** | Data analysis, running Python code, generating visualisations | Analysing spreadsheets, surfacing trends, creating charts from data |

<div class="note-scribble">Researcher = web + docs research. Analyst = data crunching. If the exam gives a scenario about analysing a sales CSV → Analyst. If it's about researching market trends → Researcher.</div>

---

## 2.7 Microsoft Copilot Studio

**What it is:** A low-code/no-code platform to **build custom AI agents and copilots** connected to your organisation's data and processes.

**Who uses it:** IT professionals, power users, business analysts — no coding required.

**Key capabilities:**
- Create custom copilots with specific knowledge bases (SharePoint, websites, documents)
- Add to Teams, websites, mobile apps
- Integrate with Power Platform (Power Automate for actions)
- Connect to third-party systems via connectors
- Create custom agents for specific business functions (HR bot, IT helpdesk, sales assistant)

![Diagram 3](/content/skillup/ab731/images/d2-microsoft-ai-services-03.png)

<div class="note-important"><strong>Build vs Buy vs Extend:</strong><br/><strong>Buy</strong> = Use M365 Copilot out-of-the-box (no customisation)<br/><strong>Extend</strong> = Use Copilot Studio to customise/extend M365 Copilot<br/><strong>Build</strong> = Use Azure AI Foundry to build a custom AI application from scratch</div>

---

## 2.8 M365 Copilot Extensibility Framework

When out-of-the-box Copilot isn't enough, you can extend it:

| Extension type | What it does | Who builds it |
|---|---|---|
| **Plugins** | Give Copilot new capabilities (e.g., call your CRM API) | Developers |
| **Connectors** | Bring external data into Microsoft Graph | IT/Developers |
| **Declarative agents** | Copilot agents scoped to specific knowledge/tasks | Copilot Studio / Developers |
| **Custom engine agents** | Full custom AI agents using Azure AI Foundry | Developers |

<mark>Exam pattern: "A company wants Copilot to answer questions from their internal knowledge base in Confluence. What's the best approach?" → Build a declarative agent in Copilot Studio with the Confluence data.</mark>

---

## 2.9 Azure AI Foundry and Foundry Tools

**Azure AI Foundry** is Microsoft's platform for building, deploying, and managing enterprise AI solutions.

### What's in Foundry Tools

| Tool | What it does |
|---|---|
| **Microsoft Foundry** | End-to-end AI project hub — model selection, prompt flows, evaluation, deployment |
| **Azure AI Search** | Vector + semantic search — the retrieval layer for RAG solutions |
| **Azure Vision in Foundry Tools** | Computer vision — image analysis, OCR, object detection, face analysis |
| **Model Catalog** | Access to hundreds of models: OpenAI (GPT-4o), Microsoft (Phi), open source (Llama, Mistral) |

### Benefits of Foundry Tools
- **Scalability** — scales from prototype to millions of users on Azure infrastructure
- **Security** — enterprise-grade access control, private networking, content filters
- **Choice** — use any model from the catalog, not locked to one vendor
- **Governance** — built-in responsible AI tooling, content safety filters, evaluations

<div class="note-important"><strong>Business scenario → Tool mapping:</strong><br/>📄 Understand documents from photos → Azure Vision (OCR)<br/>🔍 Search across thousands of internal documents → Azure AI Search<br/>🤖 Build a custom customer service bot → Microsoft Foundry + Copilot Studio<br/>📊 Analyse images from a factory floor → Azure Vision in Foundry Tools</div>

---

## 2.10 Matching AI Models to Business Needs

Not all models are equal. The exam tests your ability to match:

| Business need | Model characteristic to look for |
|---|---|
| Real-time chat with customers | Low latency, cost-effective (smaller model e.g. Phi) |
| Complex legal document analysis | High accuracy, large context window (GPT-4o) |
| Code generation at scale | Code-specialised model |
| Multilingual customer support | Strong multilingual capabilities |
| Image understanding | Multimodal model (vision + text) |
| On-premise deployment | Small, deployable model (Phi-3 mini) |

<div class="note-scribble">The exam won't ask you to memorise specific model benchmarks. It tests the concept: bigger/more expensive model ≠ always better. Match capability to task. Phi-3 for simple tasks, GPT-4o for complex reasoning.</div>

---

## 🎯 Domain 2 Exam Traps

| Trap | Correct answer |
|---|---|
| "Copilot" vs "M365 Copilot" | M365 Copilot has Microsoft Graph access; base Copilot does not |
| "Build vs Extend" | Try Copilot Studio extension before building from scratch in Foundry |
| "Researcher vs Analyst" | Researcher = web/doc research; Analyst = data analysis with code |
| "Which Copilot for collaborative AI content?" | Copilot Pages — persistent, multi-user canvas (not a single-session Word draft) |
| "Automate vs Augment first?" | Start with automatable tasks (meeting summaries, email drafts) for fastest ROI |
| "Budget-sensitive edge deployment?" | Phi model family — lightweight, runs on-device or in constrained environments |
| "Azure AI Search" | It's the retrieval/search layer for RAG — not just a search engine |
| "Copilot sees all data" | Copilot respects existing M365 permissions — can't access what user can't access |

---

## 2.11 Copilot Experiences — Pages, Chat, and Cross-App Features

Beyond per-app Copilot features, M365 Copilot includes cross-app experiences:

| Experience | What it is | Key differentiator |
|---|---|---|
| **Copilot Chat** (formerly Business Chat / BizChat) | Unified chat interface — query across all your work data (emails, docs, Teams, calendar) or web | Single place to ask anything about your work |
| **Copilot Pages** | Collaborative AI canvas — Copilot populates it, multiple users can continue editing | Persistent, shareable AI-generated artifact (unlike a single-session chat) |
| **Work / Web toggle** | In Copilot Chat, switch between your org data (Microsoft Graph) and Bing web search | Explicitly controls whether the AI searches your internal data or the public web |

![Diagram 4](/content/skillup/ab731/images/d2-microsoft-ai-services-04.png)

<div class="note-trap"><strong>Exam trap — Pages vs Word:</strong> "A team needs a shared AI-populated document where multiple members can continue adding Copilot-generated research" → <strong>Copilot Pages</strong> (multi-user, persistent, AI-populated). NOT Word Copilot (single session, single user).</div>

<div class="note-scribble">Copilot Chat is the power user's home base — if you need to ask "what did my team work on last week?" or "find all emails about Project X and summarise the key decisions", Copilot Chat with the Work toggle does this in one place. No need to open four apps.</div>

---

## 2.12 Mapping Business Processes to Copilot

Not every task benefits equally from AI. Map each task type to the right Copilot approach:

| Task type | AI benefit | Best Copilot application |
|---|---|---|
| **Automatable** | Highest — repetitive, structured, rule-based | Meeting summaries, email triage, invoice data extraction |
| **Augmentable** | High — knowledge work where AI drafts and humans refine | Writing proposals, data analysis in Excel, research in Chat |
| **Judgment-heavy** | Lower — deep expertise + ethics required | Complex legal interpretation, senior strategic decisions |
| **Relationship-based** | Minimal — human connection IS the value | Client relationship management, counselling, coaching |

### The mapping process

![Diagram 5](/content/skillup/ab731/images/d2-microsoft-ai-services-05.png)

<div class="note-important"><strong>Exam pattern:</strong> "Which tasks should be prioritised for Copilot deployment?" → Automatable tasks first (meeting summaries, email drafts, document extraction) — fastest, clearest ROI. Augmentable tasks (analysis, writing) second. Never start with judgment-heavy or relationship tasks.</div>

---

## 2.13 Choosing the Right Foundry Model

The Foundry Model Catalog contains hundreds of models. The exam tests your ability to match business need to model type:

| Scenario | Best model choice | Why |
|---|---|---|
| Complex legal reasoning, long documents | **GPT-4o** | High accuracy, large context window, strong reasoning |
| Real-time customer chat at low cost | **Phi (Phi-3 mini/small)** | Lightweight, fast, cost-effective for simple tasks |
| On-premise or edge deployment (no cloud) | **Phi-3 mini** | Small enough to run locally |
| Budget-conscious, open-source preferred | **Llama / Mistral** | Open source = no per-token cost, customisable |
| Domain-specific brand voice / jargon | **Fine-tuned model** | When base model cannot learn domain via prompting |
| Image + text understanding | **GPT-4o (multimodal)** | Vision + language in one model |

![Diagram 6](/content/skillup/ab731/images/d2-microsoft-ai-services-06.png)

<div class="note-trap"><strong>Exam trap:</strong> "Bigger model = always better" is WRONG. The exam tests that you match model capability to task complexity. Using GPT-4o for a simple FAQ chatbot is expensive overkill. Using Phi-3 for complex multi-document contract analysis will produce poor results.</div>

---

## 2.14 Buy / Build / Extend Decision Framework

The AB-731 exam often presents a scenario and asks: *"What is the MOST APPROPRIATE solution?"* Use this framework:

| Approach | When to choose | Microsoft product |
|---|---|---|
| **Buy** | Need AI capability immediately, no customisation required | Microsoft 365 Copilot (out-of-box) |
| **Extend** | Need to add org-specific data or workflows to existing Copilot | Copilot Studio (extend M365 Copilot via plugins, connectors) |
| **Build** | Need fully custom AI experience, not based on M365 Copilot | Copilot Studio (standalone agent) or Azure AI Foundry |

<div class="note-important"><strong>Exam rule:</strong> "Extend" is the answer when a business already has M365 Copilot and wants to add capabilities. "Build" from scratch (Foundry) is only justified when M365 Copilot cannot serve the use case at all (e.g., external-facing customer chatbot on a public website).</div>

---

## 📌 D2 Hard Question Patterns

**Pattern 1 — Copilot vs Copilot Studio**
> *"A company wants employees to have an AI assistant that answers HR policy questions. What is the QUICKEST path to value?"*
>
> ✅ Microsoft 365 Copilot + SharePoint connector (extend). NOT Copilot Studio build-from-scratch — that's overkill for internal staff who already have M365 licences.

**Pattern 2 — Microsoft Graph powers Copilot**
> *"Why can Microsoft 365 Copilot access a user's emails and calendar without extra configuration?"*
>
> ✅ Microsoft Graph — the unified API layer that Copilot uses to read/write across M365 apps. Graph respects existing permissions, so Copilot inherits the user's data access.

**Pattern 3 — Foundry vs Studio scope**
> *"A developer team wants to build an AI model trained on 5 years of internal sales data. Which tool is most appropriate?"*
>
> ✅ Azure AI Foundry — for custom model development, fine-tuning, and MLOps. Copilot Studio is low-code for building agents, not for training models.

**Pattern 4 — Researcher / Analyst Copilot agents**
> *"A business analyst needs to synthesise insights from 50 reports per week. Which Copilot capability addresses this?"*
>
> ✅ Analyst agent in Copilot (deep analysis, Python code execution, charts). Researcher agent handles broad web + org data synthesis. These are the two premium agentic features in M365 Copilot.
