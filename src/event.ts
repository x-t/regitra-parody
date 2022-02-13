export const on = (function () {
  // @ts-ignore
  if (window.addEventListener) {
    return function (target: HTMLElement, type: string, listener: () => void) {
      target.addEventListener(type, listener, false);
    };
  } else {
    return function (object: HTMLElement, sEvent: string, fpNotify: () => any) {
      // @ts-ignore
      object.attachEvent("on" + sEvent, fpNotify);
    };
  }
})();
