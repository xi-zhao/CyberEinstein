from pathlib import Path
import json
import re
import subprocess
import xml.etree.ElementTree as ET
import zipfile

ROOT=Path(__file__).resolve().parent
markup=(ROOT/'video.explainer.xml').read_text()
tree=ET.fromstring('<root>'+markup+'</root>')
items=tree.findall('item')
says=tree.findall('say')
assert len(items)==12
assert len(says)==12
assert len(tree.findall('followup'))==2
anchors={x.attrib['anchor'] for x in tree.iter('item') if 'anchor' in x.attrib}
for say in says:
    assert say.attrib['lang']=='zh-CN'
    refs=re.findall(r'\]\(#([^):]+)',say.attrib['text'])
    assert all(ref in anchors for ref in refs)
snippets=ROOT/'animation-source'
snippets.mkdir(exist_ok=True)
count=0
for it in items:
    if it.attrib.get('type')!='animation':continue
    count+=1
    p=snippets/(it.attrib['anchor']+'.mjs')
    p.write_text(it.text or '')
    subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
transcript=[]
for i,say in enumerate(says,1):
    body=re.sub(r'\[([^]]+)\]\([^)]*\)',r'\1',say.attrib['text'])
    transcript.append(str(i)+'. '+say.attrib['title']+'\n'+body)
(ROOT/'narration.txt').write_text('\n\n'.join(transcript)+'\n')
evidence=json.loads((ROOT/'demo-evidence.json').read_text())
validation={'online_stream_finalized':True,'slides':len(items),'narration_segments':len(says),
    'animation_modules':count,'xml_parses':True,'all_narration_refs_resolve':True,
    'javascript_syntax_checked':True,'python_syntax_checked':True,
    'preview_duration_seconds_estimate':242.324,
    'cover_visually_inspected':True,'preview_playback_visually_checked':False,
    'manimgl_installed':False,'manimgl_rendered':False,'venv_created':True,
    'doubao_voice':'zh_male_m191_uranus_bigtts','doubao_api_calls':0,
    'credentials_saved':False,'input_characters':1223,
    'numerical_teaching_example_passed':True,
    'spectrum_error_away_from_EP':evidence['max_spectrum_error_away_from_EP'],
    'blockers':['PyPI DNS resolution failed in restricted terminal',
                'Saved browser permission blocks pypi.org',
                'Saved browser permission blocked scrimba.com preview inspection',
                'Native Codex app UI access was blocked by computer-use policy'],
    'delivery_boundary':'Online script-animation preview with free service Chinese voice; not original ManimGL or the later requested Doubao voice.'}
(ROOT/'validation.json').write_text(json.dumps(validation,ensure_ascii=False,indent=2))
output=ROOT.parent/'cybereinstein-video-source.zip'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED) as z:
    for p in ROOT.iterdir():
        if p.is_file() and p.suffix in ['.py','.json','.txt','.png','.xml','.yml']:
            z.write(p,'cybereinstein-video/'+p.name)
    for p in snippets.glob('*.mjs'):z.write(p,'cybereinstein-video/animation-source/'+p.name)
print(json.dumps({'slides':len(items),'animations':count,'zip':str(output),'bytes':output.stat().st_size},ensure_ascii=False))
