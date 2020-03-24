import Uploader from './uploader';
import { throwError, getId, validateOptions } from './utils';
import { FileInfo, ExtendUploaderOptions, FilterFunction } from './interface';
import axiosAdapter from './adapters/axiosAdapter';

const getFilesInfo = (
  files: Array<File>,
  retryCount: number = 2
): Array<FileInfo> => {
  const ret: Array<FileInfo> = [];
  files.forEach((file, index) => {
    ret.push({
      type: 'file',
      id: getId(),
      file,
      index,
      retryCount,
      progress: 0,
      status: 'waiting',
      loaded: 0
    });
  });
  return ret;
};

const addChunksInfoTo = (
  filesInfo: Array<FileInfo>,
  chunkSize: number = 1,
  chunkThreshold: number = 0,
  chunkRetryCount: number = 2
) => {
  let thresholdSize: number = 0;
  if (typeof chunkThreshold === 'number') {
    thresholdSize = chunkThreshold * 1024 * 1024;
  }
  chunkSize = chunkSize * 1024 * 1024;

  filesInfo.forEach((fileInfo, index) => {
    const { file } = fileInfo;
    const fileSize = file.size;
    const len = Math.ceil(file.size / chunkSize);

    if (fileSize > thresholdSize) {
      if (!fileInfo.chunks) {
        fileInfo.chunks = [];
      }
      for (let i = 0; i < len; i++) {
        const nextIndex = i + 1;
        const getChunk = () => {
          if (i !== len - 1) {
            return file.slice(i * chunkSize, nextIndex * chunkSize);
          } else {
            return file.slice(i * chunkSize, file.size + 1);
          }
        };
        fileInfo.chunks.push({
          type: 'chunk',
          belongFile: fileInfo,
          id: getId(),
          chunk: getChunk(),
          index: i,
          retryCount: chunkRetryCount,
          status: 'waiting',
          loaded: 0
        });
      }
    }
  });
};

function Filesfilter(
  files: File[],
  {
    maxSize,
    maxCount,
    filter
  }: {
    maxSize?: number;
    maxCount?: number;
    filter?: FilterFunction | undefined;
  }
): {
  validFiles: File[];
  inValidFiles: File[];
} {
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
  private dom: HTMLInputElement;
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
      ...restOptions
    };

    validateOptions(this.options);

    if (!dom) {
      throwError('dom is invalid.');
      return;
    }

    if (!multiple) {
      dom.removeAttribute('multiple');
    } else {
      dom.setAttribute('multiple', '');
    }

    if (accept) {
      dom.setAttribute('accept', accept);
    }
    this.dom = dom;
    this.addEventListener();
  }

  private addEventListener() {
    this.dom.addEventListener('change', this.handleInputChange);
  }

  public removeEventListener() {
    this.dom.removeEventListener('change', this.handleInputChange);
  }

  private getLoopStartCount(filesInfo: Array<FileInfo>) {
    if (!filesInfo.length) {
      return 0;
    }
    const firstFileChunks = filesInfo[0].chunks;
    // 第一个文件存在分片，则第一个文件需要进行分片上传
    if (firstFileChunks) {
      return Math.min(this.options.threads as number, firstFileChunks.length);
    } else {
      // 第一个文件不需要进行分片上传
      const sum = filesInfo.reduce((sum, fileInfo) => {
        if (fileInfo.chunks) {
          return sum + fileInfo.chunks.length;
        }
        return sum + 1;
      }, 0);
      return Math.min(this.options.threads as number, sum);
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
    let { validFiles, inValidFiles } = Filesfilter(files, {
      maxCount,
      maxSize,
      filter
    });

    // sort
    if (sort) {
      validFiles = sort(validFiles);
    }

    this.invalidFiles.concat(getFilesInfo(inValidFiles, retryCount));

    const filesInfo: Array<FileInfo> = getFilesInfo(validFiles, retryCount);

    // 分片上传
    if (chunked) {
      addChunksInfoTo(filesInfo, chunkSize, chunkThreshold, chunkRetryCount);
    }

    this.allFiles = this.allFiles.concat(filesInfo);
    this.waitingUploadFiles = this.waitingUploadFiles.concat(filesInfo);

    onChange && onChange([...this.allFiles]);

    if (this.options.autoUpload) {
      const count = this.getLoopStartCount(this.waitingUploadFiles);
      console.log({ count });
      this.loopStart(count);
    }

    this.dom.value = '';
  };
}

Webuploader.configure({
  requestAdapter: axiosAdapter
});

export interface WebuploaderOptions extends ExtendUploaderOptions {
  dom: HTMLInputElement; // input dom
  multiple?: boolean; // 是否可以选择多个文件
}
