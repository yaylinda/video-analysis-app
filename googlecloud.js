import {API_KEY} from './credentials/key';
import {makeApiRequest} from './api';
import * as FileSystem from 'expo-file-system';
import Environment from './config/environment';
import firebase from './config/firebase';

const VIDEO_ANNOTATION_ENDPOINT = `https://videointelligence.googleapis.com/v1p3beta1/videos:annotate`;
const VIDEO_ANNOTATION_RESULTS_ENDPOINT = 'https://videointelligence.googleapis.com/v1/';

const VIDEO_CONTEXT = {
  speechTranscriptionConfig: {
    languageCode: 'en-US',
    enableAutomaticPunctuation: true,
  },
};

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${Environment['VIDEO_INTELLIGENCE_AUTH_TOKEN']}`,
};

export const uploadVideo = async (localUri) => {
  console.log(`uploadVideo - localUri: ${localUri}`);

  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      resolve(xhr.response);
    };
    xhr.onerror = function(e) {
      console.log(e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', localUri, true);
    xhr.send(null);
  });

  console.log(`uploadVideo - got blob`);

  const objectName = `${localUri.split('/').pop()}`;

  const ref = firebase
    .storage()
    .ref()
    .child(objectName);

  const snapshot = await ref.put(blob);

  console.log(`uploadVideo - got snapshot`);

  // We're done with the blob, close and release it
  blob.close();

  return await snapshot.ref.toString();
}

export const annotateVideo = async (inputUri) => {
  const endpoint = `${VIDEO_ANNOTATION_ENDPOINT}`;

  const body = {
    inputUri: inputUri,
    features: ['SPEECH_TRANSCRIPTION'],
    videoContext: VIDEO_CONTEXT
  }

  const response = await makeApiRequest(endpoint, 'POST', DEFAULT_HEADERS, JSON.stringify(body));

  return response;
}

export const getAnnotationResults = async(resultsPath) => {
  const endpoint = `${VIDEO_ANNOTATION_RESULTS_ENDPOINT}${resultsPath}`;

  let response;

  while (true) {
    response = await makeApiRequest(endpoint, 'GET', DEFAULT_HEADERS, null);
    console.log(`getAnnotationResults - json: ${JSON.stringify(response)}`);

    await sleep(5000);
    
    if (response['done']) {
      console.log(`getAnnotationResults - done!`);
      break;
    }
  }

  return response['response']['annotationResults'][0]['speechTranscriptions'][0]['alternatives'][0];
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

