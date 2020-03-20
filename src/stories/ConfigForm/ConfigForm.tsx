import React, { useState } from 'react';
import './ConfigForm.scss';
import { Form, Input, Button, Radio, InputNumber, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

const layout = {
  labelCol: { span: 12 },
  wrapperCol: { span: 12 }
};

const copyToClipboard = (str: string) => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

function ConfigForm(props: {
  onChange: (values: any) => void;
  initialValues?: {
    multiple?: boolean;
    autoUpload?: boolean;
    threads?: number;
    accept?: string;
    chunked?: boolean;
    chunkSize?: number;
    chunkThreshold?: number;
    retryCount?: number;
    chunkRetryCount?: number;
  };
}) {
  const [resetDisabled, setResetDisabled] = useState(true);
  const [applyDisabled, setApplyDisabled] = useState(true);
  const [values, setValues] = useState(props.initialValues);

  const { initialValues } = props;
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    const newValues = {
      ...values,
      maxSize: values.maxSize ? values.maxSize * 1024 * 1024 : undefined
    };
    const { onChange } = props;
    onChange && onChange(newValues);
    setApplyDisabled(true);
    setResetDisabled(false);
  };

  const handleReset = () => {
    form.resetFields();
    const { onChange } = props;
    onChange && onChange(initialValues);
    setResetDisabled(true);
  };

  const onValuesChange = (changedValues: any, allValues: any) => {
    setValues(allValues);
    setApplyDisabled(false);
  };

  const handleCopy = () => {
    copyToClipboard(JSON.stringify(values, null, 2));
    message.success('Get configuration successful');
  };

  return (
    <Form
      {...layout}
      form={form}
      name='control-hooks'
      initialValues={initialValues}
      size='small'
      className='config-form'
      onFinish={onFinish}
      onValuesChange={onValuesChange}
    >
      <CopyOutlined className='config-form__copy-button' onClick={handleCopy} />
      <Form.Item name='multiple' label='multiple' rules={[{ required: true }]}>
        <Radio.Group>
          <Radio.Button value={true}>true</Radio.Button>
          <Radio.Button value={false}>false</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item name='maxSize' label='maxSize'>
        <InputNumber />
      </Form.Item>
      <Form.Item name='maxCount' label='maxCount'>
        <InputNumber />
      </Form.Item>
      <Form.Item
        name='autoUpload'
        label='autoUpload'
        rules={[{ required: true }]}
      >
        <Radio.Group>
          <Radio.Button value={true}>true</Radio.Button>
          <Radio.Button value={false}>false</Radio.Button>
        </Radio.Group>
      </Form.Item>

      <Form.Item name='threads' label='threads' rules={[{ required: true }]}>
        <InputNumber min={1} />
      </Form.Item>
      <Form.Item name='accept' label='accept' rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Form.Item name='chunked' label='chunked' rules={[{ required: true }]}>
        <Radio.Group>
          <Radio.Button value={true}>true</Radio.Button>
          <Radio.Button value={false}>false</Radio.Button>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        name='chunkSize'
        label='chunkSize'
        rules={[{ required: true }]}
      >
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item
        name='chunkThreshold'
        label='chunkThreshold'
        rules={[{ required: true }]}
      >
        <InputNumber min={0} />
      </Form.Item>

      <Form.Item
        name='retryCount'
        label='retryCount'
        rules={[{ required: true }]}
      >
        <InputNumber min={0} />
      </Form.Item>
      <Form.Item
        name='chunkRetryCount'
        label='chunkRetryCount'
        rules={[{ required: true }]}
      >
        <InputNumber min={0} />
      </Form.Item>
      {/* <div className='config-form__footer'>
        <Button
          type='primary'
          className='config-form__submit-button'
          onClick={handleReset}
          disabled={resetDisabled}
        >
          Reset
        </Button>
      </div> */}
      <div className='config-form__footer' style={{ marginTop: 4 }}>
        <Button
          type='primary'
          className='config-form__submit-button'
          htmlType='submit'
          disabled={applyDisabled}
        >
          Apply
        </Button>
      </div>
    </Form>
  );
}

ConfigForm.defaultProps = {
  initialValues: {
    multiple: true,
    autoUpload: true,
    threads: 1,
    accept: 'audio/*',
    chunked: false,
    chunkSize: 1,
    chunkThreshold: 0,
    retryCount: 2,
    chunkRetryCount: 2
  }
};

export default ConfigForm;
