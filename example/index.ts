import { Webuploader } from '../src';


let startUploadIndex = 1;
let successUploadIndex = 1;

const onBefore = (file: File) => {
  const src = window.URL.createObjectURL(file);
  const audio = new Audio();
  audio.src = src;
  return new Promise((resolve, reject) => {
    audio.addEventListener(
      'loadedmetadata',
      function() {
        const duration = audio.duration;
        if (typeof duration === 'number' && duration > 45) {
          resolve(false);
        } else {
          resolve(true);
        }
      },
      false
    );
  });
};

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
  onBefore,
  onStart: () => {
    console.log('startUpload:', startUploadIndex++);
  },
  onSuccess: () => {
    console.log('successUpload:', successUploadIndex++);
  },
  onComplete: () => {
    console.log('所有文件都上传完了~');
  },
  requestAdapter: async ({
    file,
    onBeforeWrapper,
    onStartWrapper,
    onSuccessWrapper,
    onErrorWrapper,
    onAfterWrapper
  }) => {
    const onBefore = onBeforeWrapper(file);
    if (onBefore) {
      const result = await onBefore(file);
      console.log({ result });
    }
  }
});

(document.querySelector('button') as any).addEventListener(
  'click',
  function() {
    uploader.start();
  },
  false
);

// 开始上传
// webuploader.start()

// 取消上传
// webuploader.cancel()
