import Uploader from './uploader';
import {
  throwError,
  validateOptions,
  Files2FilesInfo,
  addChunksInfo
} from './utils';
import { FileInfo, ExtendUploaderOptions, FilterFunction } from './interface';
import axiosAdapter from './adapters/axiosAdapter';

/**
 * 文件筛选：通过筛选存入 validFiles，未通过筛选的存入 inValidFiles
 * @param files File 数组
 * @param filterParams 过滤参数
 *
 * @param filterParams.maxSize 最大的尺寸，单位：B。可选
 * @param filterParams.maxCount 最大的数量。可选
 * @param filterParams.filter 过滤函数，(files: File[]): File[]。可选
 */
function getFilteredFiles(
  files: File[],
  filterParams: {
    maxSize?: number;
    maxCount?: number;
    filter?: FilterFunction | undefined;
  }
): {
  validFiles: File[];
  inValidFiles: File[];
} {
  const { maxSize, maxCount, filter } = filterParams;
  let validFiles: File[] = [...files];
  const inValidFiles: File[] = [];

  // maxCount 筛选
  if (typeof maxCount === 'number' && maxCount < validFiles.length) {
    validFiles.splice(maxCount, validFiles.length - maxCount);
  }

  // maxSize 筛选
  if (typeof maxSize === 'number') {
    validFiles = validFiles.filter(file => {
      if (file.size <= maxSize) {
        return true;
      } else {
        inValidFiles.push(file);
        return false;
      }
    });
  }

  // filter 函数筛选
  if (filter) {
    validFiles = filter(validFiles);
    if (!Array.isArray(validFiles)) {
      throw new Error('The filter function must return an array of files');
    }
  }

  return { validFiles, inValidFiles };
}

/**
 * web clinet upload class
 */
export default class Webuploader extends Uploader {
  private inputDOMs: HTMLInputElement[] = [];
  public options: WebuploaderOptions;
  constructor({
    dom,
    method = 'post',
    multiple = false,
    accept = '*/*',
    threads = 1,
    autoUpload = true,
    chunked = false,
    ...restOptions
  }: WebuploaderOptions) {
    super({ method, accept, threads, autoUpload, chunked, ...restOptions });
    this.options = {
      dom,
      method,
      accept,
      threads,
      autoUpload,
      chunked,
      multiple,
      ...restOptions
    };

    validateOptions(this.options);

    if (!dom) {
      throwError('dom is invalid.');
      return;
    }
    this.dealNewInputDOMs(dom);
  }

  public addInputDOM(dom: HTMLInputElement | HTMLInputElement[]) {
    if (!dom) {
      throwError('dom is invalid.');
      return;
    }
    this.dealNewInputDOMs(dom);
  }

  private dealNewInputDOMs(dom: HTMLInputElement | HTMLInputElement[]) {
    // 数据结构统一成数组
    const inputDOMs = this.getNewInputDOMs(dom);

    // 更新 this.inputDOMs
    this.inputDOMs = [...this.inputDOMs, ...inputDOMs];

    // 处理新 inputDOMs 的 attribute
    this.dealDOMAttribute(inputDOMs);

    // 监听新 inputDOMs 的 change 事件
    this.addEventListener(inputDOMs);
  }

  // 统一处理成数组
  private getNewInputDOMs(dom: HTMLInputElement | HTMLInputElement[]) {
    let ret: HTMLInputElement[] = [];
    if (Array.isArray(dom)) {
      return [...dom];
    } else {
      ret = [dom];
    }
    return ret;
  }

  private dealDOMAttribute(doms: HTMLInputElement[]) {
    const { multiple, accept } = this.options;
    // multiple
    if (!multiple) {
      doms.forEach(item => {
        item.removeAttribute('multiple');
      });
    } else {
      doms.forEach(item => {
        item.setAttribute('multiple', '');
      });
    }

    // accept
    if (accept) {
      doms.forEach(item => {
        item.setAttribute('accept', accept);
      });
    }
  }

  /**
   * 对传入的 dom 进行 chang 事件的监听
   * @param dom input dom
   */
  private addEventListener(dom: HTMLInputElement | HTMLInputElement[]) {
    if (Array.isArray(dom)) {
      dom.forEach(item => {
        item.addEventListener('change', this.handleInputChange);
      });
    } else {
      dom.addEventListener('change', this.handleInputChange);
    }
  }

  public removeEventListener() {
    this.inputDOMs.forEach(item => {
      item.removeEventListener('change', this.handleInputChange);
    });
  }

  removeInputDOMsValue = () => {
    this.inputDOMs.forEach(inputDOM => {
      inputDOM.value = '';
    });
  };

  private getLoopStartCount(filesInfo: Array<FileInfo>) {
    if (!filesInfo.length) {
      return 0;
    }
    const firstFileChunks = filesInfo[0].chunks;
    // 第一个文件存在分片，则第一个文件需要进行分片上传
    if (firstFileChunks) {
      return Math.min(
        this.options.threads as number,
        firstFileChunks.length,
        this.theRemainingThreads
      );
    } else {
      // 第一个文件不需要进行分片上传
      const sum = filesInfo.reduce((sum, fileInfo) => {
        if (fileInfo.chunks) {
          return sum + fileInfo.chunks.length;
        }
        return sum + 1;
      }, 0);
      return Math.min(
        this.options.threads as number,
        sum,
        this.theRemainingThreads
      );
    }
  }

  private handleInputChange = (e: Event) => {
    const {
      chunked,
      chunkSize,
      chunkThreshold,
      chunkRetryCount,
      onChange,
      maxSize,
      maxCount,
      filter,
      retryCount,
      sort
    } = this.options;
    const files: Array<File> = Array.from((e.target as any).files);

    // filter
    let { validFiles, inValidFiles } = getFilteredFiles(files, {
      maxCount,
      maxSize,
      filter
    });

    console.log({ validFiles });

    // sort
    if (sort) {
      validFiles = sort(validFiles);
    }

    this.invalidFiles.concat(Files2FilesInfo(inValidFiles, retryCount));

    const filesInfo: Array<FileInfo> = Files2FilesInfo(validFiles, retryCount);

    // 分片上传
    if (chunked) {
      addChunksInfo(filesInfo, chunkSize, chunkThreshold, chunkRetryCount);
    }

    this.allFiles = this.allFiles.concat(filesInfo);
    this.waitingUploadFiles = this.waitingUploadFiles.concat(filesInfo);

    onChange && onChange([...this.allFiles]);

    if (this.options.autoUpload) {
      const count = this.getLoopStartCount(this.waitingUploadFiles);
      this.loopStart(count);
    }

    this.removeInputDOMsValue();
  };
}

Webuploader.configure({
  requestAdapter: axiosAdapter
});

export interface WebuploaderOptions extends ExtendUploaderOptions {
  dom: HTMLInputElement | HTMLInputElement[]; // input dom
  multiple?: boolean; // 是否可以选择多个文件
}
