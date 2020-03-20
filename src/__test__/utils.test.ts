import { throwError, validateOptions } from '../utils';

describe('utils', () => {
  test('utils:throwError', () => {
    const callThrowError = () => {
      throwError('error message');
    };

    expect(callThrowError).toThrowError('[uploader]:error message');
  });

  test('utils:validateOptions', () => {
    expect(
      validateOptions({
        url: 'testUrl',
        method: 'get',
        accept: ['audio/*']
      })
    ).toBe(undefined);
  });
});
