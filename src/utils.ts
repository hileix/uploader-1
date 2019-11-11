/**
 * throw error message
 * @param msg error message
 */
export function throwError(msg: string) {
  throw new Error(`[uploader]:${msg}`);
}
