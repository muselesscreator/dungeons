import logging
import os

import tornado
import tornado.httpclient


PUB_DELAY=0.2                  # delay required btw pub socket creation and send


class _BaseHandler(tornado.web.RequestHandler):
    """
    Attributes:

    expdb_server    - URL to server providing experiment
                      definitions.
    """
    def __init__(self, *args, **kwds):
        super(_BaseHandler, self).__init__(*args, **kwds)

