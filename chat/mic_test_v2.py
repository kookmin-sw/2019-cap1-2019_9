# -*- coding: utf-8 -*-
from HTMLParser import HTMLParser   # '해결을 위해 HTML파서를 불러옴
import micspeech_v1
import time
from google.cloud import translate
import sys
#번역 모듈 가져옴
#from googletrans import Translator


import sys
reload(sys)
sys.setdefaultencoding("utf-8")

def main():
    flag = 1
    ret=""
    speech = micspeech_v1.speech_v1()

    translate_client = translate.Client() #번역모듈 변수 선언
    parser = HTMLParser()                 #' 해결 모듈 변수 선언
    while True:
        text = speech.getText()
        print(text)
        #
        # # target =  ['en', 'ja', 'es']      #번역할 언어 배열로 선언
        # #
        # # if text is None:
        # #     break
        # print(text)

        # Translates some text into Russian
        #
        # for i in target:
        #     #언어에 맞게 번역 실시
        #     translation = translate_client.translate(
        #         text,
        #         target_language=i)
        #     ret+=parser.unescape(translation['translatedText'])
        #     sys.stdout.flush()
        #     #print(u'Translation: {}'.format(translation['translatedText'].decode("UTF-8").encode("UTF-8"))) #번역된 결과 출력
        #
        # time.sleep(0.01)
        # if ('end' in text):
        #      flag = 0
        #      print(ret)
        #      return ret


if __name__ == '__main__':
    main()
