import {API_KEY} from './credentials/key';
import {makeApiRequest} from './api';
import * as FileSystem from 'expo-file-system';
import Environment from './config/environment';
import firebase from './config/firebase';
// import 'react-native-get-random-values';
// import { v4 as uuidv4 } from 'uuid';

// TODO - find way to securely send api key
const CLOUD_STORAGE_ENDPOINT = `https://storage.googleapis.com/upload/storage/v1/b/[BUCKET_NAME]/o?uploadType=media&name=[OBJECT_NAME]&key=${API_KEY}`;

// TODO - find way to securely send api key
const VIDEO_ANNOTATION_ENDPOINT = `https://videointelligence.googleapis.com/v1/videos:annotate?key=${API_KEY}`;

const CREDENTIALS_FILE = 'credentials/service_account.json';

const BUCKET_NAME = 'another-linda-bucket';

const PREFIX = 'video-analysis';

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

const videoContext = {
  speechTranscriptionConfig: {
    languageCode: 'en-US',
    enableAutomaticPunctuation: true,
  },
};

export const annotateVideo = async (gcsUri) => {

}
