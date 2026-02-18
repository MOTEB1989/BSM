import { getPool } from '../config/database.js';
import { getAgentMetrics } from './observatoryService.js';
import logger from '../utils/logger.js';

// Create alert configuration
export async function createAlert(alertConfig) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      INSERT INTO alert_configs (
        alert_name, agent_id, alert_type, threshold_value,
        condition, active, notification_channels
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      alertConfig.alertName,
      alertConfig.agentId || null,
      alertConfig.alertType,
      alertConfig.thresholdValue,
      alertConfig.condition,
      alertConfig.active !== false,
      JSON.stringify(alertConfig.notificationChannels || [])
    ]);
    
    logger.info({ alertId: result.rows[0].id, alertName: alertConfig.alertName }, 'Alert created');
    return result.rows[0];
  } catch (err) {
    logger.error({ err, alertConfig }, 'Failed to create alert');
    throw err;
  }
}

// Get all active alerts
export async function getActiveAlerts() {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT * FROM alert_configs
      WHERE active = true
      ORDER BY created_at DESC
    `);
    
    return result.rows.map(row => ({
      id: row.id,
      alertName: row.alert_name,
      agentId: row.agent_id,
      alertType: row.alert_type,
      thresholdValue: parseFloat(row.threshold_value),
      condition: row.condition,
      active: row.active,
      notificationChannels: row.notification_channels,
      createdAt: row.created_at
    }));
  } catch (err) {
    logger.error({ err }, 'Failed to get active alerts');
    throw err;
  }
}

// Check alerts and trigger if needed
export async function checkAlerts() {
  try {
    const alerts = await getActiveAlerts();
    const triggeredAlerts = [];
    
    for (const alert of alerts) {
      const shouldTrigger = await evaluateAlert(alert);
      if (shouldTrigger) {
        await triggerAlert(alert, shouldTrigger.value, shouldTrigger.message);
        triggeredAlerts.push(alert);
      }
    }
    
    return triggeredAlerts;
  } catch (err) {
    logger.error({ err }, 'Failed to check alerts');
    throw err;
  }
}

// Evaluate if an alert should trigger
async function evaluateAlert(alert) {
  try {
    const metrics = await getAgentMetrics(alert.agentId, '1h');
    
    let currentValue;
    let message;
    
    switch (alert.alertType) {
      case 'response_time':
        currentValue = parseFloat(metrics.avgResponseTime);
        message = `Average response time is ${currentValue}ms`;
        break;
      
      case 'success_rate':
        currentValue = parseFloat(metrics.successRate);
        message = `Success rate is ${currentValue}%`;
        break;
      
      case 'cost':
        currentValue = parseFloat(metrics.totalCost);
        message = `Total cost is $${currentValue}`;
        break;
      
      case 'token_usage':
        currentValue = parseInt(metrics.totalTokens);
        message = `Total tokens used: ${currentValue}`;
        break;
      
      default:
        logger.warn({ alertType: alert.alertType }, 'Unknown alert type');
        return false;
    }
    
    // Evaluate condition
    const threshold = alert.thresholdValue;
    let shouldTrigger = false;
    
    switch (alert.condition) {
      case 'greater_than':
        shouldTrigger = currentValue > threshold;
        break;
      case 'less_than':
        shouldTrigger = currentValue < threshold;
        break;
      case 'equals':
        shouldTrigger = currentValue === threshold;
        break;
      default:
        logger.warn({ condition: alert.condition }, 'Unknown alert condition');
    }
    
    if (shouldTrigger) {
      return { value: currentValue, message };
    }
    
    return false;
  } catch (err) {
    logger.error({ err, alert }, 'Failed to evaluate alert');
    return false;
  }
}

// Trigger an alert
async function triggerAlert(alert, value, message) {
  const pool = getPool();
  
  try {
    // Record alert in history
    await pool.query(`
      INSERT INTO alert_history (
        alert_id, triggered_value, message
      ) VALUES ($1, $2, $3)
    `, [alert.id, value, message]);
    
    logger.warn({
      alertId: alert.id,
      alertName: alert.alertName,
      agentId: alert.agentId,
      value,
      message
    }, 'Alert triggered');
    
    // Send notifications (placeholder for actual notification logic)
    await sendNotifications(alert, message);
  } catch (err) {
    logger.error({ err, alert }, 'Failed to trigger alert');
  }
}

// Send notifications (placeholder implementation)
async function sendNotifications(alert, message) {
  // In a real implementation, this would send emails, SMS, Slack messages, etc.
  // based on alert.notificationChannels
  logger.info({
    channels: alert.notificationChannels,
    message
  }, 'Notification sent');
}

// Get alert history
export async function getAlertHistory(limit = 100) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      SELECT
        ah.*,
        ac.alert_name,
        ac.agent_id,
        ac.alert_type
      FROM alert_history ah
      JOIN alert_configs ac ON ah.alert_id = ac.id
      ORDER BY ah.timestamp DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows.map(row => ({
      id: row.id,
      alertId: row.alert_id,
      alertName: row.alert_name,
      agentId: row.agent_id,
      alertType: row.alert_type,
      timestamp: row.timestamp,
      triggeredValue: parseFloat(row.triggered_value),
      message: row.message,
      resolved: row.resolved,
      resolvedAt: row.resolved_at
    }));
  } catch (err) {
    logger.error({ err }, 'Failed to get alert history');
    throw err;
  }
}

// Resolve an alert
export async function resolveAlert(historyId) {
  const pool = getPool();
  
  try {
    await pool.query(`
      UPDATE alert_history
      SET resolved = true, resolved_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [historyId]);
    
    logger.info({ historyId }, 'Alert resolved');
  } catch (err) {
    logger.error({ err, historyId }, 'Failed to resolve alert');
    throw err;
  }
}

// Update alert configuration
export async function updateAlert(alertId, updates) {
  const pool = getPool();
  
  try {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.thresholdValue !== undefined) {
      setClauses.push(`threshold_value = $${paramIndex++}`);
      values.push(updates.thresholdValue);
    }
    
    if (updates.active !== undefined) {
      setClauses.push(`active = $${paramIndex++}`);
      values.push(updates.active);
    }
    
    if (updates.notificationChannels !== undefined) {
      setClauses.push(`notification_channels = $${paramIndex++}`);
      values.push(JSON.stringify(updates.notificationChannels));
    }
    
    if (setClauses.length === 0) {
      return;
    }
    
    values.push(alertId);
    
    await pool.query(`
      UPDATE alert_configs
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
    `, values);
    
    logger.info({ alertId, updates }, 'Alert updated');
  } catch (err) {
    logger.error({ err, alertId }, 'Failed to update alert');
    throw err;
  }
}

export default {
  createAlert,
  getActiveAlerts,
  checkAlerts,
  getAlertHistory,
  resolveAlert,
  updateAlert
};
