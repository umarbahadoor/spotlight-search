
export class PromiseAbortSignal {
  private _isPending: boolean = false;

  reject: (reason: any) => void;

  constructor() {
    this.reject = () => {
    };
  }

  setup(reject: (reason: any) => void) {
    this.reject     = reject;
    this._isPending = true;
  }

  complete() {
    this._isPending = false;
  }

  isPending(): boolean {
    return this._isPending;
  }
}
