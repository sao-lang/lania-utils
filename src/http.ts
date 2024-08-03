import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, CancelTokenSource, InternalAxiosRequestConfig } from 'axios';

const CHUNK_SIZE = 5 * 1024 * 1024; // 每片大小 5MB
const MAX_RETRIES = 3; // 最大重试次数
const RETRY_DELAY = 1000; // 重试间隔时间，单位为毫秒
const POLLING_INTERVAL = 5000; // 轮询间隔时间，单位为毫秒

export class AxiosWrapper {
    private instance = axios.create({
        timeout: 60000,
    });

    private requestQueue: (() => Promise<void>)[] = [];
    private activeRequests = 0;
    private cancelTokens: Map<string, CancelTokenSource> = new Map(); // 使用请求的唯一标识符作为键
    private pollingTimeoutId: NodeJS.Timeout | null = null;
    private isPolling = false; // 控制轮询的标志

    constructor(interceptors?: {
        requestInterceptor?: (value: InternalAxiosRequestConfig<any>) => InternalAxiosRequestConfig<any> | Promise<InternalAxiosRequestConfig<any>>;
        responseInterceptor?: (response: AxiosResponse) => AxiosResponse;
        errorInterceptor?: (error: AxiosError) => Promise<any> | any;
    }) {
        if (interceptors) {
            const { requestInterceptor, responseInterceptor, errorInterceptor } = interceptors;

            if (requestInterceptor) {
                this.instance.interceptors.request.use(requestInterceptor);
            }

            if (responseInterceptor) {
                this.instance.interceptors.response.use(responseInterceptor);
            }

            if (errorInterceptor) {
                this.instance.interceptors.response.use(
                    response => response,
                    errorInterceptor
                );
            }
        }
    }

    public get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const cancelTokenSource = axios.CancelToken.source();
        if (config) {
            config.cancelToken = cancelTokenSource.token;
        } else {
            config = { cancelToken: cancelTokenSource.token };
        }
        this.cancelTokens.set(url, cancelTokenSource);

        return this.instance.get<T>(url, config).finally(() => {
            this.cancelTokens.delete(url);
        });
    }

    public post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const cancelTokenSource = axios.CancelToken.source();
        if (config) {
            config.cancelToken = cancelTokenSource.token;
        } else {
            config = { cancelToken: cancelTokenSource.token };
        }
        this.cancelTokens.set(url, cancelTokenSource);

        return this.instance.post<T>(url, data, config).finally(() => {
            this.cancelTokens.delete(url);
        });
    }

    public put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const cancelTokenSource = axios.CancelToken.source();
        if (config) {
            config.cancelToken = cancelTokenSource.token;
        } else {
            config = { cancelToken: cancelTokenSource.token };
        }
        this.cancelTokens.set(url, cancelTokenSource);

        return this.instance.put<T>(url, data, config).finally(() => {
            this.cancelTokens.delete(url);
        });
    }

    public delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const cancelTokenSource = axios.CancelToken.source();
        if (config) {
            config.cancelToken = cancelTokenSource.token;
        } else {
            config = { cancelToken: cancelTokenSource.token };
        }
        this.cancelTokens.set(url, cancelTokenSource);

        return this.instance.delete<T>(url, config).finally(() => {
            this.cancelTokens.delete(url);
        });
    }

    private async executeNextRequest(maxConcurrent: number): Promise<void> {
        if (this.requestQueue.length > 0 && this.activeRequests < maxConcurrent) {
            const request = this.requestQueue.shift();
            if (request) {
                this.activeRequests++;
                try {
                    await request();
                } catch (error) {
                    console.error('Request failed:', error);
                } finally {
                    this.activeRequests--;
                    await this.executeNextRequest(maxConcurrent);
                }
            }
        }
    }

    private async enqueueRequest(requestFn: () => Promise<void>, maxConcurrent: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.requestQueue.push(async () => {
                try {
                    await requestFn();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
            this.executeNextRequest(maxConcurrent);
        });
    }

    private async uploadChunk(url: string, chunk: Blob, chunkIndex: number, totalChunks: number, cancelToken: CancelTokenSource): Promise<void> {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());

        const upload = async (attempt: number): Promise<void> => {
            try {
                await this.instance.post(url, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    cancelToken: cancelToken.token,
                });
            } catch (error) {
                if (axios.isCancel(error)) {
                    throw new Error('Request canceled');
                }
                if (attempt < MAX_RETRIES) {
                    console.warn(`Chunk ${chunkIndex} failed (attempt ${attempt + 1}). Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    await upload(attempt + 1);
                } else {
                    throw new Error(`Chunk ${chunkIndex} failed after ${MAX_RETRIES} attempts: ${(error as Error).message}`);
                }
            }
        };

        await upload(0);
    }

    public async uploadFile(url: string, file: File, maxConcurrent: number = 3): Promise<void> {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        for (let index = 0; index < totalChunks; index++) {
            const start = index * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);

            const cancelTokenSource = axios.CancelToken.source();
            const uploadPromise = this.enqueueRequest(() => this.uploadChunk(url, chunk, index, totalChunks, cancelTokenSource), maxConcurrent)
                .catch(error => {
                    if (axios.isCancel(error)) {
                        console.warn(`Chunk ${index} upload canceled`);
                    } else {
                        console.error(`Chunk ${index} upload failed: ${error.message}`);
                    }
                });

            await uploadPromise;
        }

        console.log('File upload process completed');
    }

    public cancelRequest(url: string): void {
        const cancelTokenSource = this.cancelTokens.get(url);
        if (cancelTokenSource) {
            cancelTokenSource.cancel('Request canceled by the user');
            this.cancelTokens.delete(url);
        }
    }

    // 轮询方法
    public polling(url: string, config?: AxiosRequestConfig, interval: number = POLLING_INTERVAL, maxRetries: number = MAX_RETRIES): void {
        this.isPolling = true; // 设置轮询标志

        const poll = async (attempt: number): Promise<void> => {
            if (!this.isPolling) {
                return; // 如果轮询被停止，则退出
            }

            try {
                await this.get(url, config);
                // 成功后重新设置轮询
                this.pollingTimeoutId = setTimeout(() => poll(0), interval);
            } catch (error) {
                if (!this.isPolling) {
                    return; // 如果轮询被停止，则退出
                }

                if (attempt < maxRetries) {
                    console.warn(`Polling failed (attempt ${attempt + 1}). Retrying...`);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                    poll(attempt + 1);
                } else {
                    console.error(`Polling failed after ${maxRetries} attempts: ${(error as Error).message}`);
                }
            }
        };

        // 开始轮询
        poll(0);
    }
}