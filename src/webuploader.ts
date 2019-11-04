import Uploader, { UploadOptions } from './uploader';
import { throwError } from './utils';

/**
 * web clinet upload class
 */
export default class Webuploader extends Uploader {
  public dom: HTMLInputElement;
  public options: WebuploaderOptions;
  constructor({ dom, multiple = false, accept = ['*/*'], threads = 1, ...restOptions }: WebuploaderOptions) {
    super(restOptions);

    if (!dom) {
      throwError('dom is invalid.');
      return;
    }

    if (multiple) {
      dom.setAttribute('multiple', '');
    }

    if (Array.isArray(accept) && accept.length) {
      dom.setAttribute('accept', `${accept.join(',')}`);
    }

    this.dom = dom;
    this.addEventListener();
    this.options = { dom, threads, ...restOptions };
  }

  public addEventListener() {
    (this.dom as HTMLInputElement).addEventListener(
      'change',
      this.handleInputChange
    );
  }

  public handleInputChange = (e: Event) => {
    const files: Array<File> = Array.from((e.target as any).files);
    this.allFiles = this.allFiles.concat(files);
    this.waitingUploadFiles = this.waitingUploadFiles.concat(files);

    if (this.options.autoUpload) {
      this.loopStart(this.options.threads as number)
    }
  };
}

export interface WebuploaderOptions extends UploadOptions {
  dom: HTMLInputElement; // input dom
  multiple?: boolean; // 是否可以选择多个文件
}
