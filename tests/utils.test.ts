import { throwError } from '../src/utils'

test('throwError', () => {
  const errorMsg = 'this is a error message.';
  expect(() => {
    throwError(errorMsg)
  }).toThrow(errorMsg);
});