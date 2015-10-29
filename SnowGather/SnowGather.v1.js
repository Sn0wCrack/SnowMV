//=============================================================================
// SnowMV - Simple Gathering
// SnowGather.v1.js
// Version: 1.3.3
//=============================================================================

"use strict";

PluginManager.register("SnowGather", "1.3.3", {
	"email": "",
	"website": "",
	"name": "Sn0wCrack"
}, "2015-10-25")

//=============================================================================
 /*:
 * @plugindesc A simple way to manage "gathering" type events.
 * @author Sn0wCrack
 *
 * @param Successful Harvest Message
 * @desc Message to display upon sucessful harvest, %1 is the amount, %2 is the item name
 * @default You gathered %1 %2.
 *
 * @param Unsuccessful Harvest Message
 * @desc Message to display upon failing to harvest items
 * @default Failed to harvest any resources.
 *
 * @param Item Broken Message
 * @desc Message to display when an item breaks upon harvesting, %1 is the item name
 * @default Your %1 broke while harvesting!
 *
 * @param Incorrect Tools Message
 * @desc Message to display when you don't have the right tools, %1 is the tools formatted for grammar
 * @default You don't have the right tool for the job, you need\n%1\nTo gather items here.
 *
 * @param Respawning Events
 * @desc Override the default option when having a time system installed, true = ON, false = OFF
 * @default true
 *
 * @param Manual Self Switches
 * @desc If you wish to manually set self switches in your event for despawning them, true = ON, false = OFF
 * @default false
 *
 * @param Last Result Store
 * @desc If you want to store the last result of a harvest as a variable, true = ON, false = OFF
 * @default true
 *
 * @param Last Result Variable ID
 * @desc The variable to store the last result in, 0 = success, 1 = failure, 2 = incorrect tools
 * @default 1
 *
 * @help
 * ============================================================================
 * Introduction
 * ============================================================================
 * 
 * Welcome to the Simple Gathering System by Sn0wCrack, this script allows you
 * to create gathering events in which you players to search for resources using
 * tools (or not if you want!)
 *
 * Please see https://github.com/Sn0wCrack/SnowMV/blob/master/LICENSE for license
 * details.
 *
 * If you use this script, please give credit!
 *
 * ============================================================================
 * Setup
 * ============================================================================
 * In your items database you can tag any item (this means only normal items,
 * not weapons, armour, etc.) with the following tags:
 *
 * Havesting Tools:
 *
 * <Harvest Chance Boost: x%> - Not Required
 * This tag allows you to set an amount this particular item will boost
 * the chances of you finding items.
 *
 * <Chance Break: x%> - Required
 * This tag allows you to set the percentage of the time the tool will,
 * break after use, e.g. 90% will break 90% of the time, 0% will never break.
 *
 *
 * Harvestables:
 *
 * <Harvest Chance: x%> - Required
 * The percentage chance of finding the item from gathering, e.g
 * 90% wil be found 90% of the time, 100% will always be found.
 *
 * <Harvest Minimum: x> - Required
 * The minimum amount of the item to be found upon the successful harvesting of 
 * it.
 *
 * <Harvest Maximum: x> - Required
 * The maximum amount of the item to be found upon the successful harvesting of 
 * it.
 *
 * Events:
 *
 * <Repspawn Time: x> - Required if you want respawing events (Requires OrangeTimeSystem)
 * Sets how long in hours you want the event to respawn in
 *
 * ============================================================================
 * Usage
 * ============================================================================
 * To call the script, create an event with a plugin command
 *		SnowGather [x] [y] this
 * Let me explain how this works: replace x with the id of the item you want
 * the player to use, if you want them to use more than one item replace it
 * with something like: [x,y,z] NO SPACES BETWEEN THE ITEMS.
 *
 * y is the id of the item you want the player to harvest from this event,
 * again if you want them to have a chance of getting more than one item
 * use something like this: [x,y,z] NO SPACES BETWEEN THE ITEMS.
 *
 * this is well, always the word this, this is only required if you're using
 * a time system.
 *
 * If you don't want the event to require the usage of a tool, replace [x] with
 * false.
 *
 * Repsawning Events:
 *
 * In order for an event to actually despawn and then respawn afte the allotted
 * time, you must first create second event page, on this page you just have to
 * have the self switch for "A" checked as a condition, leave everything else 
 * blank.
 *
 */
//=============================================================================

var Snow = Snow || {};
Snow.Gather = Snow.Gather || {};
Snow.Gather.Parameters = PluginManager.parameters("SnowGather.v1");
Snow.Gather.PopEvents = false;

Snow.Gather.WaitingEvents = [];
								 
Snow.Gather.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Snow.Gather.DataManager_isDatabaseLoaded.call(this)) {
		return false;
	}
	this.processNotetagsSnowGather($dataItems);
	return true;
};

if (Imported["OrangeTimeSystem"] && MVC.Boolean(String(Snow.Gather.Parameters["Respawning Events"]))) {
	Snow.Gather.PopEvents = true;
	Snow.Gather.onChangeHour = function() {
		console.log("1 Hour Passess...");
		for (var i = 0; i < Snow.Gather.WaitingEvents.length; i++) {
			Snow.Gather.WaitingEvents[i].timeRemaining -= 1;
			if($dataMap.events[Snow.Gather.WaitingEvents[i].eventData.id] == Snow.Gather.WaitingEvents[i].eventData && Snow.Gather.WaitingEvents[i].timeRemaining == 0)
			{
				var key = [$gameMap.mapId(), Snow.Gather.WaitingEvents[i].eventData.id, "A"];
				$gameSelfSwitches.setValue(key, false);
				Snow.Gather.WaitingEvents.splice(i, 1);
			}
		}
	}
	OrangeTimeSystem.on('changeHour', Snow.Gather.onChangeHour);
}

DataManager.processNotetagsSnowGather = function(group) {
	var note1 = /<(?:HARVEST CHANCE BOOST):[ ](\d+)([%%])>/i;
	var note2 = /<(?:CHANCE BREAK):[ ](\d+)([%%])>/i;
	var note3 = /<(?:HARVEST CHANCE):[ ](\d+)([%%])>/i;
	var note4 = /<(?:HARVEST MINIMUM):[ ](\d+)>/i;
	var note5 = /<(?:HARVEST MAXIMUM):[ ](\d+)>/i;
	
	for (var i = 1; i < group.length; i++) {
		var obj = group[i];
		var notedata = obj.note.split(/[\r\n]+/);
		for (var n = 0; n < notedata.length; n++) {
			var line = notedata[n];
			if (line.match(note1)) {
				obj.harvestChanceBoost = parseFloat(RegExp.$1 * 0.01);
			} 
			if (line.match(note2)) {
				obj.chanceBreak = parseFloat(RegExp.$1 * 0.01);
			}
			if (line.match(note3)) {
				obj.chanceHarvest = parseFloat(RegExp.$1 * 0.01);
			}
			if (line.match(note4)) {
				obj.harvestMinimum = parseInt(RegExp.$1);
			}
			if (line.match(note5)) {
				obj.harvestMaximum = parseInt(RegExp.$1);
			}
		}
	}
}

Snow.Gather.idIntoItem = function(id) {
	return $dataItems[id];
}

Snow.Gather.RandomInt = function() {
	return Math.random();
}

Snow.Gather.RandomIntRange = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

Snow.Gather.Round = function(value, decimals) {
	return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

Snow.Gather.Gather = function(requiredItems, recievableItems, event) {
	event = event || {_eventId: 0};
	var eventId = event._eventId;
	if (requiredItems == false) {
		var itemisedRecievableItems = [];
		for (var i = 0; i < recievableItems.length; i++) {
			itemisedRecievableItems[i] = Snow.Gather.idIntoItem(recievableItems[i]);
		}
		
		for (var i = 0; i < itemisedRecievableItems.length; i++) {
			var gen = Snow.Gather.Round(Snow.Gather.RandomInt(), 2);
			if (gen <= itemisedRecievableItems[i].chanceHarvest) {
				var itemGathered = Snow.Gather.RandomIntRange(itemisedRecievableItems[i].harvestMinimum, itemisedRecievableItems[i].harvestMaximum);
				$gameParty.gainItem(itemisedRecievableItems[i], itemGathered);
				if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
					$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 0); 
				}
				$gameMessage.add(Snow.Gather.Parameters["Successful Harvest Message"].replace("%1", itemGathered).replace("%2", itemisedRecievableItems[i].name));
			} else {
				if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
					$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 1); 
				}
				$gameMessage.add(Snow.Gather.Parameters["Unsuccessful Harvest Message"]);
			}
		}
		if (Snow.Gather.PopEvents) {
			Snow.Gather.WaitingEvents.push({
				eventData: $dataMap.events[eventId], 
				timeRemaining: Number($dataMap.events[eventId].meta["Respawn Time"])
			});
			if (!MVC.Boolean(String(Snow.Gather.Parameters["Manual Self Switches"])))
			{
				$gameSelfSwitches.setValue([$gameMap.mapId(), eventId, "A"], true);
			}
		}
	} else {
		var itemisedRequiredItems = [];
		var itemisedRecievableItems = [];
		for (var i = 0; i < requiredItems.length; i++) {
			itemisedRequiredItems[i] = Snow.Gather.idIntoItem(requiredItems[i]);
		}
		for (var i = 0; i < recievableItems.length; i++) {
			itemisedRecievableItems[i] = Snow.Gather.idIntoItem(recievableItems[i]);
		}
	
		var gotItems = [];
		for (var i = 0; i < requiredItems.length; i++) {
			if ($gameParty.hasItem(itemisedRequiredItems[i])) {
				gotItems[i] = itemisedRequiredItems[i];
			}
		}
	
		if (gotItems.length == requiredItems.length) {
			var totalHarvestBoost = 0.0;
			for (var i = 0; i < itemisedRequiredItems.length; i++) {
				if (itemisedRequiredItems[i].harvestChanceBoost) {
					totalHarvestBoost += itemisedRequiredItems[i].harvestChanceBoost;
				}
			}
			
			var resourceGet = 0;
			
			for (var i = 0; i < itemisedRecievableItems.length; i++) {
				var gen = Snow.Gather.Round(Math.max(0, Snow.Gather.RandomInt() - totalHarvestBoost), 2);
				if (gen <= itemisedRecievableItems[i].chanceHarvest) {
					var itemGathered = Snow.Gather.RandomIntRange(itemisedRecievableItems[i].harvestMinimum, itemisedRecievableItems[i].harvestMaximum);
					$gameParty.gainItem(itemisedRecievableItems[i], itemGathered);
					if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
						$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 0); 
					}
					$gameMessage.add(Snow.Gather.Parameters["Successful Harvest Message"].replace("%1", itemGathered).replace("%2", itemisedRecievableItems[i].name));
					resourceGet++;
				} else {
					if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
						$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 1); 
					}
				}
			}
			
			if (resourceGet == 0) {
				$gameMessage.add(Snow.Gather.Parameters["Unsuccessful Harvest Message"]);
			}
		
			for (var i = 0; i < itemisedRequiredItems.length; i++) {
				if (Snow.Gather.RandomInt() < itemisedRequiredItems[i].chanceBreak) {
					$gameParty.loseItem(itemisedRequiredItems[i], 1);
					$gameMessage.add(Snow.Gather.Parameters["Item Broken Message"].replace("%1", itemisedRequiredItems[i].name));
				}
			}
			
			if (Snow.Gather.PopEvents) {
				Snow.Gather.WaitingEvents.push({
					eventData: $dataMap.events[eventId], 
					timeRemaining: Number($dataMap.events[eventId].meta["Respawn Time"])
				});
				if (!MVC.Boolean(String(Snow.Gather.Parameters["Manual Self Switches"])))
				{
					$gameSelfSwitches.setValue([$gameMap.mapId(), eventId, "A"], true);
				}
			}
			
		} else {
			var concatItems = "";
			for (var i = 0; i < itemisedRequiredItems.length; i++)
			{
				if (i == itemisedRequiredItems.length - 1)
				{
					concatItems += "and ";
				}
				concatItems += "a " + itemisedRequiredItems[i].name;
				if (i != itemisedRequiredItems.length - 1)
				{
					concatItems += ", ";
				}
			}
			var lines = String(Snow.Gather.Parameters["Incorrect Tools Message"]).split("\\n");
			if (MVC.Boolean(String(Snow.Gather.Parameters["Last Result Store"]))) {
				$gameVariables.setValue(Number(Snow.Gather.Parameters["Last Result Variable ID"]), 2); 
			}
			for (var i = 0; i < lines.length; i++) {
				$gameMessage.add(lines[i].replace("%1", concatItems));
			}
		}
	}
}

var Snow_Gather_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	Snow_Gather_Game_Interpreter_pluginCommand.call(this, command, args);
	if (command === "SnowGather") {
		if (args[2]) {
			Snow.Gather.Gather(JSON.parse(args[0]), JSON.parse(args[1]), eval(args[2]));
		} else {
			Snow.Gather.Gather(JSON.parse(args[0]), JSON.parse(args[1]))
		}
		
	}
}