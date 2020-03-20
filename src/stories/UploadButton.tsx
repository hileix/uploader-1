import React from 'react';
import { Button } from 'antd';
import './UploadButton.scss';


function UploadButton({
  children,
  inputId
}: {
  children: any;
  inputId: string;
}) {
  return (
    <div className='upload-button'>
      <Button type='primary'>{children}</Button>
      <input type='file' id={inputId} />
    </div>
  );
}

export default UploadButton;
