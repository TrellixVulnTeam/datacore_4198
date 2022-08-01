

class CommandsProxy(object):
    def __init__(self, obj):
        self._obj = obj

    def __getattr__(self):
        pass


def factory(obj):
    return CommandsProxy(obj
