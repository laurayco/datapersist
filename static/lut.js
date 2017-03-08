(function(exports) {

  function LookupTable(def,m) {
    var that = this;
    def = def || null;
    that.lut = m;
    that.rev = {};
    that.def = def;
    return that;
  }

  LookupTable.prototype.lookup = function(key) {
    return this.lut[key] || this.def;
  }

  LookupTable.prototype.retrieve = function(key) {
    console.log(this);
    return this.rev[key] || null;
  }

  exports.LookupTable = LookupTable;
})(typeof exports === "undefined" ? this['LUT']={} : exports);
