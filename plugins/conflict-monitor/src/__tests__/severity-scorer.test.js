/**
 * Tests for SeverityScorer class
 * @module SeverityScorerTests
 */

import { SeverityScorer, SeverityLevel, SeverityThresholds } from '../severity-scorer.js';
import { ConflictType } from '../conflict-detector.js';

describe('SeverityScorer', () => {
  let scorer;

  beforeEach(() => {
    scorer = new SeverityScorer({
      enableHistory: true,
      maxHistorySize: 100,
      includeContextMultiplier: true
    });
  });

  afterEach(() => {
    scorer.scoringHistory = [];
  });

  describe('Severity Level Classification', () => {
    it('should classify LOW severity for scores below 0.3', () => {
      expect(scorer._classifySeverity(0)).toBe(SeverityLevel.LOW);
      expect(scorer._classifySeverity(0.15)).toBe(SeverityLevel.LOW);
      expect(scorer._classifySeverity(0.29)).toBe(SeverityLevel.LOW);
    });

    it('should classify MEDIUM severity for scores 0.3-0.6', () => {
      expect(scorer._classifySeverity(0.3)).toBe(SeverityLevel.MEDIUM);
      expect(scorer._classifySeverity(0.45)).toBe(SeverityLevel.MEDIUM);
      expect(scorer._classifySeverity(0.59)).toBe(SeverityLevel.MEDIUM);
    });

    it('should classify HIGH severity for scores 0.6-0.85', () => {
      expect(scorer._classifySeverity(0.6)).toBe(SeverityLevel.HIGH);
      expect(scorer._classifySeverity(0.75)).toBe(SeverityLevel.HIGH);
      expect(scorer._classifySeverity(0.84)).toBe(SeverityLevel.HIGH);
    });

    it('should classify CRITICAL severity for scores 0.85-1.0', () => {
      expect(scorer._classifySeverity(0.85)).toBe(SeverityLevel.CRITICAL);
      expect(scorer._classifySeverity(0.95)).toBe(SeverityLevel.CRITICAL);
      expect(scorer._classifySeverity(1.0)).toBe(SeverityLevel.CRITICAL);
    });
  });

  describe('Full Severity Calculation', () => {
    it('should calculate complete severity score with all factors', () => {
      const conflict = {
        type: ConflictType.RESOURCE_CONFLICT,
        statements: [],
        involvedAgents: ['agent-1', 'agent-2', 'agent-3'],
        affectedAgents: ['agent-1', 'agent-2', 'agent-3']
      };

      const context = {
        triadDeliberation: true,
        emergency: false
      };

      const result = scorer.calculateSeverity(conflict, context);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return severity result with required properties', () => {
      const conflict = {
        type: ConflictType.GOAL_CONFLICT,
        statements: []
      };

      const result = scorer.calculateSeverity(conflict, {});

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('History Management', () => {
    it('should add severity calculations to history', () => {
      const conflict = {
        type: ConflictType.GOAL_CONFLICT,
        statements: []
      };

      scorer.calculateSeverity(conflict, {});

      expect(scorer.scoringHistory.length).toBeGreaterThan(0);
    });

    it('should limit history length to maxHistorySize', () => {
      const smallScorer = new SeverityScorer({
        enableHistory: true,
        maxHistorySize: 5
      });

      for (let i = 0; i < 10; i++) {
        smallScorer.calculateSeverity({
          type: ConflictType.LOGICAL_CONTRADICTION,
          statements: [`statement-${i}`]
        }, {});
      }

      expect(smallScorer.scoringHistory.length).toBeLessThanOrEqual(5);
    });

    it('should provide history via getHistory', () => {
      const conflict = {
        type: ConflictType.LOGICAL_CONTRADICTION,
        statements: []
      };

      scorer.calculateSeverity(conflict, {});

      const history = scorer.getHistory();
      expect(history).toBeInstanceOf(Array);
    });
  });

  describe('Statistics', () => {
    it('should provide severity statistics', () => {
      const conflicts = [
        { type: ConflictType.LOGICAL_CONTRADICTION, statements: [] },
        { type: ConflictType.GOAL_CONFLICT, statements: [], involvedAgents: ['agent-1', 'agent-2'] },
        { type: ConflictType.VALUE_CONFLICT, statements: [], involvedAgents: ['agent-1', 'agent-2', 'agent-3'] }
      ];

      conflicts.forEach(conflict => scorer.calculateSeverity(conflict, {}));

      const stats = scorer.getStatistics();

      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should track severity distribution by level', () => {
      const lowConflict = { type: ConflictType.LOGICAL_CONTRADICTION, statements: [] };
      const highConflict = {
        type: ConflictType.VALUE_CONFLICT,
        statements: [],
        involvedAgents: ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5']
      };

      scorer.calculateSeverity(lowConflict, {});
      scorer.calculateSeverity(highConflict, {});

      const stats = scorer.getStatistics();
      expect(stats.byLevel).toBeDefined();
    });
  });

  describe('Recommended Actions', () => {
    it('should recommend monitoring for LOW severity', () => {
      const actions = scorer.getRecommendedActions(SeverityLevel.LOW);
      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should recommend immediate attention for CRITICAL severity', () => {
      const actions = scorer.getRecommendedActions(SeverityLevel.CRITICAL);
      expect(actions).toBeInstanceOf(Array);
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should provide different actions for each severity level', () => {
      const lowActions = scorer.getRecommendedActions(SeverityLevel.LOW);
      const mediumActions = scorer.getRecommendedActions(SeverityLevel.MEDIUM);
      const highActions = scorer.getRecommendedActions(SeverityLevel.HIGH);
      const criticalActions = scorer.getRecommendedActions(SeverityLevel.CRITICAL);

      expect(lowActions).not.toEqual(mediumActions);
      expect(mediumActions).not.toEqual(highActions);
      expect(highActions).not.toEqual(criticalActions);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing conflict properties', () => {
      const incompleteConflict = {
        type: ConflictType.LOGICAL_CONTRADICTION
      };

      const result = scorer.calculateSeverity(incompleteConflict, {});
      expect(result).toBeDefined();
    });

    it('should handle context without affectsCollectiveGoals', () => {
      const conflict = {
        type: ConflictType.GOAL_CONFLICT,
        statements: []
      };

      const context = {
        // No affectsCollectiveGoals property
      };

      const result = scorer.calculateSeverity(conflict, context);
      expect(result).toBeDefined();
    });

    it('should handle empty context', () => {
      const conflict = {
        type: ConflictType.GOAL_CONFLICT,
        statements: []
      };

      const result = scorer.calculateSeverity(conflict, {});
      expect(result).toBeDefined();
    });
  });
});
