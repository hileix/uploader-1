import { Canceler } from 'axios';

export type MethodType = 'post' | 'get';

// 文件（分片）上传的状态：'等待上传' | '正在上传' | '完成上传' | '出错' | '无效'
export type UploadStatus =
  | 'waiting'
  | 'uploading'
  | 'uploaded'
  | 'error'
  | 'invalid';

export interface FileInfo {
  [key: string]: any;
  id: string;
  type: 'file';
  file: File;
  chunks?: Array<ChunkInfo>;
  index: number;
  md5?: string;
  retryCount: number; // 剩余重试次数
  progress: number; // 上传进度
  status: UploadStatus;
  cancel?: Canceler;
  loaded: number;
}

export interface ChunkInfo {
  [key: string]: any;
  id: string;
  type: 'chunk';
  belongFile: FileInfo;
  chunk: Blob;
  md5?: string;
  index: number;
  retryCount: number; // 剩余重试次数
  status: UploadStatus;
  cancel?: Canceler;
  loaded: number;
}

export type Info = FileInfo | ChunkInfo;

export interface SimpleFileInfo extends Omit<FileInfo, 'file' | 'chunks'> {
  chunks?: SimpleChunkInfo[];
  name: string;
  size: number;
}

export interface SimpleChunkInfo
  extends Omit<ChunkInfo, 'chunk' | 'belongFile'> {
  belongFileId: string;
  belongFileName: string;
  belongFileSize: number;
  size: number;
}

export type SimpleInfo = SimpleFileInfo | SimpleChunkInfo;

export interface FilterFunction {
  (files: File[]): File[];
}

export interface UploadOptions {
  multiple?: boolean; // 是否可以选择多个文件
  url: string; // 上传文件的地址
  uploadChunkUrl?: string; // 上传分片的地址（若不指定，则使用 url 作为分片上传的地址）
  method?: MethodType; // 文件上传方式
  /**
   * 接受的文件类型
   * 值参照：https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-accept
   */
  accept?: string;
  maxSize?: number; // 文件的最大大小，单位：B
  maxCount?: number; // 文件的最大数量
  chunked?: boolean; // 开启分片上传
  chunkSize?: number; // 分片大小
  chunkThreshold?: number; // 开启分片上传的阈值（文件大小小于该值的时候，不进行分片上传；没有提供值时且开启分片上传时，则所有文件都进行分片上传）
  autoUpload?: boolean; // 是否选择文件后就自动开始上传，默认 true
  threads?: number; // 上传并发数
  retryCount?: number; // 上传文件出错时自动重试的次数，默认两次
  chunkRetryCount?: number; // 上传分片出错时自动重试次数的次数，默认两次
  /**
   * 文件筛选
   */
  filter?: FilterFunction;
  /**
   * 文件排序
   */
  sort?: FilterFunction;
  /**
   * 1. 文件数量改变时的回调
   * 2. 文件状态改变时的回调
   */
  onChange?: (
    allFileInfo: SimpleFileInfo[],
    statusChangedFileInfo?: FileInfo
  ) => void;
  /**
   * 上传前的回调，此回调用来验证是否可以进行上传
   */
  onBefore?: (
    fileInfo: FileInfo,
    callback: (errorMessage?: string) => void
  ) => void;
  /**
   * 开始上传的回调
   */
  onStart?: (fileInfo: FileInfo) => void;
  /**
   * 上传成功的回调
   */
  onSuccess?: (fileInfo: FileInfo, res?: unknown) => void;
  /**
   * 上传失败的回调
   */
  onError?: (error: Error) => void;
  /**
   * 文件上传失败时重试的回调
   */
  onRetry?: (fileInfo: FileInfo, res?: unknown) => void;
  /**
   * 上传后的回调（成功或者失败）
   */
  onAfter?: (fileInfo: FileInfo) => void;
  /**
   * 上传分片前的回调，此回调用来验证是否可以进行上传
   */
  onChunkBefore?: (
    chunkInfo: ChunkInfo,
    callback: (errorMessage?: string) => void
  ) => void;
  /**
   * 开始上传分片的回调
   */
  onChunkStart?: (chunkInfo: ChunkInfo) => void;
  /**
   * 上传分片成功的回调
   */
  onChunkSuccess?: (chunkInfo: ChunkInfo, res: unknown) => void;
  /**
   * 上传分片失败的回调
   */
  onChunkError?: (error: Error) => void;
  /**
   * 分片上传失败时重试的回调
   */
  onChunkRetry?: (chunkInfo: ChunkInfo, res?: unknown) => void;
  /**
   * 上传分片后的回调（成功或者失败）
   */
  onChunkAfter?: (chunkInfo: ChunkInfo) => void;
  /**
   * 一个文件的所有分片都上传完成的回调
   */
  onChunkComplete?: (
    uploadedFile: FileInfo,
    callback: (callbackParams: {
      // errorMessage 存在时，说明出错了
      errorMessage?: string;
      fileInfo: FileInfo;
      res: unknown;
    }) => void
  ) => void;
  /**
   * 所有文件上传完成的回调
   */
  onComplete?: (uploadedFiles: Array<FileInfo>) => void;
  /**
   * 上传进度改变的回调
   */
  onProgress?: (totalProgress: number, filesInfo: SimpleFileInfo[]) => void;
  /**
   * 请求适配器
   */
  requestAdapter?: RequestAdapterType;
}

// 请求适配器 类型
export type RequestAdapterType = (
  requestAdapterParams: RequestAdapterParams
) => void;

export type UploadType = 'file' | 'chunk';

export interface RequestAdapterParams {
  url: string;
  uploadType: UploadType;
  fileInfo: FileInfo | null;
  chunkInfo: ChunkInfo | null;
  method: MethodType;
  // 开始上传文件（分片）的回调
  onStart: (info: Info) => void;
  // 上传文件（分片）成功的回调
  onSuccess: (info: Info, res: unknown) => void;
  // 上传文件（分片）失败的回调
  onError: (err: Error, info: Info) => void;
  // 上传文件（分片）后的回调（成功或失败都会执行）
  onAfter: (info: Info) => void;
  // 上传进度变化时的回调
  onProgress: (progressEvent: any, info: Info) => void;
}

export interface ExtendUploaderOptions extends UploadOptions {
  uploadChunkUrl: string;
}
