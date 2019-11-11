import { Webuploader, axiosAdapterFactory } from '../src';

let startUploadIndex = 1;
let successUploadIndex = 1;

Webuploader.configure({
  requestAdapter: axiosAdapterFactory({ method: 'get' })
});

// @ts-ignore
const uploader = new Webuploader({
  dom: document.querySelector('#my-input') as HTMLInputElement,
  url: 'http://localhost:7001/uploadFile', // 上传文件的地址
  method: 'post', // 文件上传方式
  multiple: true, // 是否可以选择多个文件
  accept: ['audio/*'], // 接受的文件类型
  chunked: false, // 开启分片上传
  chunkSize: 5242880, // 分片大小
  threads: 3,
  autoUpload: true,
  onBefore: (file: File, callback) => {
    const src = window.URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = src;

    // 声音长度不能长于 45s
    audio.addEventListener(
      'loadedmetadata',
      function() {
        const duration = audio.duration;
        if (typeof duration === 'number' && duration > 45) {
          callback('声音长度长于 45s，请重新选择！');
          console.error('声音长度长于 45s，请重新选择！');
        } else {
          callback();
        }
      },
      false
    );
  },
  onStart: () => {
    console.log('startUpload:', startUploadIndex++);
  },
  onSuccess: () => {
    console.log('successUpload:', successUploadIndex++);
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
