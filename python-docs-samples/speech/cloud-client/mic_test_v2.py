# -*- coding: utf-8 -*-
from HTMLParser import HTMLParser   # '해결을 위해
import micspeech_v1
import time
from google.cloud import translate

#번역 모듈 가져옴
#from googletrans import Translator


import sys
reload(sys)
sys.setdefaultencoding("utf-8")

def main():
    flag = 1
    while flag:
        speech = micspeech_v1.speech_v1()

        translate_client = translate.Client() #번역모듈 변수 선언
    #    translator = Translator()
        parser = HTMLParser()      #' 해결 모듈 변수 선언
        while True:
            text = speech.getText()

            #text = u'Hello, world!'
            target =  ['en', 'ja', 'es'] #번역할 언어 배열로 선언

            if text is None:
                break
            print(text)

            # Translates some text into Russian
            print("\n google translate api test")
            for i in target:
                #언어에 맞게 번역 실시
                translation = translate_client.translate(
                    text,
                    target_language=i)
                print(parser.unescape(translation['translatedText']))
                #print(u'Translation: {}'.format(translation['translatedText'].decode("UTF-8").encode("UTF-8"))) #번역된 결과 출력
            # [END translate_quickstart]

            #print(translator.translate(utext, src='ko', dest='ja'))


            time.sleep(0.01)
            if ('end' in text):
                 flag = 0
                 break



if __name__ == '__main__':
    main()
