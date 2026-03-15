const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Skill } = require('../models');
const { redis, KEYS, TTL } = require('../config/redis');
const { generateSignedUrl, verifySignedUrl, getSkillPackagePath } = require('../utils/storage');
const path = require('path');
const fs = require('fs');

/**
 * Get all skills (public)
 * GET /api/skills
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20, sort = 'new' } = req.query;
    
    const where = { isActive: true };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let order;
    switch (sort) {
      case 'hot':
        order = [['usageCount', 'DESC'], ['downloadCount', 'DESC']];
        break;
      case 'price-low':
        order = [['pricePerCall', 'ASC']];
        break;
      case 'price-high':
        order = [['pricePerCall', 'DESC']];
        break;
      case 'name':
        order = [['name', 'ASC']];
        break;
      case 'new':
      default:
        order = [['created_at', 'DESC']];
        break;
    }
    
    const { count, rows } = await Skill.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      skills: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get skill by ID
 * GET /api/skills/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const cacheKey = KEYS.skill(id);
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json({ skill: JSON.parse(cached), source: 'cache' });
    }
    
    const skill = await Skill.findByPk(id);
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    await redis.set(cacheKey, JSON.stringify(skill), 'EX', TTL.SKILL_CACHE);
    
    res.json({ skill, source: 'database' });
  } catch (error) {
    next(error);
  }
});

/**
 * Get skill categories
 * GET /api/skills/categories/list
 */
router.get('/categories/list', async (req, res, next) => {
  try {
    const categories = await Skill.findAll({
      attributes: ['category'],
      where: { isActive: true },
      group: ['category'],
      raw: true
    });
    
    res.json({ 
      categories: categories.map(c => c.category).filter(Boolean) 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get popular skills
 * GET /api/skills/popular/list
 */
router.get('/popular/list', async (req, res, next) => {
  try {
    const skills = await Skill.findAll({
      where: { isActive: true },
      order: [['usageCount', 'DESC'], ['downloadCount', 'DESC']],
      limit: 10,
      raw: true
    });
    
    res.json({ skills });
  } catch (error) {
    next(error);
  }
});

/**
 * Get signed download URL for skill package
 * GET /api/skills/:id/install
 */
router.get('/:id/install', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const skill = await Skill.findByPk(id);
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    if (!skill.isActive) {
      return res.status(400).json({ error: 'Skill is not available' });
    }
    
    const packagePath = getSkillPackagePath(id);
    
    if (!packagePath && !skill.packageUrl) {
      return res.status(404).json({ error: 'Skill package not found' });
    }
    
    const signedUrl = generateSignedUrl(id, 'package.zip', 300);
    
    res.json({
      success: true,
      skill: {
        id: skill.id,
        name: skill.name,
        version: skill.version || '1.0.0',
        category: skill.category,
        pricePerCall: skill.pricePerCall
      },
      download: {
        signedUrl: signedUrl.url,
        expiresIn: signedUrl.expiresIn,
        expiresAt: signedUrl.expiresAt
      },
      installation: {
        steps: [
          '下载 Skill 压缩包',
          '解压到 OpenClaw 的 skills 目录',
          '配置 API Key（已自动包含在下载中）',
          '重启 OpenClaw 即可使用'
        ],
        billingApi: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/billing/consume`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Download skill package with signed URL
 * GET /api/skills/:id/download
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token, expires } = req.query;
    
    if (!token || !expires) {
      return res.status(400).json({ error: 'Missing download token' });
    }
    
    const verification = verifySignedUrl(id, 'package.zip', token, parseInt(expires));
    
    if (!verification.valid) {
      return res.status(403).json({ error: verification.error });
    }
    
    const packagePath = getSkillPackagePath(id);
    
    if (!packagePath) {
      return res.status(404).json({ error: 'Package file not found' });
    }
    
    const skill = await Skill.findByPk(id);
    
    await skill.increment('downloadCount');
    
    res.download(packagePath, `${skill.name.replace(/\s+/g, '-')}-v${skill.version || '1.0.0'}.zip`);
  } catch (error) {
    next(error);
  }
});

/**
 * Track skill download
 * POST /api/skills/:id/download
 */
router.post('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const skill = await Skill.findByPk(id);
    
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    
    await skill.increment('downloadCount');
    
    res.json({ 
      success: true, 
      downloadCount: skill.downloadCount + 1 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
