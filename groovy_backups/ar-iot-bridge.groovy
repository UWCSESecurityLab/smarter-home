/**
 *  ARIoTBridge
 *
 *  Copyright 2017 University of Washington
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
    name: "ARIoTBridge",
    namespace: "edu.uw.security",
    author: "Earlence Fernandes",
    description: "ar iot bridge",
    category: "Safety & Security",
    iconUrl: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience.png",
    iconX2Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png",
    iconX3Url: "https://s3.amazonaws.com/smartapp-icons/Convenience/Cat-Convenience@2x.png")

import groovy.json.*

preferences {
    section("Control these devices...") {
        input "switches", "capability.switch", multiple: true
        input "locks", "capability.lock", multiple: true
        input "contacts", "capability.contactSensor", multiple: true
    }
}

mappings {
	path("/devWrite/:id/:command") {
    	action: [
        	POST: "postDev"
        ]
    }
    path("/devRead/:id") {
    	action: [
        	GET: "getDev"
        ]
    }
    path("/devReadAll/") {
    	action: [
        	GET: "getDevAll"
        ]
    }
    path("/devCmdAttr/:id") {
    	action: [
        	GET: "getDevCmdAttr"
        ]
    }
    path("/program") {
    	action: [
        	POST: "program"
        ]
    }
    path("/readAllPrograms") {
    	action: [
        	GET: "readAllPrograms"
        ]
    }
    path("/deleteProgram/:name") {
    	action: [
        	POST: "deleteProgram"
        ]
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
	//switches.each { it -> devices.add(it) }
	//locks.each { it -> devices.add(it) }
    //contacts.each { it -> devices.add(it) }

    subscribe(switches, "switch", switchesHandler)
    subscribe(locks, "lock", locksHandler)
    subscribe(contacts, "contact", contactsHandler)

    //state.remove("programIndex")
}

def switchesHandler(evt) {
	state.each { key, val -> processEvent(key, val, evt) }
}

def locksHandler(evt) {
	state.each { key, val -> processEvent(key, val, evt) }
}

def contactsHandler(evt) {
	state.each { key, val -> processEvent(key, val, evt) }
}

def findDeviceWithId(id) {
	def dev = null

    dev = switches.find { it.id == id }
    if (!dev) {
    	dev = locks.find { it.id == id }
        if (!dev) {
        	dev = contacts.find { it.id == id }
        }
    }

    return dev
}

def postDev() {

	def id = params.id
    def cmd = params.command

    def dev = findDeviceWithId(id)
    if (dev) {
        if (cmd == "on") {
            dev.on()
            log.debug "switch on"
        } else if (cmd == "off") {
            dev.off()
            log.debug "switch off"
        } else if (cmd == "lock") {
        	dev.lock()
        } else if (cmd == "unlock") {
        	dev.unlock()
        }

        return [Id: UUID.randomUUID().toString(),
    		Code: 200,
            ErrorMessage: null,
            Result: [ "statusCode": "OK" ]]
	} else {
    	return [Id: UUID.randomUUID().toString(),
    		Code: 404,
            ErrorMessage: null,
            Result: [ "statusCode": "no such device" ]]
    }
}

def getDev() {

	switches.each { dev -> log.debug dev.displayName }

	return [Id: UUID.randomUUID().toString(),
    		Code: 200,
            ErrorMessage: null,
            Result: [ "stuff": "blah" ]]
}

def getAttributeState(device)
{
	def retVal = []
	device.getSupportedAttributes().each { it -> retVal.add(it.getName() + "#" + device.currentState(it.getName())?.value) }

    //device.getSupportedAttributes().each { it -> sendPush it.getName() }

    return retVal
}

def getDevAll() {

	def retVal = []

    switches.each { it -> retVal.add(JsonOutput.toJson(deviceName: it.displayName, deviceId: it.getId(), state: getAttributeState(it))) }
    locks.each { it -> retVal.add(JsonOutput.toJson(deviceName: it.displayName, deviceId: it.getId(), state: getAttributeState(it))) }
    contacts.each { it -> retVal.add(JsonOutput.toJson(deviceName: it.displayName, deviceId: it.getId(), state: getAttributeState(it))) }


	return [Id: UUID.randomUUID().toString(),
    		Code: 200,
            ErrorMessage: null,
            Result: retVal]
}

def getDevCmdAttr() {
	def retVal = [:]
    def index = 0
    def dev = findDeviceWithId(params.id)
    if (dev) {

    	for (cmd in dev.supportedCommands) {
        	retVal.put("cmd" + index, cmd.name)
            index += 1
        }
    }

    return [Id: UUID.randomUUID().toString(),
    		Code: 200,
            ErrorMessage: null,
            Result: retVal]
}

//called per event type
def processEvent(key, val, evt) {

	//sendPush (evt.value + "////" + evt.deviceId + "////" + val.eventName)

	def errorMsg = "INIT"
	if (key.contains(evt.deviceId)) {
    	// sendPush "trig dev id matches"
        if (evt.value.equals(val.eventName)) {
        	// sendPush "eventName matches"
        	def dev = findDeviceWithId(val.actionDevId)
            if (dev) {
            	dev."$val.actionName"()
            } else {
            	errorMsg = errorMsg + "; no such action device"
            }
        } else {
        	errorMsg = errorMsg + "; no such event name"
        }
    }

    //sendPush (errorMsg)
}

/*
programs one trigger-action rule
TODO: right now, this json doesn't take action parameters. easy to add later.
Leave <PgmId> as an empty string when sending this JSON
{ "pgmId": <PgmId>, "trigDevId": <TriggerDeviceId>, "eventName": <EventNameAsString>, "actionDevId": <ActionDevId>, "actionName": <ActionName> }
*/
def program() {
	def json = request.JSON

    def pgmId = UUID.randomUUID().toString()

    def programName = 'pgm_' + json.trigDevId + "_" + pgmId
    json.pgmId = programName
    state[programName] = json

    return [Id: UUID.randomUUID().toString(),
    		Code: 200,
            ErrorMessage: null,
            Result: programName]
}

def deleteProgram() {
	state.remove(params.name)

    return [Id: UUID.randomUUID().toString(),
    		Code: 200,
            ErrorMessage: null,
            Result: params.name + ' deleted']
}

def readAllPrograms() {
	//def retVal = [:]
    def retVal = []

    state.each { key, val -> retVal.add(JsonOutput.toJson(val)) }

    return [Id: UUID.randomUUID().toString(),
    		Code: 200,
            ErrorMessage: null,
            Result: retVal]
}