
import axios from 'axios';
import { RequestAdapterParams } from '../uploader';

const axiosAdapter = ({ url, method, file, onSuccess, onError, onAfter }: RequestAdapterParams) => {
  const formData = new FormData();
  formData.append('test.mp3', file);

  axios({
    url, method,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then(res => {
    // 上传成功
    onSuccess && onSuccess(res);
    onAfter && onAfter();

  }).catch(err => {
    // 上传失败
    console.error('[upload error]:', err);
    onError && onError(err);
    onAfter && onAfter();
  });

}

export default axiosAdapter;
