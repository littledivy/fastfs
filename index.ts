import EventEmitter from 'eventemitter3';
import * as path from 'path';
import * as fs from "fs";

// simple FIFO Queue for avoiding memory leak
function getCache (max: number) {
  max = max || 1000;
  var cache: { [x: string]: any; } = {}, keys: any[] = [];

  return {
    set: function( key: string, value: any ) {
      if ( keys.length > max ) delete cache[ keys.shift() || -1 ];
      keys.push(key);
      return (cache[key] = value);
    },
    get: function(key: string) {
      return cache[key];
    },
    del: function(key: string){
      var index = keys.indexOf( key );
      if(~index){ keys.splice(index, 1) }
      delete cache[key]
    }
  };
}

interface PendingJob {
    content?: any,
    callback?: any,
    options?: any
}

export class FastFs extends EventEmitter {
    public filename: string;
    public status: Status;
    public pending: PendingJob;
    cache: any;
    constructor(filename: string) {
        super();
        this.filename = path.resolve( filename );
        this.status = Status.IDLE;
        this.pending = {
          content: null,
          callback: null,
          options: null
        }
    }
    write( content: string, options?: any, callback?: any){
        var filename = this.filename;
        if( typeof options === 'function' ) {
          callback = options;
          options = 'utf8';
        }
        if( !options ) options = 'utf8';
      
        var status = this.status;
        var pending = this.pending;
        var self = this;
      
        if( status  === Status.PENDING || status === Status.WRITING ){
      
          if( pending.callback ) pending.callback(null, 0)
      
          pending.content = content;
          pending.callback = callback;
          pending.options = options;
      
          return this;
        }
      
        this.status = Status.PENDING;
      
        pending.content = content;
        pending.callback = callback;
        pending.options = options;
      
        process.nextTick( function(){
      
      
          var callback = pending.callback;
      
          var content = pending.content;
          // avoid call twice
          pending.callback = null;
      
          self.status = Status.WRITING;
      
          fs.writeFile( filename, typeof content === 'function'? content() : content, pending.options , function(err){
            self.status = Status.IDLE;
            callback && callback(err, 1);
            if(err) self.emit('error', err);
            if( content !== pending.content ){
              self.write( pending.content, pending.options,  pending.callback);
            }else{ 
              self.emit('end', content);
            }
          })
        });
      }
      destroy(){
        cache.del(this.filename);
      }
}

enum Status {
    IDLE = 1,
    PENDING = 2,
    WRITING = 3,
}

let fo = FastFs.prototype;
var cache = fo.cache = getCache(1000);

export default function (filename: string){
  // make sure one file touch same pending
  filename = path.resolve(filename);

  return cache.get(filename) || cache.set(filename, new FastFs(filename))

}
