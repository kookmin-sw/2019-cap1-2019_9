import micspeech_v1
import time

def main():
    flag = 1
    while flag:
        speech = micspeech_v1.speech_v1()
        while True:
            text = speech.getText()
            if text is None:
                break
            print(text)
            time.sleep(0.01)
            # if ('end' or '끝' in text):
            #     flag = 0
            #     break


if __name__ == '__main__':
    main()
