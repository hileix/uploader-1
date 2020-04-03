import axios, { AxiosRequestConfig } from 'axios';
import { RequestAdapterType, Info, ChunkInfo, FileInfo } from '../interface';
const CancelToken = axios.CancelToken;

const axiosAdapterFactory = (
  options?: AxiosRequestConfig
): RequestAdapterType => {
  const _options = options;

  const axiosAdapter: RequestAdapterType = ({
    url,
    method,
    fileInfo,
    chunkInfo,
    uploadType,
    onStart,
    onSuccess,
    onError,
    onAfter,
    onProgress,
    onSuccessVerify
  }) => {
    let file: File | null, chunk: Blob | null;
    let formData: FormData = new FormData();
    let info: Info;

    if (uploadType === 'file' && fileInfo) {
      file = fileInfo.file;
      info = fileInfo;
      formData.append(file.name, file);
    } else {
      chunk = (chunkInfo as ChunkInfo).chunk;
      info = chunkInfo as ChunkInfo;
      formData.append(
        (chunkInfo as ChunkInfo).belongFile.file.name +
          (chunkInfo as ChunkInfo).index,
        chunk
      );
    }

    onStart(info);

    let headers: any = {
      'content-type': 'multipart/form-data'
    };
    if (_options && _options.headers) {
      headers = {
        ...headers,
        ..._options.headers
      };
      delete _options.headers;
    }

    axios({
      url,
      method,
      data: formData,
      headers,
      onUploadProgress: (progressEvent: any) => {
        let info: Info;
        if (uploadType === 'file') {
          info = fileInfo as FileInfo;
        } else {
          info = chunkInfo as ChunkInfo;
        }
        onProgress(progressEvent, info);
      },
      cancelToken: new CancelToken(function executor(c) {
        info.cancel = c;
      }),
      ..._options
    })
      .then(res => {
        const successVerifyCallback = (errorMessage?: string) => {
          if (errorMessage) {
            throw new Error(errorMessage);
          }
          // 上传成功
          onSuccess(info, res);
          onAfter(info);
        };

        onSuccessVerify
          ? onSuccessVerify(info, res, successVerifyCallback)
          : successVerifyCallback();
      })
      .catch(err => {
        // 取消上传导致报错
        if (
          info.cancel &&
          err.__CANCEL__ &&
          err.message === '@hife/uploader:Cancel the upload'
        ) {
          onAfter(info);
        } else {
          // 上传失败
          onError(err, info);
          onAfter(info);
        }
      });
  };
  return axiosAdapter;
};

export default axiosAdapterFactory;
