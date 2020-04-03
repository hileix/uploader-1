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

