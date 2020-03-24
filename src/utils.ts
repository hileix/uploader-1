import BMF from '@hife/browser-md5-file';
import { Info, FileInfo, ChunkInfo, UploadOptions } from './interface';

let i = 0;

/**
 * throw error message
 * @param msg error message
 */
export function throwError(msg: string) {
  throw new Error(`[uploader]:${msg}`);
}

/**
 * 校验 options
 * @param options Webuploader 构造函数接受的 options
 */
export function validateOptions({ options }: any) {
  for (let key in options) {
    if (options.hasOwnProperty(key)) {
      const value = options[key];

      // url
      if (['url'].includes(key)) {
        if (typeof value !== 'string') {
          throwError(`options.${key} must be a 'string'`);
        }
      }

      // uploadChunkUrl
      if (['uploadChunkUrl'].includes(key)) {
        if (!['string', 'undefined'].includes(typeof value)) {
          throwError(`options.${key} must be a 'string'`);
        }
      }

      // method
      if (['method'].includes(key)) {
        if (!['get', 'post'].includes(value)) {
          throwError(`options.${key} must be 'get' or 'post'`);
        }
      }

      // accept
      if (['accept'].includes(key)) {
        if (!['string', 'undefined'].includes(typeof value)) {
          throwError(
            `options.${key} must be an 'array of strings', refer https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#attr-accept `
          );
        }
      }

      // maxSize maxCount chunkSize chunkThreshold retryCount chunkRetryCount threads
      if (
        [
          'maxSize',
          'maxCount',
          'chunkSize',
          'chunkThreshold',
          'retryCount',
          'chunkRetryCount',
          'threads'
        ].includes(key)
      ) {
        if (!['number', 'undefined'].includes(typeof value)) {
          throwError(`options.${key} must be 'number'`);
        }
      }

      // multiple autoUpload chunked
      if (['multiple', 'autoUpload', 'chunked'].includes(key)) {
        if (!['boolean', 'undefined'].includes(typeof value)) {
          throwError(`options.${key} must be 'boolean'`);
        }
      }

      // function
      if (
        [
          'filter',
          'sort',
          'onChange',
          'onBefore',
          'onStart',
          'onSuccess',
          'onError',
          'onRetry',
          'onAfter',
          'onChunkBefore',
          'onChunkStart',
          'onChunkSuccess',
          'onChunkError',
          'onChunkRetry',
          'onChunkAfter',
          'onChunkComplete',
          'onComplete',
          'onProgress',
          'requestAdapter'
        ].includes(key)
      ) {
        if (!['function', 'undefined'].includes(typeof value)) {
          throwError(`options.${key} must be 'function'`);
        }
      }
    }
  }
}

/**
 * 获取 id
 */
export const getId = () => {
  return `${new Date().getTime()}${i++}`;
};

export const log = {
  start: (msg: string) => {
    console.log(`%c ${msg}`, `color: blue;`);
  },
  success: (msg: string) => {
    console.log(`%c ${msg}`, `color: green;`);
  }
};

/**
 * 获取文件的 md5 值
 * @param {File} file 文件
 */
export const getFileMD5 = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    new BMF().md5(file, (err: any, md5: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(md5);
      }
    });
  });
};

/**
 * 通过 id 查找 filesInfo 中的 fileInfo（或chunkInfo）
 * @param id file id 或 chunk id
 * @param filesInfo 被查找的文件信息数组
 */
export function getInfoInFilesInfoById<
  T extends {
    [key: string]: any;
  }
>(id: string, filesInfo: T[]): T | undefined {
  let info: T | undefined;
  const iLen = filesInfo.length;
  for (let i = 0; i < iLen; i++) {
    const file = filesInfo[i];
    if (file.id === id) {
      info = file;
      break;
    } else {
      if (file.chunks) {
        const jLen = file.chunks.length;
        for (let j = 0; j < jLen; j++) {
          const chunk = file.chunks[j];
          if (chunk.id === id) {
            info = chunk;
            break;
          }
        }
      }
      if (info) {
        break;
      }
    }
  }
  return info;
}

/**
 * 通过 id 移除 fileInfo 数组（chunkInfo 数组）中的项
 * @param id file id 或 chunk id
 * @param infos fileInfo 数组 或 chunkInfo 数组
 */
export function removeInfoFromFilesInfoById<T extends { id: string }>(
  id: string,
  infos: T[]
): T | undefined {
  // 通过 id 找到 index，然后通过 index 删除
  const index = infos.findIndex(file => file.id === id);
  if (index === -1) {
    return;
  }
  const ret = infos.splice(index, 1);
  if (ret.length) {
    return ret[0];
  }
  return;
}
