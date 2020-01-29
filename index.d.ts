export declare interface Logger {
  debug(tags: object, message?: string): void;
  debug(message: string, tags?: object): void;
  info(tags: object, message?: string): void;
  info(message: string, tags?: object): void;
  warn(tags: object, message?: string): void;
  warn(message: string, tags?: object): void;
  error(tags: object, message?: string): void;
  error(message: string, tags?: object): void;
  fatal(tags: object, message?: string): void;
  fatal(message: string, tags?: object): void;
}

export declare interface WatchOptions {
  ignorePaths?: string[];
  obfuscatePayload?: boolean;
  stringifyPayload?: boolean;
}

export declare class EventLogger {
  constructor(logger: Logger);
  watch(process: any, options?: any);
}

export declare interface Serializers {
  [key: string]: any;
}

export declare const Serializers: Serializers;

export declare interface ProcessInfo {
  app: string;
  version: string;
  node: string;
}

export declare const ProcessInfo: ProcessInfo;

export declare interface Streams {
  HttpWritableStream: NodeJS.WritableStream;
  Standardization: NodeJS.WritableStream;
}

export declare const Streams: Streams;
