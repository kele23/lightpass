import axios from 'axios';

export class ApiProvider {
    constructor() {}

    /**
     * Do HTTP GET for text content.
     * Internally uses _doTextGet
     * @param {*} url
     * @param {*} queryParams
     * @returns
     */
    async textGet(endpoint, queryParams) {
        return await this._doTextGet(endpoint, queryParams);
    }

    /**
     * Do HTTP GET with response type "text"
     * Used for download html content
     * @param {*} url
     * @param {*} queryParams
     * @returns
     */
    async _doTextGet(endpoint, queryParams) {
        try {
            const params = new URLSearchParams(queryParams);
            const result = await axios({
                method: 'get',
                url: endpoint,
                responseType: 'text',
                params: params,
            });
            console.debug(result);
            return result?.data;
        } catch (error) {
            console.warn(error);
            throw 'Cannot download page';
        }
    }

    async _doMultipartPost(endpoint, body = {}, queryParams, { unwrap } = { unwrap: true }) {
        try {
            const params = new URLSearchParams(queryParams);
            const result = await axios.post(endpoint, body, {
                params,
            });
            console.debug(result);
            if (unwrap) {
                return result?.data?.data;
            } else {
                return result?.data;
            }
        } catch (error) {
            console.warn(error);
            if (unwrap) {
                throw error?.response?.data?.data;
            } else {
                throw error?.response?.data;
            }
        }
    }

    async _doBlobPost(endpoint, body = {}, queryParams) {
        try {
            const params = new URLSearchParams(queryParams);
            const result = await axios.post(endpoint, body, {
                params,
                responseType: 'blob',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.debug(result);
            return result.data;
        } catch (error) {
            console.warn(error);
            throw 'Cannot download blob';
        }
    }

    async _doPost(endpoint, body = {}, queryParams, { unwrap } = { unwrap: true }) {
        try {
            const params = new URLSearchParams(queryParams);
            const result = await axios.post(endpoint, body, {
                params,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.debug(result);
            if (unwrap) {
                return result?.data?.data;
            } else {
                return result?.data;
            }
        } catch (error) {
            console.warn(error);
            if (unwrap) {
                throw error?.response?.data?.data;
            } else {
                throw error?.response?.data;
            }
        }
    }

    async _doCachedGet(endpoint, queryParams, { unwrap } = { unwrap: true }, failSilently = false) {
        const params = new URLSearchParams(queryParams);
        const paramsUrl = params.toString();

        const loc = window.sessionStorage?.getItem(endpoint + '?' + paramsUrl);
        if (loc) {
            const deserialized = JSON.parse(loc);
            if (deserialized && deserialized.update > Date.now() - 300000) {
                return deserialized.data;
            }
        }

        const data = await this._doGet(endpoint, queryParams, { unwrap }, failSilently);
        window.sessionStorage?.setItem(endpoint + '?' + paramsUrl, JSON.stringify({ update: Date.now(), data }));
        return data;
    }

    async _doGet(endpoint, queryParams, { unwrap } = { unwrap: true }) {
        try {
            const params = this._paramsToURLParams(queryParams);
            const result = await axios.get(endpoint, {
                params: params,
            });
            console.debug(result);
            if (unwrap) {
                return result?.data?.data;
            } else {
                return result?.data;
            }
        } catch (error) {
            console.warn(error);
            if (unwrap) {
                throw error?.response?.data?.data;
            } else {
                throw error?.response?.data;
            }
        }
    }

    _paramsToURLParams(queryParams) {
        if (!queryParams) return new URLSearchParams();

        let urlParams = new URLSearchParams();
        //Ensure the url encoding is performed correctly for arrays
        Object.entries(queryParams).forEach(([param, value]) => {
            if (value)
                if (Array.isArray(value)) value.forEach((item) => urlParams.append(param, item));
                else urlParams.append(param, value);
        });
        return urlParams;
    }
}

/**
 *
 * @returns {ApiProvider} api provider
 */
export const getApiProvider = () => {
    if (!window.rcApiProvider) {
        window.rcApiProvider = new ApiProvider();
    }
    return window.rcApiProvider;
};
