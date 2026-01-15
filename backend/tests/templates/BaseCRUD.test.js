/**
 * BaseCRUD Template Tests
 */
const BaseCRUD = require('../../src/templates/BaseCRUD');

describe('BaseCRUD Template', () => {
  let sequelize;
  let TestModel;
  let crudService;

  beforeAll(async () => {
    // Get sequelize instance
    const { sequelize: seq } = require('../../src/models');
    sequelize = seq;

    // Define a test model
    const { DataTypes } = require('sequelize');
    TestModel = sequelize.define('TestItem', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        unique: true
      },
      category: {
        type: DataTypes.STRING
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      deletedAt: {
        type: DataTypes.DATE
      }
    }, {
      tableName: 'test_items',
      timestamps: true
    });

    // Sync the model
    await TestModel.sync({ force: true });

    // Create CRUD service
    crudService = new BaseCRUD(TestModel, {
      searchFields: ['name', 'email'],
      allowedFilters: ['category', 'isActive'],
      defaultSort: [['createdAt', 'DESC']]
    });
  });

  afterAll(async () => {
    // Drop test table
    await TestModel.drop();
  });

  beforeEach(async () => {
    // Clear data before each test
    await TestModel.destroy({ where: {}, truncate: true });
  });

  describe('CREATE operations', () => {
    it('should create a single record', async () => {
      const data = { name: 'Test Item', email: 'test@example.com' };
      const result = await crudService.create(data);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Item');
      expect(result.email).toBe('test@example.com');
    });

    it('should create multiple records', async () => {
      const dataArray = [
        { name: 'Item 1', email: 'item1@example.com' },
        { name: 'Item 2', email: 'item2@example.com' },
        { name: 'Item 3', email: 'item3@example.com' }
      ];
      const results = await crudService.createMany(dataArray);

      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('Item 1');
      expect(results[2].name).toBe('Item 3');
    });

    it('should throw error for duplicate unique field', async () => {
      await crudService.create({ name: 'Item', email: 'dupe@example.com' });

      await expect(
        crudService.create({ name: 'Item 2', email: 'dupe@example.com' })
      ).rejects.toThrow();
    });
  });

  describe('READ operations', () => {
    beforeEach(async () => {
      // Seed test data
      await TestModel.bulkCreate([
        { name: 'Alpha', email: 'alpha@example.com', category: 'A', isActive: true },
        { name: 'Beta', email: 'beta@example.com', category: 'B', isActive: true },
        { name: 'Gamma', email: 'gamma@example.com', category: 'A', isActive: false },
        { name: 'Delta', email: 'delta@example.com', category: 'B', isActive: true },
        { name: 'Epsilon', email: 'epsilon@example.com', category: 'A', isActive: true }
      ]);
    });

    it('should find all records with pagination', async () => {
      const result = await crudService.findAll({ page: 1, limit: 3 });

      expect(result.records).toHaveLength(3);
      expect(result.pagination.total).toBe(5);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasMore).toBe(true);
    });

    it('should search by searchFields', async () => {
      const result = await crudService.findAll({ search: 'alpha' });

      expect(result.records).toHaveLength(1);
      expect(result.records[0].name).toBe('Alpha');
    });

    it('should filter by allowed filters', async () => {
      const result = await crudService.findAll({ filters: { category: 'A' } });

      expect(result.records).toHaveLength(3);
      result.records.forEach(record => {
        expect(record.category).toBe('A');
      });
    });

    it('should find record by ID', async () => {
      const created = await crudService.create({ name: 'FindMe', email: 'findme@example.com' });
      const found = await crudService.findById(created.id);

      expect(found).toBeDefined();
      expect(found.name).toBe('FindMe');
    });

    it('should return null for non-existent ID', async () => {
      const result = await crudService.findById(99999);
      expect(result).toBeNull();
    });

    it('should find one by conditions', async () => {
      const found = await crudService.findOne({ email: 'beta@example.com' });

      expect(found).toBeDefined();
      expect(found.name).toBe('Beta');
    });

    it('should find by field', async () => {
      const results = await crudService.findByField('category', 'B');

      expect(results).toHaveLength(2);
      results.forEach(record => {
        expect(record.category).toBe('B');
      });
    });

    it('should count records', async () => {
      const count = await crudService.count();
      expect(count).toBe(5);

      const filteredCount = await crudService.count({ category: 'A' });
      expect(filteredCount).toBe(3);
    });

    it('should check if record exists', async () => {
      const exists = await crudService.exists({ email: 'alpha@example.com' });
      expect(exists).toBe(true);

      const notExists = await crudService.exists({ email: 'notexist@example.com' });
      expect(notExists).toBe(false);
    });

    it('should sort records', async () => {
      const result = await crudService.findAll({ sortBy: 'name', sortOrder: 'ASC' });

      expect(result.records[0].name).toBe('Alpha');
      expect(result.records[4].name).toBe('Gamma');
    });
  });

  describe('UPDATE operations', () => {
    let testRecord;

    beforeEach(async () => {
      testRecord = await crudService.create({ name: 'Original', email: 'update@example.com' });
    });

    it('should update a record by ID', async () => {
      const updated = await crudService.update(testRecord.id, { name: 'Updated' });

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated');
      expect(updated.email).toBe('update@example.com');
    });

    it('should return null when updating non-existent record', async () => {
      const result = await crudService.update(99999, { name: 'Test' });
      expect(result).toBeNull();
    });

    it('should update multiple records', async () => {
      await crudService.createMany([
        { name: 'Item A', email: 'a@example.com', category: 'X' },
        { name: 'Item B', email: 'b@example.com', category: 'X' }
      ]);

      const affected = await crudService.updateMany(
        { category: 'X' },
        { isActive: false }
      );

      expect(affected).toBe(2);
    });

    it('should upsert (create when not exists)', async () => {
      const { record, created } = await crudService.upsert(
        { email: 'new@example.com' },
        { name: 'New Item', email: 'new@example.com' }
      );

      expect(created).toBe(true);
      expect(record.name).toBe('New Item');
    });

    it('should upsert (update when exists)', async () => {
      const { record, created } = await crudService.upsert(
        { email: 'update@example.com' },
        { name: 'Upserted' }
      );

      expect(created).toBe(false);
      expect(record.name).toBe('Upserted');
    });
  });

  describe('DELETE operations', () => {
    it('should delete a record by ID', async () => {
      const created = await crudService.create({ name: 'ToDelete', email: 'delete@example.com' });
      const deleted = await crudService.delete(created.id);

      expect(deleted).toBe(true);

      const found = await crudService.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent record', async () => {
      const result = await crudService.delete(99999);
      expect(result).toBe(false);
    });

    it('should delete multiple records', async () => {
      await crudService.createMany([
        { name: 'Del 1', email: 'del1@example.com', category: 'DEL' },
        { name: 'Del 2', email: 'del2@example.com', category: 'DEL' }
      ]);

      const deletedCount = await crudService.deleteMany({ category: 'DEL' });
      expect(deletedCount).toBe(2);
    });
  });

  describe('Soft Delete', () => {
    let softDeleteService;

    beforeAll(() => {
      softDeleteService = new BaseCRUD(TestModel, {
        softDelete: true,
        searchFields: ['name']
      });
    });

    it('should soft delete a record', async () => {
      const created = await softDeleteService.create({ name: 'SoftDelete', email: 'soft@example.com' });
      await softDeleteService.delete(created.id);

      // Record should not be findable
      const found = await softDeleteService.findById(created.id);
      expect(found).toBeNull();

      // But still exists in database
      const rawRecord = await TestModel.findByPk(created.id);
      expect(rawRecord).toBeDefined();
      expect(rawRecord.deletedAt).toBeDefined();
    });

    it('should restore a soft-deleted record', async () => {
      const created = await softDeleteService.create({ name: 'Restore', email: 'restore@example.com' });
      await softDeleteService.delete(created.id);

      const restored = await softDeleteService.restore(created.id);

      expect(restored).toBeDefined();
      expect(restored.name).toBe('Restore');

      const found = await softDeleteService.findById(created.id);
      expect(found).toBeDefined();
    });

    it('should exclude soft-deleted records from findAll', async () => {
      await softDeleteService.create({ name: 'Active', email: 'active@example.com' });
      const toDelete = await softDeleteService.create({ name: 'Deleted', email: 'deleted@example.com' });
      await softDeleteService.delete(toDelete.id);

      const result = await softDeleteService.findAll();
      const names = result.records.map(r => r.name);

      expect(names).toContain('Active');
      expect(names).not.toContain('Deleted');
    });
  });

  describe('Field Exclusion', () => {
    it('should exclude specified fields from response', async () => {
      const serviceWithExclusion = new BaseCRUD(TestModel, {
        excludeFields: ['email', 'category']
      });

      const created = await serviceWithExclusion.create({
        name: 'Test',
        email: 'exclude@example.com',
        category: 'SECRET'
      });

      expect(created.name).toBeDefined();
      expect(created.email).toBeUndefined();
      expect(created.category).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      try {
        await crudService.create({ email: 'missing-name@example.com' }); // name is required
        fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('create failed');
      }
    });

    it('should include operation and model name in errors', async () => {
      try {
        await crudService.create({ email: 'test@example.com' }); // missing required name
        fail('Should have thrown');
      } catch (error) {
        expect(error.operation).toBe('create');
        expect(error.modelName).toBe('TestItem');
      }
    });
  });

  describe('Static Factory', () => {
    it('should create instance via static factory', () => {
      const service = BaseCRUD.create(TestModel, {
        searchFields: ['name']
      });

      expect(service).toBeInstanceOf(BaseCRUD);
      expect(service.options.searchFields).toContain('name');
    });
  });
});
