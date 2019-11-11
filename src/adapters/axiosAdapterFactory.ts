import axios from 'axios';
import { RequestAdapterType } from '../uploader';

const axiosAdapterFactory = (options?: object): RequestAdapterType => {
  const _options = options;
  const axiosAdapter: RequestAdapterType = ({
    url,
    method,
    file,
    handleStart,
    handleSuccess,
    handleError,
    handleAfter
  }) => {
    handleStart(file);

    const formData = new FormData();
    formData.append(file.name, file);

    axios({
      url,
      method,
      data: formData,
      headers: {
        'content-type': 'multipart/form-data'
      },
      ..._options
    })
      .then(res => {
        // 上传成功
        handleSuccess(res);
        handleAfter(file);
      })
      .catch(err => {
        // 上传失败
        handleError(err);
        handleAfter(file);
      });
  };
  return axiosAdapter;
};

export default axiosAdapterFactory;
