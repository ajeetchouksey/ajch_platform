# D2: Design Agentic AI Solutions

> **Exam weight**: 28% · **Questions**: ~17 of 60

## Overview

Domain 2 is the technical design domain — it covers how to architect multi-agent systems using Azure AI Foundry, AI Agent Service, Copilot Studio, and the Microsoft Agent Framework (AutoGen/Magentic-One). It tests your ability to choose orchestration patterns, design memory and tool layers, and wire agents together correctly.

---

## Orchestration Patterns

### Single-Agent vs Multi-Agent Decision

```mermaid
graph TD
    T[Task] --> Q1{Parallelizable<br/>sub-tasks?}
    Q1 -->|No| Q2{Fits in<br/>context window?}
    Q2 -->|Yes| SA[Single Agent]
    Q2 -->|No| CM[Coordinator + Memory]
    Q1 -->|Yes| Q3{Independent<br/>domains?}
    Q3 -->|Yes| MA[Multi-Agent<br/>Parallel]
    Q3 -->|No| SC[Sequential<br/>Pipeline]
```

### Multi-Agent Patterns

| Pattern | Structure | When to Use |
|---------|-----------|-------------|
| **Sequential** | A → B → C | Each step depends on previous output |
| **Parallel** | A → [B, C, D] → Merge | Independent subtasks, reduce latency |
| **Hierarchical** | Coordinator → [Specialist A, B] | Domain specialization + routing |
| **Debate** | Agent A ↔ Agent B → Critic | Improve accuracy via adversarial review |
| **Magentic-One** | Orchestrator + [WebSurfer, FileSurfer, Coder, Executor] | Open-ended research tasks |

### Exam Trap ⚠️

<div class="note-trap">
Magentic-One is NOT the same as generic multi-agent. Magentic-One is a **specific Microsoft pattern** for open-ended web/file/code tasks. Use it when the task is: unstructured, requires browsing + coding + file operations. Do NOT use it for structured business workflows — hierarchical coordinator pattern is correct there.
</div>

---

## Azure AI Agent Service

### Agent Service Architecture

```mermaid
graph TD
    U[User Message] --> T[Thread / Run]
    T --> A[Agent<br/>system prompt + tools]
    A -->|tool_call| TL[Tool Layer]
    TL --> CI[Code Interpreter]
    TL --> FS[File Search<br/>Azure AI Search]
    TL --> FN[Function Tools<br/>Azure Functions]
    TL --> BP[Bing Search]
    A -->|response| T
    T --> U2[Assistant Response]
```

### Key Concepts: Threads, Runs, Steps

| Concept | Description | Azure Equivalent |
|---------|-------------|-----------------|
| **Thread** | Conversation history container | Cosmos DB-backed session |
| **Run** | Single agent execution on a thread | Async task with polling |
| **Run Step** | Individual tool call or message | Trace span |
| **File** | Uploaded document for processing | Azure Blob Storage |
| **Vector Store** | Index for file search | Azure AI Search index |

### Built-in Tools

| Tool | What it Does | Max Files |
|------|-------------|-----------|
| **Code Interpreter** | Executes Python in sandbox | 20 per thread |
| **File Search** | Semantic search over uploaded files | 10,000 per vector store |
| **Bing Search** | Real-time web search | N/A |
| **Function calling** | Calls your custom Azure Functions | 128 per agent |

### Creating an Agent (SDK Pattern)

```python
from azure.ai.projects import AIProjectClient

agent = client.agents.create_agent(
    model="gpt-4o",
    name="invoice-processor",
    instructions="You process invoices and extract structured data.",
    tools=[{"type": "code_interpreter"}, {"type": "file_search"}],
    tool_resources={"file_search": {"vector_store_ids": [vs.id]}}
)

thread = client.agents.create_thread()
message = client.agents.create_message(thread.id, role="user", content="Process this invoice")
run = client.agents.create_and_process_run(thread.id, agent_id=agent.id)
```

---

## Copilot Studio Design

### Copilot Studio Architecture

```mermaid
graph TD
    U[User<br/>Teams/Web/Custom] --> C[Copilot]
    C --> T{Topic<br/>matching}
    T -->|Matched| TP[Topic Flow]
    T -->|No match| FB[Fallback / Generative AI]
    TP --> KB[Knowledge Source<br/>SharePoint/URLs/Dataverse]
    TP --> AC[Actions<br/>Power Automate flows]
    TP --> EXT[External APIs<br/>HTTP connector]
    TP --> PA[Plugin<br/>OpenAPI spec]
```

### Topics vs Actions vs Plugins

| Concept | Purpose | Trigger |
|---------|---------|---------|
| **Topic** | Conversation flow for a specific intent | User phrase matching |
| **Action (flow)** | Call Power Automate or external API | Within a topic |
| **Plugin** | Expose external API as tool | AI-driven selection |
| **Knowledge source** | Add docs/URLs to generative answers | Fallback or explicit |
| **Adaptive card** | Rich response in Teams/Web | Within topic |

### Exam Trap ⚠️

<div class="note-trap">
In Copilot Studio, **generative answers** (the fallback AI response) and **topics** (explicit flow) are DIFFERENT. Generative answers search knowledge sources. Topics override generative answers when a phrase is matched. The exam tests whether you know which one activates for a given input.
</div>

---

## Microsoft Agent Framework (AutoGen)

### AgentChat Multi-Agent Setup

```python
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_ext.models.openai import AzureOpenAIChatCompletionClient

model_client = AzureOpenAIChatCompletionClient(
    model="gpt-4o",
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_key=os.environ["AZURE_OPENAI_KEY"],
)

researcher = AssistantAgent("researcher", model_client=model_client,
    system_message="Search and summarize information.")
writer = AssistantAgent("writer", model_client=model_client,
    system_message="Write clear reports from summaries.")

team = RoundRobinGroupChat([researcher, writer], max_turns=6)
result = await team.run(task="Research and report on Azure AI Foundry")
```

### Selection Strategies

| Strategy | How It Works | Use Case |
|----------|-------------|----------|
| **RoundRobin** | Fixed rotation through agents | Structured pipeline |
| **Selector (LLM)** | LLM picks next speaker | Dynamic routing |
| **Swarm** | Agents hand off directly | Distributed work |

### Termination Conditions

```python
from autogen_agentchat.conditions import MaxMessageTermination, TextMentionTermination

termination = MaxMessageTermination(10) | TextMentionTermination("TASK_COMPLETE")
```

---

## Memory Architecture

### Memory Tiers for Agents

```mermaid
graph LR
    subgraph "Working Memory"
        CTX[Context Window<br/>Current conversation]
    end
    subgraph "Short-term Memory"
        REDIS[Azure Cache for Redis<br/>Session state, tool results]
    end
    subgraph "Long-term Memory"
        COSMOS[Cosmos DB<br/>Conversation history<br/>User preferences]
        SEARCH[Azure AI Search<br/>Vector embeddings<br/>Knowledge base]
    end
    CTX <-->|in-context| REDIS
    REDIS <-->|persist/retrieve| COSMOS
    CTX <-->|RAG retrieval| SEARCH
```

| Memory Type | Azure Service | TTL | Use For |
|-------------|--------------|-----|---------|
| In-context | Token window | Request lifetime | Current turn reasoning |
| Working | Azure Cache for Redis | Minutes | Multi-turn session state |
| Episodic | Cosmos DB (NoSQL) | Days/months | Conversation history |
| Semantic | Azure AI Search (vector) | Persistent | Knowledge retrieval |

---

## RAG Pipeline Design in AI Foundry

### Full RAG Architecture

```mermaid
graph TD
    DOC[Source Documents<br/>PDF/Word/HTML] --> CHUNK[Chunking<br/>AI Foundry pipeline]
    CHUNK --> EMB[Embedding Model<br/>text-embedding-3-large]
    EMB --> IDX[Azure AI Search<br/>Vector + Keyword Index]
    
    Q[User Query] --> QEMB[Query Embedding]
    QEMB --> HYBRIDSEARCH[Hybrid Search<br/>Vector + BM25]
    IDX --> HYBRIDSEARCH
    HYBRIDSEARCH --> RERANK[Semantic Reranking<br/>Azure AI Search]
    RERANK --> CTX2[Context injection<br/>into prompt]
    CTX2 --> LLM[LLM Response]
```

### Chunking Strategies

| Strategy | Chunk Size | Best For |
|----------|-----------|----------|
| Fixed-size | 512 tokens | Uniform documents |
| Sentence-based | Variable | Prose, documentation |
| Semantic | Variable (topic boundary) | Long technical docs |
| Hierarchical | Parent + child chunks | Summary + detail retrieval |

### Hybrid Search (Recommended)
- **Vector search**: semantic similarity (finds "similar meaning")
- **Keyword (BM25)**: exact term matching (finds "exact words")
- **Semantic reranker**: re-scores top-N results using a cross-encoder model
- Always use hybrid + reranker for production — pure vector search misses exact terminology

---

## Prompt Flow in AI Foundry

### Prompt Flow Node Types

| Node Type | Purpose | Example |
|-----------|---------|---------|
| **LLM node** | Call a model | Extract entities from text |
| **Python node** | Custom code | Parse JSON, call external API |
| **Prompt node** | Template rendering | Build dynamic prompts |
| **Embedding node** | Generate embeddings | Vectorize user input |
| **Vector DB node** | Search vector store | Retrieve relevant chunks |

### Evaluation Flow Pattern

```mermaid
graph LR
    INPUT[Eval Dataset<br/>question + ground_truth] --> FLOW[Agent Flow]
    FLOW --> OUTPUT[Agent Response]
    OUTPUT --> EVAL[Evaluation Flow]
    INPUT --> EVAL
    EVAL --> METRICS[Metrics<br/>Groundedness, Relevance,<br/>Coherence, F1]
```

---

## Cheat Sheet 📋

| Concept | Key Rule |
|---------|----------|
| Magentic-One | Open-ended tasks: browse + code + files; NOT for structured workflows |
| Hierarchical pattern | Use when routing decisions require reasoning about task type |
| Thread vs Run | Thread = conversation container; Run = single execution on thread |
| Code Interpreter | Executes Python in a sandbox — use for data analysis, not arbitrary code |
| Copilot Studio trigger | Topics fire on phrase match; generative answers are the fallback |
| RAG: hybrid search | Always use vector + BM25 + semantic reranker for production |
| Chunking: semantic | Best for long technical documents with topic boundaries |
| Memory: Redis | Working memory / session state (minutes TTL) |
| Memory: AI Search | Knowledge base / long-term semantic retrieval |
| RoundRobin vs Selector | RoundRobin = fixed pipeline; Selector = LLM decides who speaks next |
