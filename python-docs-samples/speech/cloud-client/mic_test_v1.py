# -*- coding: utf-8 -*-
import micspeech_v1
import time
from google.cloud import translate
#번역 모듈 가져옴
#from googletrans import Translator


import sys
import imp
imp.reload(sys)
# sys.setdefaultencoding("utf-8")

def main():
        speech = micspeech_v1.speech_v1()

        while True:
            text = speech.getText()
            if text is None:
                break
            print(text)
            time.sleep(0.01)
            if ('end' in text):
                 flag = 0
                 break

if __name__ == '__main__':
    main()
