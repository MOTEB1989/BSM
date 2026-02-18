import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import * as gatewayController from '../controllers/gatewayController.js';
import { adminAuth } from '../middleware/auth.js';
import { swaggerSpec } from '../config/swagger.js';

const router = Router();

// ==================== SWAGGER DOCUMENTATION ====================

/**
 * Swagger UI documentation
 */
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'BSM Gateway API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));

/**
 * OpenAPI JSON specification
 */
router.get('/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

// ==================== PUBLIC ENDPOINTS ====================

/**
 * @route POST /api/gateway/chat
 * @desc Main unified gateway endpoint for chat completions
 * @access Public (with API key)
 */
router.post('/chat', gatewayController.gatewayChat);

/**
 * @route GET /api/gateway/providers
 * @desc List available AI providers
 * @access Public
 */
router.get('/providers', gatewayController.listProviders);

/**
 * @route GET /api/gateway/models
 * @desc List available models across all providers
 * @access Public
 */
router.get('/models', gatewayController.listModels);

/**
 * @route GET /api/gateway/usage
 * @desc Get usage statistics for API key
 * @access Public (requires API key)
 */
router.get('/usage', gatewayController.getUsage);

/**
 * @route GET /api/gateway/test
 * @desc Test connectivity to all providers
 * @access Public
 */
router.get('/test', gatewayController.testProviders);

/**
 * @route GET /api/gateway/stats
 * @desc Get public gateway statistics
 * @access Public
 */
router.get('/stats', gatewayController.getStats);

// ==================== ADMIN ENDPOINTS ====================

/**
 * @route GET /api/gateway/admin/providers
 * @desc List all providers with detailed information
 * @access Admin
 */
router.get('/admin/providers', adminAuth, gatewayController.adminListProviders);

/**
 * @route POST /api/gateway/admin/providers
 * @desc Add a new AI provider
 * @access Admin
 */
router.post('/admin/providers', adminAuth, gatewayController.adminAddProvider);

/**
 * @route PUT /api/gateway/admin/providers/:id
 * @desc Update an existing provider
 * @access Admin
 */
router.put('/admin/providers/:id', adminAuth, gatewayController.adminUpdateProvider);

/**
 * @route DELETE /api/gateway/admin/providers/:id
 * @desc Delete a provider
 * @access Admin
 */
router.delete('/admin/providers/:id', adminAuth, gatewayController.adminDeleteProvider);

/**
 * @route POST /api/gateway/admin/keys
 * @desc Generate a new API key
 * @access Admin
 */
router.post('/admin/keys', adminAuth, gatewayController.adminGenerateKey);

/**
 * @route GET /api/gateway/admin/stats
 * @desc Get detailed gateway statistics
 * @access Admin
 */
router.get('/admin/stats', adminAuth, gatewayController.adminGetStats);

/**
 * @route GET /api/gateway/admin/requests
 * @desc Get recent requests log
 * @access Admin
 */
router.get('/admin/requests', adminAuth, gatewayController.adminGetRequests);

export default router;
