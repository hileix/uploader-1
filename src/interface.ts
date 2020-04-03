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
  id: string; // 文件 id
  type: 'file'; // 类型，'file' 表示属于文件
  file: File; // 文件
  chunks?: Array<ChunkInfo>; // 文件的分片
  index: number; // 索引
  md5?: string; // 文件 md5 值
  retryCount: number; // 剩余重试次数
  progress: number; // 上传进度
  status: UploadStatus; // 上传状态
  cancel?: Canceler; // 取消 ajax 请求的函数
  loaded: number; // 已上传的数据量，单位：B
}

export interface ChunkInfo {
  [key: string]: any;
  id: string; // 分片 id
  type: 'chunk'; // 类型，'chunk' 表示属于分片
  belongFile: FileInfo; // 分片所属文件的信息
  chunk: Blob; // 分片
  md5?: string; // 分片的 md5 值
  index: number; // 索引
  retryCount: number; // 剩余重试次数
  status: UploadStatus; // 上传状态
  cancel?: Canceler; // 取消 ajax 请求的函数
  loaded: number; // 已上传的数据量，单位：B
}

export type Info = FileInfo | ChunkInfo;

export interface FilterFunction {
  (files: File[]): File[];
}

export interface UploadOptions {
  /**
   * 是否可以选择多个文件
   * 默认值：false
   */
  multiple?: boolean;
  /**
   * 上传文件的地址
   */
  url: string;
  /**
   * 上传分片的地址（若不指定，则使用 url 作为分片上传的地址）
   */
  uploadChunkUrl?: string;
  /**
   * 文件上传方式
   * 默认值：'post'
   */
  method?: MethodType;
  /**
   * 接受的文件类型
   * 默认值：'*\/*'
   * 值参照：https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-accept
   */
  accept?: string;
  /**
   * 文件的最大大小，单位：B
   */
  maxSize?: number;
  /**
   * 文件的最大数量
   */
  maxCount?: number;
  /**
   * 是否开启分片上传
   * 默认值：false
   */
  chunked?: boolean;
  /**
   * 分片大小，单位：MB
   * 默认值：1
   */
  chunkSize?: number;
  /**
   * 开启分片上传的阈值，单位：MB（文件大小小于该值的时候，不进行分片上传；没有提供值时且开启分片上传时，则所有文件都进行分片上传）
   * 默认值：0
   */
  chunkThreshold?: number;
  /**
   * 是否选择文件后就自动开始上传
   * 默认值：true
   */
  autoUpload?: boolean;
  /**
   * 上传并发数
   * 默认值：1
   */
  threads?: number;
  /**
   * 上传文件出错时自动重试的次数
   * 默认值：2
   */
  retryCount?: number;
  /**
   * 上传分片出错时自动重试次数的次数
   * 默认值：2
   */
  chunkRetryCount?: number;
  /**
   * 文件是否需要 md5 序列化
   * 默认值：false
   */
  md5?: boolean;
  /**
   * 分片是否需要 md5 序列化
   * 默认值：false
   */
  chunkMD5?: boolean;
  /**
   * 文件筛选函数，返回值为通过筛选的文件
   */
  filter?: FilterFunction;
  /**
   * 文件排序函数，返回值为排好序的文件
   */
  sort?: FilterFunction;
  /**
   * 校验完文件（maxSize/maxCount）的回调
   */
  onVerified?: OnVerifiedFn;
  /**
   * 文件数量改变、文件状态改变时的回调
   * allFileInfo：所有上传的文件信息
   * statusChangedFileInfo：状态发生的文件信息
   */
  onChange?: (
    allFileInfo: FileInfo[],
    statusChangedFileInfo?: FileInfo
  ) => void;
  /**
   * 上传前的回调，此回调用来对文件进行 md5 序列化、验证等操作
   * fileInfo：文件信息
   * callback：回调函数。当传入 errorMessage 参数，表示有错误，该文件不进行上传；否则进行上传
   */
  onBefore?: (
    fileInfo: FileInfo,
    callback: (errorMessage?: string) => void
  ) => void;
  /**
   * 开始上传的回调
   * fileInfo：文件信息
   */
  onStart?: (fileInfo: FileInfo) => void;
  /**
   * 文件是否上传成功的验证回调（可使用此回调对服务端返回的数据进行验证，看是否真的上传成功了）
   * fileInfo：文件信息
   * res：服务端响应的数据
   * callback：回调函数。当传入 errorMessage 参数，表示有错误，该文件上传是否；否则文件上传成功
   */
  onSuccessVerify?: (
    fileInfo: FileInfo,
    res: unknown,
    callback: (errorMesssage?: string) => void
  ) => void;
  /**
   * 上传成功的回调
   * fileInfo：文件信息
   * res：服务端响应的数据
   */
  onSuccess?: (fileInfo: FileInfo, res?: unknown) => void;
  /**
   * 上传失败的回调
   * error：错误信息
   */
  onError?: (error: Error) => void;
  /**
   * 文件上传失败时重试的回调
   * fileInfo：文件信息
   * res：服务端响应的数据
   */
  onRetry?: (fileInfo: FileInfo, res?: unknown) => void;
  /**
   * 上传后的回调（成功或者失败）
   * fileInfo：上传后的文件信息
   */
  onAfter?: (fileInfo: FileInfo) => void;
  /**
   * 上传分片前的回调，此回调用来验证是否可以进行上传
   * chunkInfo：分片信息
   * callback：回调函数。当传入 errorMessage 参数，表示有错误，该文件不进行上传；否则进行上传
   */
  onChunkBefore?: (
    chunkInfo: ChunkInfo,
    callback: (errorMessage?: string) => void
  ) => void;
  /**
   * 开始上传分片的回调
   * chunkInfo：分片信息
   */
  onChunkStart?: (chunkInfo: ChunkInfo) => void;
  /**
   * 分片是否上传成功的验证回调（可使用此回调对后端返回的数据进行验证，看是否真的上传成功了）
   * chunkInfo：分片信息
   * res：服务端响应的数据
   * callback：回调函数。当传入 errorMessage 参数，表示有错误，该分片上传是否；否则分片上传成功
   */
  onChunkSuccessVerify?: (
    chunkInfo: ChunkInfo,
    res: unknown,
    callback: (errorMesssage?: string) => void
  ) => void;
  /**
   * 上传分片成功的回调
   * chunkInfo：分片信息
   * res：服务端响应的数据
   */
  onChunkSuccess?: (chunkInfo: ChunkInfo, res: unknown) => void;
  /**
   * 上传分片失败的回调
   * error：错误信息
   */
  onChunkError?: (error: Error) => void;
  /**
   * 分片上传失败时重试的回调
   * chunkInfo：分片信息
   * res：服务端响应的数据
   */
  onChunkRetry?: (chunkInfo: ChunkInfo, res?: unknown) => void;
  /**
   * 上传分片后的回调（成功或者失败）
   * chunkInfo：分片信息
   */
  onChunkAfter?: (chunkInfo: ChunkInfo) => void;
  /**
   * 一个文件的所有分片都上传完成的回调
   * uploadedFileInfo：文件信息
   * callback：回调。当传入 errorMessage 参数，表示有错误，该文件上传失败；否则表示上传成功
   */
  onChunkComplete?: (
    uploadedFileInfo: FileInfo,
    callback: (callbackParams: {
      // errorMessage 存在时，说明出错了
      errorMessage?: string;
      fileInfo: FileInfo;
      res: unknown;
    }) => void
  ) => void;
  /**
   * 所有文件上传完成的回调
   * uploadedFiles：已上传成功的文件信息
   */
  onComplete?: (uploadedFiles: Array<FileInfo>) => void;
  /**
   * 上传进度改变的回调
   * totalProgress：总进度
   * filesInfo：所有的文件信息
   */
  onProgress?: (totalProgress: number, filesInfo: FileInfo[]) => void;
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
  // 是否上传成功的验证回调
  onSuccessVerify?: (
    info: Info,
    res: unknown,
    callback: (errorMessage?: string) => void
  ) => void;
}

export interface ExtendUploaderOptions extends UploadOptions {
  uploadChunkUrl?: string;
}

// verifiedParams：校验后的参数。当 verifiedParams 为 undefined 时，表示校验没有问题
export type OnVerifiedFn = (verifiedParams?: {
  // 验证未通过的类型：
  // 'MAX_SIZE' 表示有文件未通过 maxSize 的验证
  // 'MAX_COUNT' 表示有文件未通过 maxCount 的验证
  // 'ACCEPT' 表示有文件未通过 accept 的验证（在 firefox 中 accept 有 bug）
  type: 'MAX_SIZE' | 'MAX_COUNT' | 'ACCEPT';
  files: File[]; // 未通过验证的文件信息
}) => void;
