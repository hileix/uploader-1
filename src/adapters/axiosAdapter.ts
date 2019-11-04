
import axios from 'axios';
import { RequestAdapterParams } from '../uploader';

const axiosAdapter = ({ url, method, file, onStart, onSuccess, onError, onAfter }: RequestAdapterParams) => {
  onStart(file);

  const formData = new FormData();
  formData.append(file.name, file);

  axios({
    url, method,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => {
    // 上传成功
    onSuccess && onSuccess(res);
    onAfter && onAfter(file);

  }).catch(err => {
    // 上传失败
    console.error('[upload error]:', err);
    onError && onError(err);
    onAfter && onAfter(file);
  });

}

export default axiosAdapter;
