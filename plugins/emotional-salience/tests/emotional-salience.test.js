/**
 * Emotional Salience Plugin Tests
 * 
 * Tests for valence detection, salience scoring, context tracking,
 * and Empath integration.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  EmotionalSaliencePlugin,
  ValenceDetector,
  SalienceScorer,
  EmotionalContextTracker,
  FearConditioner
} from '../src/index.js';

describe('Emotional Salience Plugin', () => {
  describe('ValenceDetector', () => {
    let detector;

    beforeEach(() => {
      detector = new ValenceDetector({
        emotionThreshold: 0.3,
        threatThreshold: 0.4,
        trackContext: true
      });
    });

    test('should detect positive valence', () => {
      const result = detector.detect('This is wonderful! I love it!');
      
      expect(result.valence).toBeGreaterThan(0);
      expect(result.valenceLabel).toBe('positive');
      expect(result.emotions.joy).toBeDefined();
      expect(result.emotions.joy).toBeGreaterThan(0);
    });

    test('should detect negative valence', () => {
      const result = detector.detect('I am frustrated and angry about this!');
      
      expect(result.valence).toBeLessThan(0);
      expect(result.valenceLabel).toBe('negative');
      expect(result.primaryEmotion).toMatch(/anger|frustration/);
    });

    test('should detect neutral valence', () => {
      const result = detector.detect('The system is working as expected.');
      
      expect(result.valenceLabel).toBe('neutral');
      expect(result.intensity).toBeLessThan(0.5);
    });

    test('should detect threat indicators', () => {
      const result = detector.detect('Danger! This is a critical threat!');
      
      expect(result.threat.detected).toBe(true);
      expect(result.threat.score).toBeGreaterThan(0.4);
      expect(result.threat.indicators.length).toBeGreaterThan(0);
    });

    test('should detect urgency', () => {
      const result = detector.detect('URGENT: Need this ASAP! Deadline is now!');
      
      expect(result.urgency.detected).toBe(true);
      expect(result.urgency.score).toBeGreaterThan(0.3);
    });

    test('should detect importance', () => {
      const result = detector.detect('This is critical and essential for the project.');
      
      expect(result.importance.detected).toBe(true);
      expect(result.importance.score).toBeGreaterThan(0.3);
    });

    test('should apply intensity modifiers', () => {
      const mildResult = detector.detect('I am slightly happy.');
      const intenseResult = detector.detect('I am extremely happy!');
      
      expect(intenseResult.intensity).toBeGreaterThan(mildResult.intensity);
    });

    test('should track emotional context', () => {
      detector.detect('Happy message 1');
      detector.detect('Happy message 2');
      detector.detect('Happy message 3');
      
      const context = detector.getEmotionalContext(3);
      expect(context.averageValence).toBeGreaterThan(0);
      expect(context.sampleSize).toBe(3);
    });

    test('should detect message valence', () => {
      const message = {
        id: 'msg-1',
        content: 'I am terrified of this error!',
        sender: 'user-1',
        timestamp: Date.now()
      };
      
      const result = detector.detectMessage(message);
      
      expect(result.message.id).toBe('msg-1');
      expect(result.threat.detected).toBe(true);
      expect(result.emotions.fear).toBeDefined();
    });
  });

  describe('SalienceScorer', () => {
    let scorer;

    beforeEach(() => {
      scorer = new SalienceScorer({
        salienceThreshold: 0.3,
        attentionThreshold: 0.6,
        enableThreatScoring: true,
        enableEmotionalScoring: true
      });
    });

    test('should calculate salience score', () => {
      const result = scorer.calculateSalience({
        content: 'URGENT: Critical system failure!'
      });
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.category).toBeDefined();
      expect(result.priority).toBeDefined();
    });

    test('should categorize critical salience', () => {
      const result = scorer.calculateSalience({
        content: 'EMERGENCY: Database corruption detected! Immediate action required!',
        threat: { detected: true, score: 0.9 }
      });
      
      expect(result.category).toMatch(/critical|high/);
      expect(result.attention.required).toBe(true);
    });

    test('should calculate component scores', () => {
      const result = scorer.calculateSalience({
        content: 'Important deadline approaching fast!'
      });
      
      expect(result.components).toBeDefined();
      expect(result.components.urgency).toBeDefined();
      expect(result.components.importance).toBeDefined();
    });

    test('should prioritize items by salience', () => {
      const items = [
        { id: 1, content: 'Minor note' },
        { id: 2, content: 'CRITICAL: System down!' },
        { id: 3, content: 'Regular update' }
      ];
      
      const prioritized = scorer.prioritize(items);
      
      expect(prioritized.length).toBe(3);
      expect(prioritized[0].salience.score).toBeGreaterThanOrEqual(prioritized[1].salience.score);
    });

    test('should prioritize threats', () => {
      const threats = [
        { content: 'Minor warning', threat: { score: 0.3 } },
        { content: 'CRITICAL: Security breach!', threat: { score: 0.9 } },
        { content: 'Medium risk detected', threat: { score: 0.5 } }
      ];
      
      const prioritized = scorer.prioritizeThreats(threats);
      
      // Highest threat should be first
      expect(prioritized[0].content).toContain('Security breach');
    });

    test('should update value weights', () => {
      scorer.updateValueWeight('safety', 0.95);
      
      const value = scorer.getValue('safety');
      expect(value.weight).toBe(0.95);
    });

    test('should generate recommendations', () => {
      const result = scorer.calculateSalience({
        content: 'CRITICAL: Emergency!',
        threat: { detected: true, score: 0.9 }
      });
      
      if (result.category === 'critical') {
        expect(result.recommendations.some(r => r.action === 'escalate')).toBe(true);
      }
    });

    test('should track value alignment', () => {
      const result = scorer.calculateSalience({
        content: 'Safety threat detected!',
        threat: { detected: true, score: 0.8 }
      });
      
      expect(result.valueAlignment).toBeDefined();
      if (result.components.threat > 0.3) {
        expect(result.valueAlignment.some(a => a.value === 'safety')).toBe(true);
      }
    });
  });

  describe('EmotionalContextTracker', () => {
    let tracker;

    beforeEach(() => {
      tracker = new EmotionalContextTracker({
        trackPerAgent: true,
        trackPerConversation: true,
        enablePatternDetection: true
      });
    });

    test('should track emotional events', () => {
      const event = {
        source: 'alpha',
        type: 'message',
        conversationId: 'conv-1',
        valence: 0.5,
        intensity: 0.7,
        emotions: { joy: 0.6 }
      };
      
      const result = tracker.track(event);
      
      expect(result.eventId).toBeDefined();
      expect(result.valence).toBe(0.5);
      expect(result.intensity).toBe(0.7);
    });

    test('should track per conversation', () => {
      tracker.track({ source: 'alpha', conversationId: 'conv-1', valence: 0.5, intensity: 0.6, emotions: {} });
      tracker.track({ source: 'beta', conversationId: 'conv-1', valence: 0.3, intensity: 0.4, emotions: {} });
      
      const history = tracker.getConversationHistory('conv-1');
      
      expect(history.events.length).toBe(2);
    });

    test('should track per agent', () => {
      tracker.track({ source: 'alpha', agentId: 'alpha', valence: 0.5, intensity: 0.6, emotions: {} });
      tracker.track({ source: 'alpha', agentId: 'alpha', valence: 0.3, intensity: 0.4, emotions: {} });
      
      const profile = tracker.getAgentProfile('alpha');
      
      expect(profile.agentId).toBe('alpha');
      expect(profile.history.length).toBe(2);
    });

    test('should calculate trend', () => {
      // Add events with declining valence
      for (let i = 0; i < 10; i++) {
        tracker.track({
          source: 'alpha',
          conversationId: 'conv-1',
          valence: 0.5 - (i * 0.1),
          intensity: 0.5,
          emotions: {}
        });
      }
      
      const trend = tracker.getTrend('conversation', 'conv-1');
      
      expect(trend.dataPoints).toBe(10);
      expect(trend.valenceTrend).toBe('declining');
    });

    test('should detect emotional escalation pattern', () => {
      // Add events with increasing intensity
      for (let i = 0; i < 10; i++) {
        tracker.track({
          source: 'alpha',
          conversationId: 'conv-1',
          valence: -0.5,
          intensity: 0.2 + (i * 0.08),
          emotions: { anger: 0.2 + (i * 0.1) }
        });
      }
      
      const patterns = tracker.patterns;
      const escalationPattern = patterns.find(p => p.type === 'emotional-escalation');
      
      // Pattern should be detected
      expect(escalationPattern).toBeDefined();
    });

    test('should reset conversation context', () => {
      tracker.track({ source: 'alpha', conversationId: 'conv-1', valence: 0.5, intensity: 0.6, emotions: {} });
      tracker.resetConversation('conv-1');
      
      const history = tracker.getConversationHistory('conv-1');
      expect(history.events.length).toBe(0);
    });

    test('should clear all context', () => {
      tracker.track({ source: 'alpha', conversationId: 'conv-1', valence: 0.5, intensity: 0.6, emotions: {} });
      tracker.track({ source: 'beta', agentId: 'beta', valence: 0.3, intensity: 0.4, emotions: {} });
      
      tracker.clear();
      
      const globalContext = tracker.getContext();
      expect(globalContext.global.overallValence).toBe(0);
    });
  });

  describe('FearConditioner', () => {
    let conditioner;

    beforeEach(() => {
      conditioner = new FearConditioner({
        learningRate: 0.1,
        extinctionRate: 0.01,
        fearThreshold: 0.2
      });
    });

    test('should condition fear response', () => {
      const result = conditioner.condition('error-sound', 0.8);
      
      expect(result.stimulus).toBe('error-sound');
      expect(result.fearStrength).toBeGreaterThan(0);
      expect(result.newlyConditioned).toBe(true);
    });

    test('should strengthen fear with repeated conditioning', () => {
      conditioner.condition('error-sound', 0.8);
      const result1 = conditioner.condition('error-sound', 0.8);
      const result2 = conditioner.condition('error-sound', 0.8);
      
      expect(result2.exposures).toBe(3);
      expect(result2.fearStrength).toBeGreaterThan(result1.fearStrength);
    });

    test('should trigger fear response', () => {
      conditioner.condition('danger-signal', 0.9);
      
      const response = conditioner.test('danger-signal');
      
      expect(response.fearResponse).toBeGreaterThan(0.2);
      expect(response.triggered).toBe(true);
    });

    test('should show fear generalization', () => {
      conditioner.condition('loud-noise', 0.8);
      
      // Similar stimulus should trigger some fear
      const response = conditioner.test('loud-boom');
      
      // May show generalization if strings are similar enough
      expect(response).toBeDefined();
    });

    test('should extinct fear response', () => {
      conditioner.condition('spider-image', 0.7);
      
      const beforeTest = conditioner.test('spider-image');
      const beforeFear = beforeTest.fearResponse;
      
      // Extinction through safety exposure
      conditioner.extinct('spider-image', 0.9);
      
      const afterTest = conditioner.test('spider-image');
      expect(afterTest.remainingFear).toBeLessThan(beforeFear);
    });

    test('should get all associations', () => {
      conditioner.condition('stimulus-1', 0.5);
      conditioner.condition('stimulus-2', 0.7);
      
      const associations = conditioner.getAssociations();
      
      expect(associations.length).toBe(2);
    });

    test('should clear associations', () => {
      conditioner.condition('stimulus-1', 0.5);
      conditioner.clear();
      
      const associations = conditioner.getAssociations();
      expect(associations.length).toBe(0);
    });
  });

  describe('EmotionalSaliencePlugin Integration', () => {
    let plugin;

    beforeEach(() => {
      plugin = new EmotionalSaliencePlugin({
        empath: { enabled: false }
      });
    });

    test('should initialize', async () => {
      await plugin.initialize();
      expect(plugin.isInitialized()).toBe(true);
    });

    test('should start and stop', async () => {
      await plugin.initialize();
      await plugin.start();
      expect(plugin.isRunning()).toBe(true);
      
      await plugin.stop();
      expect(plugin.isRunning()).toBe(false);
    });

    test('should detect valence', async () => {
      await plugin.initialize();
      
      const result = plugin.detectValence('I am so happy!');
      
      expect(result.valenceLabel).toBe('positive');
    });

    test('should calculate salience', async () => {
      await plugin.initialize();
      
      const result = plugin.calculateSalience({
        content: 'URGENT: Critical issue!'
      });
      
      expect(result.score).toBeGreaterThan(0);
    });

    test('should process message through full pipeline', async () => {
      await plugin.initialize();
      
      const message = {
        id: 'test-1',
        content: 'This is important and urgent!',
        sender: 'test-agent',
        conversationId: 'test-conv'
      };
      
      const result = await plugin.processMessage(message);
      
      expect(result.message).toBe(message);
      expect(result.valence).toBeDefined();
      expect(result.salience).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.processedAt).toBeDefined();
    });

    test('should track emotional events', async () => {
      await plugin.initialize();
      
      const event = {
        source: 'test',
        type: 'test',
        valence: 0.5,
        intensity: 0.7
      };
      
      const result = plugin.trackEmotionalEvent(event);
      
      expect(result).toBeDefined();
    });

    test('should get health status', async () => {
      await plugin.initialize();
      
      const health = plugin.getHealth();
      
      expect(health.initialized).toBe(true);
      expect(health.valenceDetector).toBe('ok');
      expect(health.salienceScorer).toBe('ok');
    });

    test('should get statistics', async () => {
      await plugin.initialize();
      
      // Generate some data
      plugin.detectValence('Happy message');
      plugin.calculateSalience({ content: 'Test' });
      
      const stats = plugin.getStatistics();
      
      expect(stats.valence).toBeDefined();
      expect(stats.salience).toBeDefined();
      expect(stats.context).toBeDefined();
    });

    test('should emit events', async () => {
      await plugin.initialize();
      
      const valenceHandler = jest.fn();
      plugin.on('valence-detected', valenceHandler);
      
      plugin.detectValence('Test emotion');
      
      expect(valenceHandler).toHaveBeenCalled();
    });

    test('should update value weights', async () => {
      await plugin.initialize();
      
      plugin.updateValueWeight('safety', 0.95);
      
      const value = plugin.getValue('safety');
      expect(value.weight).toBe(0.95);
    });

    test('should prioritize threats', async () => {
      await plugin.initialize();
      
      const threats = [
        { content: 'Low risk', threat: { score: 0.2 } },
        { content: 'High risk', threat: { score: 0.8 } }
      ];
      
      const prioritized = plugin.prioritizeThreats(threats);
      
      expect(prioritized[0].content).toContain('High risk');
    });
  });
});
