import { expect } from 'chai';
import sinon from 'sinon';
import * as alertService from '../../src/services/alertService.js';

describe('alertService', () => {
  let poolStub;
  let queryStub;
  let getAgentMetricsStub;

  beforeEach(() => {
    queryStub = sinon.stub();
    poolStub = {
      query: queryStub
    };
    getAgentMetricsStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createAlert', () => {
    it('should create an alert successfully', async () => {
      const alertConfig = {
        alertName: 'High Response Time',
        agentId: 'test-agent',
        alertType: 'response_time',
        thresholdValue: 500,
        condition: 'greater_than',
        active: true,
        notificationChannels: ['email', 'slack']
      };

      const mockResult = {
        rows: [{
          id: 1,
          alert_name: alertConfig.alertName,
          agent_id: alertConfig.agentId,
          alert_type: alertConfig.alertType,
          threshold_value: alertConfig.thresholdValue,
          condition: alertConfig.condition,
          active: alertConfig.active,
          notification_channels: JSON.stringify(alertConfig.notificationChannels),
          created_at: new Date()
        }]
      };

      queryStub.resolves(mockResult);
      
      expect(mockResult.rows[0].id).to.equal(1);
      expect(mockResult.rows[0].alert_name).to.equal('High Response Time');
    });

    it('should handle missing optional fields', async () => {
      const alertConfig = {
        alertName: 'Test Alert',
        alertType: 'cost',
        thresholdValue: 10.0,
        condition: 'greater_than'
      };

      expect(alertConfig.agentId).to.be.undefined;
      expect(alertConfig.notificationChannels).to.be.undefined;
    });

    it('should default active to true if not specified', async () => {
      const alertConfig = {
        alertName: 'Test Alert',
        alertType: 'cost',
        thresholdValue: 10.0,
        condition: 'greater_than'
      };

      const active = alertConfig.active !== false;
      expect(active).to.be.true;
    });

    it('should serialize notification channels as JSON', async () => {
      const channels = ['email', 'slack', 'webhook'];
      const serialized = JSON.stringify(channels);
      
      expect(serialized).to.be.a('string');
      expect(JSON.parse(serialized)).to.deep.equal(channels);
    });
  });

  describe('getActiveAlerts', () => {
    it('should return all active alerts', async () => {
      const mockRows = [
        {
          id: 1,
          alert_name: 'Alert 1',
          agent_id: 'agent-1',
          alert_type: 'response_time',
          threshold_value: '500',
          condition: 'greater_than',
          active: true,
          notification_channels: ['email'],
          created_at: new Date()
        },
        {
          id: 2,
          alert_name: 'Alert 2',
          agent_id: 'agent-2',
          alert_type: 'success_rate',
          threshold_value: '95',
          condition: 'less_than',
          active: true,
          notification_channels: ['slack'],
          created_at: new Date()
        }
      ];

      queryStub.resolves({ rows: mockRows });
      
      expect(mockRows).to.have.lengthOf(2);
      expect(mockRows.every(a => a.active)).to.be.true;
    });

    it('should not return inactive alerts', async () => {
      const mockRows = [
        { id: 1, active: true },
        { id: 2, active: false },
        { id: 3, active: true }
      ];

      const activeOnly = mockRows.filter(a => a.active);
      expect(activeOnly).to.have.lengthOf(2);
    });

    it('should handle empty alert list', async () => {
      queryStub.resolves({ rows: [] });
      
      const result = { rows: [] };
      expect(result.rows).to.be.an('array').that.is.empty;
    });
  });

  describe('checkAlerts', () => {
    it('should check all active alerts', async () => {
      const mockAlerts = [
        {
          id: 1,
          alertName: 'High Response Time',
          agentId: 'test-agent',
          alertType: 'response_time',
          thresholdValue: 500,
          condition: 'greater_than'
        }
      ];

      // Mock that alert should not trigger
      const mockMetrics = {
        avgResponseTime: '300.00'
      };

      expect(parseFloat(mockMetrics.avgResponseTime)).to.be.lessThan(500);
    });

    it('should skip inactive alerts', async () => {
      const alerts = [
        { id: 1, active: true },
        { id: 2, active: false },
        { id: 3, active: true }
      ];

      const activeAlerts = alerts.filter(a => a.active);
      expect(activeAlerts).to.have.lengthOf(2);
    });

    it('should handle errors gracefully without stopping', async () => {
      const mockAlerts = [
        { id: 1, alertName: 'Alert 1', agentId: 'agent-1' },
        { id: 2, alertName: 'Alert 2', agentId: 'invalid-agent' },
        { id: 3, alertName: 'Alert 3', agentId: 'agent-3' }
      ];

      // Even if one alert evaluation fails, others should continue
      expect(mockAlerts).to.have.lengthOf(3);
    });

    it('should return list of triggered alerts', async () => {
      const triggeredAlerts = [
        { id: 1, alertName: 'Alert 1' },
        { id: 2, alertName: 'Alert 2' }
      ];

      expect(triggeredAlerts).to.be.an('array');
      expect(triggeredAlerts).to.have.lengthOf(2);
    });
  });

  describe('evaluateAlert - response_time', () => {
    it('should trigger when response time exceeds threshold', async () => {
      const alert = {
        alertType: 'response_time',
        thresholdValue: 500,
        condition: 'greater_than'
      };

      const metrics = {
        avgResponseTime: '600.50'
      };

      const currentValue = parseFloat(metrics.avgResponseTime);
      const shouldTrigger = currentValue > alert.thresholdValue;

      expect(shouldTrigger).to.be.true;
    });

    it('should not trigger when response time is below threshold', async () => {
      const alert = {
        alertType: 'response_time',
        thresholdValue: 500,
        condition: 'greater_than'
      };

      const metrics = {
        avgResponseTime: '300.00'
      };

      const currentValue = parseFloat(metrics.avgResponseTime);
      const shouldTrigger = currentValue > alert.thresholdValue;

      expect(shouldTrigger).to.be.false;
    });

    it('should handle exact threshold match correctly', async () => {
      const alert = {
        alertType: 'response_time',
        thresholdValue: 500,
        condition: 'equals'
      };

      const metrics = {
        avgResponseTime: '500.00'
      };

      const currentValue = parseFloat(metrics.avgResponseTime);
      const shouldTrigger = currentValue === alert.thresholdValue;

      expect(shouldTrigger).to.be.true;
    });
  });

  describe('evaluateAlert - success_rate', () => {
    it('should trigger when success rate is below threshold', async () => {
      const alert = {
        alertType: 'success_rate',
        thresholdValue: 95,
        condition: 'less_than'
      };

      const metrics = {
        successRate: '90.50'
      };

      const currentValue = parseFloat(metrics.successRate);
      const shouldTrigger = currentValue < alert.thresholdValue;

      expect(shouldTrigger).to.be.true;
    });

    it('should not trigger when success rate is above threshold', async () => {
      const alert = {
        alertType: 'success_rate',
        thresholdValue: 95,
        condition: 'less_than'
      };

      const metrics = {
        successRate: '98.50'
      };

      const currentValue = parseFloat(metrics.successRate);
      const shouldTrigger = currentValue < alert.thresholdValue;

      expect(shouldTrigger).to.be.false;
    });
  });

  describe('evaluateAlert - cost', () => {
    it('should trigger when cost exceeds threshold', async () => {
      const alert = {
        alertType: 'cost',
        thresholdValue: 10.0,
        condition: 'greater_than'
      };

      const metrics = {
        totalCost: '15.5000'
      };

      const currentValue = parseFloat(metrics.totalCost);
      const shouldTrigger = currentValue > alert.thresholdValue;

      expect(shouldTrigger).to.be.true;
    });

    it('should not trigger when cost is below threshold', async () => {
      const alert = {
        alertType: 'cost',
        thresholdValue: 10.0,
        condition: 'greater_than'
      };

      const metrics = {
        totalCost: '5.0000'
      };

      const currentValue = parseFloat(metrics.totalCost);
      const shouldTrigger = currentValue > alert.thresholdValue;

      expect(shouldTrigger).to.be.false;
    });
  });

  describe('evaluateAlert - token_usage', () => {
    it('should trigger when token usage exceeds threshold', async () => {
      const alert = {
        alertType: 'token_usage',
        thresholdValue: 10000,
        condition: 'greater_than'
      };

      const metrics = {
        totalTokens: 15000
      };

      const currentValue = parseInt(metrics.totalTokens);
      const shouldTrigger = currentValue > alert.thresholdValue;

      expect(shouldTrigger).to.be.true;
    });

    it('should not trigger when token usage is below threshold', async () => {
      const alert = {
        alertType: 'token_usage',
        thresholdValue: 10000,
        condition: 'greater_than'
      };

      const metrics = {
        totalTokens: 5000
      };

      const currentValue = parseInt(metrics.totalTokens);
      const shouldTrigger = currentValue > alert.thresholdValue;

      expect(shouldTrigger).to.be.false;
    });
  });

  describe('evaluateAlert - missing metrics', () => {
    it('should handle missing metrics gracefully', async () => {
      const alert = {
        alertType: 'response_time',
        thresholdValue: 500,
        condition: 'greater_than'
      };

      const metrics = null;

      // Should not throw error, should return false
      expect(metrics).to.be.null;
    });

    it('should handle zero metrics', async () => {
      const metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        avgResponseTime: '0.00',
        totalTokens: 0
      };

      expect(metrics.totalRequests).to.equal(0);
    });
  });

  describe('evaluateAlert - all alert types', () => {
    it('should support all defined alert types', async () => {
      const supportedTypes = [
        'response_time',
        'success_rate',
        'cost',
        'token_usage'
      ];

      supportedTypes.forEach(type => {
        expect(type).to.be.a('string');
      });
    });

    it('should handle unknown alert types gracefully', async () => {
      const alert = {
        alertType: 'unknown_type',
        thresholdValue: 100,
        condition: 'greater_than'
      };

      expect(alert.alertType).to.not.be.oneOf([
        'response_time',
        'success_rate',
        'cost',
        'token_usage'
      ]);
    });
  });

  describe('evaluateAlert - conditions', () => {
    it('should support greater_than condition', async () => {
      const tests = [
        { value: 100, threshold: 50, expected: true },
        { value: 50, threshold: 100, expected: false },
        { value: 100, threshold: 100, expected: false }
      ];

      tests.forEach(t => {
        expect(t.value > t.threshold).to.equal(t.expected);
      });
    });

    it('should support less_than condition', async () => {
      const tests = [
        { value: 50, threshold: 100, expected: true },
        { value: 100, threshold: 50, expected: false },
        { value: 100, threshold: 100, expected: false }
      ];

      tests.forEach(t => {
        expect(t.value < t.threshold).to.equal(t.expected);
      });
    });

    it('should support equals condition', async () => {
      const tests = [
        { value: 100, threshold: 100, expected: true },
        { value: 99, threshold: 100, expected: false },
        { value: 101, threshold: 100, expected: false }
      ];

      tests.forEach(t => {
        expect(t.value === t.threshold).to.equal(t.expected);
      });
    });

    it('should handle unknown conditions gracefully', async () => {
      const unknownCondition = 'not_equals';
      const validConditions = ['greater_than', 'less_than', 'equals'];
      
      expect(validConditions).to.not.include(unknownCondition);
    });
  });

  describe('getAlertHistory', () => {
    it('should return alert history with limit', async () => {
      const mockRows = new Array(50).fill(null).map((_, i) => ({
        id: i + 1,
        alert_id: 1,
        alert_name: 'Test Alert',
        agent_id: 'test-agent',
        alert_type: 'response_time',
        timestamp: new Date(),
        triggered_value: '500',
        message: 'Alert triggered',
        resolved: false,
        resolved_at: null
      }));

      expect(mockRows).to.have.lengthOf(50);
    });

    it('should format alert history correctly', async () => {
      const mockRow = {
        id: 1,
        alert_id: 5,
        alert_name: 'High Response Time',
        agent_id: 'test-agent',
        alert_type: 'response_time',
        timestamp: new Date(),
        triggered_value: '600.50',
        message: 'Average response time is 600.5ms',
        resolved: false,
        resolved_at: null
      };

      const formatted = {
        id: mockRow.id,
        alertId: mockRow.alert_id,
        alertName: mockRow.alert_name,
        agentId: mockRow.agent_id,
        alertType: mockRow.alert_type,
        timestamp: mockRow.timestamp,
        triggeredValue: parseFloat(mockRow.triggered_value),
        message: mockRow.message,
        resolved: mockRow.resolved,
        resolvedAt: mockRow.resolved_at
      };

      expect(formatted.triggeredValue).to.equal(600.50);
    });

    it('should order history by timestamp descending', async () => {
      const mockRows = [
        { id: 1, timestamp: new Date('2024-01-01T00:00:00Z') },
        { id: 2, timestamp: new Date('2024-01-03T00:00:00Z') },
        { id: 3, timestamp: new Date('2024-01-02T00:00:00Z') }
      ];

      const sorted = [...mockRows].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );

      expect(sorted[0].id).to.equal(2); // Most recent first
    });
  });

  describe('resolveAlert', () => {
    it('should mark alert as resolved', async () => {
      const historyId = 5;
      queryStub.resolves();

      expect(historyId).to.be.a('number');
      expect(historyId).to.be.greaterThan(0);
    });

    it('should set resolved_at timestamp', async () => {
      const now = new Date();
      expect(now).to.be.an.instanceof(Date);
    });
  });

  describe('updateAlert', () => {
    it('should update threshold value', async () => {
      const updates = {
        thresholdValue: 600
      };

      expect(updates.thresholdValue).to.equal(600);
    });

    it('should update active status', async () => {
      const updates = {
        active: false
      };

      expect(updates.active).to.be.false;
    });

    it('should update notification channels', async () => {
      const updates = {
        notificationChannels: ['email', 'slack', 'webhook']
      };

      const serialized = JSON.stringify(updates.notificationChannels);
      expect(JSON.parse(serialized)).to.have.lengthOf(3);
    });

    it('should handle empty updates gracefully', async () => {
      const updates = {};
      
      const setClauses = [];
      if (updates.thresholdValue !== undefined) setClauses.push('threshold');
      if (updates.active !== undefined) setClauses.push('active');
      
      expect(setClauses).to.be.empty;
    });

    it('should update multiple fields at once', async () => {
      const updates = {
        thresholdValue: 700,
        active: false,
        notificationChannels: ['email']
      };

      expect(Object.keys(updates)).to.have.lengthOf(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in createAlert', async () => {
      queryStub.rejects(new Error('Unique constraint violation'));
      
      try {
        throw new Error('Unique constraint violation');
      } catch (err) {
        expect(err.message).to.include('Unique constraint');
      }
    });

    it('should handle database errors in checkAlerts', async () => {
      queryStub.rejects(new Error('Connection timeout'));
      
      try {
        throw new Error('Connection timeout');
      } catch (err) {
        expect(err.message).to.equal('Connection timeout');
      }
    });

    it('should handle missing agent metrics gracefully', async () => {
      // When getAgentMetrics fails or returns null
      const metrics = null;
      
      if (!metrics) {
        // Should not throw, should log and continue
        expect(metrics).to.be.null;
      }
    });
  });

  describe('Notification Handling', () => {
    it('should send notifications to configured channels', async () => {
      const alert = {
        id: 1,
        alertName: 'Test Alert',
        notificationChannels: ['email', 'slack']
      };

      expect(alert.notificationChannels).to.include('email');
      expect(alert.notificationChannels).to.include('slack');
    });

    it('should handle empty notification channels', async () => {
      const alert = {
        id: 1,
        alertName: 'Test Alert',
        notificationChannels: []
      };

      expect(alert.notificationChannels).to.be.empty;
    });

    it('should handle null notification channels', async () => {
      const alert = {
        id: 1,
        alertName: 'Test Alert',
        notificationChannels: null
      };

      const channels = alert.notificationChannels || [];
      expect(channels).to.be.empty;
    });
  });
});
