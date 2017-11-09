/**
 *  security-manager
 *
 *  Copyright 2016 Eric Zeng
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License. You may obtain a copy of the License at:
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software distributed under the License is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License
 *  for the specific language governing permissions and limitations under the License.
 *
 */
definition(
    name: "security-manager",
    namespace: "eric-zeng",
    author: "Eric Zeng",
    description: "Making the world a better place",
    category: "Safety & Security",
    iconUrl: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience.png",
    iconX2Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
    iconX3Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
    oauth: true)


preferences {
	section("Give me all of your permissions") {
		input "contact_sensors", "capability.contactSensor", title: "Contact Sensors", required: false
        input "thermometers", "capability.temperatureMeasurement", title: "Thermometers", required: false
        input "switches", "capability.switch", title: "Switches", required: false
	}
}

def installed() {
	log.debug "Installed with settings: ${settings}"

	initialize()
}

def updated() {
	log.debug "Updated with settings: ${settings}"

	unsubscribe()
	initialize()
}

def initialize() {
	// TODO: subscribe to attributes, devices, locations, etc.
}

def getDoor() {
	def resp = []
    resp << [contact: contact_sensors.currentContact]
    return resp
}

def getTemp() {
	def resp = []
    resp << [temp: thermometers.currentTemperature]
    return resp
}

def getSwitch() {
	def resp = []
    resp << [switch: switches.currentSwitch]
    return resp
}

def postSwitch() {
	// use the built-in request object to get the command parameter
    def command = params.command
    log.debug "command: $command"

    // all switches have the command
    // execute the command on all switches
    // (note we can do this on the array - the command will be invoked on every element
    switch(command) {
        case "on":
            switches.on()
            break
        case "off":
            switches.off()
            break
        default:
            httpError(400, "$command is not a valid command for all switches specified")
    }
}

mappings {
	path("/door") {
 		action: [
        	GET: "getDoor"
        ]
    }
    path("/temp") {
    	action: [
        	GET: "getTemp"
        ]
    }
    path("/switch/:command") {
    	action: [
        	POST: "postSwitch"
        ]
    }
    path("/switch") {
    	action: [
        	GET: "getSwitch"
        ]
    }
}
