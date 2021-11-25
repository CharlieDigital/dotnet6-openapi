/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WeatherForecast } from '../models/WeatherForecast';
import type { CancelablePromise } from '../core/CancelablePromise';
import { request as __request } from '../core/request';

export class WeatherForecastService {

    /**
     * @returns WeatherForecast Success
     * @throws ApiError
     */
    public static getWeatherForecast(): CancelablePromise<Array<WeatherForecast>> {
        return __request({
            method: 'GET',
            path: `/WeatherForecast`,
        });
    }

}