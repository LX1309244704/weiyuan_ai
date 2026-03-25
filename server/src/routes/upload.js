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
    console.log('[Upload] Looking for RunningHub model...')
    const model = await AiModel.findOne({
      where: { provider: 'runninghub', isActive: true }
    })
    
    console.log('[Upload] Found model:', model ? 'yes' : 'no', model ? ', has apiKey: ' + !!model.apiKey : '')
    
    if (!model || !model.apiKey) {
      return res.status(400).json({ error: 'RunningHub API Key not configured' })
    }
    
    // 解密 API Key
    const apiKey = decrypt(model.apiKey) || model.apiKey
    console.log('[Upload] API Key decrypted, length:', apiKey?.length)
    
    // 上传到 RunningHub - 使用 form-data 包
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('file', file.buffer, {
      filename: file.originalname || file.name,
      contentType: file.mimetype
    })
    
    console.log('[Upload] Uploading to RunningHub, file:', file.originalname)
    
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
      console.log('[Upload] RunningHub response:', JSON.stringify(response.data))
    } catch (rhError) {
      console.error('[Upload] RunningHub error:', rhError.message)
      console.error('[Upload] RunningHub response data:', rhError.response?.data)
      console.error('[Upload] RunningHub status:', rhError.response?.status)
      throw rhError
    }
    
    console.log('[Upload] Response data:', JSON.stringify(response.data))
    
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
    console.error('[Upload] Error:', error.message)
    console.error('[Upload] Stack:', error.stack)
    return res.status(500).json({ error: error.message, details: error.stack })
  }
})

module.exports = router