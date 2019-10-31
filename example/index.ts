import Webuploader from '../src';

let startUploadIndex = 1;
let successUploadIndex = 1;

const webuploader = new Webuploader('#my-input', {
  url: 'http://localhost:7001/uploadFile', // 上传文件的地址
  method: 'POST', // 文件上传方式
  multiple: true, // 是否可以选择多个文件
  accept: ['image/*', 'audio/*'], // 接受的文件类型
  chunked: false, // 开启分片上传
  chunkSize: 5242880, // 分片大小
  threads: 3,
  autoUpload: false,
  startUpload: () => {
    console.log('startUpload:', startUploadIndex++)
  },
  successUpload: () => {
    console.log('successUpload:', successUploadIndex++)
  },
  uploadComplete: () => {
    console.log('所有文件都上传完了~');
  }
});

(document.querySelector('button') as any).addEventListener('click', function () {
  webuploader.start()
}, false)

// 开始上传
// webuploader.start()

// 取消上传
// webuploader.cancel()

