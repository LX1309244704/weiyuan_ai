const express = require('express')
const router = express.Router()
const multer = require('multer')
const { AiModel } = require('../models')
const axios = require('axios')
const { decrypt } = require('../utils/encryption')

// 配置 multer (仅用于本路由)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
})

/**
 * POST /upload/image - 上传图片到 RunningHub
 * 使用 multer.single('file') 处理 multipart/form-data
 */
router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    
    const file = req.file
    
    // 获取 RunningHub API Key
    const model = await AiModel.findOne({
      where: { provider: 'runninghub', isActive: true }
    })
    
    
    if (!model || !model.apiKey) {
      return res.status(400).json({ error: 'RunningHub API Key not configured' })
    }
    
    // 解密 API Key
    const apiKey = decrypt(model.apiKey) || model.apiKey
    
    // 上传到 RunningHub - 使用 form-data 包
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('file', file.buffer, {
      filename: file.originalname || file.name,
      contentType: file.mimetype
    })
    
    
    let response
    try {
      response = await axios.post(
        'https://www.runninghub.cn/openapi/v2/media/upload/binary',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            ...formData.getHeaders()
          },
          timeout: 60000
        }
      )
    } catch (rhError) {
      throw rhError
    }
    
    
    // 检查成功响应
    if (response.data.code === 0 && response.data.data?.download_url) {
      return res.json({ url: response.data.data.download_url })
    }
    
    if (response.data.results && response.data.results[0]?.url) {
      return res.json({ url: response.data.results[0].url })
    }
    
    if (response.data.url) {
      return res.json({ url: response.data.url })
    }
    
    return res.status(500).json({ error: 'Upload failed', details: response.data })
  } catch (error) {
    return res.status(500).json({ error: error.message, details: error.stack })
  }
})

module.exports = router