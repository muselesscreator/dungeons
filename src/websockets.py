import functools
import logging
import types

import tornado
import tornado.websocket

log = logging.getLogger('tornado.application')

if tornado.version_info >= (3, 2, 0, 0):
    WebSocketClosedError = tornado.websocket.WebSocketClosedError
else:
    WebSocketClosedError = AttributeError

class BaseWebSocket(tornado.websocket.WebSocketHandler):
    def __init__(self, *args, **kwds):
        super(BaseWebSocket, self).__init__(*args, **kwds)
        self._pinger = None
        self._open = False

    @property
    def loop(self):
        """
        Current IOLoop
        """
        return self.application.loop

    def on_message(self, data):
        """
        Override default WebSocket method.  Subclasses should use handle_message()
        to react to received data
        """
        if self._open:
            msg = tornado.escape.json_decode(data)
            non_unicode = {
                    str(k) if type(k) == types.UnicodeType else k:
                    str(v) if type(v) == types.UnicodeType else v
                    for k, v in msg.items()}

            log.debug('Received %s', non_unicode)
            if self.preprocess_message(non_unicode):
                self.handle_message(non_unicode)

    def preprocess_message(self, msg):
        """Check the message for special preprocessing, and return whether message
        should be passed to handle_message

        @param msg  - dictionary containing received data.
        """
        return True

    def on_close(self):
        """
        Override default WebSocket method.  Subclasses should use handle_close()
        to react to a closing websocket.
        """
        super(BaseWebSocket, self).on_close()
        log.debug('Closing websocket %s', self.request.uri)
        self._open = False

        if self._pinger is not None:
            self.loop.remove_timeout(self._pinger)
            self._pinger = None
        self.handle_close()

    def open(self):
        """
        Override default Websocket method.  Subclasses should use handle_open()
        to react to an opening websocket.
        """
        super(BaseWebSocket, self).open()
        log.debug('Opening websocket %s', self.request.uri)
        self._open = True
        self.handle_open()

    def handle_message(self, msg):
        """
        Handle a message received on the web socket.  This method
        should be overridden by derived classes.

        @param msg  - dictionary containing received data.
        """
        pass

    def handle_close(self):
        """
        Handle the WebSocket closing.  This method can be defined by
        derived classes.
        """
        pass

    def handle_open(self):
        """
        Handle the WebSocket opening.  This method can be defined by
        derived classes.
        """
        pass

    def send_msg(self, msg):
        """
        Send a message over the websocket.

        @param msg  - dictionary containing JSON-encodable data to send
        """
        data = tornado.escape.json_encode(msg)
        try:
            self.write_message(data)
        except WebSocketClosedError:
            log.info('Attempt to write to closed websocket')


class _EchoWebSocket(BaseWebSocket):
    """
    Websocket that simply echos current settings from a controller.

    Class Attributes:
        @param _controller   - name of controller used by this websocket.
        @param _settings     - name of controller property to echo.  The
                               default is 'settings'
    """
    _controller = None
    _settings = 'settings'

    def _get_controller(self):
        try:
            return getattr(self, self._controller)
        except Exception, e:
            log.exception(e)

    def _get_settings(self):
        try:
            return getattr(self._get_controller(), self._settings)
        except Exception, e:
            log.exception(e)

    def handle_open(self):
        controller = self._get_controller()
        if controller is not None:
            controller.register(self._on_update)

    def handle_close(self):
        controller = self._get_controller()
        if controller is not None:
            controller.unregister(self._on_update)

    def _on_update(self):
        settings = self._get_settings()
        if settings is not None:
            self.send_msg(settings)

    def preprocess_message(self, msg):
        # on receipt of empty message, bounce back current settings
        if not msg:
            self._on_update()
            return False                  # stop processing
        return True


class _SetWebSocket(_EchoWebSocket):
    """
    Websocket that echos the current settings from a controller and
    also passes any messages recieved to the set() method of the
    controller.

    Class Attributes:
        @param _controller   - name of controller used by this websocket.
        @param _settings     - name of controller property to echo.  The
                               default is 'settings'
    """
    def handle_message(self, msg):
        controller = self._get_controller()
        if controller is not None:
            controller.set(msg)
