import request from './request';

export interface OptionsInterface {
  url: string; // 上传文件的地址
  method?: 'POST' | 'GET'; // 文件上传方式
  multiple?: boolean; // 是否可以选择多个文件
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
}

let i: number = 0;

export default class Webuploader {
  constructor(
    selector: string,
    {
      url = '',
      method = 'POST',
      multiple = false,
      autoUpload = true,
      threads = 1,
      accept,
      ...restOption
    }: OptionsInterface
  ) {

    if (!selector) {
      throw new Error('selector is required!');
    }

    if (!url) {
      throw new Error('url is required!');
    }

    this.input = document.querySelector(selector);

    if (!this.input) {
      throw new Error('selector is invalid!');
    }

    if (multiple) {
      this.input.setAttribute('multiple', '');
    }

    if (Array.isArray(accept) && accept.length) {
      this.input.setAttribute('accept', `${accept.join(',')}`);
    }

    // 监听事件
    this.addEventListener();

    // 存储 options
    this.options = { url, method, multiple, autoUpload, threads, accept, ...restOption };
  }

  public input: HTMLInputElement | null;
  public options: OptionsInterface;
  public allFiles: Array<File> = []; // 所有的文件
  public waitingUploadFiles: Array<File> = []; // 等待上传的文件
  public uploadingFiles: Array<File> = []; // 正在上传的文件
  public uploadedFiles: Array<File> = []; // 上传成功的文件
  public errorUploadFiles: Array<File> = []; // 上传失败的文件

  private addEventListener() {
    // onChange 事件
    (this.input as HTMLInputElement).addEventListener(
      'change',
      this.handleInputChange
    );
  }

  private loopStart = (count: number) => {
    for (let i = 0; i < count; i++) {
      this.start();
    }
  }

  private handleInputChange = (e: Event) => {
    const files: Array<File> = Array.from((e.target as any).files);
    this.allFiles = this.allFiles.concat(files);
    this.waitingUploadFiles = this.waitingUploadFiles.concat(files);

    if (this.options.autoUpload) {
      this.loopStart(this.options.threads as number)
    }
  };

  private handleBeforeUpload = () => {
    const { beforeUpload } = this.options;
    beforeUpload && beforeUpload();
  }
  private handleStartUpload = () => {
    this.uploadingFiles.push(this.waitingUploadFiles.shift() as File);

    const { startUpload } = this.options;
    startUpload && startUpload();
  }
  private handleSuccessUpload = () => {
    const { successUpload } = this.options;
    successUpload && successUpload();

    this.uploadedFiles.push(this.uploadingFiles.shift() as File);

    // 还有正在上传的文件
    if (this.waitingUploadFiles.length) {
      this.loopStart(1);
    }

    // 所有文件都上传完了
    if (!this.waitingUploadFiles.length && !this.uploadingFiles.length) {
      const { uploadComplete } = this.options;
      uploadComplete && uploadComplete();
    }

  }
  private handleErrorUpload = () => {
    const file = this.uploadingFiles.shift();
    this.errorUploadFiles.push(file as File);

    const { errorUpload } = this.options;
    errorUpload && errorUpload();
  }
  private handleAfterUpload = () => {
    const { afterUpload } = this.options;
    afterUpload && afterUpload();
  }

  // 开始上传
  public start() {
    const { url, } = this.options;
    const file = this.waitingUploadFiles[0];
    if (!file) {
      return console.warn('[webuploader]: NO waiting upload files!');
    }
    uploadRequest({
      url,
      file: file,
      fileName: getFileName(i),
      beforeUpload: this.handleBeforeUpload,
      startUpload: this.handleStartUpload,
      successUpload: this.handleSuccessUpload,
      errorUpload: this.handleErrorUpload,
      afterUpload: this.handleAfterUpload
    });
  }
}

// 上传
function uploadRequest({
  url,
  file,
  fileName,
  beforeUpload,
  startUpload,
  successUpload,
  errorUpload,
  afterUpload
}: uploadParams) {
  const formData = new FormData();
  formData.append(fileName, file);

  // 上传前
  beforeUpload && beforeUpload();

  request.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => {
    // 上传成功
    successUpload && successUpload(res);
    afterUpload && afterUpload();

  }).catch(err => {
    // 上传失败
    console.error('[upload error]:', err);
    errorUpload && errorUpload(err);
    afterUpload && afterUpload();
  });

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

export interface uploadParams {
  /**
   * 上传的地址
   */
  url: string;
  /**
   * 上传的文件
   */
  file: File;
  /**
   * 文件名称
   */
  fileName: string;
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
}
