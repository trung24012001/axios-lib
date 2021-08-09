const Axios = require('axios');

function AxiosProgress(defaultConfig, axios) {    
    var responseCb;
    var errorCb;
    return {
        interceptors: {
            response: {
                use: function (resCb, errCb) {
                    responseCb = resCb;
                    errorCb = errCb;
                },
            },
            request: axios.interceptors.request,
        },
        getTypeOfData: function (type, data) {
            switch (type) {
                case "stream":
                    break;
                case "arraybuffer":
                    return Buffer.concat(data);
                default:
                    let strData = Buffer.concat(data).toString('utf8');
                    try {
                        return JSON.parse(strData);
                    } catch {
                        return strData;
                    }
            }
        },
        handleProgress: function (url, config, method, data) {
            let contentLength = config && config.headers && config.headers["content-length"] || 0;
            let totalLength = 0;
            let progressCb = config && config.onRequestProgress;
            progressCb = !progressCb && defaultConfig && defaultConfig.onRequestProgress;

            if (data) {
                if (data.readable) {
                    data.on('error', (err) => Promise.reject(err))
                    data.on('data', (chunk) => {
                        totalLength += chunk.length;
                        progressCb && progressCb(totalLength, contentLength);
                    })
                } else {
                    totalLength = Buffer.from(data.toString('utf8')).length
                    progressCb && progressCb(totalLength, contentLength);
                }
            }

            let originType = null;
            if (config && config["responseType"]) {
                originType = config["responseType"];
                delete config["responseType"];
            }
            return new Promise(async (resolve, reject) => {
                try {
                    let res = await axios({
                        ...defaultConfig,
                        url,
                        method,
                        data,
                        ...config,
                        responseType: "stream",

                    });
                    contentLength = res.headers && res.headers["content-length"] || 0;
                    progressCb = config && config.onResponseProgress;
                    progressCb = !progressCb && defaultConfig && defaultConfig.onResponseProgress;
                    totalLength = 0;
                    chunks = [];
                    res.data.on('error', async (err) => {
                        await errorCb && resolve(errorCb(err));
                        reject(err);
                    })
                    res.data.on('data', (chunk) => {
                        totalLength += chunk.length;
                        chunks.push(chunk);
                        progressCb && progressCb(totalLength, contentLength);
                    })
                    res.data.on('end', async () => {
                        res.data = this.getTypeOfData(originType, chunks) || res.data;
                        await responseCb && resolve(responseCb(res));
                        resolve(res);
                    })
                    
                } catch (error) {
                    await errorCb && resolve(errorCb(error)); 
                    reject(error);
                }
            })
        },
        request: function (config) {
            let newConfig = {
                ...defaultConfig,
                ...config,
            }
            return axios.request(newConfig)
        },
        create: function (config) {
            const instance = axios.create({});
            return new axios_progress(config, instance);
        },
        get: function (url, config) {
            return this.handleProgress(url, config, "GET");
        },

        delete: function (url, config) {
            return this.handleProgress(url, config, "DELETE");
        },

        head: function (url, config) {
            return this.handleProgress(url, config, "HEAD")
        },

        options: function (url, config) {
            return this.handleProgress(url, config, "OPTIONS")
        },

        post: function (url, data, config) {
            return this.handleProgress(url, config, "POST", data)
        },

        put: function (url, data, config) {
            return this.handleProgress(url, config, "PUT", data)
        },

        patch: function (url, data, config) {
            return this.handleProgress(url, config, "PATCH", data)
        }
    }
}
module.exports = AxiosProgress({}, Axios);
module.exports.default = AxiosProgress({}, Axios);
