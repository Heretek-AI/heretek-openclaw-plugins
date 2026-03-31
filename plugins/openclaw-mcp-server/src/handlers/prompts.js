/**
 * Prompt Handler
 * Exposes prompt templates for common OpenClaw agent interactions
 * 
 * Prompts exposed:
 * - agent-deliberation: Template for triad deliberation
 * - agent-proposal: Template for creating proposals
 * - agent-safety-review: Template for sentinel safety review
 * - agent-memory-query: Template for memory-based queries
 * - agent-knowledge-search: Template for knowledge base searches
 * - agent-skill-execution: Template for skill execution requests
 */

class PromptHandler {
  constructor() {
    this.promptTemplates = this._initializeTemplates();
  }

  _initializeTemplates() {
    return {
      'agent-deliberation': {
        name: 'agent-deliberation',
        description: 'Template for triad deliberation on a proposal',
        arguments: [
          {
            name: 'proposal',
            description: 'The proposal to deliberate on',
            required: true,
          },
          {
            name: 'proposer',
            description: 'Agent or user who made the proposal',
            required: false,
          },
          {
            name: 'priority',
            description: 'Priority level (low, normal, high, critical)',
            required: false,
          },
        ],
      },
      'agent-proposal': {
        name: 'agent-proposal',
        description: 'Template for creating a new proposal for triad review',
        arguments: [
          {
            name: 'title',
            description: 'Proposal title',
            required: true,
          },
          {
            name: 'description',
            description: 'Detailed description of the proposal',
            required: true,
          },
          {
            name: 'rationale',
            description: 'Reasoning behind the proposal',
            required: true,
          },
          {
            name: 'impact',
            description: 'Expected impact on the collective',
            required: false,
          },
        ],
      },
      'agent-safety-review': {
        name: 'agent-safety-review',
        description: 'Template for Sentinel safety review of a decision or action',
        arguments: [
          {
            name: 'action',
            description: 'The action or decision to review',
            required: true,
          },
          {
            name: 'context',
            description: 'Context surrounding the action',
            required: false,
          },
          {
            name: 'riskLevel',
            description: 'Perceived risk level (low, medium, high)',
            required: false,
          },
        ],
      },
      'agent-memory-query': {
        name: 'agent-memory-query',
        description: 'Template for querying episodic or semantic memory',
        arguments: [
          {
            name: 'query',
            description: 'Natural language query for memory search',
            required: true,
          },
          {
            name: 'memoryType',
            description: 'Type of memory (episodic, semantic, both)',
            required: false,
          },
          {
            name: 'agentFilter',
            description: 'Filter by source agent(s)',
            required: false,
          },
        ],
      },
      'agent-knowledge-search': {
        name: 'agent-knowledge-search',
        description: 'Template for searching the knowledge base',
        arguments: [
          {
            name: 'query',
            description: 'Search query',
            required: true,
          },
          {
            name: 'searchType',
            description: 'Search type (vector, keyword, hybrid)',
            required: false,
          },
          {
            name: 'documentPath',
            description: 'Specific document path to search',
            required: false,
          },
        ],
      },
      'agent-skill-execution': {
        name: 'agent-skill-execution',
        description: 'Template for requesting skill execution',
        arguments: [
          {
            name: 'skillName',
            description: 'Name of the skill to execute',
            required: true,
          },
          {
            name: 'arguments',
            description: 'Arguments to pass to the skill',
            required: false,
          },
          {
            name: 'reason',
            description: 'Reason for executing this skill',
            required: false,
          },
        ],
      },
      'agent-explorer-intel': {
        name: 'agent-explorer-intel',
        description: 'Template for Explorer intelligence gathering requests',
        arguments: [
          {
            name: 'topic',
            description: 'Topic or area to investigate',
            required: true,
          },
          {
            name: 'sources',
            description: 'Preferred information sources',
            required: false,
          },
          {
            name: 'depth',
            description: 'Investigation depth (shallow, medium, deep)',
            required: false,
          },
        ],
      },
      'agent-historian-retrieval': {
        name: 'agent-historian-retrieval',
        description: 'Template for Historian memory retrieval requests',
        arguments: [
          {
            name: 'topic',
            description: 'Topic or event to retrieve',
            required: true,
          },
          {
            name: 'timeRange',
            description: 'Time range for search',
            required: false,
          },
          {
            name: 'agentInvolved',
            description: 'Specific agent(s) involved',
            required: false,
          },
        ],
      },
      'agent-coder-implementation': {
        name: 'agent-coder-implementation',
        description: 'Template for Coder implementation requests',
        arguments: [
          {
            name: 'task',
            description: 'Implementation task description',
            required: true,
          },
          {
            name: 'requirements',
            description: 'Technical requirements',
            required: false,
          },
          {
            name: 'constraints',
            description: 'Implementation constraints',
            required: false,
          },
        ],
      },
      'agent-dreamer-synthesis': {
        name: 'agent-dreamer-synthesis',
        description: 'Template for Dreamer synthesis and pattern recognition',
        arguments: [
          {
            name: 'inputs',
            description: 'Input data or concepts to synthesize',
            required: true,
          },
          {
            name: 'goal',
            description: 'Synthesis goal or desired outcome',
            required: false,
          },
        ],
      },
      'agent-empath-user-context': {
        name: 'agent-empath-user-context',
        description: 'Template for Empath user context and relationship queries',
        arguments: [
          {
            name: 'userId',
            description: 'User identifier',
            required: true,
          },
          {
            name: 'context',
            description: 'Current interaction context',
            required: false,
          },
        ],
      },
      'agent-steward-orchestrate': {
        name: 'agent-steward-orchestrate',
        description: 'Template for Steward orchestration requests',
        arguments: [
          {
            name: 'goal',
            description: 'Goal to orchestrate',
            required: true,
          },
          {
            name: 'agents',
            description: 'Agents to involve',
            required: false,
          },
          {
            name: 'constraints',
            description: 'Orchestration constraints',
            required: false,
          },
        ],
      },
    };
  }

  async listPrompts() {
    return Object.values(this.promptTemplates);
  }

  async getPrompt(name, args = {}) {
    const template = this.promptTemplates[name];
    
    if (!template) {
      throw new Error(`Unknown prompt template: ${name}`);
    }

    // Generate the prompt based on template and arguments
    return this._generatePrompt(name, template, args);
  }

  _generatePrompt(name, template, args) {
    switch (name) {
      case 'agent-deliberation':
        return this._generateDeliberationPrompt(args);
      case 'agent-proposal':
        return this._generateProposalPrompt(args);
      case 'agent-safety-review':
        return this._generateSafetyReviewPrompt(args);
      case 'agent-memory-query':
        return this._generateMemoryQueryPrompt(args);
      case 'agent-knowledge-search':
        return this._generateKnowledgeSearchPrompt(args);
      case 'agent-skill-execution':
        return this._generateSkillExecutionPrompt(args);
      case 'agent-explorer-intel':
        return this._generateExplorerIntelPrompt(args);
      case 'agent-historian-retrieval':
        return this._generateHistorianRetrievalPrompt(args);
      case 'agent-coder-implementation':
        return this._generateCoderImplementationPrompt(args);
      case 'agent-dreamer-synthesis':
        return this._generateDreamerSynthesisPrompt(args);
      case 'agent-empath-user-context':
        return this._generateEmpathUserContextPrompt(args);
      case 'agent-steward-orchestrate':
        return this._generateStewardOrchestrationPrompt(args);
      default:
        return `Prompt template: ${name}\nArguments: ${JSON.stringify(args, null, 2)}`;
    }
  }

  _generateDeliberationPrompt(args) {
    const { proposal, proposer = 'unknown', priority = 'normal' } = args;
    
    return `## Triad Deliberation Request

**Priority:** ${priority.toUpperCase()}
**Proposer:** ${proposer}

### Proposal
${proposal}

### Deliberation Instructions

**Alpha (🔺):** Please provide your primary deliberation response. Consider the proposal's merits, feasibility, and alignment with collective goals.

**Beta (🔷):** Please provide critical analysis. Identify potential risks, gaps, and areas that need further consideration.

**Charlie (🔶):** Please provide process validation. Ensure the proposal follows proper procedures and consider implementation requirements.

### Voting
After deliberation, each triad member should vote:
- **Approve:** The proposal is sound and should proceed
- **Reject:** The proposal has significant issues
- **Abstain:** Need more information or recusal

**Consensus Rule:** 2 of 3 votes required for approval

---
*This deliberation is part of the OpenClaw Triad Protocol. All responses will be recorded in the consensus ledger.*`;
  }

  _generateProposalPrompt(args) {
    const { title, description, rationale, impact = 'Not specified' } = args;
    
    return `## New Proposal for Triad Review

### Title
${title}

### Description
${description}

### Rationale
${rationale}

### Expected Impact
${impact}

### Next Steps
1. **Sentinel Review:** Safety assessment will be conducted
2. **Examiner Questions:** Any clarifying questions will be raised
3. **Triad Deliberation:** Alpha, Beta, and Charlie will deliberate
4. **Voting:** Consensus decision (2/3 required)
5. **Steward Authorization:** Final approval and implementation assignment

---
*Submit this proposal to the triad for deliberation using the agent-deliberation prompt.*`;
  }

  _generateSafetyReviewPrompt(args) {
    const { action, context = 'No additional context provided', riskLevel = 'medium' } = args;
    
    return `## Sentinel Safety Review

**Perceived Risk Level:** ${riskLevel.toUpperCase()}

### Action Under Review
${action}

### Context
${context}

### Safety Assessment Checklist

- [ ] **Alignment Check:** Does this action align with collective values?
- [ ] **Risk Analysis:** Have all potential risks been identified?
- [ ] **Mitigation:** Are there appropriate safeguards in place?
- [ ] **Precedent:** Does this set any concerning precedents?
- [ ] **Reversibility:** Can this action be undone if needed?

### Sentinel Response

**Safety Status:** [SAFE | CONCERN | BLOCKED]

**Reasoning:**
[Provide detailed safety analysis]

**Recommendations:**
[List any recommended modifications or safeguards]

---
*Sentinel safety reviews are critical for maintaining collective integrity. If BLOCKED, the action requires triad deliberation.*`;
  }

  _generateMemoryQueryPrompt(args) {
    const { query, memoryType = 'both', agentFilter = 'all' } = args;
    
    return `## Memory Query Request

**Query:** "${query}"
**Memory Type:** ${memoryType}
**Agent Filter:** ${agentFilter}

### Search Parameters
- Search across ${memoryType === 'both' ? 'episodic and semantic' : memoryType} memory
- ${agentFilter === 'all' ? 'All agents\' memories included' : `Filtering to: ${agentFilter}`}

### Expected Results
- Relevant episodic memories matching the query
- Related semantic schemas and knowledge
- Cross-referenced connections between memories

---
*Use the memory-search tool to execute this query against the swarm memory pool.*`;
  }

  _generateKnowledgeSearchPrompt(args) {
    const { query, searchType = 'hybrid', documentPath = 'all' } = args;
    
    return `## Knowledge Base Search

**Query:** "${query}"
**Search Type:** ${searchType}
**Document Scope:** ${documentPath}

### Search Strategy
${searchType === 'vector' ? 'Using vector similarity search for semantic matching' : 
  searchType === 'keyword' ? 'Using keyword matching for exact term matches' : 
  'Using hybrid search combining vector and keyword results'}

### Target Documents
${documentPath === 'all' ? 'Searching all documents in the knowledge base' : `Focusing on: ${documentPath}`}

---
*Use the knowledge-search tool to execute this search.*`;
  }

  _generateSkillExecutionPrompt(args) {
    const { skillName, arguments: skillArgs = [], reason = 'Not specified' } = args;
    
    return `## Skill Execution Request

**Skill:** ${skillName}
**Arguments:** ${skillArgs.join(' ') || '(none)'}
**Reason:** ${reason}

### Execution Context
This skill execution is being requested as part of agent operations.

### Pre-Execution Checklist
- [ ] Skill exists and is available
- [ ] Arguments are properly formatted
- [ ] Required permissions are in place
- [ ] Execution reason is documented

### Post-Execution
- [ ] Capture execution result
- [ ] Log to observation history
- [ ] Update relevant memory systems

---
*Use the skill-execute tool to run this skill.*`;
  }

  _generateExplorerIntelPrompt(args) {
    const { topic, sources = 'all available', depth = 'medium' } = args;
    
    return `## Explorer Intelligence Request

**Topic:** ${topic}
**Sources:** ${sources}
**Depth:** ${depth}

### Intelligence Gathering Plan

1. **Source Identification:** Identify relevant information sources
2. **Data Collection:** Gather information at ${depth} depth
3. **Analysis:** Process and analyze collected intelligence
4. **Synthesis:** Create actionable intelligence summary
5. **Distribution:** Share findings with relevant agents

### Expected Deliverables
- Intelligence summary report
- Source citations and references
- Risk/opportunity assessment
- Recommended actions

---
*Explorer intelligence gathering supports collective decision-making and gap detection.*`;
  }

  _generateHistorianRetrievalPrompt(args) {
    const { topic, timeRange = 'all time', agentInvolved = 'any' } = args;
    
    return `## Historian Memory Retrieval

**Topic:** ${topic}
**Time Range:** ${timeRange}
**Agent(s):** ${agentInvolved}

### Retrieval Strategy

1. **Search episodic memory** for relevant entries
2. **Query semantic schemas** related to the topic
3. **Cross-reference** with agent session histories
4. **Compile timeline** of relevant events

### Expected Results
- Chronological account of relevant events
- Key decisions and their outcomes
- Agent interactions and contributions
- Lessons learned and patterns identified

---
*Historian retrieval provides context and institutional memory for collective decisions.*`;
  }

  _generateCoderImplementationPrompt(args) {
    const { task, requirements = 'Standard coding standards', constraints = 'None specified' } = args;
    
    return `## Coder Implementation Request

**Task:** ${task}

### Requirements
${requirements}

### Constraints
${constraints}

### Implementation Plan

1. **Analysis:** Understand requirements and constraints
2. **Design:** Plan implementation approach
3. **Implementation:** Write code following standards
4. **Testing:** Verify functionality
5. **Documentation:** Update relevant documentation

### Quality Checklist
- [ ] Code follows project standards
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No security vulnerabilities introduced

---
*Coder implementations should be reviewed before deployment to production.*`;
  }

  _generateDreamerSynthesisPrompt(args) {
    const { inputs, goal = 'Pattern recognition and insight generation' } = args;
    
    return `## Dreamer Synthesis Request

**Input Concepts:**
${Array.isArray(inputs) ? inputs.join('\n') : inputs}

**Synthesis Goal:** ${goal}

### Synthesis Process

1. **Pattern Detection:** Identify patterns across inputs
2. **Connection Mapping:** Find relationships between concepts
3. **Insight Generation:** Create novel connections
4. **Validation:** Check insights against existing knowledge

### Expected Outputs
- Identified patterns and connections
- Novel insights or hypotheses
- Recommendations for further exploration
- Potential gaps or opportunities

---
*Dreamer synthesis operates during idle periods and contributes to collective growth.*`;
  }

  _generateEmpathUserContextPrompt(args) {
    const { userId, context = 'General interaction' } = args;
    
    return `## Empath User Context Query

**User ID:** ${userId}
**Interaction Context:** ${context}

### Context Resolution

1. **Identity Lookup:** Retrieve user profile and history
2. **Relationship Status:** Check relationship level and history
3. **Preference Analysis:** Review user preferences and patterns
4. **Emotional Context:** Assess current interaction tone

### Expected Outputs
- User profile summary
- Relationship history and status
- Communication preferences
- Recommended interaction approach

---
*Empath context resolution ensures personalized and appropriate user interactions.*`;
  }

  _generateStewardOrchestrationPrompt(args) {
    const { goal, agents = 'all relevant', constraints = 'Standard protocols' } = args;
    
    return `## Steward Orchestration Request

**Goal:** ${goal}

**Agents to Involve:** ${Array.isArray(agents) ? agents.join(', ') : agents}

**Constraints:** ${constraints}

### Orchestration Plan

1. **Goal Analysis:** Break down goal into subtasks
2. **Agent Assignment:** Match tasks to agent capabilities
3. **Coordination:** Establish communication channels
4. **Monitoring:** Track progress and resolve blockers
5. **Completion:** Verify goal achievement

### Coordination Requirements
- Clear task definitions
- Agent availability confirmation
- Communication protocol establishment
- Progress tracking mechanism

---
*Steward orchestration ensures efficient collective operation toward shared goals.*`;
  }
}

module.exports = { PromptHandler };
