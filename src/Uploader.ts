import { throwError } from './utils';

/**
 * upload base class
 */
export default class Uploader {
  static configure = ({ requestAdapter }: configure) => {
    if (typeof requestAdapter !== 'function') {
      throwError('requestAdapter is a function.');
    }
    Uploader.requestAdapter = requestAdapter;
  };
  static requestAdapter: (requestAdapterParams: RequestAdapterParams) => void;

  constructor({
    url = '',
    method = 'post',
    autoUpload = true,
    threads = 1,
    accept,
    requestAdapter,
    ...restOption
  }: UploadOptions) {
    if (
      typeof requestAdapter !== 'function' &&
      typeof Uploader.requestAdapter !== 'function'
    ) {
      throwError(
        'Please configure Upload requestAdapter using upload.configure() method.'
      );
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
  public status: Status; // 状态

  public loopStart = (count: number) => {
    for (let i = 0; i < count; i++) {
      this.start();
    }
  };

  public handleBeforeUpload = (file: File) => {
    const { onBefore } = this.options;
    return onBefore;
  };

  public handleStartUpload = (file: File) => {
    this.uploadingFiles.push(this.waitingUploadFiles.shift() as File);
    const { onStart } = this.options;
    return onStart;
  };

  public handleSuccessUpload = (file: File) => {
    const { onSuccess } = this.options;

    this.uploadedFiles.push(this.uploadingFiles.shift() as File);

    // 还有正在上传的文件
    if (this.waitingUploadFiles.length) {
      this.start();
    }

    // 所有文件都上传完了
    if (!this.waitingUploadFiles.length && !this.uploadingFiles.length) {
      const { onComplete } = this.options;
      return onComplete;
    } else {
      return onSuccess;
    }
  };

  public handleErrorUpload = (error: Error) => {
    const file = this.uploadingFiles.shift();
    this.errorUploadFiles.push(file as File);

    const { onError } = this.options;
    return onError;
  };

  public handleAfterUpload = (file: File) => {
    const { onAfter } = this.options;
    return onAfter;
  };

  // start upload
  public start() {
    const { url, method, requestAdapter } = this.options;
    const file = this.waitingUploadFiles[0];
    if (!file) {
      return console.warn(
        '[webuploader]: There are no files waiting to be uploaded!'
      );
    }

    uploadRequest({
      url,
      file: file,
      method: method as methodType,
      onBeforeWrapper: this.handleBeforeUpload,
      onStartWrapper: this.handleStartUpload,
      onSuccessWrapper: this.handleSuccessUpload,
      onErrorWrapper: this.handleErrorUpload,
      onAfterWrapper: this.handleAfterUpload,
      requestAdapter: requestAdapter || Uploader.requestAdapter
    });
  }
}

// 上传
function uploadRequest({
  url,
  file,
  method,
  onBeforeWrapper,
  onStartWrapper,
  onSuccessWrapper,
  onErrorWrapper,
  onAfterWrapper,
  requestAdapter
}: UploadParams) {
  requestAdapter({
    url,
    file,
    method,
    onBeforeWrapper,
    onStartWrapper,
    onSuccessWrapper,
    onErrorWrapper,
    onAfterWrapper
  });
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
  method: methodType;
  /**
   * 上传之前的回调
   */
  onBeforeWrapper: (file: File) => OnBefore | undefined;
  /**
   * 开始上传的回调
   */
  onStartWrapper: (file: File) => void;
  /**
   * 上传成功的回调
   */
  onSuccessWrapper?: (res: any) => void;
  /**
   * 上传失败的回调
   */
  onErrorWrapper?: (err: Error) => void;
  /**
   * 上传后的回调（成功或失败都会执行）
   */
  onAfterWrapper?: (file: File) => void;
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
  onBefore?: (file: File) => void; // 上传前的回调
  onStart?: (file: File) => void; // 开始上传的回调
  onSuccess?: (file: File) => void; // 上传成功的回调
  onError?: (error: Error) => void; // 上传失败的回调
  onAfter?: (file: File) => void; // 上传后的回调（成功或者失败）
  onComplete?: () => void; // 所有文件上传完成的回调
  onProgress?: (file: File, percentage: number) => void; // 上传进度的回调
  requestAdapter?: (UploadParams: UploadParams) => void; // 请求适配器
}

export interface RequestAdapterParams {
  url: string;
  method: methodType;
  file: File;
  onBeforeWrapper: (file: File) => void;
  onStartWrapper: (file: File) => void;
  onSuccessWrapper?: (res: any) => void;
  onErrorWrapper?: (err: Error) => void;
  onAfterWrapper?: (file: File) => void;
}

export interface filesSourceAdapterParams {
  dom: HTMLInputElement;
  receiveFiles: (files: Array<File>) => void;
}

export interface configure {
  requestAdapter: (requestAdapterParams: RequestAdapterParams) => void;
}

export type CommonCallbackWrapper = <T>(file: File) => T | undefined;

export type OnBeforeWrapper = CommonCallbackWrapper;

export type OnStartWrapper = CommonCallbackWrapper;

export type OnSuccessWrapper = CommonCallbackWrapper;

export type OnErrorWrapper = CommonCallbackWrapper;

export type OnAfterWrapper = CommonCallbackWrapper;

export type OnBefore = (file: File) => any;

export type Status = 'uploading' | 'inactive';
