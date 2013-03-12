import os, sys

p = os.environ.get("SIMPLEOBS_PATH","")
sys.path.insert(0, p)

from simple_obs import app as application