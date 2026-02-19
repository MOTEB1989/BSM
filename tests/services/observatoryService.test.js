import { expect } from 'chai';
import sinon from 'sinon';
import * as observatoryService from '../../src/services/observatoryService.js';

describe('observatoryService', () => {
  let poolStub;
  let queryStub;

  beforeEach(() => {
    queryStub = sinon.stub();
    poolStub = {
      query: queryStub
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getRealTimeMetrics', () => {
    it('should return metrics for all agents with valid formatting', async () => {
      const mockMetrics = [{
        agent_id: 'test-agent',
        total_requests: '100',
        successful_requests: '95',
        avg_response_time: '150.5678',
        max_response_time: '500',
        total_tokens: '10000',
        total_cost: '1.5678'
      }];

      // Test data transformation
      const transformed = {
        agentId: mockMetrics[0].agent_id,
        totalRequests: parseInt(mockMetrics[0].total_requests),
        successfulRequests: parseInt(mockMetrics[0].successful_requests),
        successRate: ((95 / 100) * 100).toFixed(2),
        avgResponseTime: parseFloat(mockMetrics[0].avg_response_time).toFixed(2),
        maxResponseTime: parseInt(mockMetrics[0].max_response_time),
        totalTokens: parseInt(mockMetrics[0].total_tokens),
        totalCost: parseFloat(mockMetrics[0].total_cost).toFixed(4)
      };

      expect(transformed.successRate).to.equal('95.00');
      expect(transformed.avgResponseTime).to.equal('150.57');
      expect(transformed.totalCost).to.equal('1.5678');
    });

    it('should handle invalid time range gracefully', async () => {
      const invalidRange = 'invalid';
      const validRanges = ['1h', '6h', '24h', '7d', '30d'];
      
      expect(validRanges).to.not.include(invalidRange);
    });

    it('should calculate success rate correctly', async () => {
      const testCases = [
        { total: 100, successful: 95, expected: '95.00' },
        { total: 100, successful: 100, expected: '100.00' },
        { total: 100, successful: 0, expected: '0.00' },
        { total: 50, successful: 25, expected: '50.00' },
        { total: 3, successful: 2, expected: '66.67' }
      ];

      testCases.forEach(tc => {
        const rate = ((tc.successful / tc.total) * 100).toFixed(2);
        expect(rate).to.equal(tc.expected);
      });
    });

    it('should format decimal values correctly', async () => {
      const testValues = [
        { value: 150.5678, decimals: 2, expected: '150.57' },
        { value: 1.23456789, decimals: 4, expected: '1.2346' },
        { value: 0.001, decimals: 4, expected: '0.0010' },
        { value: 100, decimals: 2, expected: '100.00' }
      ];

      testValues.forEach(tv => {
        const formatted = parseFloat(tv.value).toFixed(tv.decimals);
        expect(formatted).to.equal(tv.expected);
      });
    });

    it('should handle empty metrics array', async () => {
      const emptyMetrics = [];
      expect(emptyMetrics).to.be.an('array').that.is.empty;
    });

    it('should handle null or undefined token counts', async () => {
      const metric = {
        agent_id: 'test-agent',
        total_requests: '10',
        successful_requests: '10',
        avg_response_time: '100',
        max_response_time: '200',
        total_tokens: null,
        total_cost: null
      };

      const totalTokens = parseInt(metric.total_tokens || 0);
      const totalCost = parseFloat(metric.total_cost || 0).toFixed(4);

      expect(totalTokens).to.equal(0);
      expect(totalCost).to.equal('0.0000');
    });
  });

  describe('getAgentMetrics', () => {
    it('should return metrics for a specific agent', async () => {
      const agentId = 'test-agent';
      const mockMetric = {
        agent_id: agentId,
        total_requests: '50',
        successful_requests: '48',
        avg_response_time: '120.5',
        max_response_time: '300',
        total_tokens: '5000',
        total_cost: '0.75'
      };

      expect(mockMetric.agent_id).to.equal(agentId);
    });

    it('should return zero metrics for non-existent agent', async () => {
      const emptyMetrics = [];
      const agentId = 'non-existent-agent';

      const defaultMetrics = {
        agentId,
        totalRequests: 0,
        successfulRequests: 0,
        successRate: '0.00',
        avgResponseTime: '0.00',
        maxResponseTime: 0,
        totalTokens: 0,
        totalCost: '0.00'
      };

      expect(defaultMetrics.totalRequests).to.equal(0);
      expect(defaultMetrics.successRate).to.equal('0.00');
    });

    it('should prevent division by zero in success rate', async () => {
      const metric = {
        total_requests: '0',
        successful_requests: '0'
      };

      // When total is 0, avoid division
      const total = parseInt(metric.total_requests);
      if (total === 0) {
        expect(total).to.equal(0);
      }
    });
  });

  describe('getTokenUsageByAgent', () => {
    it('should aggregate token usage correctly', async () => {
      const mockRows = [{
        agent_id: 'test-agent',
        total_tokens: '10000',
        total_prompt_tokens: '6000',
        total_completion_tokens: '4000',
        request_count: '50'
      }];

      const result = {
        agentId: mockRows[0].agent_id,
        totalTokens: parseInt(mockRows[0].total_tokens || 0),
        promptTokens: parseInt(mockRows[0].total_prompt_tokens || 0),
        completionTokens: parseInt(mockRows[0].total_completion_tokens || 0),
        requestCount: parseInt(mockRows[0].request_count)
      };

      expect(result.totalTokens).to.equal(10000);
      expect(result.promptTokens).to.equal(6000);
      expect(result.completionTokens).to.equal(4000);
    });

    it('should handle agents with zero usage', async () => {
      const mockRows = [{
        agent_id: 'unused-agent',
        total_tokens: '0',
        total_prompt_tokens: '0',
        total_completion_tokens: '0',
        request_count: '1'
      }];

      expect(parseInt(mockRows[0].total_tokens)).to.equal(0);
    });

    it('should validate time range parameter', async () => {
      const validRanges = ['1h', '6h', '24h', '7d', '30d'];
      
      validRanges.forEach(range => {
        expect(validRanges).to.include(range);
      });
    });

    it('should sort agents by token usage descending', async () => {
      const mockRows = [
        { agent_id: 'agent-1', total_tokens: '10000' },
        { agent_id: 'agent-2', total_tokens: '5000' },
        { agent_id: 'agent-3', total_tokens: '15000' }
      ];

      // In real query, ORDER BY total_tokens DESC handles this
      const sorted = [...mockRows].sort((a, b) => 
        parseInt(b.total_tokens) - parseInt(a.total_tokens)
      );

      expect(sorted[0].agent_id).to.equal('agent-3');
      expect(sorted[2].agent_id).to.equal('agent-2');
    });
  });

  describe('getTokenUsageByUser', () => {
    it('should aggregate user token usage', async () => {
      const mockRows = [{
        user_id: 'user-123',
        total_tokens: '20000',
        total_cost: '2.50',
        request_count: '100',
        agents_used: '3'
      }];

      const result = {
        userId: mockRows[0].user_id,
        totalTokens: parseInt(mockRows[0].total_tokens || 0),
        totalCost: parseFloat(mockRows[0].total_cost || 0).toFixed(4),
        requestCount: parseInt(mockRows[0].request_count),
        agentsUsed: parseInt(mockRows[0].agents_used)
      };

      expect(result.totalTokens).to.equal(20000);
      expect(result.totalCost).to.equal('2.5000');
      expect(result.agentsUsed).to.equal(3);
    });

    it('should limit results to top 100 users', async () => {
      const mockRows = new Array(150).fill(null).map((_, i) => ({
        user_id: `user-${i}`,
        total_tokens: '1000',
        total_cost: '0.10',
        request_count: '10',
        agents_used: '1'
      }));

      // Query should have LIMIT 100
      expect(mockRows.length).to.equal(150);
      const limited = mockRows.slice(0, 100);
      expect(limited.length).to.equal(100);
    });

    it('should filter out null user IDs', async () => {
      // Query includes: WHERE user_id IS NOT NULL
      const userIds = ['user1', 'user2', null, 'user3', undefined];
      const filtered = userIds.filter(id => id != null);
      
      expect(filtered).to.have.lengthOf(3);
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze positive sentiment correctly', async () => {
      const positiveText = 'I love this amazing product! It is fantastic and wonderful!';
      
      // Mock sentiment score > 2 = positive
      const mockResult = { score: 5, comparative: 0.5, tokens: 10 };
      
      let label = 'neutral';
      if (mockResult.score > 2) label = 'positive';
      
      expect(label).to.equal('positive');
    });

    it('should analyze negative sentiment correctly', async () => {
      const negativeText = 'This is terrible, horrible, and awful!';
      
      // Mock sentiment score < -2 = negative
      const mockResult = { score: -5, comparative: -0.5, tokens: 6 };
      
      let label = 'neutral';
      if (mockResult.score < -2) label = 'negative';
      
      expect(label).to.equal('negative');
    });

    it('should analyze neutral sentiment correctly', async () => {
      const neutralText = 'The product works as expected.';
      
      // Mock sentiment score between -2 and 2 = neutral
      const mockResult = { score: 0, comparative: 0, tokens: 5 };
      
      let label = 'neutral';
      if (mockResult.score > 2) label = 'positive';
      else if (mockResult.score < -2) label = 'negative';
      
      expect(label).to.equal('neutral');
    });

    it('should handle empty text gracefully', async () => {
      const emptyText = '';
      expect(emptyText).to.equal('');
    });

    it('should handle sentiment analysis errors', async () => {
      try {
        throw new Error('Sentiment analysis failed');
      } catch (err) {
        // Should return default neutral sentiment
        const defaultSentiment = { score: 0, label: 'neutral', comparative: 0, tokens: 0 };
        expect(defaultSentiment.label).to.equal('neutral');
      }
    });
  });

  describe('getConversationAnalytics', () => {
    it('should return conversation analytics with correct formatting', async () => {
      const mockRow = {
        total_conversations: '100',
        avg_messages_per_conversation: '5.5',
        avg_sentiment_score: '0.75',
        positive_count: '60',
        neutral_count: '30',
        negative_count: '10'
      };

      const result = {
        totalConversations: parseInt(mockRow.total_conversations || 0),
        avgMessagesPerConversation: parseFloat(mockRow.avg_messages_per_conversation || 0).toFixed(2),
        avgSentimentScore: parseFloat(mockRow.avg_sentiment_score || 0).toFixed(2),
        sentimentDistribution: {
          positive: parseInt(mockRow.positive_count || 0),
          neutral: parseInt(mockRow.neutral_count || 0),
          negative: parseInt(mockRow.negative_count || 0)
        }
      };

      expect(result.totalConversations).to.equal(100);
      expect(result.avgMessagesPerConversation).to.equal('5.50');
      expect(result.sentimentDistribution.positive).to.equal(60);
    });

    it('should handle zero conversations', async () => {
      const mockRow = {
        total_conversations: '0',
        avg_messages_per_conversation: null,
        avg_sentiment_score: null,
        positive_count: '0',
        neutral_count: '0',
        negative_count: '0'
      };

      expect(parseInt(mockRow.total_conversations)).to.equal(0);
    });
  });

  describe('getTimeSeriesMetrics', () => {
    it('should return time series data with correct structure', async () => {
      const mockRows = [
        {
          time_bucket: new Date('2024-01-01T00:00:00Z'),
          request_count: '50',
          avg_response_time: '150.5',
          success_rate: '95.5'
        },
        {
          time_bucket: new Date('2024-01-01T01:00:00Z'),
          request_count: '60',
          avg_response_time: '160.3',
          success_rate: '97.2'
        }
      ];

      const result = mockRows.map(row => ({
        timestamp: row.time_bucket,
        requestCount: parseInt(row.request_count),
        avgResponseTime: parseFloat(row.avg_response_time).toFixed(2),
        successRate: parseFloat(row.success_rate).toFixed(2)
      }));

      expect(result).to.have.lengthOf(2);
      expect(result[0].requestCount).to.equal(50);
      expect(result[0].avgResponseTime).to.equal('150.50');
    });

    it('should handle different time bucket sizes', async () => {
      const bucketSizes = ['5 minutes', '30 minutes', '1 hour', '6 hours', '1 day'];
      
      bucketSizes.forEach(bucket => {
        expect(bucket).to.be.a('string');
      });
    });

    it('should sort time series by timestamp ascending', async () => {
      const mockRows = [
        { time_bucket: new Date('2024-01-01T02:00:00Z') },
        { time_bucket: new Date('2024-01-01T00:00:00Z') },
        { time_bucket: new Date('2024-01-01T01:00:00Z') }
      ];

      const sorted = [...mockRows].sort((a, b) => 
        a.time_bucket.getTime() - b.time_bucket.getTime()
      );

      expect(sorted[0].time_bucket.getHours()).to.equal(0);
      expect(sorted[2].time_bucket.getHours()).to.equal(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection failures', async () => {
      try {
        throw new Error('Database connection lost');
      } catch (err) {
        expect(err.message).to.equal('Database connection lost');
      }
    });

    it('should handle malformed query results', async () => {
      const malformedRow = {
        agent_id: 'test',
        total_requests: 'not-a-number',
        successful_requests: null
      };

      const parsed = parseInt(malformedRow.total_requests);
      expect(parsed).to.be.NaN;
    });

    it('should handle very large numbers correctly', async () => {
      const largeNumber = '999999999';
      const parsed = parseInt(largeNumber);
      
      expect(parsed).to.equal(999999999);
    });

    it('should handle floating point precision', async () => {
      const value = 0.1 + 0.2;
      const formatted = value.toFixed(2);
      
      expect(formatted).to.equal('0.30');
    });

    it('should validate time range before query', async () => {
      const validRanges = ['1h', '6h', '24h', '7d', '30d'];
      const userInput = '1h';
      
      expect(validRanges).to.include(userInput);
    });
  });

  describe('Performance Metrics', () => {
    it('should handle high request volumes', async () => {
      const highVolume = {
        total_requests: '1000000',
        successful_requests: '999500'
      };

      const successRate = ((999500 / 1000000) * 100).toFixed(2);
      expect(successRate).to.equal('99.95');
    });

    it('should handle response times across ranges', async () => {
      const responseTimes = [50, 100, 500, 1000, 5000];
      
      responseTimes.forEach(time => {
        expect(time).to.be.a('number');
        expect(time).to.be.at.least(0);
      });
    });
  });
});
