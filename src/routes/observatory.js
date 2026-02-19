import { Router } from 'express';
import {
  getRealTimeMetrics,
  getAgentMetrics,
  getTokenUsageByAgent,
  getTokenUsageByUser,
  getConversationAnalytics,
  getTimeSeriesMetrics
} from '../services/observatoryService.js';
import {
  createABTest,
  getActiveABTests,
  getABTest,
  getABTestResults,
  updateABTestStatus
} from '../services/abTestService.js';
import {
  createAlert,
  getActiveAlerts,
  getAlertHistory,
  resolveAlert,
  updateAlert
} from '../services/alertService.js';
import { generatePDFReport, generateExcelReport } from '../services/reportService.js';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import {
  validateAgentId,
  validateTestId,
  validateAlertId,
  validateHistoryId,
  validateTimeRange,
  validateLimit
} from '../middleware/observatoryValidation.js';

const router = Router();

// Get real-time metrics for all agents
router.get('/metrics', validateTimeRange, async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;
    const metrics = await getRealTimeMetrics(timeRange);
    res.json({ metrics, timeRange });
  } catch (err) {
    next(err);
  }
});

// Get metrics for specific agent
router.get('/metrics/:agentId', validateAgentId, validateTimeRange, async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { timeRange = '24h' } = req.query;
    const metrics = await getAgentMetrics(agentId, timeRange);
    res.json({ metrics, agentId, timeRange });
  } catch (err) {
    next(err);
  }
});

// Get time series data for charts
router.get('/metrics/:agentId/timeseries', validateAgentId, validateTimeRange, async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { timeRange = '24h' } = req.query;
    const timeSeries = await getTimeSeriesMetrics(agentId, timeRange);
    res.json({ timeSeries, agentId, timeRange });
  } catch (err) {
    next(err);
  }
});

// Get token usage by agent
router.get('/tokens/agents', validateTimeRange, async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;
    const tokenUsage = await getTokenUsageByAgent(timeRange);
    res.json({ tokenUsage, timeRange });
  } catch (err) {
    next(err);
  }
});

// Get token usage by user
router.get('/tokens/users', validateTimeRange, async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;
    const tokenUsage = await getTokenUsageByUser(timeRange);
    res.json({ tokenUsage, timeRange });
  } catch (err) {
    next(err);
  }
});

// Get conversation analytics
router.get('/analytics/conversations', validateTimeRange, async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;
    const analytics = await getConversationAnalytics(timeRange);
    res.json({ analytics, timeRange });
  } catch (err) {
    next(err);
  }
});

// A/B Testing endpoints
router.post('/ab-tests', async (req, res, next) => {
  try {
    const { testName, agentId, variantA, variantB } = req.body;
    
    if (!testName || !agentId || !variantA || !variantB) {
      throw new AppError('Missing required fields', 400, 'INVALID_INPUT');
    }
    
    const test = await createABTest({ testName, agentId, variantA, variantB });
    res.status(201).json({ test });
  } catch (err) {
    next(err);
  }
});

router.get('/ab-tests', async (req, res, next) => {
  try {
    const tests = await getActiveABTests();
    res.json({ tests });
  } catch (err) {
    next(err);
  }
});

router.get('/ab-tests/:testId', validateTestId, async (req, res, next) => {
  try {
    const { testId } = req.params;
    const test = await getABTest(parseInt(testId));
    
    if (!test) {
      throw new AppError('Test not found', 404, 'NOT_FOUND');
    }
    
    res.json({ test });
  } catch (err) {
    next(err);
  }
});

router.get('/ab-tests/:testId/results', validateTestId, async (req, res, next) => {
  try {
    const { testId } = req.params;
    const results = await getABTestResults(parseInt(testId));
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

router.patch('/ab-tests/:testId', validateTestId, async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      throw new AppError('Missing active field', 400, 'INVALID_INPUT');
    }
    
    await updateABTestStatus(parseInt(testId), active);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Alert endpoints
router.post('/alerts', async (req, res, next) => {
  try {
    const { alertName, agentId, alertType, thresholdValue, condition, notificationChannels } = req.body;
    
    if (!alertName || !alertType || thresholdValue === undefined || !condition) {
      throw new AppError('Missing required fields', 400, 'INVALID_INPUT');
    }
    
    const alert = await createAlert({
      alertName,
      agentId,
      alertType,
      thresholdValue,
      condition,
      notificationChannels
    });
    
    res.status(201).json({ alert });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts', async (req, res, next) => {
  try {
    const alerts = await getActiveAlerts();
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

router.get('/alerts/history', validateLimit, async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const history = await getAlertHistory(parseInt(limit));
    res.json({ history });
  } catch (err) {
    next(err);
  }
});

router.patch('/alerts/:alertId', validateAlertId, async (req, res, next) => {
  try {
    const { alertId } = req.params;
    await updateAlert(parseInt(alertId), req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/alerts/history/:historyId/resolve', validateHistoryId, async (req, res, next) => {
  try {
    const { historyId } = req.params;
    await resolveAlert(parseInt(historyId));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Report generation endpoints
router.get('/reports/pdf', validateTimeRange, async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;
    const pdfBuffer = await generatePDFReport(timeRange);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=observatory-report-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    logger.error({ err }, 'Failed to generate PDF report');
    next(err);
  }
});

router.get('/reports/excel', validateTimeRange, async (req, res, next) => {
  try {
    const { timeRange = '24h' } = req.query;
    const excelBuffer = await generateExcelReport(timeRange);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=observatory-report-${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (err) {
    logger.error({ err }, 'Failed to generate Excel report');
    next(err);
  }
});

export default router;
