/*jshint esversion: 6 */

export {};

declare global {
  // tslint:disable-next-line: interface-name
  interface Array<T> {
    copySort(callback: (arg0: T, arg1: T) => number): T[];
    count(callback: (arg: T) => boolean): number;
    first(callback: (arg: T) => boolean): number | undefined;
    last(callback: (arg: T) => boolean): number | undefined;
    shiftMultiple(arg: number): T[];
  }
}
// --------------------------------------------------------------------------------------------
Object.defineProperty(Array.prototype, "copySort", {
  enumerable: false,
  value(callback: (x: any, y: any) => number) {
    const array = this.slice();
    array.sort(callback);
    return array;
  }
});
// --------------------------------------------------------------------------------------------
Object.defineProperty(Array.prototype, "count", {
  enumerable: false,
  value(callback: (x: any) => boolean) {
    return this.filter(callback).length;
  }
});
//--------------------------------------------------------------------------------------------
Object.defineProperty(Array.prototype, "first", {
  enumerable: false,
  value(callback: (arg: any) => boolean) {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < this.length; i++) {
      if (!callback || callback(this[i])) {
        return this[i];
      }
    }
    return undefined;
  }
});
// --------------------------------------------------------------------------------------------
Object.defineProperty(Array.prototype, "last", {
  enumerable: false,
  value(callback: (arg: any) => boolean) {
    for (let i = this.length - 1; 0 <= i; i--) {
      if (!callback || callback(this[i])) {
        return this[i];
      }
    }
    return undefined;
  }
});
// --------------------------------------------------------------------------------------------
Object.defineProperty(Array.prototype, "shiftMultiple", {
  enumerable: false,
  value(arg: number) {
    if (!arg) {
      arg = 1;
    }
    const result = [];
    for (let i = 0; i < arg && 0 < this.length; i++) {
      result.push(this.shift());
    }
    return result;
  }
});
// --------------------------------------------------------------------------------------------
