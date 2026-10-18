from pathlib import Path
import sys, importlib.util
from PIL import Image
import numpy as np
spec=importlib.util.spec_from_file_location('oldslice',Path(__file__).parents[1]/'battle-preview-20260926/slice.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
for name in sys.argv[1:]:
 im=np.array(Image.open(Path(__file__).parent/(name+'.png')).convert('RGBA')); lab,n=mod._label(im[:,:,3]>64,4)
 boxes=[]
 for sl in mod._objects(lab,n):
  if sl is None:continue
  area=(im[sl][:,:,3]>64).sum()
  if area>600:boxes.append([sl[1].start,sl[0].start,sl[1].stop,sl[0].stop,int(area)])
 print(name,im.shape,len(boxes),boxes)
