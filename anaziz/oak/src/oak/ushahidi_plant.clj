;; Copyright (C) 2012 FoAM vzw
;; This program is free software: you can redistribute it and/or modify
;; it under the terms of the GNU Affero General Public License as
;; published by the Free Software Foundation, either version 3 of the
;; License, or (at your option) any later version.
;;
;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; GNU Affero General Public License for more details.
;;
;; You should have received a copy of the GNU Affero General Public License
;; along with this program.  If not, see <http://www.gnu.org/licenses/>.

(ns oak.ushahidi-plant
  (:use
   oak.vec2
   oak.forms
   oak.log
   oak.defs
   oak.profile
   oak.ushahidi
   oak.db))

(defn make-ushahidi-plant [id name pos layer ush-id date lat lng fract incident]
  (hash-map
   :version 1
   :entity-type "ushahidi"
   :id id
   :owner name
   :pos pos  
   :state "alive"
   :layer layer
   :time (current-time)
   :ush-id ush-id
   :date date
   :lat lat
   :lng lng
   :fract fract
   :incident incident
   :neighbours ()
   :power 0
   ))

(defn ushahidi-plant-count-fungi [neighbours]
  (reduce
   (fn [r entity]
     (if (= (:entity-type entity) "plant")
       (+ r 1) r))
   0
   neighbours))


(defn ushahidi-plant-add-neighbour [plant entity]
  (modify
   :neighbours (fn [n] (cons (:id entity) n)) plant))

(defn ushahidi-plant-thank [plant player-name]
  (let [in (:incident plant)
        ush-id (:incidentid in)]
    (println "thanking" player-name)
    
    ;; increment plant count for this player
    (db-find-update!
     (fn [player]
       (println (:name player) "score is increasing")
       (modify :plant-count (fn [c] (+ c 1))
               (modify :has-picked (fn [p] (set-cons (:ush-id plant) p))
                       player)))
     :players
     {:name player-name})
    
    (ushahidi-add-incident-comment
     ush-id player-name
     (str player-name " has helped this plant in anaziz")))
  plant)
  
(defn ushahidi-plant-powerup [plant entity]
  (reduce
   (fn [plant player-name]
     (ushahidi-plant-thank plant player-name))
   (ushahidi-plant-add-neighbour plant entity)
   (:grown-by entity)))
    
(defn ushahidi-plant-update-neighbours [plant neighbours]
  (reduce
   (fn [plant entity]
     (if (not (list-contains? (:neighbours plant) (:id entity)))
       (ushahidi-plant-powerup plant entity)
       plant))
   plant
   neighbours))

(defn ushahidi-plant-update [plant neighbours]
  (ushahidi-plant-update-neighbours plant neighbours))