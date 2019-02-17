export default class Util {
  static async mapAsync(arr, cb) {
    const res = [];
    for (let i = 0; i < arr.length; i += 1) {
      // eslint-disable-next-line
      res.push(await cb(arr[i], i, arr));
    }
    return res;
  }

  static async forEachAsync(arr, cb) {
    for (let i = 0; i < arr.length; i += 1) {
      // eslint-disable-next-line
      await cb(arr[i], i, arr);
    }
  }
}
