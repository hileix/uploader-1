import {
  throwError,
  getInfoInFilesInfoById,
  removeInfoFromFilesInfoById,
  getFileMD5,
} from './utils';
import {
  FileInfo,
  RequestAdapterType,
  MethodType,
  UploadOptions,
  ChunkInfo,
  RequestAdapterParams,
  Info,
  UploadType,
  ExtendUploaderOptions,
} from './interface';

const DEFAULT_THREADS = 1;

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
    let _uploadChunkUrl: string | undefined = restOption.uploadChunkUrl;
    if (!_uploadChunkUrl) {
      _uploadChunkUrl = url;
    }

    this.options = {
      url,
      method,
      autoUpload,
      threads,
      ...restOption,
      uploadChunkUrl: _uploadChunkUrl,
    };

    this.validateOptions(this.options);
  }

  protected options: ExtendUploaderOptions;
  protected allFiles: Array<FileInfo> = []; // 所有的文件
  protected waitingUploadFiles: Array<FileInfo> = []; // 等待上传的文件
  private uploadingFiles: Array<FileInfo> = []; // 正在上传的文件
  private uploadedFiles: Array<FileInfo> = []; // 上传成功的文件
  private errorUploadFiles: Array<FileInfo> = []; // 上传失败的文件
  protected invalidFiles: Array<FileInfo> = []; // 无效的文件（未通过 onBefore 筛选的文件）

  private allChunks: Array<ChunkInfo> = []; // 一个文件的所有的分片
  private waitingUploadChunks: Array<ChunkInfo> = []; // 一个文件中等待上传的分片
  private uploadingChunks: Array<ChunkInfo> = []; // 一个文件中正在上传的分片
  private uploadedChunks: Array<ChunkInfo> = []; // 一个文件中上传成功的分片
  private errorUploadChunks: Array<ChunkInfo> = []; // 一个文件中上传失败的分片
  public status: Status; // 状态
  public uploadingCount: number = 0; // 正在上传文件（分片）的数量

  // 剩余的上传线程数量
  get theRemainingThreads() {
    const { threads } = this.options;
    if (threads) {
      return threads - this.uploadingCount;
    }
    return DEFAULT_THREADS - this.uploadingCount;
  }

  get totalSize() {
    return this.allFiles.reduce((total, fileInfo) => {
      return total + fileInfo.file.size;
    }, 0);
  }

  /**
   * 获取文件统计信息
   */
  public getStats() {
    return {
      allFiles: this.allFiles,
      waitingUploadFiles: this.waitingUploadFiles,
      uploadingFiles: this.uploadingFiles,
      uploadedFiles: this.uploadedFiles,
      errorUploadFiles: this.errorUploadFiles,
      invalidFiles: this.invalidFiles,

      allChunks: this.allChunks,
      waitingUploadChunks: this.waitingUploadChunks,
      uploadingChunks: this.uploadingChunks,
      uploadedChunks: this.uploadedChunks,
      errorUploadChunks: this.errorUploadChunks,

      loadedSize: this.loadedSize,
      totalSize: this.totalSize,
    };
  }

  /**
   * 清除文件统计数据
   */
  public clearStats() {
    this.allFiles = [];
    this.waitingUploadFiles = [];
    this.uploadingFiles = [];
    this.uploadedFiles = [];
    this.errorUploadFiles = [];
    this.invalidFiles = [];

    this.allChunks = [];
    this.waitingUploadChunks = [];
    this.uploadingChunks = [];
    this.uploadedChunks = [];
    this.errorUploadChunks = [];

    this.loadedSize = 0;
    this.prevLoaded = 0;

    const { onChange } = this.options;
    onChange && onChange([]);

    return {
      allFiles: this.allFiles,
      waitingUploadFiles: this.waitingUploadFiles,
      uploadingFiles: this.uploadingFiles,
      uploadedFiles: this.uploadedFiles,
      errorUploadFiles: this.errorUploadFiles,
      invalidFiles: this.invalidFiles,

      allChunks: this.allChunks,
      waitingUploadChunks: this.waitingUploadChunks,
      uploadingChunks: this.uploadingChunks,
      uploadedChunks: this.uploadedChunks,
      errorUploadChunks: this.errorUploadChunks,

      loadedSize: this.loadedSize,
    };
  }

  /**
   * 将一个文件（分片）设置为成功上传的状态
   */
  public toSuccessful(id: string) {
    const info = getInfoInFilesInfoById(id, this.allFiles);

    if (!info) {
      throw new Error(
        'The id passed in when the toSuccessful method is called does not exist'
      );
    }

    let uploadType: UploadType = info.type;

    // 开始
    this.handleStartUpload(uploadType, info);

    // 进度（使 loaded 和 total 相等进行模拟文件/分片完全上传成功）
    this.handleProgressChange(uploadType, { loaded: 1, total: 1 }, info);

    // 成功
    this.handleSuccessUpload(uploadType, info);
  }

  /**
   * 通过 id 移除一个文件
   * @return {boolean} true 移除成功 | false 移除失败
   */
  public remove(id: string): boolean {
    if (!id || typeof id !== 'string') {
      throw new Error('uploader.remove(id: string): The id must be a string.');
    }

    const info = getInfoInFilesInfoById(id, this.allFiles);

    // 要移除的文件不存在
    if (!info) {
      return false;
    }
    // 取消上传
    info.cancel && info.cancel('@hife/uploader:Cancel the upload');
    let isRemove = false;
    [
      this.allFiles,
      this.waitingUploadFiles,
      this.uploadingFiles,
      this.uploadedFiles,
      this.errorUploadFiles,
      this.invalidFiles,
    ].forEach((arr) => {
      const ret = !!removeInfoFromFilesInfoById(id, arr);
      if (!isRemove && ret) {
        isRemove = true;
      }
    });

    if (isRemove) {
      this.loadedSize -= info.file.size;
      const { onChange } = this.options;
      onChange && onChange([...this.allFiles]);
      return true;
    }
    return false;
  }

  public start() {}

  public pause() {}

  /**
   * 文件（分片）重试上传
   */
  public retry(id: string): boolean {
    const info = getInfoInFilesInfoById(id, this.allFiles);
    if (!info) {
      throw new Error('The retry upload file does not exist');
    }
    const { onRetry, onChunkRetry, onChange } = this.options;
    const uploadType = info.type;

    if (info.retryCount === 0) {
      info.retryCount = this.options.retryCount || 2;
    }

    info.retryCount--;

    if (uploadType === 'file') {
      // 不按照队列出队的顺序删除 uploadingFiles 中的元素是避免后传的文件（分片）的响应先回来
      // 通过 id 删除，100% 确定删除正确
      const fileInfo = removeInfoFromFilesInfoById(
        info.id,
        this.uploadingFiles
      );
      if (!fileInfo) {
        throw new Error(
          `Unable to find files with id ${info.id} in uploadingFiles`
        );
      }
      fileInfo.status = 'waiting';
      onChange && onChange([...this.allFiles], { ...fileInfo });
      this.waitingUploadFiles.unshift(fileInfo);
      onRetry && onRetry(fileInfo);
    } else {
      // 不按照队列出队的顺序删除 uploadingFiles 中的元素是避免后传的文件（分片）的响应先回来
      // 通过 id 删除，100% 确定删除正确
      const chunkInfo = removeInfoFromFilesInfoById(
        info.id,
        this.uploadingChunks
      );
      if (!chunkInfo) {
        throw new Error(
          `Unable to find files with id ${info.id} in uploadingFiles`
        );
      }
      chunkInfo.status = 'waiting';
      this.waitingUploadChunks.unshift(chunkInfo);
      onChunkRetry && onChunkRetry(chunkInfo);
    }

    if (this.theRemainingThreads > 0) {
      this.loopStart(this.theRemainingThreads);
    }

    return true;
  }

  /**
   * 同时上传多个文件（分片）
   */
  public loopStart = (count: number) => {
    for (let i = 0; i < count; i++) {
      const fileInfo: FileInfo = this.waitingUploadFiles[0];
      // 分片上传（上传文件的非第一片时）
      if (this.waitingUploadChunks.length) {
        this.upload('chunk');
      } else if (fileInfo.chunks) {
        // 分片上传（上传文件的第一片时）
        if (!this.waitingUploadChunks.length) {
          this.waitingUploadChunks = [
            ...(this.waitingUploadFiles[0].chunks as Array<ChunkInfo>),
          ];
          this.allChunks = [...this.waitingUploadChunks];
        }
        this.upload('chunk');
      } else {
        this.upload('file');
      }
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
   * 开始上传文件（分片）
   * 状态：等待上传的文件（分片） -> 正在上传的文件（分片）
   */
  public handleStartUpload = (uploadType: UploadType, info: Info) => {
    this.uploadingCount++;
    if (uploadType === 'file') {
      const fileInfo = this.waitingUploadFiles.shift();
      if (fileInfo) {
        const { onStart, onChange } = this.options;
        this.uploadingFiles.push(fileInfo);
        fileInfo.status = 'uploading';
        onChange && onChange([...this.allFiles], { ...fileInfo });

        onStart && onStart(info as FileInfo);
      }
    } else {
      const { onChunkStart, onStart } = this.options;
      if (!this.uploadingFiles.length) {
        const fileInfo = this.waitingUploadFiles.shift();
        if (fileInfo) {
          this.uploadingFiles.push(fileInfo);
          fileInfo.status = 'uploading';
        }
      }

      // 开始上传第一片分片时，也触发 onStart 回调
      if (this.allChunks.length === this.waitingUploadChunks.length) {
        onStart &&
          onStart((this.waitingUploadChunks as ChunkInfo[])[0].belongFile);
      }

      const chunkInfo = this.waitingUploadChunks.shift();
      if (chunkInfo) {
        this.uploadingChunks.push(chunkInfo);
        chunkInfo.status = 'uploading';
      }

      onChunkStart && onChunkStart(info as ChunkInfo);
    }
  };

  /**
   * 上传一个文件（分片）成功
   * 状态：正在上传的文件 -> 上传成功的文件
   */
  public handleSuccessUpload = (
    uploadType: UploadType,
    info: Info,
    res?: unknown
  ) => {
    if (this.uploadingCount) {
      this.uploadingCount--;
    }
    if (uploadType === 'file') {
      const _info = info as FileInfo;
      const { onSuccess, onChange } = this.options;
      onSuccess && onSuccess(info as FileInfo, res);

      // 不按照队列出队的顺序删除 uploadingFiles 中的元素是避免后传的文件（分片）的响应先回来
      // 通过 id 删除，100% 确定删除正确
      const fileInfo = removeInfoFromFilesInfoById(
        _info.id,
        this.uploadingFiles
      );
      if (!fileInfo) {
        throw new Error(
          `Unable to find files with id ${_info.id} in uploadingFiles`
        );
      }
      fileInfo.status = 'uploaded';
      onChange && onChange([...this.allFiles], { ...fileInfo });

      this.uploadedFiles.push(fileInfo);

      // 还有正在上传的文件
      if (this.waitingUploadFiles.length) {
        if (this.theRemainingThreads > 0) {
          this.loopStart(this.theRemainingThreads);
        }
      } else {
        // 所有文件都上传完了
        if (!this.uploadingFiles.length) {
          const { onComplete } = this.options;
          onComplete && onComplete([...this.uploadedFiles]);
        }
      }
    } else {
      const _info = info as ChunkInfo;
      const { onChunkSuccess } = this.options;
      onChunkSuccess && onChunkSuccess(info as ChunkInfo, res);

      // 不按照队列出队的顺序删除 uploadingFiles 中的元素是避免后传的文件（分片）的响应先回来
      // 通过 id 删除，100% 确定删除正确
      const chunkInfo = removeInfoFromFilesInfoById(
        _info.id,
        this.uploadingChunks
      );
      if (!chunkInfo) {
        throw new Error(
          `Unable to find chunks with id ${_info.id} in uploadingChunks`
        );
      }
      chunkInfo.status = 'uploaded';
      this.uploadedChunks.push(chunkInfo);

      // 还有等待上传的分片
      if (this.waitingUploadChunks.length) {
        if (this.theRemainingThreads > 0) {
          this.loopStart(
            Math.min(this.theRemainingThreads, this.waitingUploadChunks.length)
          );
        }
      } else {
        // 一个文件的所有分片都上传完了
        if (!this.waitingUploadChunks.length && !this.uploadingChunks.length) {
          this.uploadingCount = 0;
          this.allChunks = [];
          const { onChunkComplete } = this.options;
          const uploadedFile = this.uploadedChunks[0].belongFile;

          onChunkComplete &&
            onChunkComplete(uploadedFile, this.chunkCompleteCallback);

          // 当一个文件所有的分片都上传完成了，就重置 this.uploadedChunks 的状态
          this.uploadedChunks = [];
        }
      }
    }
  };

  chunkCompleteCallback = ({
    errorMessage,
    fileInfo,
    res,
    isRetry = true,
  }: {
    errorMessage?: string;
    fileInfo: FileInfo;
    res: unknown;
    isRetry?: boolean;
  }) => {
    if (errorMessage) {
      if (isRetry) {
        this.loadedSize -= fileInfo.loaded;
        fileInfo.loaded = 0;

        fileInfo.retryCount = this.options.retryCount || 2;
      } else {
        fileInfo.retryCount = 0;
      }
      // 出错
      this.handleErrorUpload('file', fileInfo, new Error(errorMessage));
    } else {
      // 成功
      this.handleSuccessUpload('file', fileInfo, res);
    }
  };

  /**
   * 上传一个文件（分片）失败
   * 状态：正在上传的文件 -> 上传出错的文件
   */
  public handleErrorUpload = (
    uploadType: UploadType,
    info: Info,
    error: Error
  ) => {
    this.loadedSize -= info.loaded;

    this.uploadingCount--;
    // 还有剩余的重试次数
    if (info.retryCount) {
      this.retry(info.id);
      return;
    }
    // 没有剩余次数了
    if (uploadType === 'file') {
      // 不按照队列出队的顺序删除 uploadingFiles 中的元素是避免后传的文件（分片）的响应先回来
      // 通过 id 删除，100% 确定删除正确
      const fileInfo = removeInfoFromFilesInfoById(
        info.id,
        this.uploadingFiles
      );
      if (!fileInfo) {
        throw new Error(
          `Unable to find files with id ${info.id} in uploadingFiles`
        );
      }
      const { onError, onChange } = this.options;

      fileInfo.status = 'error';
      onChange && onChange([...this.allFiles], { ...fileInfo });
      this.errorUploadFiles.push(fileInfo);

      if (info.loaded) {
        this.loadedSize += info.loaded;
      } else {
        this.loadedSize += info.file.size;
      }

      fileInfo.progress = 100;

      onChange && onChange([...this.allFiles], { ...fileInfo });
      onError && onError(error, info);
    } else {
      // 不按照队列出队的顺序删除 uploadingFiles 中的元素是避免后传的文件（分片）的响应先回来
      // 通过 id 删除，100% 确定删除正确
      const chunkInfo = removeInfoFromFilesInfoById(
        info.id,
        this.uploadingChunks
      );
      if (!chunkInfo) {
        throw new Error(
          `Unable to find chunks with id ${info.id} in uploadingChunks`
        );
      }
      const { onError, onChange } = this.options;
      chunkInfo.status = 'error';
      onChange && onChange([...this.allFiles], { ...chunkInfo.belongFile });
      this.errorUploadChunks.push(chunkInfo);

      // 文件的一个分片出错，整个文件就上传出错，所以需要删除 uploadingFiles 中的文件信息
      // 不按照队列出队的顺序删除 uploadingFiles 中的元素是避免后传的文件（分片）的响应先回来
      // 通过 id 删除，100% 确定删除正确
      const fileInfo = removeInfoFromFilesInfoById(
        chunkInfo.belongFile.id,
        this.uploadingFiles
      );
      if (!fileInfo) {
        throw new Error(
          `Unable to find files with id ${info.id} in uploadingFiles`
        );
      }
      fileInfo.status = 'error';

      this.allChunks = [];
      this.waitingUploadChunks = [];
      this.uploadingChunks = [];
      this.errorUploadChunks = [];

      this.errorUploadFiles.push(fileInfo);
      this.loadedSize += chunkInfo.belongFile.file.size;
      fileInfo.progress = 100;

      onChange && onChange([...this.allFiles], { ...fileInfo });
      onError && onError(error, info);
    }

    // 还有正在上传的文件
    if (this.waitingUploadFiles.length) {
      if (this.theRemainingThreads > 0) {
        this.loopStart(this.theRemainingThreads);
      }
    } else {
      // 所有文件都上传完了
      if (!this.uploadingFiles.length) {
        const { onComplete } = this.options;
        onComplete && onComplete([...this.uploadedFiles]);
      }
    }

    const { onProgress } = this.options;

    const progress = (this.loadedSize / this.totalSize) * 100;

    onProgress && onProgress(progress, [...this.allFiles]);
  };

  /**
   * 上传文件（分片）完成（成功或失败）
   */
  public handleAfterUpload = (uploadType: UploadType, info: Info) => {
    if (uploadType === 'file') {
      const { onAfter } = this.options;
      onAfter && onAfter(info as FileInfo);
    } else {
      const { onChunkAfter } = this.options;
      onChunkAfter && onChunkAfter(info as ChunkInfo);
    }
  };

  // 已加载的 size
  loadedSize: number = 0;

  // 上次 onProgress 事件所加载的数据量
  prevLoaded: number = 0;

  /**
   * 通过 onProgress 事件的 progressEvent 事件对象，得到 loaded 和 total，再算出所有文件的 size，从而求出 progress
   * 这里有个问题：onProgress 事件中 total 和 file.size 的值并不会相等（size 会有细微的差距），如何处理呢？
   * 解决办法：
   * 1. 在 loaded 与 total 不相等时，使用 loaded 作为已加载的数据量进行计算（误差很小），并且使用一个 prevLoaded 记录每次的 loaded 的值
   * 2. 在 loaded 与 total 相等时，先减去 prevLoaded 的值，再加上实际文件（分片）的 size 的值即可
   */
  public handleProgressChange = (
    uploadType: UploadType,
    progressEvent: any,
    info: Info
  ) => {
    const { loaded, total } = progressEvent;
    // loaded 与 total 相等时，表示文件（分片）上传进度为 100%
    if (loaded === total) {
      let infoSize: number = 0;
      if (uploadType === 'file') {
        const _info = info as FileInfo;
        infoSize = _info.file.size;
        _info.loaded = infoSize;
        // 单个文件的进度为 100
        _info.progress = 100;
      } else {
        const _info = info as ChunkInfo;
        infoSize = _info.chunk.size;
        _info.loaded = infoSize;

        // 单个文件的进度通过分片的索引和 size 进行计算
        const count = _info.index + 1;

        _info.belongFile.progress =
          count === (_info.belongFile.chunks as ChunkInfo[]).length
            ? 100
            : ((infoSize * count) / _info.belongFile.file.size) * 100;
      }
      this.loadedSize = this.loadedSize - this.prevLoaded + infoSize;
      this.prevLoaded = 0;
    } else {
      // 上传进度还未达到 100%
      this.loadedSize = this.loadedSize - this.prevLoaded + loaded;
      this.prevLoaded = loaded;
      info.loaded = loaded;

      if (uploadType === 'file') {
        const _info = info as FileInfo;
        _info.progress = (loaded / total) * 100;
      } else {
        const _info = info as ChunkInfo;
        const count = _info.index;
        const loadedSize = count * _info.chunk.size + loaded;
        const totalSize = _info.belongFile.file.size;

        _info.belongFile.progress = (loadedSize / totalSize) * 100;
      }
    }
    const { onProgress } = this.options;
    const progress = (this.loadedSize / this.totalSize) * 100;

    onProgress && onProgress(progress, [...this.allFiles]);
  };

  // 上传
  public upload(uploadType: UploadType) {
    const { onBefore, onChunkBefore } = this.options;
    let fileInfo: FileInfo | undefined, chunkInfo: ChunkInfo | undefined;
    if (uploadType === 'file') {
      fileInfo = this.waitingUploadFiles[0];
      if (!fileInfo) {
        return console.warn(
          `[webuploader]: There are no files waiting to be uploaded!`
        );
      }
      const md5Promise = new Promise((resolve, reject) => {
        if (!this.options.md5 || (fileInfo as FileInfo).md5) {
          resolve(true);
        } else {
          getFileMD5((fileInfo as FileInfo).file)
            .then((md5) => {
              (fileInfo as FileInfo).md5 = md5;
              resolve(true);
            })
            .catch((err) => {
              console.error(err);
            });
        }
      });
      md5Promise.then((result) => {
        onBefore
          ? onBefore(fileInfo as FileInfo, this.beforeUploadCallback)
          : this.beforeUploadCallback();
      });
    } else {
      chunkInfo = this.waitingUploadChunks[0];
      if (!chunkInfo) {
        return console.warn(
          `[webuploader]: There are no chunks waiting to be uploaded!`
        );
      }
      const md5Promise = new Promise((resolve, reject) => {
        if (!this.options.chunkMD5 || (chunkInfo as ChunkInfo).md5) {
          resolve(true);
        } else {
          getFileMD5((chunkInfo as ChunkInfo).chunk)
            .then((md5) => {
              (chunkInfo as ChunkInfo).md5 = md5;
              resolve(true);
            })
            .catch((err) => {
              console.error(err);
            });
        }
      });
      md5Promise.then((result) => {
        onChunkBefore
          ? onChunkBefore(
              chunkInfo as ChunkInfo,
              this.beforeChunkUploadCallback
            )
          : this.beforeChunkUploadCallback();
      });
    }
  }

  public beforeUploadCallback = (errorMessage?: string): void => {
    const uploadType = 'file';
    // 文件未通过筛选
    // 状态：等待上传的文件 -> 未通过筛选的文件
    if (errorMessage) {
      const fileInfo = this.waitingUploadFiles.shift();
      if (fileInfo) {
        fileInfo.status = 'invalid';
        this.invalidFiles.push(fileInfo);
      }
      return;
    }
    const { url, method, requestAdapter } = this.options;

    const fileInfo: FileInfo = this.waitingUploadFiles[0];

    const onStart = (info: Info): void => {
      this.handleStartUpload(uploadType, info);
    };

    const onSuccess = (info: Info, res: unknown): void => {
      this.handleSuccessUpload(uploadType, info, res);
    };

    const onError = (error: Error, info: Info) => {
      this.handleErrorUpload(uploadType, info, error);
    };

    const onAfter = (info: Info) => {
      this.handleAfterUpload(uploadType, info);
    };

    const onProgress = (progressEvent: any, info: Info) => {
      this.handleProgressChange(uploadType, progressEvent, info);
    };

    const onSuccessVerify = (
      info: Info,
      res: unknown,
      callback: (errorMessage?: string) => void
    ) => {
      const { onSuccessVerify } = this.options;
      onSuccessVerify && onSuccessVerify(info as FileInfo, res, callback);
    };

    uploadRequest(requestAdapter || Uploader.requestAdapter, {
      url,
      fileInfo,
      chunkInfo: null,
      uploadType,
      method: method as MethodType,
      onStart,
      onSuccess,
      onError,
      onAfter,
      onProgress,
      onSuccessVerify,
    });
  };

  /**
   * 分片上传前的回调，可进行分片的校验
   * 参数：
   * 当 errorMessage 存在时，表示出错
   * 当 isSuccessful 存在时，表示
   */
  public beforeChunkUploadCallback = (errorMessage?: string): void => {
    const uploadType = 'chunk';
    // 文件未通过筛选
    // 状态：等待上传的文件 -> 未通过筛选的文件
    if (errorMessage) {
      this.invalidFiles = this.invalidFiles.concat(
        this.waitingUploadFiles.shift() as FileInfo
      );
      return;
    }

    const { url, uploadChunkUrl, method, requestAdapter } = this.options;

    const _chunkInfo = this.waitingUploadChunks[0];

    const onStart = (info: Info): void => {
      this.handleStartUpload(uploadType, info);
    };

    const onSuccess = (info: Info, res: unknown): void => {
      this.handleSuccessUpload(uploadType, info, res);
    };

    const onError = (error: Error, info: Info) => {
      this.handleErrorUpload(uploadType, info, error);
    };

    const onAfter = (info: Info) => {
      this.handleAfterUpload(uploadType, info);
    };

    const onProgress = (progressEvent: any, info: Info) => {
      this.handleProgressChange(uploadType, progressEvent, info);
    };

    const onSuccessVerify = (
      info: Info,
      res: unknown,
      callback: (errorMessage?: string) => void
    ) => {
      const { onChunkSuccessVerify } = this.options;
      onChunkSuccessVerify &&
        onChunkSuccessVerify(info as ChunkInfo, res, callback);
    };

    uploadRequest(requestAdapter || Uploader.requestAdapter, {
      url: uploadChunkUrl || url,
      fileInfo: null,
      chunkInfo: _chunkInfo,
      uploadType,
      method: method as MethodType,
      onStart,
      onSuccess,
      onError,
      onAfter,
      onProgress,
      onSuccessVerify,
    });
  };
}

// 上传
function uploadRequest(
  requestAdapter: RequestAdapterType,
  uploadParams: RequestAdapterParams
): void {
  requestAdapter(uploadParams);
}

export interface configure {
  requestAdapter: RequestAdapterType;
}

export type Status = 'uploading' | 'inactive';
