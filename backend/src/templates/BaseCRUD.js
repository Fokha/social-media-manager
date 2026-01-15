/**
 * ============================================================================
 * BASE CRUD TEMPLATE
 * ============================================================================
 * A unified template for Create, Read, Update, Delete operations.
 * Extend this class for any model to get standardized CRUD functionality.
 *
 * Usage:
 *   const UserService = require('./templates/BaseCRUD').create(User, {
 *     searchFields: ['email', 'firstName', 'lastName'],
 *     defaultSort: [['createdAt', 'DESC']],
 *     allowedFilters: ['role', 'isActive'],
 *   });
 *
 * Or extend the class:
 *   class PostService extends BaseCRUD {
 *     constructor() {
 *       super(Post, { searchFields: ['content', 'title'] });
 *     }
 *     // Add custom methods
 *   }
 */

const { Op } = require('sequelize');

class BaseCRUD {
  /**
   * @param {Object} model - Sequelize model
   * @param {Object} options - Configuration options
   * @param {string[]} options.searchFields - Fields to search in findAll
   * @param {Array} options.defaultSort - Default sorting [[field, direction]]
   * @param {string[]} options.allowedFilters - Fields that can be filtered
   * @param {Object[]} options.defaultIncludes - Default associations to include
   * @param {string[]} options.excludeFields - Fields to exclude from responses
   */
  constructor(model, options = {}) {
    this.model = model;
    this.modelName = model.name || 'Record';
    this.options = {
      searchFields: [],
      defaultSort: [['createdAt', 'DESC']],
      allowedFilters: [],
      defaultIncludes: [],
      excludeFields: ['password'],
      softDelete: false,
      ...options
    };
  }

  // ============================================================================
  // CREATE
  // ============================================================================

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @param {Object} options - Additional options (transaction, include, etc.)
   * @returns {Promise<Object>} Created record
   */
  async create(data, options = {}) {
    try {
      const record = await this.model.create(data, {
        ...options,
        returning: true
      });

      // Reload with includes if specified
      if (this.options.defaultIncludes.length > 0 || options.include) {
        await record.reload({
          include: options.include || this.options.defaultIncludes
        });
      }

      return this._formatResponse(record);
    } catch (error) {
      throw this._handleError(error, 'create');
    }
  }

  /**
   * Create multiple records
   * @param {Object[]} dataArray - Array of record data
   * @param {Object} options - Additional options
   * @returns {Promise<Object[]>} Created records
   */
  async createMany(dataArray, options = {}) {
    try {
      const records = await this.model.bulkCreate(dataArray, {
        ...options,
        returning: true,
        validate: true
      });
      return records.map(r => this._formatResponse(r));
    } catch (error) {
      throw this._handleError(error, 'createMany');
    }
  }

  // ============================================================================
  // READ
  // ============================================================================

  /**
   * Find all records with pagination, search, and filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Records per page (default: 20)
   * @param {string} params.search - Search query
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction (ASC/DESC)
   * @param {Object} params.filters - Filter conditions
   * @param {Object} params.where - Additional where conditions
   * @returns {Promise<Object>} { records, pagination }
   */
  async findAll(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        sortBy,
        sortOrder = 'DESC',
        filters = {},
        where = {},
        include
      } = params;

      // Build where clause
      const whereClause = { ...where };

      // Add soft delete filter
      if (this.options.softDelete) {
        whereClause.deletedAt = null;
      }

      // Add search conditions
      if (search && this.options.searchFields.length > 0) {
        whereClause[Op.or] = this.options.searchFields.map(field => ({
          [field]: { [Op.like]: `%${search}%` }
        }));
      }

      // Add allowed filters
      for (const [key, value] of Object.entries(filters)) {
        if (this.options.allowedFilters.includes(key) && value !== undefined) {
          whereClause[key] = value;
        }
      }

      // Build sort order
      const order = sortBy
        ? [[sortBy, sortOrder.toUpperCase()]]
        : this.options.defaultSort;

      // Calculate offset
      const offset = (page - 1) * limit;

      // Execute query
      const { count, rows } = await this.model.findAndCountAll({
        where: whereClause,
        include: include || this.options.defaultIncludes,
        order,
        limit: parseInt(limit),
        offset,
        distinct: true
      });

      return {
        records: rows.map(r => this._formatResponse(r)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
          hasMore: page * limit < count
        }
      };
    } catch (error) {
      throw this._handleError(error, 'findAll');
    }
  }

  /**
   * Find a single record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object|null>} Found record or null
   */
  async findById(id, options = {}) {
    try {
      const record = await this.model.findByPk(id, {
        include: options.include || this.options.defaultIncludes,
        ...options
      });

      if (!record) {
        return null;
      }

      // Check soft delete
      if (this.options.softDelete && record.deletedAt) {
        return null;
      }

      return this._formatResponse(record);
    } catch (error) {
      throw this._handleError(error, 'findById');
    }
  }

  /**
   * Find a single record by conditions
   * @param {Object} where - Where conditions
   * @param {Object} options - Additional options
   * @returns {Promise<Object|null>} Found record or null
   */
  async findOne(where, options = {}) {
    try {
      const whereClause = { ...where };

      if (this.options.softDelete) {
        whereClause.deletedAt = null;
      }

      const record = await this.model.findOne({
        where: whereClause,
        include: options.include || this.options.defaultIncludes,
        ...options
      });

      return record ? this._formatResponse(record) : null;
    } catch (error) {
      throw this._handleError(error, 'findOne');
    }
  }

  /**
   * Find records by specific field
   * @param {string} field - Field name
   * @param {any} value - Field value
   * @param {Object} options - Additional options
   * @returns {Promise<Object[]>} Found records
   */
  async findByField(field, value, options = {}) {
    try {
      const whereClause = { [field]: value };

      if (this.options.softDelete) {
        whereClause.deletedAt = null;
      }

      const records = await this.model.findAll({
        where: whereClause,
        include: options.include || this.options.defaultIncludes,
        order: this.options.defaultSort,
        ...options
      });

      return records.map(r => this._formatResponse(r));
    } catch (error) {
      throw this._handleError(error, 'findByField');
    }
  }

  /**
   * Count records
   * @param {Object} where - Where conditions
   * @returns {Promise<number>} Count
   */
  async count(where = {}) {
    try {
      const whereClause = { ...where };

      if (this.options.softDelete) {
        whereClause.deletedAt = null;
      }

      return await this.model.count({ where: whereClause });
    } catch (error) {
      throw this._handleError(error, 'count');
    }
  }

  /**
   * Check if record exists
   * @param {Object} where - Where conditions
   * @returns {Promise<boolean>} Exists
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  /**
   * Update a record by ID
   * @param {string|number} id - Record ID
   * @param {Object} data - Update data
   * @param {Object} options - Additional options
   * @returns {Promise<Object|null>} Updated record or null
   */
  async update(id, data, options = {}) {
    try {
      const record = await this.model.findByPk(id);

      if (!record) {
        return null;
      }

      if (this.options.softDelete && record.deletedAt) {
        return null;
      }

      await record.update(data, options);

      // Reload with includes
      if (this.options.defaultIncludes.length > 0 || options.include) {
        await record.reload({
          include: options.include || this.options.defaultIncludes
        });
      }

      return this._formatResponse(record);
    } catch (error) {
      throw this._handleError(error, 'update');
    }
  }

  /**
   * Update multiple records
   * @param {Object} where - Where conditions
   * @param {Object} data - Update data
   * @param {Object} options - Additional options
   * @returns {Promise<number>} Number of affected rows
   */
  async updateMany(where, data, options = {}) {
    try {
      const whereClause = { ...where };

      if (this.options.softDelete) {
        whereClause.deletedAt = null;
      }

      const [affectedCount] = await this.model.update(data, {
        where: whereClause,
        ...options
      });

      return affectedCount;
    } catch (error) {
      throw this._handleError(error, 'updateMany');
    }
  }

  /**
   * Update or create a record
   * @param {Object} where - Where conditions to find
   * @param {Object} data - Data to create or update
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} { record, created }
   */
  async upsert(where, data, options = {}) {
    try {
      const [record, created] = await this.model.findOrCreate({
        where,
        defaults: data,
        ...options
      });

      if (!created) {
        await record.update(data);
      }

      return {
        record: this._formatResponse(record),
        created
      };
    } catch (error) {
      throw this._handleError(error, 'upsert');
    }
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  /**
   * Delete a record by ID
   * @param {string|number} id - Record ID
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Success
   */
  async delete(id, options = {}) {
    try {
      const record = await this.model.findByPk(id);

      if (!record) {
        return false;
      }

      if (this.options.softDelete) {
        await record.update({ deletedAt: new Date() });
      } else {
        await record.destroy(options);
      }

      return true;
    } catch (error) {
      throw this._handleError(error, 'delete');
    }
  }

  /**
   * Delete multiple records
   * @param {Object} where - Where conditions
   * @param {Object} options - Additional options
   * @returns {Promise<number>} Number of deleted rows
   */
  async deleteMany(where, options = {}) {
    try {
      if (this.options.softDelete) {
        const [affectedCount] = await this.model.update(
          { deletedAt: new Date() },
          { where, ...options }
        );
        return affectedCount;
      }

      return await this.model.destroy({ where, ...options });
    } catch (error) {
      throw this._handleError(error, 'deleteMany');
    }
  }

  /**
   * Restore a soft-deleted record
   * @param {string|number} id - Record ID
   * @returns {Promise<Object|null>} Restored record
   */
  async restore(id) {
    if (!this.options.softDelete) {
      throw new Error('Soft delete is not enabled for this model');
    }

    try {
      const record = await this.model.findByPk(id);

      if (!record || !record.deletedAt) {
        return null;
      }

      await record.update({ deletedAt: null });
      return this._formatResponse(record);
    } catch (error) {
      throw this._handleError(error, 'restore');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Format response (exclude sensitive fields)
   * @private
   */
  _formatResponse(record) {
    if (!record) return null;

    const data = record.toJSON ? record.toJSON() : { ...record };

    // Remove excluded fields
    for (const field of this.options.excludeFields) {
      delete data[field];
    }

    return data;
  }

  /**
   * Handle errors uniformly
   * @private
   */
  _handleError(error, operation) {
    const err = new Error(`${this.modelName} ${operation} failed: ${error.message}`);
    err.originalError = error;
    err.operation = operation;
    err.modelName = this.modelName;

    // Handle specific Sequelize errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      err.code = 'DUPLICATE_ENTRY';
      err.fields = error.fields;
    } else if (error.name === 'SequelizeValidationError') {
      err.code = 'VALIDATION_ERROR';
      err.errors = error.errors.map(e => ({
        field: e.path,
        message: e.message
      }));
    } else if (error.name === 'SequelizeForeignKeyConstraintError') {
      err.code = 'FOREIGN_KEY_ERROR';
    }

    return err;
  }

  // ============================================================================
  // STATIC FACTORY
  // ============================================================================

  /**
   * Create a CRUD service instance
   * @param {Object} model - Sequelize model
   * @param {Object} options - Configuration options
   * @returns {BaseCRUD} CRUD service instance
   */
  static create(model, options = {}) {
    return new BaseCRUD(model, options);
  }
}

module.exports = BaseCRUD;
