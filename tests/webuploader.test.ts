import Webuploader from '../src/webuploader'

test('Webuploader', () => {
  const errorMsg = 'this is a error message.';
  expect(() => {
    throwError(errorMsg)
  }).toThrow(errorMsg);
});
