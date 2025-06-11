// 支持的文件扩展名和对应的类型名称
export const SUPPORTED_FILE_EXTENSIONS = {
  '.java': 'Java',
  '.js': 'JavaScript',
  '.html': 'HTML',
} as const;

export type FileType = typeof SUPPORTED_FILE_EXTENSIONS[keyof typeof SUPPORTED_FILE_EXTENSIONS]; 