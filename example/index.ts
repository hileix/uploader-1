import {  Webuploader } from '../src';

Webuploader.configure({ requestAdapter: () => console.log('12121') });


let startUploadIndex = 1;
let successUploadIndex = 1;

const uploader = new Webuploader({
  dom: document.querySelector('#my-input') as HTMLInputElement,
  url: 'http://localhost:7001/uploadFile', // 上传文件的地址
  method: 'post', // 文件上传方式
  multiple: true, // 是否可以选择多个文件
  accept: ['image/*', 'audio/*'], // 接受的文件类型
  chunked: false, // 开启分片上传
  chunkSize: 5242880, // 分片大小
  threads: 3,
  autoUpload: false,
  onStart: () => {
    console.log('startUpload:', startUploadIndex++)
  },
  onSuccess: () => {
    console.log('successUpload:', successUploadIndex++)
  },
  onComplete: () => {
    console.log('所有文件都上传完了~');
  },
});

(document.querySelector('button') as any).addEventListener('click', function () {
  uploader.start()
}, false)

// 开始上传
// webuploader.start()

// 取消上传
// webuploader.cancel()
