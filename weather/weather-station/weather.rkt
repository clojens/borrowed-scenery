;;; Query various online services for weather information
;;;
;;; Copyright (C) 2009 FoAM vzw.
;;;
;;; This package is free software: you can redistribute it and/or
;;; modify it under the terms of the GNU Lesser General Public
;;; License as published by the Free Software Foundation, either
;;; version 3 of the License, or (at your option) any later version.
;;;
;;; This program is distributed in the hope that it will be useful,
;;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
;;; Lesser General Public License for more details.
;;;
;;; You can find a copy of the GNU Lesser General Public License at
;;; http://www.gnu.org/licenses/lgpl-3.0.html.
;;;
;;;
;;; Authors
;;;
;;; nik gaffney <nik@fo.am>
;;;
;;;
;;; Requirements
;;;
;;; Tested with Racket v5.2 requires dherman's json package
;;;
;;;
;;; Commentary
;;;
;;; Covers the basics but not all the many details. The following services are 
;;; usable with varying degrees of completion...
;;;  - Weather Underground
;;;  - OpenWeatherMap
;;;  - local wview
;;;
;;; bugs and/or improvements
;;; - very little error handling
;;; - this version is wunderground specific 
;;;

#lang racket

(require (planet dherman/json:4:0))
(require net/url)

(provide get-weather
         get-conditions
         get-astronomy
         ;; direct interface
         get-request
         ;; conditions
         name 
         id
         weather-string
         temperature
         humidity
         pressure
         wind-string
         wind-speed
         wind-direction
         ;;; astronomy
         moon-age
         sunrise
         sunset
         ;; various
         set-api-key
         )


;;;;; ;  ;;;;;;;; ; ; ;
;;
;; API setup
;;  an API KEY is required to access the weather underground API and should be 
;;  set using set-api-key before using any of the weather data functions.
;;  see: http://www.wunderground.com/?apiref=f1a625cfe36df818)
;; 
;;;; ;;;  ; 

(define api-key "") 
(define (set-api-key key)
  (set! api-key key))

;;;;;; ; ;     ;;  ;        ;
;;
;; Weather Underground
;;  get weather data using the Weather Underground JSON API. requests should be 
;;  formatted as a request url (as string) conforming to the description at
;;  http://www.wunderground.com/weather/api/d/docs
;;
;;;;; ;; ; ; ;

(define (get-request request)
  (read-json (get-pure-port 
              (string->url request))))

;; get weather data for a city, airport, autoip, personal weather station, etc.
;; see: http://api.wunderground.com/weather/api/d/docs?d=data/index
;;      http://api.wunderground.com/weather/api/d/docs?d=resources/country-to-iso-matching  
;; e.g. (get-weather "conditions" "Belgium/Gent")

(define (get-weather features location)
  (get-request (string-append 
               "http://api.wunderground.com/api/"
               api-key "/"
               features "/q/"
               location ".json")))
 
;;;;;;; ;   ;;; ;   ; ; ;        
;;
;; Weather Conditions
;;  see: http://www.wunderground.com/weather/api/d/docs?d=data/conditions
;;
;;; ; ; ;  ; ;   ; ;

;; get weather conditions for a location
(define (get-conditions location)
  (get-weather "conditions" location))

;; these functions take the return value of get-conditions and should return a single formatted string

;; name of location
(define (name ht)
  (hash-ref (hash-ref (hash-ref ht 'current_observation) 'display_location) 'full))

;; id of city or station
(define (id ht)
  (hash-ref (hash-ref ht 'current_observation) 'station_id))

;; current temperature in ªC
(define (temperature ht)
   (hash-ref (hash-ref ht 'current_observation) 'uvtemp_c))

;; current dewpoint in ªC
(define (dewpoint ht)
   (hash-ref (hash-ref ht 'current_observation) 'dewpoint_c))

;; current weather description
(define (weather-string ht)
   (hash-ref (hash-ref ht 'current_observation) 'weather))

;; Humidity in %
(define (humidity ht)
  (hash-ref (hash-ref ht 'current_observation) 'relative_humidity))

;; Atmospheric pressure in kPa
(define (pressure ht)
  (hash-ref (hash-ref ht 'current_observation) 'pressure_mb))

;; Wind direction in degrees (meteorological)
(define (wind-string ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_string))

;; Wind direction in degrees (meteorological)
(define (wind-direction-degrees ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_degrees))

;; Wind direction 
(define (wind-direction ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_dir))

;; Wind speed (in mph)
(define (wind-speed ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_mph))

;; Wind speed in mph
(define (wind-speed-mph ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_mph))

;; Wind speed in kph
(define (wind-speed-kph ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_kph))

;; Wind gusts in mph
(define (wind-gust-mph ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_gust_mph))

;; Wind gusts in kph
(define (wind-gust-kph ht)
  (hash-ref (hash-ref ht 'current_observation) 'wind_gust_kph))

;; Precipitation volume (last hour, 3 hours or today)
(define (rain-today ht)
  (hash-ref (hash-ref ht 'current_observation) 'precip_today_metric))

;; Solar radiation
(define (solar-radiation ht)
  (hash-ref (hash-ref ht 'current_observation) 'solarradiation))

;; UV Index
(define (uv-index ht)
  (hash-ref (hash-ref ht 'current_observation) 'UV))

;; Cloudiness in %


;;;;; ; ; ;;;;;;  ;;  ;
;;
;; Astronomical data 
;;  see: http://api.wunderground.com/weather/api/d/docs?d=data/astronomy
;;
;;;; ; ;  ;;; ;

;; get astronomical data for a location
(define (get-astronomy location)
  (get-weather "astronomy" location))

;; these functions take the return value of get-astronomy and should return a single formatted string

;; Age of the moon in days
(define (moon-age ht)
  (hash-ref (hash-ref ht 'moon_phase) 'ageOfMoon))

;; Sunrise time as a string (if needed at some point -> racket/date)
(define (sunrise ht)
  (format "~a:~a" 
           (hash-ref (hash-ref (hash-ref ht 'moon_phase) 'sunrise) 'hour)
           (hash-ref (hash-ref (hash-ref ht 'moon_phase) 'sunrise) 'minute)))

;; Sunset time as a string (if needed at some point -> racket/date)
(define (sunset ht)
  (format "~a:~a" 
           (hash-ref (hash-ref (hash-ref ht 'moon_phase) 'sunset) 'hour)
           (hash-ref (hash-ref (hash-ref ht 'moon_phase) 'sunset) 'minute)))

;;;;;; ; ;; ;
;;
;; error handling
;;   while honouring hidden intentions
;;
;;;; ;  ;;

;; api errors (e.g. key not found)

;; no data/reference error

;; no data available
(define (no-data-handler exn)
  (format "No data available"))

(define (cloudiness ht)
  (with-handlers ((exn:fail?
                   (lambda (e) (no-data-handler e))))
    (hash-ref (hash-ref (car (hash-ref ht 'list)) 'clouds) 'all)))
