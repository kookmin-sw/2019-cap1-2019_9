from __future__ import division

import re
import sys

from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types
import pyaudio
from six.moves import queue
from threading import Thread
import time


# Audio recording parameters
RATE = 16000
CHUNK = int(RATE / 10)  # 100ms


class MicrophoneStream(object):
    """Opens a recording stream as a generator yielding the audio chunks."""
    def __init__(self, rate, chunk):
        self._rate = rate
        self._chunk = chunk

        # Create a thread-safe buffer of audio data
        self._buff = queue.Queue()
        self.closed = True

    def __enter__(self):
        self._audio_interface = pyaudio.PyAudio()
        self._audio_stream = self._audio_interface.open(
            format=pyaudio.paInt16,
            # The API currently only supports 1-channel (mono) audio
            # https://goo.gl/z757pE
            channels=1, rate=self._rate,
            input=True, frames_per_buffer=self._chunk,
            # Run the audio stream asynchronously to fill the buffer object.
            # This is necessary so that the input device's buffer doesn't
            # overflow while the calling thread makes network requests, etc.
            stream_callback=self._fill_buffer,
        )

        self.closed = False

        return self

    def __exit__(self, type, value, traceback):
        self._audio_stream.stop_stream()
        self._audio_stream.close()
        self.closed = True
        # Signal the generator to terminate so that the client's
        # streaming_recognize method will not block the process termination.
        self._buff.put(None)
        self._audio_interface.terminate()

    def _fill_buffer(self, in_data, frame_count, time_info, status_flags):
        """Continuously collect data from the audio stream, into the buffer."""
        self._buff.put(in_data)
        return None, pyaudio.paContinue

    def generator(self):
        while not self.closed:
            # Use a blocking get() to ensure there's at least one chunk of
            # data, and stop iteration if the chunk is None, indicating the
            # end of the audio stream.
            chunk = self._buff.get()
            if chunk is None:
                return
            data = [chunk]

            # Now consume whatever other data's still buffered.
            while True:
                try:
                    chunk = self._buff.get(block=False)
                    if chunk is None:
                        return
                    data.append(chunk)
                except queue.Empty:
                    break

            yield b''.join(data)

class speech_v1(Thread):
    def __init__(self):
        Thread.__init__(self)

        self.language_code = 'ko-KR'  # a BCP-47 language tag

        self._buff = queue.Queue()

        self.client = speech.SpeechClient()
        self.config = types.RecognitionConfig(
            encoding=enums.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=RATE,
            language_code=self.language_code)
        self.streaming_config = types.StreamingRecognitionConfig(
            config=self.config,
            interim_results=True)

        self.mic = None
        self.status = True

        self.daemon = True
        self.start()

    def __exit__(self):
        self._buff.put(None)

    def run(self):
        with MicrophoneStream(RATE, CHUNK) as stream:
            self.mic = stream
            audio_generator = stream.generator()
            requests = (types.StreamingRecognizeRequest(audio_content=content)
                        for content in audio_generator)

            responses = self.client.streaming_recognize(self.streaming_config, requests)

            # Now, put the transcription responses to use.

            try: 
                self.listen_print_loop(responses, stream)
            except Exception as exception:
            # Output unexpected Exceptions.
        	    print("Excption handle : Exceeded maximum allowed stream duration of 65 seconds")
        
        
        self._buff.put(None)
        self.status = False



    def pauseMic(self):
        if self.mic is not None:
            self.mic.pause()

    def resumeMic(self):
        if self.mic is not None:
            self.mic.resume()


    def getText(self, block = True):
        return self._buff.get(block=block)
    
    def listen_print_loop(self, responses, mic):
        num_chars_printed = 0
        try:
            for response in responses:
                if not response.results:
                    continue

                result = response.results[0]
                if not result.alternatives:
                    continue
                

                transcript = result.alternatives[0].transcript
                overwrite_chars = ' ' * (num_chars_printed - len(transcript))

                if not result.is_final:
                    
                    # sys.stdout.write(transcript + overwrite_chars + '\r')
                    # sys.stdout.flush()
                   
                    num_chars_printed = len(transcript)
                else:
                  
                   
                    self._buff.put(transcript+overwrite_chars)
                    num_chars_printed = 0

        except:
            return