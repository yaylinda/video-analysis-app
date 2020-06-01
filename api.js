export const makeApiRequest = (endpoint, method, headers, body) => {
  console.log(`makeApiRequest - ${endpoint}, ${method}, ${JSON.stringify(headers)}, ${body ? 'hasBody' : 'hasNoBody'}`);

  return fetch(endpoint, {
    method: method,
    headers: headers,
    body: body,
    redirect: 'follow',
  }).then((response) => {
    if (response.ok) {
      requestSuccess = true;
      console.log(`makeApiRequest - success`);
    } else {
      requestSuccess = false;
      console.log(`makeApiRequest - error`);
    }
    return response.json();
  });
}