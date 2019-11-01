import { throwError } from './utils';


let i: number = 0;
export interface configure {
  requestAdapter: (requestAdapterParams: RequestAdapterParams) => void;
}

/**
 * upload base class
 */
export default class Uploader {
  static configure = ({ requestAdapter }: configure) => {
    if (typeof requestAdapter !== 'function') {
      throwError('requestAdapter is a function.');
    }
    Uploader.requestAdapter = requestAdapter;
  }
  static requestAdapter: (requestAdapterParams: RequestAdapterParams) => void;

  constructor(
    {
      url = '',
      method = 'post',
      autoUpload = true,
      threads = 1,
      accept,
      ...restOption
    }: UploadOptions
  ) {
    if (typeof Uploader.requestAdapter !== 'function') {
      throwError('Please configure Upload requestAdapter using upload.configure() method.')
    }
    if (!url) {
      throwError('url is required.');
    }

    // 存储 options
    this.options = { url, method, autoUpload, threads, accept, ...restOption };
  }

  public options: UploadOptions;
  public allFiles: Array<File> = []; // 所有的文件
  public waitingUploadFiles: Array<File> = []; // 等待上传的文件
  public uploadingFiles: Array<File> = []; // 正在上传的文件
  public uploadedFiles: Array<File> = []; // 上传成功的文件
  public errorUploadFiles: Array<File> = []; // 上传失败的文件

  public loopStart = (count: number) => {
    for (let i = 0; i < count; i++) {
      this.start();
    }
  }

  public handleBeforeUpload = () => {
    const { beforeUpload } = this.options;
    beforeUpload && beforeUpload();
  }
  public handleStartUpload = () => {
    this.uploadingFiles.push(this.waitingUploadFiles.shift() as File);

    const { startUpload } = this.options;
    startUpload && startUpload();
  }
  public handleSuccessUpload = () => {
    const { successUpload } = this.options;
    successUpload && successUpload();

    this.uploadedFiles.push(this.uploadingFiles.shift() as File);

    // 还有正在上传的文件
    if (this.waitingUploadFiles.length) {
      this.start();
    }

    // 所有文件都上传完了
    if (!this.waitingUploadFiles.length && !this.uploadingFiles.length) {
      const { uploadComplete } = this.options;
      uploadComplete && uploadComplete();
    }

  }
  public handleErrorUpload = () => {
    const file = this.uploadingFiles.shift();
    this.errorUploadFiles.push(file as File);

    const { errorUpload } = this.options;
    errorUpload && errorUpload();
  }
  public handleAfterUpload = () => {
    const { afterUpload } = this.options;
    afterUpload && afterUpload();
  }

  // start upload
  public start() {
    const { url, method } = this.options;
    const file = this.waitingUploadFiles[0];
    if (!file) {
      return console.warn('[webuploader]: There are no files waiting to be uploaded!');
    }

    uploadRequest({
      url,
      file: file,
      method: method as methodType,
      beforeUpload: this.handleBeforeUpload,
      startUpload: this.handleStartUpload,
      successUpload: this.handleSuccessUpload,
      errorUpload: this.handleErrorUpload,
      afterUpload: this.handleAfterUpload,
      requestAdapter: Uploader.requestAdapter
    });
  }
}

// 上传
function uploadRequest({
  url,
  file,
  method,
  beforeUpload,
  startUpload,
  successUpload,
  errorUpload,
  afterUpload,
  requestAdapter
}: UploadParams) {
  // 上传前
  beforeUpload && beforeUpload();

  requestAdapter({ url, file, method, successUpload, errorUpload, afterUpload });

  // 开始上传
  startUpload && startUpload();
}

/**
 * 获取 fileName
 * @param i 索引
 */
function getFileName(i: number): string {
  return String(new Date().getTime()) + String(i);
}

export interface UploadParams {
  /**
   * 上传的地址
   */
  url: string;
  /**
   * 上传的文件
   */
  file: File;
  /**
   * 上传方式
   */
  method: methodType,
  /**
   * 上传之前的回调
   */
  beforeUpload?: () => void;
  /**
   * 开始上传的回调
   */
  startUpload?: () => void;
  /**
   * 上传成功的回调
   */
  successUpload?: (res: any) => void;
  /**
   * 上传失败的回调
   */
  errorUpload?: (err: Error) => void;
  /**
   * 上传后的回调（成功或失败都会执行）
   */
  afterUpload?: () => void;
  /**
   * 请求适配器
   */
  requestAdapter: (requestAdapterParams: RequestAdapterParams) => void;
}


export type methodType = 'post' | 'get';

export interface UploadOptions {
  url: string; // 上传文件的地址
  method?: methodType; // 文件上传方式
  accept?: Array<string>; // 接受的文件类型
  chunked?: boolean; // 开启分片上传
  chunkSize?: number; // 分片大小
  autoUpload?: boolean; // 是否选择文件后就自动开始上传，默认 true
  threads?: number; // 上传并发数
  beforeUpload?: () => void; // 上传前的回调
  startUpload?: () => void; // 开始上传的回调
  successUpload?: () => void; // 上传成功的回调
  errorUpload?: () => void; // 上传失败的回调
  afterUpload?: () => void; // 上传后的回调（成功或者失败）
  uploadComplete?: () => void; // 所有文件上传完成的回调
  uploadProgress?: (file: File, percentage: number) => void; // 上传进度的回调
  requestAdapter?: (UploadParams: UploadParams) => void; // 请求适配器
}


export interface RequestAdapterParams {
  url: string;
  method: methodType;
  file: File,
  successUpload?: (res: any) => void;
  errorUpload?: (err: Error) => void;
  afterUpload?: () => void;
}

export interface filesSourceAdapterParams {
  dom: HTMLInputElement,
  receiveFiles: (files: Array<File>) => void;
}
