IntInterface = function(opts, parent) {
  var self = this;
  self.$obj = parent;
  self.name = opts.name;
  self.id = opts.id;
  self.$editable_label = {};
  self.base_value = opts.value;
  self.opts = opts;

  if (!_.isUndefined(opts.mods)) {
    self.mods = opts.mods;
  }
  else {
    self.mods = {};
  }

  self.genView = function() {
    var $disp = newRow();
    self.$editable_label = newCol(8,{
                                    class: 'editable',
                                    id: self.id + '_editable',
                                    text: self.base_value
    });
    $disp.append(newCol(4, {text: self.name})
         .append(self.$editable_label);
    self.$obj.append($disp);
  }

  self.gen_validator = function() {
    var validator = function(value) {
      if (!_.isUndefined(self.opts.min) && value < min) {
        return false;
      }
      if (!_.isUndefined(self.opts.max) && value > max) {
        return false;
      } 
      return true;

    }
  }

  self.init = function() {
    self.genView();
    self.$editable_label = new Editable(self.gen_validator());
    self.save();
  }

  self.save = function() {
    console.log("Save");  
  }
  
  self.data = function() {
    var obj = {};
    obj.base_value = self.base_value;
    obj.mods = self.mods;
    obj.opts = self.opts;
    obj.id = self.id;
    obj.name = self.name;
  }

  self.load(data) {
    self.base_value = data.base_value;
    self.mods = data.mods;
    self.id = data.id;
    self.name = data.name;
  }

  self.init();
}
