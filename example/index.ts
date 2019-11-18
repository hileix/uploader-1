import { Webuploader, axiosAdapter } from '../src';

let startUploadIndex = 1;
let successUploadIndex = 1;

Webuploader.configure({
  requestAdapter: axiosAdapter
});

// @ts-ignore
const uploader = new Webuploader({
  dom: document.querySelector('#my-input') as HTMLInputElement,
  url: 'http://localhost:7001/uploadFile', // 上传文件的地址
  method: 'post', // 文件上传方式
  multiple: true, // 是否可以选择多个文件
  accept: ['audio/*'], // 接受的文件类型
  threads: 3,
  autoUpload: true,
  onBefore: (file: File, callback) => {
    const size = file.size / 1024 / 1024;
    // 小于 2M 的文件才能上传
    if (size < 2) {
      callback();
    } else {
      console.error('文件大小必须小于 2M！');
      callback('文件大小必须小于 2M！');
    }
  },
  onStart: file => {
    console.log(`开始上传第 ${startUploadIndex} 个文件`, file.name);
  },
  onSuccess: () => {
    console.log(`第 ${successUploadIndex}: 个文件上传成功！`);
  },
  onComplete: () => {
    console.log('所有文件都上传完了~');
  }
});

(document.querySelector('button') as any).addEventListener(
  'click',
  function() {},
  false
);
