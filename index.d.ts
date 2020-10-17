import EventEmitter from 'eventemitter3';
interface PendingJob {
    content?: any;
    callback?: any;
    options?: any;
}
export declare class FastFs extends EventEmitter {
    filename: string;
    status: Status;
    pending: PendingJob;
    cache: any;
    constructor(filename: string);
    write(content: string, options?: any, callback?: any): this | undefined;
    destroy(): void;
}
declare enum Status {
    IDLE = 1,
    PENDING = 2,
    WRITING = 3
}
export default function (filename: string): any;
export {};
