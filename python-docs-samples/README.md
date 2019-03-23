## Google Cloud Platform Python Samples

[![Open in Cloud Shell][shell_img]][shell_link]

[shell_img]: http://gstatic.com/cloudssh/images/open-btn.png
[shell_link]: https://console.cloud.google.com/cloudshell/open?git_repo=https://github.com/GoogleCloudPlatform/python-docs-samples&page=editor&open_in_editor=./README.md

This repository holds the samples used in the python documentation on [cloud.google.com](https://cloud.google.com).

[![Build Status](https://travis-ci.org/GoogleCloudPlatform/python-docs-samples.svg)](https://travis-ci.org/GoogleCloudPlatform/python-docs-samples)
[![Coverage Status](https://coveralls.io/repos/github/GoogleCloudPlatform/python-docs-samples/badge.svg?branch=HEAD)](https://coveralls.io/github/GoogleCloudPlatform/python-docs-samples?branch=HEAD)

For more detailed introduction to a product, check the README.md in the
corresponding folder.

## Contributing changes

* See [CONTRIBUTING.md](CONTRIBUTING.md)

## Licensing

* See [LICENSE](LICENSE)

## How To run

 $ pip install virtualenv

 $ vitrualenv env

 $ sudo apt-get install git

 $ sudo git clone http://people.csail.mit.edu/hubert/git/pyaudio.git

 $ cd pyaudio

 $ sudo python setup.py install 

 $ export GOOGLE_APPLICATION_CREDENTIALS="/home/koko/Downloads/speechkey.json"

 $ git clone https://github.com/GoogleCloudPlatform/python-docs-samples.git

 $ source env/bin/activate

 $ cd python-docs-samples/speech/cloud-client/

 $ pip install -r requirements.txt

 $ python mic_test_v1.py  
