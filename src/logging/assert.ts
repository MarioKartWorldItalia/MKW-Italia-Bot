    export class AssertError extends Error {
        constructor(msg: string) {
            super(msg);
            this.name = "AssertError";
        }
    }
    
    export function assertCond(cond: boolean, message?: string) {
        if (!cond) {
            let errStr = "Assertion failed";
            if(message && message.length > 0) {
                errStr += "\nMessage: " + message;
            }
            throw new AssertError(errStr);
        }
    }

