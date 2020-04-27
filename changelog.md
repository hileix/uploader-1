## Release v2.0.0
- breakchange: axiosAdapter 中传给 onSuccess 回调的第二个参数由 res 改为 res.data

## Release v1.10.0
- feat:添加 accept 只接受文件后缀类型的功能

## Release v1.9.8
- fix:修复上传文件上传完一个后就不会继续上传的 bug

## Release v1.9.7
- fix:修复 maxCount 参数无效的 bug

## Release v1.9.6
- fix:修复调用 toSuccessful 时报错的 bug

## Release v1.9.5
- fix:修复重试上传时同时上传文件数量错误的 bug

## Release v1.9.4
- fix:修复 onProgress 回调第一个参数错误的 bug

## Release v1.9.3
- fix:修复 onProgress 在重试时第一个参数错误的 bug

## Release v1.9.2
- fix:修复重试时 onProgress 回调第一个单数计算错误的 bug

## Release v1.9.1
- fix:修复 onChunkComplete 回调 callback 参数执行后逻辑错误的 bug

## Release v1.9.0
- feat:onError 回调添加 info 参数 
- fix:修复上传重试文件时不会调用 onError 回调的 bug

## Release v1.8.0
- feat:添加 onFilesInfoQueued 回调

## Release v1.7.0
- feat:retry 实例方法添加 boolean 返回值：返回值为 true 时，表示正在重试；否则表示没有重试次数了，不进行重试

## Release v1.5.0
- feat:添加 onSuccessVerify 和 onChunkSuccessVerify 回调 Closes #8

## Release v1.4.2
- fix:修复 accept 为 'image/*' 时 onVerified 回调传 type 为 'ACCEPT' 的错误参数的 bug Closes #3

## Release v1.4.1
- fix:修复在 onBefore 和 onChunkBefore 中拿不到文件/分片 md5 的 bug

## Release v1.4.0
- feat:添加 onVerified 回调参数 type 的值 'ACCEPT'，用于兼容 Firefox 对 input accept 属性在某种情况下不兼容的 bug

## Release v1.3.0
- feat:添加 onVerified 回调

## Release v1.2.0
- feat:UploadOptions 添加 md5 和 chunkMD5 属性

## Release v1.1.2
- fix:修复 Request Config headers 不会覆盖的 bug

## Release v1.1.1
- fix:修复跨域请求上传时不会带上 cookie 的 bug

## Release v1.1.0
- feat:添加 addInputDOM 实例方法
- feat:UploadOptions dom 属性添加可以传入数组的功能

## Release v1.0.6
- fix:修复调用 remove() 方法时，不会取消上传请求的 bug

## Release v1.0.5
- fix:修复 onChange 和 onProgress 回调中参数错误的 bug

## Release v1.0.4
- docs:update changelog.md

## Release v1.0.3
- fix:修复 uploadChunkUrl ts 定义错误的 bug

## Release v1.0.2
- fix:修复 lib 未上传至 npm 的 bug

## Release v1.0.1

