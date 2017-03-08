function nop(){}

const Translator = typeof LUT === "undefined" ?
  require("./lut").LookupTable :
  LUT.LookupTable;

(function(exports){

  class DummyStorage {

    constructor(view_transforms, store_view_results) {
      this.view_transforms = view_transforms;
      this.store_view_results = typeof store_view_results==="undefined" ? true : store_view_results;
      return this;
    }

    exists(id,src,cb) {
      var that = this;
      that.get_permissions(id,(function(permissions){
        cb(that.fulfills_permissions(permissions,src));
      }));
    }

    fulfills_permissions(perms,src) {
      // to-do!
      return false;
    }

    get_permissions(id,cb) {
      var that = this;
      that.load_data(id,(function(result,data){
        cb(typeof data !== 'undefined' ? data['permissions'] : null);
      }));
    }

    read(id,src,cb) {
      that.exists(id,function(exists){
        if(!exists) cb("notfound",null);
        else that.load_data(id,function(result,data){
          cb(result,data);
        });
      });
    }

    load_data(id,cb) {
      // this is dummy storage.
      // not intended to work.
      // override and inherit!
      cb("unsupported",null);
    }

    write(data,src,cb) {
      var that = this;
      that.exists(data["id"],src,function(exists){
        that.store_data(data,function(result){
          var checksum = data["id"];
          cb(result,checksum);
          result = result == "good";
          if(result) {
            that.update_views(data["id"],exists);
          }
        });
      });
    }

    store_data(data,cb) {
      // this is dummy storage.
      // not intended to work.
      // override and inherit!
      cb("unsupported",null);
    }

    update_views(doc,is_new) {
      var that = this;
      if(!this.store_view_results) return;
    }
  }

  class RuntimeStorage extends DummyStorage {
    constructor(v,s) {
      super(v,s);
      this.docs = {};// id: {perms:{<uid>:'rwh'},create,modified,revisions:[{ts,data}],data}
      this.view_emits = {};// view_name: {doc_id:emit_result}
      this.view_reductions = {};// view_name: <results>
      this.view_transforms = {}; // view_name: {function map, function reduce}
    }

    store_data(data,cb) {
      this.docs[data["id"]] = data;
      cb("good",data);
    }

    load_data(id,cb) {
      if(typeof this.docs[id] !== "undefined")  {
        cb("good",this.docs[id]);
      } else {
        cb("notfound",null);
      }
    }
  }

  class SocketConnection {
    constructor(ws,src,bucket) {
      this.ws = ws;
      this.src = src;
      this.bucket = bucket;
      if(this.ws["addEventListener"]) {
        this.ws.addEventListener("message",this.handle_message.bind(this));
      } else {
        this.ws.on("message",this.handle_message.bind(this));
      }
    }

    handle_message(message) {
      message = JSON.parse(message.data);
      if(message["status"]) {
        this.handle_response(message);
      } else {
        this.handle_operation(message);
      }
    }

    handle_response(message) {
      console.log("Received response",message);
    }

    handle_operation(message) {
      var that = this;
      this.bucket.handle_command(message,this.src,function(response){
        console.log(response.status,response.operation,response.data);
        that.ws.send(JSON.stringify(message));
      });
    }
  }

  class DataPersistance {

    constructor(storage) {
      var that = this;
      that.storage = storage;

      that.statuscodes = new Translator(-1,{
        'error': -1,
        'unsupported': 0,
        'good': 1,
        'nopermission': 2,
        'notfound': 3
      });

      that.ops_map = new Translator(nop,{
        read: that.retrieve__,
        write: that.store__,
        remove: that.remove__,
        view: that.view__
      });
    }

    wrap_response(status,operation,data) {
      return {
        status: this.statuscodes.lookup(status),
        operation: operation,
        data: data
      };
    }

    handle_command(cmd,src,cb) {
      var payload = cmd.data;
      this.ops_map.lookup(cmd.operation).call(this,payload,src,cb);
    }

    retrieve__(data,src,cb) {
      var data_ = {
        id_: data['id'],
        data: "data loading isn't actually supported right now. :("
      };
      cb(this.wrap_response('unsupported','read',data));
    }

    store__(data,src,cb) {
      cb(this.wrap_response('unsupported','write',data));
    }

    view__(data,src,cb) {
      var view = data['name'];
      var ts = new Date();
      var response = {};
      cb(this.wrap_response('unsupported','view',{
        name: view,
        modified: ts,
        response: response
      }));
    }

    remove__(data,src,cb) {
      cb(this.wrap_response('unsupported','remove',{
        id_: data['id_']
      }));
    }

  }

  exports.DataPersist = DataPersistance;
  exports.DummyStorage = DummyStorage;
  exports.RuntimeStorage = RuntimeStorage;
  exports.SocketConnection = SocketConnection;

})(typeof exports === 'undefined' ? this['DataPersist']={} : exports);
