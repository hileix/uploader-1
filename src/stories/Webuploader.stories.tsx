import React, { useEffect } from 'react';
import { storiesOf } from '@storybook/react';
import { Webuploader } from '../index';
import { log } from '../utils';
import { FileInfo, ChunkInfo } from '../interface';
import './WebuploaderStories.scss';
import { getFileMD5 } from '../utils';
import ConfigForm from './ConfigForm';
import UploadView from './UploadView';

const { useState } = React;

let url = 'http://localhost:7001/uploadFile',
  uploadChunkUrl = 'http://localhost:7001/uploadChunk';

if (process.env.NODE_ENV !== 'development') {
  url = '';
  uploadChunkUrl = '';
}

function getWebuploaderInstance(selector: string, config?: any): any {
  const inputDOM = document.querySelector(selector);
  return new Webuploader({
    dom: inputDOM as HTMLInputElement,
    url: 'http://localhost:7001/uploadFile', // 上传文件的地址
    uploadChunkUrl: 'http://localhost:7001/uploadChunk', // 上传分片的地址
    method: 'post', // 文件上传方式
    ...defaultConfig,
    ...(config ? config : {})
  });
}

const defaultConfig = {
  multiple: true,
  autoUpload: true,
  threads: 1,
  accept: 'audio/*',
  chunked: false,
  chunkSize: 1,
  chunkThreshold: 0,
  retryCount: 2,
  chunkRetryCount: 2,
  md5: false,
  chunkMD5: false
};

function Tips() {
  return (
    <div className='webuploader-stories__tips-wrapper'>
      <p>开发环境下，请先确保运行 npm run server 开启了 node 服务</p>
      <p>请打开控制台查看 Console 和 Network</p>
    </div>
  );
}

function FileUpload() {
  const [percent, setPercent] = useState(0);
  const [uploader, setUploader] = useState<any>(null);
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);

  let startFileIndex = 1;
  let startChunkIndex = 1;
  let successFileIndex = 1;
  let successChunkIndex = 1;

  const onChange = (filesInfo: any) => {
    setAllFiles(filesInfo);
  };
  const onBefore = (fileInfo: FileInfo, callback: any) => {
    callback();
  };

  const onStart = (fileInfo: FileInfo) => {
    log.start(
      `>>>>>> 开始上传第 ${startFileIndex++} 个【文件】：${fileInfo.file.name}`
    );
  };

  const onChunkStart = (chunkInfo: ChunkInfo) => {
    log.start(
      `>>> 开始上传第 ${startChunkIndex++} 个【分片】：${chunkInfo.index + 1}`
    );
  };

  const onSuccess = () => {
    log.success(`<<<<<< 第 ${successFileIndex++} 个【文件】上传成功！`);
  };

  const onChunkSuccess = () => {
    log.success(`<<< 第 ${successChunkIndex++} 个【分片】上传成功！`);
  };

  const onComplete = () => {
    console.log('所有文件都上传完了~');
    successFileIndex = 1;
    successChunkIndex = 1;
    startChunkIndex = 1;
    startFileIndex = 1;
  };

  const onChunkComplete = (uploadedFile: FileInfo, callback: any) => {
    console.log('一个文件的所有分片都上传成功了！');
    successChunkIndex = 1;
    startChunkIndex = 1;
    callback({
      fileInfo: uploadedFile,
      res: {}
    });
  };

  const onProgress = (progress: number, filesInfo: any) => {
    setAllFiles(filesInfo);
    setPercent(Number(progress.toFixed(2)));
  };

  const onVerified = (params: any) => {
    console.log('onVerified:', params);
  };

  useEffect(() => {
    const uploader = getWebuploaderInstance('#file-upload-input-1', {
      onChange,
      onBefore,
      onStart,
      onChunkStart,
      onSuccess,
      onChunkSuccess,
      onComplete,
      onChunkComplete,
      onProgress,
      onVerified
    });

    setUploader(uploader);

    return () => {};
  }, []);

  const handleConfigChange = (values: any) => {
    if (uploader) {
      uploader.removeEventListener();
    }

    const newUploader = getWebuploaderInstance('#file-upload-input-1', {
      ...values,
      onChange,
      onBefore,
      onStart,
      onChunkStart,
      onSuccess,
      onChunkSuccess,
      onComplete,
      onChunkComplete,
      onProgress,
      onVerified
    });

    setAllFiles([]);
    setPercent(0);
    setUploader(newUploader);
  };


  return (
    <div className='webuploader-stories__wrapper'>
      <div className='webuploader-stories__left'>
        <ConfigForm onChange={handleConfigChange}></ConfigForm>
      </div>

      <div className='webuploader-stories__right'>
        <UploadView
          inputId='file-upload-input-1'
          uploader={uploader}
          allFiles={allFiles}
          totalPercent={percent}
        ></UploadView>
      </div>
    </div>
  );
}

function ChunkUpload() {
  const [percent, setPercent] = useState(0);
  const [uploader, setUploader] = useState<any>(null);
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const defaultConfig = {
    multiple: true,
    autoUpload: true,
    threads: 1,
    accept: 'audio/*',
    chunked: true,
    chunkSize: 1,
    chunkThreshold: 0,
    retryCount: 2,
    chunkRetryCount: 2,
    md5: false,
    chunkMD5: false
  };

  useEffect(() => {
    let startFileIndex = 1;
    let startChunkIndex = 1;
    let successFileIndex = 1;
    let successChunkIndex = 1;
    const uploader = getWebuploaderInstance('#file-upload-input-2', {
      ...defaultConfig,
      onChange: (filesInfo: any) => {
        setAllFiles(filesInfo);
      },
      onBefore: (fileInfo: FileInfo, callback: any) => {
        callback();
      },
      onStart: (fileInfo: FileInfo) => {
        log.start(
          `>>>>>> 开始上传第 ${startFileIndex++} 个【文件】：${
            fileInfo.file.name
          }`
        );
      },
      onChunkStart: (chunkInfo: ChunkInfo) => {
        log.start(
          `>>> 开始上传第 ${startChunkIndex++} 个【分片】：${chunkInfo.index +
            1}`
        );
      },
      onSuccess: () => {
        log.success(`<<<<<< 第 ${successFileIndex++} 个【文件】上传成功！`);
      },
      onChunkSuccess: () => {
        log.success(`<<< 第 ${successChunkIndex++} 个【分片】上传成功！`);
      },
      onComplete: () => {
        console.log('所有文件都上传完了~');
        successFileIndex = 1;
        successChunkIndex = 1;
        startChunkIndex = 1;
        startFileIndex = 1;
      },
      onChunkComplete: (uploadedFile: FileInfo, callback: any) => {
        console.log('一个文件的所有分片都上传成功了！');
        successChunkIndex = 1;
        startChunkIndex = 1;
        callback({
          fileInfo: uploadedFile,
          res: {}
        });
      },
      onProgress: (progress: number, filesInfo: any) => {
        setAllFiles(filesInfo);
        setPercent(Number(progress.toFixed(2)));
      }
    });
    setUploader(uploader);

    return () => {};
  }, []);

  const handleConfigChange = (values: any) => {
    console.log({ values });
    if (uploader) {
      uploader.removeEventListener();
    }
    let startFileIndex = 1;
    let startChunkIndex = 1;
    let successFileIndex = 1;
    let successChunkIndex = 1;
    const newUploader = getWebuploaderInstance('#file-upload-input-2', {
      ...values,
      onChange: (filesInfo: any) => {
        setAllFiles(filesInfo);
      },
      onBefore: (fileInfo: FileInfo, callback: any) => {
        callback();
      },
      onStart: (fileInfo: FileInfo) => {
        log.start(
          `>>>>>> 开始上传第 ${startFileIndex++} 个【文件】：${
            fileInfo.file.name
          }`
        );
      },
      onChunkStart: (chunkInfo: ChunkInfo) => {
        log.start(
          `>>> 开始上传第 ${startChunkIndex++} 个【分片】：${chunkInfo.index +
            1}`
        );
      },
      onSuccess: () => {
        log.success(`<<<<<< 第 ${successFileIndex++} 个【文件】上传成功！`);
      },
      onChunkSuccess: () => {
        log.success(`<<< 第 ${successChunkIndex++} 个【分片】上传成功！`);
      },
      onComplete: () => {
        console.log('所有文件都上传完了~');
        successFileIndex = 1;
        successChunkIndex = 1;
        startChunkIndex = 1;
        startFileIndex = 1;
      },
      onChunkComplete: (uploadedFile: FileInfo, callback: any) => {
        console.log('一个文件的所有分片都上传成功了！');
        successChunkIndex = 1;
        startChunkIndex = 1;
        callback({
          fileInfo: uploadedFile,
          res: {}
        });
      },
      onProgress: (progress: number, filesInfo: any) => {
        setAllFiles(filesInfo);
        setPercent(Number(progress.toFixed(2)));
      }
    });

    setAllFiles([]);
    setPercent(0);
    setUploader(newUploader);
  };

  return (
    <div className='webuploader-stories__wrapper'>
      <div className='webuploader-stories__left'>
        <ConfigForm
          onChange={handleConfigChange}
          initialValues={defaultConfig}
        ></ConfigForm>
      </div>

      <div className='webuploader-stories__right'>
        <UploadView
          inputId='file-upload-input-2'
          uploader={uploader}
          allFiles={allFiles}
          totalPercent={percent}
        ></UploadView>
      </div>
    </div>
  );
}

function ErrorRetry() {
  const [percent, setPercent] = useState(0);
  const [uploader, setUploader] = useState<any>(null);
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const defaultConfig = {
    multiple: true,
    autoUpload: true,
    threads: 1,
    accept: 'audio/*',
    chunked: true,
    chunkSize: 1,
    chunkThreshold: 0,
    retryCount: 2,
    chunkRetryCount: 2,
    md5: false,
    chunkMD5: false
  };
  let startFileIndex = 1;
  let startChunkIndex = 1;
  let successFileIndex = 1;
  let successChunkIndex = 1;

  const onChange = (filesInfo: any) => {
    setAllFiles(filesInfo);
  };

  const onBefore = (fileInfo: FileInfo, callback: any) => {
    callback();
  };

  const onStart = (fileInfo: FileInfo) => {
    log.start(
      `>>>>>> 开始上传第 ${startFileIndex++} 个【文件】：${fileInfo.file.name}`
    );
  };

  const onChunkStart = (chunkInfo: ChunkInfo) => {
    log.start(
      `>>> 开始上传第 ${startChunkIndex++} 个【分片】：${chunkInfo.index + 1}`
    );
  };

  const onSuccess = () => {
    log.success(`<<<<<< 第 ${successFileIndex++} 个【文件】上传成功！`);
  };

  const onChunkSuccess = () => {
    log.success(`<<< 第 ${successChunkIndex++} 个【分片】上传成功！`);
  };

  const onComplete = () => {
    console.log('所有文件都上传完了~');
    successFileIndex = 1;
    successChunkIndex = 1;
    startChunkIndex = 1;
    startFileIndex = 1;
  };

  const onChunkComplete = (uploadedFile: FileInfo, callback: any) => {
    console.log('一个文件的所有分片都上传成功了！');
    successChunkIndex = 1;
    startChunkIndex = 1;
    callback({
      fileInfo: uploadedFile,
      res: {}
    });
  };

  const onProgress = (progress: number, allFiles: FileInfo[]) => {
    setPercent(Number(progress.toFixed(2)));
    setAllFiles(allFiles);
  };

  useEffect(() => {
    const uploader = getWebuploaderInstance('#file-upload-input-3', {
      ...defaultConfig,
      onChange,
      onBefore,
      onStart,
      onChunkStart,
      onSuccess,
      onChunkSuccess,
      onComplete,
      onChunkComplete,
      onProgress
    });
    setUploader(uploader);

    return () => {};
  }, []);

  const handleConfigChange = (values: any) => {
    if (uploader) {
      uploader.removeEventListener();
    }
    const newUploader = getWebuploaderInstance('#file-upload-input-3', {
      ...values,
      onChange,
      onBefore,
      onStart,
      onChunkStart,
      onSuccess,
      onChunkSuccess,
      onComplete,
      onChunkComplete,
      onProgress
    });

    setAllFiles([]);
    setPercent(0);
    setUploader(newUploader);
  };

  return (
    <div className='webuploader-stories__wrapper'>
      <div className='webuploader-stories__left'>
        <ConfigForm
          onChange={handleConfigChange}
          initialValues={defaultConfig}
        ></ConfigForm>
      </div>

      <div className='webuploader-stories__right'>
        <UploadView
          inputId='file-upload-input-3'
          uploader={uploader}
          allFiles={allFiles}
          totalPercent={percent}
        ></UploadView>
      </div>
    </div>
  );
}

function BreakpointResume() {
  const [percent, setPercent] = useState(0);
  const [uploader, setUploader] = useState<any>(null);
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);

  const defaultConfig = {
    multiple: true,
    autoUpload: true,
    threads: 1,
    accept: 'audio/*',
    chunked: true,
    chunkSize: 1,
    chunkThreshold: 0,
    retryCount: 2,
    chunkRetryCount: 2,
    md5: false,
    chunkMD5: false
  };

  let startFileIndex = 1;
  let startChunkIndex = 1;
  let successFileIndex = 1;
  let successChunkIndex = 1;

  const onChange = (filesInfo: any) => {
    setAllFiles(filesInfo);
  };

  const onStart = (fileInfo: FileInfo) => {
    log.start(
      `>>>>>> 开始上传第 ${startFileIndex++} 个【文件】：${fileInfo.file.name}`
    );
  };

  const onSuccess = () => {
    log.success(`<<<<<< 第 ${successFileIndex++} 个【文件】上传成功！`);
  };

  const onChunkStart = (chunkInfo: ChunkInfo) => {
    log.start(
      `>>> 开始上传第 ${startChunkIndex++} 个【分片】：${chunkInfo.index + 1}`
    );
  };

  const onChunkSuccess = (chunInfo: ChunkInfo, res: any) => {
    // 分片上传后，
    log.success(`<<< 第 ${successChunkIndex++} 个【分片】上传成功！`);
  };

  const onComplete = () => {
    console.log('所有文件都上传完了~');
    successFileIndex = 1;
    successChunkIndex = 1;
    startChunkIndex = 1;
    startFileIndex = 1;
  };

  const onChunkComplete = (uploadedFile: FileInfo, callback: any) => {
    console.log('一个文件的所有分片都上传成功了！');
    successChunkIndex = 1;
    startChunkIndex = 1;

    // 当所有分片都上传完成了，则进行网络请求，合并文件（这里模拟网络请求的时间）
    setTimeout(() => {
      callback({
        fileInfo: uploadedFile,
        res: { ret: 0, data: 'success' }
      });
    }, 1000);
  };

  const onProgress = (progress: number, filesInfo: any) => {
    setAllFiles(filesInfo);
    setPercent(Number(progress.toFixed(2)));
  };

  useEffect(() => {
    const uploader = getWebuploaderInstance('#file-upload-input-4', {
      ...defaultConfig,
      onChange,
      onStart,
      onChunkStart,
      onSuccess,
      onChunkSuccess,
      onComplete,
      onChunkComplete,
      onProgress,
      onBefore: (fileInfo: FileInfo, callback: any) => {
        // 开始上传文件前，设置文件的 md5 值
        getFileMD5(fileInfo.file)
          .then(md5 => {
            fileInfo.md5 = md5;
            // 模拟检查文件是否存在于服务端
            const isChunkInBackend = () => {
              return !!(startFileIndex % 2);
            };

            // 文件已存在服务器端，则直接设置该文件为成功上传的文件
            if (isChunkInBackend()) {
              uploader.toSuccessful(fileInfo.id);
            } else {
              // 文件不存在服务端，则直接调用 callback，进行文件上传
              callback();
            }
          })
          .catch(err => {
            console.error(err);
            callback(err.message);
          });
      },
      onChunkBefore: (chunkInfo: ChunkInfo, callback: any) => {
        // 开始上传分片前，设置分片的 md5 值
        getFileMD5(chunkInfo.chunk)
          .then(md5 => {
            chunkInfo.md5 = md5;
            // 模拟检查分片是否存在于服务端
            const isChunkInBackend = () => {
              return !!(startChunkIndex % 2);
            };

            // 分片已存在服务器端，则直接设置该分片为成功上传的分片
            if (isChunkInBackend()) {
              uploader.toSuccessful(chunkInfo.id);
            } else {
              // 分片不存在服务端，则直接调用 callback，进行分片上传
              callback();
            }
          })
          .catch(err => {
            console.error(err);
            callback(err.message);
          });
      }
    });
    setUploader(uploader);
    return () => {};
  }, []);

  const handleConfigChange = (values: any) => {
    if (uploader) {
      uploader.removeEventListener();
    }
    const newUploader = getWebuploaderInstance('#file-upload-input-4', {
      ...values,
      onChange,

      onStart,
      onChunkStart,
      onSuccess,
      onChunkSuccess,
      onComplete,
      onChunkComplete,
      onProgress,
      onBefore: (fileInfo: FileInfo, callback: any) => {
        // 开始上传文件前，设置文件的 md5 值
        getFileMD5(fileInfo.file)
          .then(md5 => {
            fileInfo.md5 = md5;
            // 模拟检查文件是否存在于服务端
            const isChunkInBackend = () => {
              return !!(startFileIndex % 2);
            };

            // 文件已存在服务器端，则直接设置该文件为成功上传的文件
            if (isChunkInBackend()) {
              uploader.toSuccessful(fileInfo.id);
            } else {
              // 文件不存在服务端，则直接调用 callback，进行文件上传
              callback();
            }
          })
          .catch(err => {
            console.error(err);
            callback(err.message);
          });
      },
      onChunkBefore: (chunkInfo: ChunkInfo, callback: any) => {
        // 开始上传分片前，设置分片的 md5 值
        getFileMD5(chunkInfo.chunk)
          .then(md5 => {
            chunkInfo.md5 = md5;
            // 模拟检查分片是否存在于服务端
            const isChunkInBackend = () => {
              return !!(startChunkIndex % 2);
            };

            // 分片已存在服务器端，则直接设置该分片为成功上传的分片
            if (isChunkInBackend()) {
              uploader.toSuccessful(chunkInfo.id);
            } else {
              // 分片不存在服务端，则直接调用 callback，进行分片上传
              callback();
            }
          })
          .catch(err => {
            console.error(err);
            callback(err.message);
          });
      }
    });

    setAllFiles([]);
    setPercent(0);
    setUploader(newUploader);
  };

  return (
    <div className='webuploader-stories__wrapper'>
      <div className='webuploader-stories__left'>
        <ConfigForm
          onChange={handleConfigChange}
          initialValues={defaultConfig}
        ></ConfigForm>
      </div>

      <div className='webuploader-stories__right'>
        <UploadView
          inputId='file-upload-input-4'
          uploader={uploader}
          allFiles={allFiles}
          totalPercent={percent}
        ></UploadView>
      </div>
    </div>
  );
}

storiesOf('文件上传', module)
  .add('文件上传', () => <FileUpload />, {
    info: {
      text: 'text'
    }
  })
  .add('分片上传', () => <ChunkUpload />, {
    info: {
      text: 'text'
    }
  })
  .add('出错重试', () => <ErrorRetry />, {
    info: {
      text: 'text'
    }
  })
  .add('断点续传', () => <BreakpointResume />, {
    info: {
      text: 'text'
    }
  });
