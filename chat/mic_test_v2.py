# -*- coding: utf-8 -*-
from HTMLParser import HTMLParser   # '해결을 위해 HTML파서를 불러옴
import micspeech_v1
import time
from google.cloud import translate
import sys


import sys
reload(sys)
sys.setdefaultencoding("utf-8")

def main():
    speech = micspeech_v1.speech_v1()

    translate_client = translate.Client() #번역모듈 변수 선언
    parser = HTMLParser()                 #' 해결 모듈 변수 선언
    ret = ''
    while True:
        text = speech.getText()
        
        target =  ['en']      #번역할 언어 배열로 선언
        
        if text is None:      # 60초 이상이 지나거나 말이 비는 구간이 생기면 종료
            break

        # Translates some text into Russian
        
        for i in target:
            #언어에 맞게 번역 실시
            translation = translate_client.translate(
                text,
                target_language=i)
            ret+=parser.unescape(translation['translatedText'])
            print(u'Translation: {}'.format(translation['translatedText'].decode("UTF-8").encode("UTF-8"))) #번역된 결과 출력
            
            sys.stdout.flush()
        
        time.sleep(0.01)


if __name__ == '__main__':
    while True:
       main()
