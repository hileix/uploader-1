import axios from 'axios';
import { RequestAdapterType, Info, ChunkInfo, FileInfo } from '../interface';
const CancelToken = axios.CancelToken;

const axiosAdapterFactory = (options?: object): RequestAdapterType => {
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
    onProgress
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

    axios({
      url,
      method,
      data: formData,
      headers: {
        'content-type': 'multipart/form-data'
      },
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
        // 上传成功
        onSuccess(info, res);
        onAfter(info);
      })
      .catch(err => {
        console.log('ccc');

        // 上传失败
        onError(err, info);
        onAfter(info);
      });
  };
  return axiosAdapter;
};

export default axiosAdapterFactory;
