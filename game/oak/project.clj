(defproject oak "1.0.0"
  :description "a game server"
  :main oak.core
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/math.numeric-tower "0.0.1"]
                 [org.clojure/data.json "0.1.2"]
                 [congomongo "0.1.9"]
                 [org.mongodb/mongo-java-driver "2.7.3"]
                 [org.webbitserver/webbit "0.4.3"]])
