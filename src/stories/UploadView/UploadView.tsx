import React from 'react';
import './UploadView.scss';
import { Button, Progress } from 'antd';
import UploadButton from '../UploadButton';
import { DeleteOutlined } from '@ant-design/icons';
import { FileInfo } from '../../interface';

function UploadView(props: {
  inputId: string;
  uploader: any;
  allFiles: FileInfo[];
  totalPercent: number;
}) {
  const { uploader, allFiles, totalPercent, inputId } = props;

  const getStats = () => {
    const stats = uploader && uploader.getStats();
    console.log({ stats });
  };

  const clearStats = () => {
    const stats = uploader && uploader.clearStats();
    console.log({ stats });
  };

  const remove = (id: string) => {
    const ret = uploader && uploader.remove(id);
    console.log({ ret });
  };
  return (
    <div className='upload-view'>
      <div className='upload-view__inner-wrapper'>
        <UploadButton inputId={inputId}>上传文件</UploadButton>
        <Button onClick={getStats} style={{ marginLeft: 8 }}>
          获取文件统计信息
        </Button>
        <Button onClick={clearStats} style={{ marginLeft: 8 }}>
          清除文件统计信息
        </Button>
      </div>
      <div className='upload-view__inner-wrapper'>
        <div className='upload-view__total-progress-wrapper'>
          <div className='upload-view__total-progress'>总进度</div>
          <Progress percent={totalPercent} />
        </div>
        <div className='upload-view__files-wrapper'>
          {allFiles.map(fileInfo => {
            const _percent = Number(fileInfo.progress.toFixed(2));
            return (
              <div
                key={fileInfo.id}
                className='webuploader-stories__file-progress'
              >
                <div>{fileInfo.file.name}:</div>
                <div className='upload-view__progress-wrapper'>
                  <Progress
                    percent={_percent}
                    status={
                      fileInfo.status === 'error' ? 'exception' : 'normal'
                    }
                  />
                  <div className='upload-view__remove-button-wrapper'>
                    <DeleteOutlined
                      className='upload-view__remove-button'
                      onClick={() => remove(fileInfo.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

UploadView.defaultProps = {
  allFiles: [],
  uploader: null,
  totalPercent: 0
};

export default UploadView;
