/**
 * 上传图片到 RunningHub
 * @param {File} file - 要上传的文件
 * @param {string} apiKey - RunningHub API Key
 * @returns {Promise<string>} - 返回上传后的 URL
 */
export async function uploadToRunningHub(file, apiKey) {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('https://www.runninghub.cn/openapi/v2/media/upload/binary', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upload failed: ${response.status} - ${errorText}`)
  }
  
  const result = await response.json()
  
  if (result.results && result.results[0]?.url) {
    return result.results[0].url
  }
  
  if (result.url) {
    return result.url
  }
  
  throw new Error('Invalid response format: ' + JSON.stringify(result))
}

/**
 * 将 base64 转换为 File 对象
 * @param {string} base64 - base64 数据
 * @param {string} filename - 文件名
 * @returns {File}
 */
export function base64ToFile(base64, filename = 'image.png') {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('Invalid base64 data')
  }
  
  const arr = base64.split(',')
  if (arr.length < 2) {
    throw new Error('Invalid base64 format')
  }
  
  const mimeMatch = arr[0].match(/:(.*?);/)
  if (!mimeMatch || !mimeMatch[1]) {
    throw new Error('Invalid base64 mime type')
  }
  
  const mime = mimeMatch[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  
  return new File([u8arr], filename, { type: mime })
}