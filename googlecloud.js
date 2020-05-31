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

const getHeaders = (accessToken) => {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  }
};

export const annotateVideo = async (localUri, accessToken) => {
  const endpoint = `${VIDEO_ANNOTATION_ENDPOINT}`;

  const inputContent = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });

  const body = {
    inputContent: inputContent,
    features: ['SPEECH_TRANSCRIPTION'],
    videoContext: VIDEO_CONTEXT
  }

  const response = await makeApiRequest(endpoint, 'POST', getHeaders(accessToken), JSON.stringify(body));

  return response;
}

export const getAnnotationResults = async(resultsPath, accessToken) => {
  const endpoint = `${VIDEO_ANNOTATION_RESULTS_ENDPOINT}${resultsPath}`;
  const headers = getHeaders(accessToken);

  let response;

  while (true) {
    response = await makeApiRequest(endpoint, 'GET', headers, null);
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

