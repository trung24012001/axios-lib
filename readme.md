# Axios Progress

## Install

```
npm install axios-lib
```

## Usage

**This config is only for Nodejs**

```
const axios_progress = require('axios-lib');

const config = {
    onResponseProgress = function (byteReceived, contentLength) {
        //Todos
    },
    onRequestProgress = function (byteReceived, contentLength) {
        //Todos
    }
}

axios_progress.create(config);
axios_progress.get('/url', config);
axios_progress.post('/url', data, config);
axios_progress.delete('/url', config);
```

**Note: _Axios progress returns an object. Can't use ~~axios(config)~~ like normal axios_**

