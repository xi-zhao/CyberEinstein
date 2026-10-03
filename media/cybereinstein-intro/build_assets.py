"""Build original, precise visual assets and an independently checked toy example."""
from pathlib import Path
import json
import math
import subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
FONT = '/Users/xizhao/Library/Fonts/微软雅黑.ttf'
BG = '#0b0d13'
BLUE = '#58c4dd'
TEAL = '#5dd6b5'
GOLD = '#f4cf73'
WHITE = '#eeeeee'
GRAY = '#7e8a9e'

def make_cover():
    im = Image.new('RGB', (1920, 1080), BG)
    d = ImageDraw.Draw(im)
    def text(x, y, s, size, color=WHITE, anchor='mm'):
        f = ImageFont.truetype(FONT, size)
        d.text((x, y), s, font=f, fill=color, anchor=anchor)
    def line(points, color, width=3):
        d.line(points, fill=color, width=width, joint='curve')
    for x in range(80, 1920, 80): line([(x, 0), (x, 1080)], '#141a23', 1)
    for y in range(40, 1080, 80): line([(0, y), (1920, y)], '#141a23', 1)
    text(960, 255, 'CyberEinstein', 110)
    text(960, 378, '让科学史可以重新运行', 62, BLUE)
    pos = [(240,610),(355,735),(500,605),(720,685),(960,610),(1200,685),(1420,605),(1570,735),(1680,610)]
    for a,b in [(0,2),(1,2),(2,3),(3,4),(4,5),(5,6),(6,7),(6,8)]:
        line([pos[a],pos[b]], '#334154', 5)
    line([pos[0],pos[2],pos[3],pos[4],pos[5],pos[6],pos[8]], TEAL, 5)
    for i,(x,y) in enumerate(pos):
        col = GOLD if i == 8 else TEAL if i in (3,4,5) else BLUE
        d.ellipse((x-13,y-13,x+13,y+13),fill=col)
        d.ellipse((x-24,y-24,x+24,y+24),outline=col,width=2)
    for x,s,c in [(325,'方法',BLUE),(800,'证据',TEAL),(1280,'经验',TEAL),(1660,'新问题',GOLD)]:
        text(x,840,s,36,c)
    text(960,965,'让每个人都有机会，发现人类尚未知晓的事。',42)
    im.save(ROOT/'cybereinstein-cover.png')

def check_example():
    gamma = 1.0
    gs = np.r_[np.linspace(0.0, .98, 50), np.linspace(1.02, 2.0, 50)]
    records=[]
    for g in gs:
        h=np.array([[1j*gamma,g],[g,-1j*gamma]],dtype=complex)
        eig=np.linalg.eigvals(h)
        root=np.sqrt(complex(g*g-gamma*gamma))
        exact=np.array([root,-root])
        e=min(max(abs(eig-exact)),max(abs(eig-exact[::-1])))
        records.append({'g':float(g),'spectrum_error':float(e),
                        'trace_error':float(abs(sum(eig))),
                        'determinant_error':float(abs(np.prod(eig)-(h[0,0]*h[1,1]-h[0,1]*h[1,0])))})
    h_ep=np.array([[1j,1],[1,-1j]],dtype=complex)
    bad=np.sqrt(gs*gs+gamma*gamma)
    out={'type':'teaching_example_not_a_project_research_result',
         'model':'H=[[i*gamma,g],[g,-i*gamma]], gamma=1',
         'analytic_spectrum':'E_plus/minus = +/-sqrt(g^2-gamma^2)',
         'method':'NumPy eigvals versus characteristic-polynomial solution',
         'sample_count':len(records),
         'max_spectrum_error_away_from_EP':max(r['spectrum_error'] for r in records),
         'max_trace_error':max(r['trace_error'] for r in records),
         'max_determinant_error':max(r['determinant_error'] for r in records),
         'EP_check':{'H_squared_frobenius_norm':float(np.linalg.norm(h_ep@h_ep)),
                     'H_rank':int(np.linalg.matrix_rank(h_ep)),
                     'reason':'At g=gamma=1, H is nonzero, H^2=0, so eigenvalues coalesce at zero; avoid treating ill-conditioned eigvals at the EP as exact.'},
         'wrong_sign_detected':bool(np.max(abs(bad-np.sqrt((gs*gs-1).astype(complex))))>0.5),
         'samples':records,
         'limitations':'An analytically defined 2x2 teaching model; not a reproduction of a paper and not an original discovery.'}
    assert out['max_spectrum_error_away_from_EP']<1e-12
    assert out['EP_check']['H_squared_frobenius_norm']==0.0
    assert out['EP_check']['H_rank']==1
    assert out['wrong_sign_detected']
    (ROOT/'demo-evidence.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
    print({k:v for k,v in out.items() if k not in ['samples','limitations']})

if __name__=='__main__':
    make_cover()
    check_example()
