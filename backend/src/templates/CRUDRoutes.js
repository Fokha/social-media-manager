/**
 * ============================================================================
 * CRUD ROUTES GENERATOR
 * ============================================================================
 * Generates Express routes for any CRUD service.
 *
 * Usage:
 *   const router = require('express').Router();
 *   const CRUDRoutes = require('./templates/CRUDRoutes');
 *   const PostService = require('./services/PostService');
 *
 *   // Generate all CRUD routes
 *   CRUDRoutes.generate(router, PostService, {
 *     middleware: [authenticate],
 *     exclude: ['delete'], // Optional: exclude certain routes
 *   });
 *
 *   // Or use individual route generators
 *   CRUDRoutes.createRoute(router, PostService, { middleware: [authenticate] });
 */

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

class CRUDRoutes {
  /**
   * Generate all CRUD routes
   * @param {Object} router - Express router
   * @param {Object} service - CRUD service instance
   * @param {Object} options - Configuration options
   */
  static generate(router, service, options = {}) {
    const {
      middleware = [],
      exclude = [],
      resourceName = service.modelName?.toLowerCase() || 'resource',
      ownerField = null, // If set, filters by req.user.id
    } = options;

    const routes = {
      list: () => this.listRoute(router, service, { middleware, ownerField }),
      get: () => this.getRoute(router, service, { middleware, ownerField }),
      create: () => this.createRoute(router, service, { middleware, ownerField }),
      update: () => this.updateRoute(router, service, { middleware, ownerField }),
      delete: () => this.deleteRoute(router, service, { middleware, ownerField }),
    };

    for (const [name, generator] of Object.entries(routes)) {
      if (!exclude.includes(name)) {
        generator();
      }
    }

    return router;
  }

  /**
   * GET / - List all records
   */
  static listRoute(router, service, options = {}) {
    const { middleware = [], ownerField } = options;

    router.get('/', ...middleware, asyncHandler(async (req, res) => {
      const {
        page = 1,
        limit = 20,
        search,
        sortBy,
        sortOrder,
        ...filters
      } = req.query;

      // Add owner filter if specified
      const where = {};
      if (ownerField && req.user) {
        where[ownerField] = req.user.id;
      }

      const result = await service.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        sortBy,
        sortOrder,
        filters,
        where
      });

      res.json({
        success: true,
        data: {
          [service.modelName?.toLowerCase() + 's' || 'records']: result.records,
          pagination: result.pagination
        }
      });
    }));

    return router;
  }

  /**
   * GET /:id - Get single record
   */
  static getRoute(router, service, options = {}) {
    const { middleware = [], ownerField } = options;

    router.get('/:id', ...middleware, asyncHandler(async (req, res) => {
      const record = await service.findById(req.params.id);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: `${service.modelName || 'Record'} not found`
        });
      }

      // Check ownership if specified
      if (ownerField && req.user && record[ownerField] !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: { [service.modelName?.toLowerCase() || 'record']: record }
      });
    }));

    return router;
  }

  /**
   * POST / - Create record
   */
  static createRoute(router, service, options = {}) {
    const { middleware = [], ownerField } = options;

    router.post('/', ...middleware, asyncHandler(async (req, res) => {
      const data = { ...req.body };

      // Add owner if specified
      if (ownerField && req.user) {
        data[ownerField] = req.user.id;
      }

      const record = await service.create(data);

      res.status(201).json({
        success: true,
        data: { [service.modelName?.toLowerCase() || 'record']: record }
      });
    }));

    return router;
  }

  /**
   * PUT /:id - Update record
   */
  static updateRoute(router, service, options = {}) {
    const { middleware = [], ownerField } = options;

    router.put('/:id', ...middleware, asyncHandler(async (req, res) => {
      // Check ownership first if specified
      if (ownerField && req.user) {
        const existing = await service.findById(req.params.id);
        if (!existing) {
          return res.status(404).json({
            success: false,
            error: `${service.modelName || 'Record'} not found`
          });
        }
        if (existing[ownerField] !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      const record = await service.update(req.params.id, req.body);

      if (!record) {
        return res.status(404).json({
          success: false,
          error: `${service.modelName || 'Record'} not found`
        });
      }

      res.json({
        success: true,
        data: { [service.modelName?.toLowerCase() || 'record']: record }
      });
    }));

    return router;
  }

  /**
   * DELETE /:id - Delete record
   */
  static deleteRoute(router, service, options = {}) {
    const { middleware = [], ownerField } = options;

    router.delete('/:id', ...middleware, asyncHandler(async (req, res) => {
      // Check ownership first if specified
      if (ownerField && req.user) {
        const existing = await service.findById(req.params.id);
        if (!existing) {
          return res.status(404).json({
            success: false,
            error: `${service.modelName || 'Record'} not found`
          });
        }
        if (existing[ownerField] !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      const success = await service.delete(req.params.id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: `${service.modelName || 'Record'} not found`
        });
      }

      res.json({
        success: true,
        message: `${service.modelName || 'Record'} deleted successfully`
      });
    }));

    return router;
  }

  /**
   * Add bulk operations
   */
  static bulkRoutes(router, service, options = {}) {
    const { middleware = [], ownerField } = options;

    // POST /bulk - Create multiple
    router.post('/bulk', ...middleware, asyncHandler(async (req, res) => {
      const { items } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Items must be an array'
        });
      }

      // Add owner to all items if specified
      const dataArray = items.map(item => {
        if (ownerField && req.user) {
          return { ...item, [ownerField]: req.user.id };
        }
        return item;
      });

      const records = await service.createMany(dataArray);

      res.status(201).json({
        success: true,
        data: {
          [service.modelName?.toLowerCase() + 's' || 'records']: records,
          count: records.length
        }
      });
    }));

    // DELETE /bulk - Delete multiple
    router.delete('/bulk', ...middleware, asyncHandler(async (req, res) => {
      const { ids } = req.body;

      if (!Array.isArray(ids)) {
        return res.status(400).json({
          success: false,
          error: 'IDs must be an array'
        });
      }

      const where = { id: ids };
      if (ownerField && req.user) {
        where[ownerField] = req.user.id;
      }

      const count = await service.deleteMany(where);

      res.json({
        success: true,
        data: { deletedCount: count }
      });
    }));

    return router;
  }
}

module.exports = CRUDRoutes;
