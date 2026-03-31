/**
 * Tests for ResolutionSuggester class
 * @module ResolutionSuggesterTests
 */

import { ResolutionSuggester, ResolutionStrategy, ResolutionSuggestion } from '../resolution-suggester.js';
import { ConflictType } from '../conflict-detector.js';
import { SeverityLevel } from '../severity-scorer.js';

describe('ResolutionSuggester', () => {
  let suggester;

  beforeEach(() => {
    suggester = new ResolutionSuggester({
      enableHistory: true,
      maxHistorySize: 100,
      includeSteps: true,
      includeRationale: true,
      trackSuccessRates: true
    });
  });

  afterEach(() => {
    suggester.resolutionHistory = [];
    suggester.strategySuccessRates.clear();
  });

  describe('ResolutionSuggestion Class', () => {
    it('should create a suggestion with strategy and description', () => {
      const suggestion = new ResolutionSuggestion({
        strategy: ResolutionStrategy.COMPROMISE,
        description: 'Find middle ground'
      });

      expect(suggestion.strategy).toBe(ResolutionStrategy.COMPROMISE);
      expect(suggestion.description).toBe('Find middle ground');
    });

    it('should include optional steps when provided', () => {
      const suggestion = new ResolutionSuggestion({
        strategy: ResolutionStrategy.COMPROMISE,
        description: 'Find middle ground',
        steps: ['Step 1', 'Step 2', 'Step 3']
      });

      expect(suggestion.steps).toEqual(['Step 1', 'Step 2', 'Step 3']);
    });
  });

  describe('Generate Suggestions', () => {
    it('should generate suggestions for a conflict', () => {
      const conflict = {
        id: 'conflict-1',
        type: ConflictType.GOAL_CONFLICT,
        statements: [
          { content: 'goal-1' },
          { content: 'goal-2' }
        ]
      };

      const severity = {
        score: 0.5,
        severityLevel: SeverityLevel.MEDIUM
      };

      const suggestions = suggester.generateSuggestions(conflict, severity, {});

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should generate multiple strategies for complex conflicts', () => {
      const conflict = {
        id: 'conflict-2',
        type: ConflictType.RESOURCE_CONFLICT,
        statements: [],
        involvedAgents: ['agent-1', 'agent-2', 'agent-3']
      };

      const severity = {
        score: 0.7,
        severityLevel: SeverityLevel.HIGH
      };

      const suggestions = suggester.generateSuggestions(conflict, severity, {});

      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Resolution History', () => {
    it('should record resolution in history', () => {
      const conflictId = 'conflict-3';

      suggester.recordResolution(conflictId, ResolutionStrategy.COMPROMISE, true);

      expect(suggester.resolutionHistory.length).toBeGreaterThan(0);
      const record = suggester.resolutionHistory[0];
      expect(record.conflictId).toBe(conflictId);
      expect(record.strategy).toBe(ResolutionStrategy.COMPROMISE);
      expect(record.success).toBe(true);
    });

    it('should track successful resolutions', () => {
      suggester.recordResolution('conflict-4', ResolutionStrategy.COLLABORATION, true);
      suggester.recordResolution('conflict-5', ResolutionStrategy.COLLABORATION, true);
      suggester.recordResolution('conflict-6', ResolutionStrategy.COLLABORATION, false);

      const successRate = suggester.getStrategySuccessRate(ResolutionStrategy.COLLABORATION);
      expect(successRate).toBeCloseTo(0.67, 2);
    });

    it('should filter history by strategy', () => {
      suggester.recordResolution('conflict-7', ResolutionStrategy.COMPROMISE, true);
      suggester.recordResolution('conflict-8', ResolutionStrategy.COLLABORATION, true);
      suggester.recordResolution('conflict-9', ResolutionStrategy.COMPROMISE, false);

      const compromiseHistory = suggester.getHistory({
        strategy: ResolutionStrategy.COMPROMISE
      });

      expect(compromiseHistory.length).toBe(2);
      compromiseHistory.forEach(record => {
        expect(record.strategy).toBe(ResolutionStrategy.COMPROMISE);
      });
    });

    it('should filter history by success status', () => {
      suggester.recordResolution('conflict-10', ResolutionStrategy.COMPROMISE, true);
      suggester.recordResolution('conflict-11', ResolutionStrategy.COMPROMISE, false);
      suggester.recordResolution('conflict-12', ResolutionStrategy.COLLABORATION, true);

      const successfulHistory = suggester.getHistory({
        success: true
      });

      expect(successfulHistory.length).toBe(2);
      successfulHistory.forEach(record => {
        expect(record.success).toBe(true);
      });
    });
  });

  describe('Statistics', () => {
    it('should provide strategy statistics', () => {
      suggester.recordResolution('conflict-13', ResolutionStrategy.COMPROMISE, true);
      suggester.recordResolution('conflict-14', ResolutionStrategy.COMPROMISE, true);
      suggester.recordResolution('conflict-15', ResolutionStrategy.COLLABORATION, false);

      const stats = suggester.getStatistics();

      expect(stats.totalResolutions).toBe(3);
      expect(stats.byStrategy).toBeDefined();
      expect(stats.overallSuccessRate).toBeDefined();
    });

    it('should calculate success rate per strategy', () => {
      suggester.recordResolution('conflict-16', ResolutionStrategy.AVOIDANCE, true);
      suggester.recordResolution('conflict-17', ResolutionStrategy.AVOIDANCE, false);
      suggester.recordResolution('conflict-18', ResolutionStrategy.AVOIDANCE, true);

      const stats = suggester.getStatistics();
      const avoidanceStats = stats.byStrategy[ResolutionStrategy.AVOIDANCE];

      expect(avoidanceStats.successRate).toBeCloseTo(0.67, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing conflict type', () => {
      const conflict = {
        id: 'conflict-19',
        statements: []
      };

      const severity = {
        score: 0.5,
        severityLevel: SeverityLevel.MEDIUM
      };

      const suggestions = suggester.generateSuggestions(conflict, severity, {});
      expect(suggestions).toBeDefined();
    });

    it('should return null for strategy with no history', () => {
      const successRate = suggester.getStrategySuccessRate(ResolutionStrategy.COMPETITION);
      expect(successRate).toBe(null);
    });

    it('should handle empty history when getting statistics', () => {
      const emptySuggester = new ResolutionSuggester({
        enableHistory: true,
        trackSuccessRates: true
      });

      const stats = emptySuggester.getStatistics();
      expect(stats.totalResolutions).toBe(0);
      expect(stats.overallSuccessRate).toBe(0);
    });
  });
});
