# Web 端和 Node.js 端文件上传

## 安装
```shell
yarn add @hife/uploader
```

## 使用

### web 端文件上传
```typescript
import { Webuploader, axiosAdapter } from '@hife/uploader';
// 配置 requestAdapter，这里使用官方的 axiosAdapter
Webuploader.configure({ requestAdapter: axiosAdapter });

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


## Todo list
### web 端
- [x] 单文件上传
- [x] 多文件上传
- [ ] 分片上传

### Node.js 端
- [ ] 单文件上传
- [ ] 多文件上传
- [ ] 分片上传
