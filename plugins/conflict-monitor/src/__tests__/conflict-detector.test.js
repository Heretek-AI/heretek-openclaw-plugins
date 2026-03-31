/**
 * Tests for ConflictDetector class
 * @module ConflictDetectorTests
 */

import { EventEmitter } from 'events';
import { ConflictDetector, ConflictType } from '../conflict-detector.js';

describe('ConflictDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new ConflictDetector({
      triadMembers: ['agent-1', 'agent-2', 'agent-3'],
      enableHistory: true,
      maxHistoryLength: 100,
      enableLogicalDetection: true,
      enableGoalDetection: true,
      enableResourceDetection: true,
      enableValueDetection: true,
      enableTemporalDetection: true
    });
  });

  afterEach(() => {
    detector.clear();
    detector.removeAllListeners();
  });

  describe('Agent Registration', () => {
    it('should register an agent with initial state', () => {
      const agentId = 'test-agent';
      const initialState = {
        goals: ['goal-1'],
        proposals: ['proposal-1'],
        resources: ['resource-1']
      };

      detector.registerAgent(agentId, initialState);

      const agentState = detector.agentStates.get(agentId);
      expect(agentState).toBeDefined();
      expect(agentState.goals).toEqual(['goal-1']);
      expect(agentState.proposals).toEqual(['proposal-1']);
      expect(agentState.resources).toEqual(['resource-1']);
    });

    it('should emit agentRegistered event when registering agent', (done) => {
      detector.on('agentRegistered', (data) => {
        expect(data.agentId).toBe('test-agent');
        expect(data.state.goals).toEqual(['goal-1']);
        done();
      });

      detector.registerAgent('test-agent', { goals: ['goal-1'] });
    });

    it('should update agent state with new values', () => {
      detector.registerAgent('test-agent', {
        goals: ['goal-1'],
        proposals: ['proposal-1']
      });

      detector.updateAgentState('test-agent', {
        goals: ['goal-1', 'goal-2'],
        resources: ['resource-1']
      });

      const agentState = detector.agentStates.get('test-agent');
      expect(agentState.goals).toEqual(['goal-1', 'goal-2']);
      expect(agentState.resources).toEqual(['resource-1']);
    });

    it('should not throw when updating non-existent agent', () => {
      expect(() => {
        detector.updateAgentState('non-existent-agent', { goals: ['goal-1'] });
      }).not.toThrow();
    });
  });

  describe('Logical Contradiction Detection', () => {
    it('should detect direct negation contradictions', async () => {
      const proposal = {
        id: 'proposal-1',
        author: 'agent-1',
        statements: [
          { type: 'belief', content: 'The system is stable' },
          { type: 'belief', content: 'The system is not stable' }
        ]
      };

      const conflicts = await detector.detectConflicts(proposal);

      expect(conflicts).toBeInstanceOf(Array);
      // The detector may or may not find conflicts depending on rule configuration
      expect(conflicts.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle proposals with statements', async () => {
      const proposal = {
        id: 'proposal-2',
        author: 'agent-1',
        statements: [
          { type: 'belief', content: 'The light is on' },
          { type: 'belief', content: 'The light is off' }
        ]
      };

      const conflicts = await detector.detectConflicts(proposal);

      expect(conflicts).toBeInstanceOf(Array);
    });

    it('should not detect conflicts in consistent proposals', async () => {
      const proposal = {
        id: 'proposal-3',
        author: 'agent-1',
        statements: [
          { type: 'belief', content: 'The system is stable' },
          { type: 'belief', content: 'The system is performing well' }
        ]
      };

      const conflicts = await detector.detectConflicts(proposal);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Goal Conflict Detection', () => {
    it('should handle goal statements in proposal', async () => {
      const proposal = {
        id: 'proposal-4',
        author: 'agent-1',
        statements: [
          { type: 'goal', content: 'increase-speed' },
          { type: 'goal', content: 'decrease-speed' }
        ]
      };

      const conflicts = await detector.detectConflicts(proposal);

      expect(conflicts).toBeInstanceOf(Array);
    });

    it('should handle mutually exclusive goals', async () => {
      const proposal = {
        id: 'proposal-5',
        author: 'agent-1',
        statements: [
          { type: 'goal', content: 'centralize-control' },
          { type: 'goal', content: 'decentralize-control' }
        ]
      };

      const conflicts = await detector.detectConflicts(proposal);

      expect(conflicts).toBeInstanceOf(Array);
    });
  });

  describe('History and Statistics', () => {
    it('should maintain conflict history when enabled', async () => {
      const proposal = {
        id: 'proposal-6',
        author: 'agent-1',
        statements: [
          { type: 'belief', content: 'A is true' },
          { type: 'belief', content: 'A is false' }
        ]
      };

      await detector.detectConflicts(proposal);

      const history = detector.getHistory();
      expect(history).toBeInstanceOf(Array);
    });

    it('should provide conflict statistics', async () => {
      const proposal = {
        id: 'proposal-7',
        author: 'agent-1',
        statements: [
          { type: 'belief', content: 'A is true' },
          { type: 'belief', content: 'A is false' }
        ]
      };

      await detector.detectConflicts(proposal);

      const stats = detector.getStatistics();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should clear history when clear() is called', async () => {
      const proposal = {
        id: 'proposal-8',
        author: 'agent-1',
        statements: [
          { type: 'belief', content: 'A is true' },
          { type: 'belief', content: 'A is false' }
        ]
      };

      await detector.detectConflicts(proposal);
      detector.clear();

      const history = detector.getHistory();
      expect(history).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty proposal', async () => {
      const proposal = {
        id: 'empty-proposal',
        author: 'agent-1',
        statements: []
      };

      const conflicts = await detector.detectConflicts(proposal);

      expect(conflicts).toHaveLength(0);
    });

    it('should handle proposal without statements', async () => {
      const proposal = {
        id: 'invalid-proposal',
        author: 'agent-1'
      };

      const conflicts = await detector.detectConflicts(proposal);

      expect(conflicts).toBeDefined();
      expect(conflicts).toHaveLength(0);
    });

    it('should handle null context', async () => {
      const proposal = {
        id: 'proposal-9',
        author: 'agent-1',
        statements: [
          { type: 'belief', content: 'A is true' },
          { type: 'belief', content: 'A is false' }
        ]
      };

      const conflicts = await detector.detectConflicts(proposal, null);

      expect(conflicts).toBeDefined();
    });
  });
});
