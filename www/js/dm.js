var dm = {};

dm.lastStreamID = 0;

dm.Stream = function(url) {
  var self = this;
  self.id = url;
  self.ws = null;
  self.handlers = [];
  self._send_buffer = [];
  self._last_msg = null;

  self.init = function() {
    self.ws = new WebSocket(self.url);
    self.ws.onmessage = self._on_message;
    self.ws.stream = self;

    self.ws.onopen = function() {
      _.each(self._send_buffer, function(msg) {self.ws.send(msg);});
      delete self._send_buffer;
      self.send({});
    }

    self.ws.onclose = function() {
      setTimeout(function() {self.init(); }, 5000);
    }

    self.close = function() {
      self.ws.onclose = function() {};
      self.ws.close();
    }
  }
  
  // register a handler
  self.register = function(callback) {
    self.handlers.push(callback);
    if (self._last_msg != null) {
      callback(self._last_msg);
    }
  }

  // unregister a handler
  self.unregister = function(callback) {
    this.handlers = _.reject(this.handlers, function(v) {return v == callback});
  }

  // unregister all handlers
  self.unregister_all = function() {
    this.handlers = [];
  }

  // handle new messages on the stream and json data to handlers
  self._on_message = function(event) {
    var msg = JSON.parse(event.data);
    self._last_msg = msg;
    _.map(this.stream.handlers, function(handler) {
      handler(msg);
      return handler;
    });
  }

  self.send = function(msg) {
    data = JSON.stringify(msg);
    if (self.ws.readyState != self.ws.OPEN){
      self._send_buffer.push(data);
    }
    else {
      self.ws.send(data);
    }
  }

  self.init();
}

