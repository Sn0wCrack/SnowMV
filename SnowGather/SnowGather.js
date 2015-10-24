//=============================================================================
// Snow Scripts - Simple Gathering
// SnowGather.js
// Version: 1.1.0
//=============================================================================

"use strict";

var Imported = Imported || {};
Imported.Snow_Gather = true;

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
 * <Harvest Chance Boost: x%>
 * This tag allows you to set an amount this particular item will boost
 * the chances of you finding items.
 *
 * <Chance Break: x%>
 * This tag allows you to set the percentage of the time the tool will,
 * break after use, e.g. 90% will break 90% of the time, 0% will never break.
 *
 *
 * Harvestables:
 *
 * <Chance Harvest: x%>
 * The percentage chance of finding the item from gathering, e.g
 * 90% wil be found 90% of the time, 100% will always be found.
 *
 * <Harvest Minimum: x>
 * The minimum amount of the item to be found upon the successful harvesting of 
 * it.
 *
 * <Harvest Maximum: x>
 * The maximum amount of the item to be found upon the successful harvesting of 
 * it.
 *
 * ============================================================================
 * Usage
 * ============================================================================
 * To call the script, create an event with a plugin command
 *		SnowGather [x] [y]
 * Let me explain how this works: replace x with the id of the item you want
 * the player to use, if you want them to use more than one item replace it
 * with something like: [x,y,z] NO SPACES BETWEEN THE ITEMS.
 *
 * y is the id of the item you want the player to harvest from this event,
 * again if you want them to have a chance of getting more than one item
 * use something like this: [x,y,z] NO SPACES BETWEEN THE ITEMS.
 *
 * If you don't want the vent to require the usage of a tool, replace [x] with
 * false.
 */
//=============================================================================

var Snow = Snow || {};
Snow.Gather = Snow.Gather || {};
Snow.Gather.Parameters = PluginManager.parameters("SnowGather");

Snow.Gather.WaitingEvents = {}; /*
								 * [0]:
								 *		mapId
								 *      eventId
								 *      timeRemaining
								 */
								 
Snow.Gather.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Snow.Gather.DataManager_isDatabaseLoaded.call(this)) {
		return false;
	}
	this.processNotetagsSnowGather($dataItems);
	return true;
};

Snow.Gather.Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function(mapId) {
    if ($dataMap) {
		DataManager.processNotetagsEvents();
	}
	Snow.Gather.Game_Map_setup.call(this, mapId);
};

DataManager.processNotetagsSnowGather = function(group) {
	var note1 = /<(?:HARVEST CHANCE BOOST):[ ](\d+)([%%])>/i;
	var note2 = /<(?:CHANCE BREAK):[ ](\d+)([%%])>/i;
	var note3 = /<(?:CHANCE HARVEST):[ ](\d+)([%%])>/i;
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

DataManager.processNotetagsEvents = function() {
	var note = /<(?:RESPAWN TIME):[ ](\d+)>/i;
	
	if (!$dataMap) {
		return;
	}
	for (var i = 1; i < $dataMap.events.length; i++) {
		if ($dataMap.events[i].note) {
			var notedata = $dataMap.events[i].note.split(/[\r\n]+/);
			for (var i = 0; i < notedata.length; i++) {
				var line = notedata[i];
				if (line.match(note)) {
					//$dataMap.events[i].respawnTime = parseInt(RegExp.$1);
				}
			}
		}
	}
}

Snow.Gather.idIntoItem = function(id) {
	return $dataItems[id];
}

Snow.Gather.RandomInt = function() {
	return Snow.Gather.Round(Math.random(), 2);
}

Snow.Gather.RandomIntRange = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

Snow.Gather.Round = function(value, decimals) {
	return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

Snow.Gather.Gather = function(requiredItems, recievableItems) {
	if (requiredItems == false) {
		var itemisedRecievableItems = [];
		for (var i = 0; i < recievableItems.length; i++) {
			itemisedRecievableItems[i] = Snow.Gather.idIntoItem(recievableItems[i]);
		}
		
		for (var i = 0; i < itemisedRecievableItems.length; i++) {
				var gen = Math.max(0, Snow.Gather.RandomInt());
				if (gen <= itemisedRecievableItems[i].chanceHarvest) {
					var itemGathered = Snow.Gather.RandomIntRange(itemisedRecievableItems[i].harvestMinimum, itemisedRecievableItems[i].harvestMaximum);
					$gameParty.gainItem(itemisedRecievableItems[i], itemGathered);
					$gameMessage.add(Snow.Gather.Parameters["Successful Harvest Message"].replace("%1", itemGathered).replace("%2", itemisedRecieveableItems[i].name));
				} else {
					$gameMessage.add(Snow.Gather.Parameters["Unsuccessful Harvest Message"]);
				}
		}
	}
	else {
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
				totalHarvestBoost += itemisedRequiredItems[i].harvestChanceBoost;
			}
		
			for (var i = 0; i < itemisedRecievableItems.length; i++) {
				var gen = Math.max(0, Snow.Gather.RandomInt() - totalHarvestBoost);
				if (gen <= itemisedRecievableItems[i].chanceHarvest) {
					var itemGathered = Snow.Gather.RandomIntRange(itemisedRecievableItems[i].harvestMinimum, itemisedRecievableItems[i].harvestMaximum);
					$gameParty.gainItem(itemisedRecievableItems[i], itemGathered);
					$gameMessage.add(Snow.Gather.Parameters["Successful Harvest Message"].replace("%1", itemGathered).replace("%2", itemisedRecieveableItems[i].name));
				} else {
					$gameMessage.add(Snow.Gather.Parameters["Unsuccessful Harvest Message"]);
				}
			}
		
			for (var i = 0; i < itemisedRequiredItems.length; i++) {
				if (Snow.Gather.RandomInt() < itemisedRequiredItems[i].chanceBreak) {
					$gameParty.loseItem(itemisedRequiredItems[i], 1);
					$gameMessage.add(Snow.Gather.Parameters["Item Broken Message"].replace("%1", itemisedRequiredItem[i].name));
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
			$gameMessage.add(Snow.Gather.Paramaters["Incorrect Tools Message"].replace("%1", concatItems));
		}
	}
}

var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
	_Game_Interpreter_pluginCommand.call(this, command, args);
	if (command === "SnowGather") {
		Snow.Gather.Gather(JSON.parse(args[0]), JSON.parse(args[1]));
	}
}