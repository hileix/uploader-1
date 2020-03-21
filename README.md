# Web 端和 Node.js 端文件上传

## 安装
```shell
yarn add @hife/uploader
```

## 例子

```shell
# 1. 首先 clone 本仓库
git clone git@github.com:hifeteam/uploader.git

# 2. 进入项目安装依赖
cd uploader && yarn

# 3. 开启 node 服务，模拟后端接收请求；也可以修改 server/index.js，自行控制上传请求的响应数据
npm run server

# 4. 开启 storybook 开发环境，查看示例
npm start
```

## API
```typescript
import { Canceler } from 'axios';

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
   * 文件筛选函数，返回值为通过筛选的文件
   */
  filter?: FilterFunction;
  /**
   * 文件排序函数，返回值为排好序的文件
   */
  sort?: FilterFunction;
  /**
   * 文件数量改变、文件状态改变时的回调
   * allFileInfo：所有上传的文件信息
   * statusChangedFileInfo：状态发生的文件信息
   */
  onChange?: (
    allFileInfo: SimpleFileInfo[],
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
  onProgress?: (totalProgress: number, filesInfo: SimpleFileInfo[]) => void;
  /**
   * 请求适配器
   */
  requestAdapter?: RequestAdapterType;
}


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
```