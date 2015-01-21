function check_opts(options, baseclass) {
  /* check_opts() will set up the options dict for a JQuery constructor
   *
   * @arg options   - (dict) optional dict containing JQuery constructor options.
   * @arg baseclass - (str) class to append to options' "class" key.
   */
  var opts = _.extend({}, options);
  if (_.has(opts, 'class') && !_.isUndefined(opts['class'])) {
    opts['class'] = opts['class'] + ' ' + baseclass;
  }
  else {
    opts['class'] = baseclass;
  }
  return opts;
}

function newRow(options) {
  // Generates a new div with the provided options and the 'row' class
  return $('<div/>', check_opts(options, 'row'));
}

function newCol(size, options) {
  /* Generates a new div with the provided options and the 'col-md-<size>' class
   *
   * Note on Bootstrap scaffolding:
   *   to appropriately use Bootstrap scaffolding requires correct usage of rows and columns
   *   whenever you create a row, you create a div of the size of the row's container that can
   *     be subdivided 12 times.
   *   You can then fill this with columns of size 1-12.
   *   so if you have a row inside of a col-md-6 (half the size of its container) and add a
   *     col-md-6 to this row, it will be 1/4 the size of the original column's container.
   *   you can also add an offset the size of one of these subdivisions.
   *     so a col-md-5 with col-md-offset-1 takes the same space as a col-md-6/
   */
  return $('<div/>', check_opts(options, 'col-md-' + size));
}

function newGlyph(name) {
  // Generates a new glypicon with the provided name
  return $('<span/>', {class: 'glyphicon glyphicon-' + name});
}

function newButton(color, options) {
  // Generates a new button of the provided color with the provided options
  var color_names = {
    'blue': 'primary',
    'white': 'default',
    'green': 'success',
    'lightblue': 'info',
    'orange': 'warning',
    'red': 'danger'};
  var btn_class = 'btn btn-' + color_names[color];
  var opts = check_opts(options, btn_class);
  opts.type = 'button';
  return $('<button/>', opts);
}

function newPanelSet(id, title, body) {
  /* Generates a new panel set around <body> with the provided id and title
   *
   * Panel sets contain a header that you click on to toggle a collapsible body.
   *
   * @arg id       - this is the id for the panel set.
   * @arg title    - the text for the title bar of the panel set.
   * @arg body     - the jquery object to place in the body of the panel set.
   */
  // I have to do the header div manally as I had trouble getting
  // JQuery to play nice with the data-toggle attribute.
  var header = $('<div class="panel-heading disp_panel_inner_heading" ' +
                 'href="#' + id + '_body" data-toggle="collapse">' +
                 title + '</div>');
  var body = $('<div/>', {
      class: 'panel-body disp_panel collapse in',
      style: 'padding:5px',
      id: id + '_body'}).append(body);
  return $('<div/>', {class: 'disp_panel_bg'}).append(header).append(body);
}

function genToggle(id, text, obj) {
  // generates a toggle to be activated by bootstrap
  obj.append(newCol(1, {text: text}));
  var checkbox = $('<input/>', {type: 'checkbox', class: 'switch-small', style:'height:25px', id: 'stream_enable'});
  obj.append(newCol(2).append(checkbox));
}

function BaseModal() {
  // Provides access to/control of the "modal" divs included in base.html
  var self = this;
  self.$overlay = $('#modal_overlay');
  self.$modal = $('#modal');
  self.$content = $('#modal_content');

  self.open = function(settings) {
    /* BaseModal.open(settings)
     *
     * Display's the modal with the provided settings.
     *
     * @param settings - dict containing a subset of the following settings
     * @param settings.content  - html content to be shown in the modal
     * @param settings.width    - width of the modal
     * @param settings.height   - height of the modal
     */
    self.$content.empty().append(settings.content);

    self.$modal.css({
      width: settings.width || 'auto',
      height: settings.height || 'auto'
    })

    // center the modal
    var top, left;
    top = Math.max($(window).height() - self.$modal.outerHeight(), 0)/2;
    left = Math.max($(window).width() - self.$modal.outerWidth(), 0)/2;
    self.$modal.css({
      top: top + $(window).scrollTop(),
      left: left + $(window).scrollLeft()
    });

    $(window).bind('resize.modal', self.center);
    self.$modal.show();
    self.$overlay.show();
  }

  self.show = function() {
    $(window).bind('resize.modal', self.center);
    self.$modal.show();
    self.$overlay.show();
  }

  self.close = function() {
    /* BaseModal.close()
     *
     * closes/hides the modal
     */

    self.$modal.hide();
    self.$overlay.hide();
    self.$content.empty();
    $(window).unbind('resize.modal');
  }
}

function ConfirmDialog(settings) {
  var self = this;
  self.modal = webui.modal;
  self.prompt = settings.prompt;
  self.conf_text = settings.conf_text || "Confirm";
  self.cancel_text = settings.cancel_text || "Cancel";
  self.on_conf = settings.on_conf;
  self.on_cancel = settings.on_cancel || function() {};

  self.init = function() {
    var $content, $prompt, $response;
    $prompt = $('<div/>', {text: self.prompt, style:'padding:5px'});
    $response = $('<div/>').append(newButton('green', {id:'modal_conf', text: self.conf_text, style: 'margin:5px'}))
                           .append(newButton('red', {id: 'modal_cancel', text: self.cancel_text, style: 'margin:5px'}));
    $content = $('<div/>').append($prompt,$response);
    self.modal.open({content: $content});
    $('#modal_conf').on('click', function() {
      self.on_conf();
      self.close();
    });
    $('#modal_cancel').on('click', function() {
      self.on_cancel();
      self.close();
    });
  }

  self.close = function() {
    $('#modal_conf').off('click');
    $('#modal_cancel').off('click');
    self.modal.close();
    delete self;
  }
  self.init();
}

Editable = function(obj, handler, validator) {
  var self = this;
  self.$obj = obj;
  self.handler = handler;
  self.validator = validator;

  self.$obj.editable(function(value, settings) {
    if (self.validator(value)) {
      handler(value)
    } else {
      self.obj[0].reset();
    }
  },{
    type: 'text',
    style: 'inherit',
    event: 'focus',
    indicator: '',
  });
}

