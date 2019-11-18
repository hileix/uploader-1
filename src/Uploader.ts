import { throwError } from './utils';

/**
 * 上传的基类
 */
export default class Uploader {
  static configure = ({ requestAdapter }: configure) => {
    if (typeof requestAdapter !== 'function') {
      throwError('requestAdapter is a function.');
    }
    Uploader.requestAdapter = requestAdapter;
  };
  static requestAdapter: RequestAdapterType;

  constructor({
    url = '',
    method = 'post',
    autoUpload = true,
    threads = 1,
    ...restOption
  }: UploadOptions) {
    // 存储 options
    this.options = { url, method, autoUpload, threads, ...restOption };
    this.validateOptions(this.options);
  }

  public options: UploadOptions;
  public allFiles: Array<File> = []; // 所有的文件
  public waitingUploadFiles: Array<File> = []; // 等待上传的文件
  public uploadingFiles: Array<File> = []; // 正在上传的文件
  public uploadedFiles: Array<File> = []; // 上传成功的文件
  public errorUploadFiles: Array<File> = []; // 上传失败的文件
  public invalidFiles: Array<File> = []; // 无效的文件（未通过 onBefore 筛选的文件）
  public status: Status; // 状态

  public loopStart = (count: number) => {
    for (let i = 0; i < count; i++) {
      this.upload();
    }
  };

  /**
   * 验证 options
   */
  public validateOptions = (options: UploadOptions) => {
    const { url, requestAdapter } = options;
    if (
      typeof requestAdapter !== 'function' &&
      typeof Uploader.requestAdapter !== 'function'
    ) {
      throwError('There is no requestAdapter.');
    }
    if (!url) {
      throwError('url is required.');
    }
  };

  /**
   * 开始上传文件
   * 状态：等待上传的文件 -> 正在上传的文件
   */
  public handleStartUpload = () => {
    this.uploadingFiles.push(this.waitingUploadFiles.shift() as File);
    const { onStart } = this.options;
    return onStart;
  };

  /**
   * 上传一个文件成功
   * 状态：正在上传的文件 -> 上传成功的文件
   */
  public handleSuccessUpload = (file: File) => {
    const { onSuccess } = this.options;
    onSuccess && onSuccess(file);

    this.uploadedFiles.push(this.uploadingFiles.shift() as File);

    // 还有正在上传的文件
    if (this.waitingUploadFiles.length) {
      this.upload();
    }

    // 所有文件都上传完了
    if (!this.waitingUploadFiles.length && !this.uploadingFiles.length) {
      const { onComplete } = this.options;
      onComplete && onComplete([...this.uploadedFiles]);
    }
  };

  /**
   * 上传一个文件失败
   * 状态：正在上传的文件 -> 上传出错的文件
   */
  public handleErrorUpload = (error: Error) => {
    const file = this.uploadingFiles.shift();
    this.errorUploadFiles.push(file as File);

    const { onError } = this.options;
    onError && onError(error);
  };

  /**
   * 上传文件完成（成功或失败）
   */
  public handleAfterUpload = (file: File) => {
    const { onAfter } = this.options;
    onAfter && onAfter(file);
  };

  // 上传
  public upload() {
    const { onBefore } = this.options;
    const file = this.waitingUploadFiles[0];
    if (!file) {
      return console.warn(
        '[webuploader]: There are no files waiting to be uploaded!'
      );
    }

    onBefore
      ? onBefore(file, this.beforeUploadCallback)
      : this.beforeUploadCallback();
  }

  public beforeUploadCallback = (errorMessage?: string): void => {
    // 文件未通过筛选
    // 状态：等待上传的文件 -> 未通过筛选的文件
    if (errorMessage) {
      this.invalidFiles = this.invalidFiles.concat(
        this.waitingUploadFiles.shift() as File
      );
      return;
    }
    const { url, method, requestAdapter } = this.options;
    const file = this.waitingUploadFiles[0];

    uploadRequest(requestAdapter || Uploader.requestAdapter, {
      url,
      file,
      method: method as MethodType,
      handleStart: this.handleStartUpload,
      handleSuccess: this.handleSuccessUpload,
      handleError: this.handleErrorUpload,
      handleAfter: this.handleAfterUpload
    });
  };
}

// 上传
function uploadRequest(
  requestAdapter: RequestAdapterType,
  uploadParams: UploadParams
): void {
  requestAdapter(uploadParams);
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
  method: MethodType;
  /**
   * 开始上传的回调
   */
  handleStart: () => void;
  /**
   * 上传成功的回调
   */
  handleSuccess: (res: unknown) => void;
  /**
   * 上传失败的回调
   */
  handleError: (err: Error) => void;
  /**
   * 上传后的回调（成功或失败都会执行）
   */
  handleAfter: (file: File) => void;
}

export type MethodType = 'post' | 'get';

export interface UploadOptions {
  url: string; // 上传文件的地址
  method?: MethodType; // 文件上传方式
  accept?: Array<string>; // 接受的文件类型
  // chunked?: boolean; // 开启分片上传
  // chunkSize?: number; // 分片大小
  autoUpload?: boolean; // 是否选择文件后就自动开始上传，默认 true
  threads?: number; // 上传并发数
  /**
   * 上传前的回调，此回调用来验证是否可以进行上传
   */
  onBefore?: (file: File, callback: (errorMessage?: string) => void) => void;
  /**
   * 开始上传的回调
   */
  onStart?: (file: File) => void;
  /**
   * 上传成功的回调
   */
  onSuccess?: (file: File) => void;
  /**
   * 上传失败的回调
   */
  onError?: (error: Error) => void; // 上传失败的回调
  /**
   * 上传后的回调（成功或者失败）
   */
  onAfter?: (file: File) => void;
  /**
   * 所有文件上传完成的回调
   */
  onComplete?: (uploadedFiles: Array<File>) => void;
  /**
   * 请求适配器
   */
  requestAdapter?: RequestAdapterType;
}

export interface configure {
  requestAdapter: RequestAdapterType;
}

export type Status = 'uploading' | 'inactive';

// 请求适配器 类型
export type RequestAdapterType = (
  requestAdapterParams: RequestAdapterParams
) => void;

export interface RequestAdapterParams {
  url: string;
  method: MethodType;
  file: File;
  handleStart: (file: File) => void;
  handleSuccess: (res: unknown) => void;
  handleError: (err: Error) => void;
  handleAfter: (file: File) => void;
}
