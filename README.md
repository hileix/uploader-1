# Web 端和 Node.js 端文件上传

## 安装
```shell
yarn add @hife/uploader
```

## 例子

```typescript
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

```

## API

### Uploader
```typescript
export interface UploadOptions {
  url: string; // 上传文件的地址
  method?: MethodType; // 文件上传方式
  accept?: Array<string>; // 接受的文件类型
  autoUpload?: boolean; // 是否选择文件后就自动开始上传，默认 true
  threads?: number; // 上传并发数
  /**
   * 上传前的回调，此回调用来验证是否可以进行上传
   */
  onBefore?: (file: File, callback: (errorMessage?: string) => void) => void;
  /**
   * 开始上传的回调
   */
  onStart?: (file: File) => void;
  /**
   * 上传成功的回调
   */
  onSuccess?: (file: File) => void;
  /**
   * 上传失败的回调
   */
  onError?: (error: Error) => void; // 上传失败的回调
  /**
   * 上传后的回调（成功或者失败）
   */
  onAfter?: (file: File) => void;
  /**
   * 所有文件上传完成的回调
   */
  onComplete?: (uploadedFiles: Array<File>) => void;
  /**
   * 请求适配器
   */
  requestAdapter?: RequestAdapterType;
}
```

### Webuploader

```typescript
export interface WebuploaderOptions extends UploadOptions {
  dom: HTMLInputElement; // input dom
  multiple?: boolean; // 是否可以选择多个文件
}
```

### Node.js 端文件上传
```typescript
// 未完待续
```

## 开发
```shell
# 开启后端服务
node server/

# 开启前端开发环境
npm start
```
