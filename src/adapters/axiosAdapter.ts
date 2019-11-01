
import axios from 'axios';
import { RequestAdapterParams } from '../uploader';

const axiosAdapter = ({ url, method, file, successUpload, errorUpload, afterUpload }: RequestAdapterParams) => {
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
    successUpload && successUpload(res);
    afterUpload && afterUpload();

  }).catch(err => {
    // 上传失败
    console.error('[upload error]:', err);
    errorUpload && errorUpload(err);
    afterUpload && afterUpload();
  });

}

export default axiosAdapter;
