"""One-off narration synthesis using the official Doubao Voice V3 HTTP API.

Configured for the user's requested voice. No credential is saved.
The adapter is prepared and syntax-checked, but has not called the service here.
"""
from pathlib import Path
import argparse
import base64
import getpass
import json
import os
import re
import subprocess
import urllib.request
import urllib.error
import uuid

ROOT = Path(__file__).resolve().parent
ENDPOINT = 'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
VOICE = 'zh_male_m191_uranus_bigtts'


def texts():
    import xml.etree.ElementTree as ET
    raw=(ROOT/'video.explainer.xml').read_text()
    root=ET.fromstring('<root>'+raw+'</root>')
    return [re.sub(r'\[([^]]+)\]\([^)]*\)',r'\1',e.attrib['text'])
            for e in root.findall('say')]


def payload(text):
    return {'req_params':{'text':text,'speaker':VOICE,
                         'audio_params':{'format':'mp3','sample_rate':24000}}}


def synthesize(text, key, destination):
    request_id=str(uuid.uuid4())
    headers={'X-Api-Key':key,'X-Api-Resource-Id':'seed-tts-2.0',
             'X-Api-Request-Id':request_id,'Content-Type':'application/json',
             'X-Control-Require-Usage-Tokens-Return':'*'}
    req=urllib.request.Request(ENDPOINT,
        data=json.dumps(payload(text),ensure_ascii=False).encode('utf-8'),
        headers=headers,method='POST')
    chunks=[]
    sentences=[]
    usage=[]
    try:
        with urllib.request.urlopen(req,timeout=60) as response:
            for line in response:
                line=line.strip()
                if not line or line==b'data: [DONE]':continue
                if line.startswith(b'data:'):line=line[5:].strip()
                obj=json.loads(line)
                code=obj.get('code',0)
                if code not in (0,20000000):
                    raise RuntimeError('Doubao rejected the request; code='+str(code))
                if obj.get('data'):chunks.append(base64.b64decode(obj['data']))
                if obj.get('sentence'):sentences.append(obj['sentence'])
                if obj.get('usage'):usage.append(obj['usage'])
    except urllib.error.HTTPError as err:
        raise RuntimeError('Doubao HTTP status '+str(err.code)) from None
    except urllib.error.URLError:
        raise RuntimeError('Network connection to Doubao failed') from None
    audio=b''.join(chunks)
    if not audio:raise RuntimeError('No audio was returned')
    mp3=destination.with_suffix('.mp3')
    mp3.write_bytes(audio)
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(mp3),
                    '-ar','24000','-ac','1','-c:a','pcm_s16le',str(destination)],check=True)
    destination.with_suffix('.metadata.json').write_text(json.dumps(
        {'speaker':VOICE,'resource_id':'seed-tts-2.0','request_id':request_id,
         'sentences':sentences,'usage':usage,'text_characters':len(text)},
        ensure_ascii=False,indent=2))


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--prepare-only',action='store_true')
    parser.add_argument('--free-quota-characters',type=int,default=0,
                        help='Verified remaining free quota; no paid fallback.')
    args=parser.parse_args()
    paragraphs=texts()
    total=sum(map(len,paragraphs))
    if args.prepare_only:
        print(json.dumps({'speaker':VOICE,'resource_id':'seed-tts-2.0',
                          'endpoint':ENDPOINT,'paragraphs':len(paragraphs),
                          'input_characters':total,'called_api':False},ensure_ascii=False))
        return
    if args.free_quota_characters<total:
        raise SystemExit('Free quota must cover '+str(total)+' input characters before synthesis.')
    key=os.environ.get('DOUBAO_API_KEY') or getpass.getpass('Doubao API Key (not saved): ')
    if not key:raise SystemExit('No credential supplied')
    output=ROOT/'voice'
    output.mkdir(exist_ok=True)
    for i,text in enumerate(paragraphs,1):
        dst=output/f'{i:02d}.wav'
        if dst.exists():
            print('Already exists:',dst.name)
            continue
        synthesize(text,key,dst)
        print('Saved:',dst.name)


if __name__=='__main__':main()
