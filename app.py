#!/usr/bin/python

import functools
import getopt
import logging
import os
import sys
import time

import tornado.gen
import tornado.httpserver
import tornado.ioloop
import tornado.template
import tornado.web
import zmq.eventloop.ioloop

from src.gbprocs import mk_process, getOtherProcs, GBProcess

from src import restapi
from src import websockets

class RootHandler(tornado.web.RequestHandler):
    def get(self):
        if self.request.uri == '/':
            path = os.path.join(self.application.www_dir, 'index.html')
            self.render(path)
        else:
            fn = os.path.basename(self.request.uri)
            path = os.path.join(self.application.www_dir, fn)
            self.render(path)


class NoCacheStaticFileHandler(tornado.web.StaticFileHandler):
    """
    StaticFilehandler that disables the file cache
    """
    def set_extra_headers(self, _):
        """Disable caching on all served files
        """
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')


class NoLogStaticFileHandler(NoCacheStaticFileHandler):
    """
    NoCacheStaticFileHandler with logging disabled.  Useful for
    high frequency handlers.
    """
    def _log(self):
        pass

class Application(tornado.web.Application):
    def __init__(self, www_dir, loop=None):
        handlers = [
            # Static handlers
            (r'/css/(.*)', NoCacheStaticFileHandler, {'path': os.path.join(www_dir, 'css')}),
            (r'/js/(.*)', NoCacheStaticFileHandler, {'path': os.path.join(www_dir, 'js')}),
            (r'/fonts/(.*)', NoCacheStaticFileHandler, {'path': os.path.join(www_dir, 'fonts')}),
            (r'/component/(.*)', NoCacheStaticFileHandler, {'path': os.path.join(www_dir, 'component')}),
            (r'/resources/(.*)', NoCacheStaticFileHandler, {'path': os.path.join(www_dir, 'resources')}),

            # Websockets

            # Serve files located in root directory.  This is a catch-all and
            # needs to be last.
            (r'/.*', RootHandler),

        ]
        super(Application, self).__init__(handlers)

        self._loop = loop
        self._www_dir = www_dir

    @property
    def loop(self):
        """
        Application IOLoop
        """
        return self._loop

    @property
    def www_dir(self):
        """
        Path to static web files.
        """
        return self._www_dir

def main():

    www_dir = os.path.join(os.path.realpath('.'), 'www')
 
    zmq.eventloop.ioloop.install()
    loop = tornado.ioloop.IOLoop.instance()
    app = Application(www_dir, loop)
    httpd = tornado.httpserver.HTTPServer(app)
    httpd.listen(8888)

    loop.start()

if __name__ == '__main__':
    main()
