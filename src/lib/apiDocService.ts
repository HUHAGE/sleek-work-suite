import axios from 'axios';

const API_KEY = 'sk-nceurnlivqmcahsesxnxyubgtiezhpklhgpwkjnbduedxgrl';
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

interface GenerateDocOptions {
  code: string;
  format: 'html' | 'word' | 'pdf' | 'markdown';
}

export async function generateApiDoc({ code, format }: GenerateDocOptions): Promise<string> {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "deepseek-ai/DeepSeek-R1-0528-Qwen3-8B",
        messages: [
          {
            role: "system",
            content: "你是一个专业的API文档生成器。请根据提供的代码生成详细、准确、专业的API文档。包含所有必要的细节，如接口地址、请求/响应格式、参数说明、请求头、示例等。使用markdown格式输出。"
          },
          {
            role: "user",
            content: `请为以下代码生成${format.toUpperCase()}格式的API文档：\n\n${code}`
          }
        ],
        temperature: 0.3,
        top_p: 0.8,
        presence_penalty: 0,
        frequency_penalty: 0,
        stream: false,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (response.data && response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error: any) {
    console.error('Error generating API documentation:', error);
    if (error.response) {
      // 输出详细的错误信息
      console.error('Error details:', error.response.data);
    }
    throw new Error(error.response?.data?.error?.message || 'Failed to generate API documentation');
  }
}

export async function convertToFormat(content: string, format: 'html' | 'word' | 'pdf' | 'markdown'): Promise<Blob> {
  switch (format) {
    case 'markdown':
      return new Blob([content], { type: 'text/markdown' });
    case 'html': {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>API Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1, h2, h3 { color: #333; }
              pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
              code { font-family: 'Courier New', monospace; }
              table { border-collapse: collapse; width: 100%; margin: 1em 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f4; }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `;
      return new Blob([htmlContent], { type: 'text/html' });
    }
    case 'word':
      // TODO: Implement Word conversion
      return new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    case 'pdf':
      // TODO: Implement PDF conversion
      return new Blob([content], { type: 'application/pdf' });
    default:
      throw new Error('Unsupported format');
  }
} 